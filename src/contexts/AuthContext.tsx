import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types/database';

/**
 * Auth Context Type
 * Provides authentication state and methods for the application
 */
interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 * Manages authentication state and provides auth methods to the application
 * 
 * Key Features:
 * - Listens to Supabase auth state changes
 * - Fetches user role from user_profiles table when session exists
 * - Provides signIn, signUp, and signOut methods
 * - Handles loading states to prevent premature redirects
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Fetch user role from user_profiles table
   * This is called after successful authentication to get the user's role
   */
  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return profile?.role || null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  }, []);

  /**
   * Update auth state from session
   * Fetches user role when session exists
   */
  const updateAuthState = useCallback(async (newSession: Session | null) => {
    setSession(newSession);
    setUser(newSession?.user ?? null);

    if (newSession?.user) {
      // Fetch role from user_profiles table
      const userRole = await fetchUserRole(newSession.user.id);
      setRole(userRole);
    } else {
      setRole(null);
    }
  }, [fetchUserRole]);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Update auth state with new session
      if (data.session) {
        await updateAuthState(data.session);
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        error: error as AuthError,
      };
    }
  }, [updateAuthState]);

  /**
   * Sign up with email and password
   * Returns error if signup fails, or indicates if email confirmation is needed
   */
  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Check if email confirmation is required
      // If session exists immediately, user is auto-confirmed
      // Otherwise, they need to confirm their email
      const needsEmailConfirmation = !data.session;

      if (data.session) {
        // User is auto-confirmed, update auth state
        await updateAuthState(data.session);
      }

      return {
        error: null,
        needsEmailConfirmation,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        error: error as AuthError,
      };
    }
  }, [updateAuthState]);

  /**
   * Sign out current user
   */
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      // Auth state will be updated via onAuthStateChange listener
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  /**
   * Listen to Supabase auth state changes
   * This keeps the session in sync across the application
   */
  useEffect(() => {
    // Set initial loading state
    setLoading(true);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
      setLoading(false);
    });

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      // Update auth state when session changes
      await updateAuthState(session);
      
      // Set loading to false after initial load
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [updateAuthState]);

  const contextValue: AuthContextType = {
    session,
    user,
    role,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use Auth Context
 * Must be used within AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

