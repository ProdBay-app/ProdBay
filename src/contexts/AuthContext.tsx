import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

type UserRole = 'PRODUCER' | 'SUPPLIER' | 'ADMIN' | null;

interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 * Manages authentication state and user role from profiles table
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Fetch user profile from profiles table to get role
   */
  const fetchUserProfile = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setRole(null);
        setProfile(null);
        return;
      }

      if (data) {
        setRole(data.role as UserRole);
        setProfile({
          id: data.id,
          role: data.role as UserRole,
          full_name: data.full_name
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setRole(null);
      setProfile(null);
    }
  };

  /**
   * Initialize auth state and set up listener
   */
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch profile when user signs in
        await fetchUserProfile(session.user.id);
      } else {
        // Clear profile when user signs out
        setRole(null);
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Profile will be fetched automatically by onAuthStateChange listener
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  /**
   * Sign up with email and password
   * The database trigger will automatically create a profile with PRODUCER role
   */
  const signUp = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Profile will be created automatically by database trigger (handle_new_user)
      // Profile will be fetched automatically by onAuthStateChange listener
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  /**
   * Sign out
   */
  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
  };

  const value: AuthContextType = {
    user,
    session,
    role,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

