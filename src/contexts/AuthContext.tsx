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
   * Implements retry logic to handle race condition where profile might not exist yet
   * (e.g., immediately after signup before database trigger completes)
   */
  const fetchUserProfile = async (userId: string): Promise<void> => {
    const maxRetries = 3;
    const retryDelay = 500; // milliseconds

    console.log(`[fetchUserProfile] Starting profile fetch for user ${userId}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[fetchUserProfile] Attempt ${attempt}/${maxRetries} for user ${userId}`);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('id, role, full_name')
          .eq('id', userId)
          .single();

        if (error) {
          // If it's a "not found" error and we have retries left, wait and retry
          if (error.code === 'PGRST116' && attempt < maxRetries) {
            console.log(`[fetchUserProfile] Profile not found for user ${userId}, retrying in ${retryDelay}ms (attempt ${attempt}/${maxRetries})...`);
            // Correct Promise-based delay pattern
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
          
          // For other errors or final attempt, log and set null
          console.error('[fetchUserProfile] Error fetching user profile:', error);
          setRole(null);
          setProfile(null);
          return;
        }

        if (data) {
          // Success - profile found
          console.log(`[fetchUserProfile] Profile found for user ${userId}, role: ${data.role}`);
          setRole(data.role as UserRole);
          setProfile({
            id: data.id,
            role: data.role as UserRole,
            full_name: data.full_name
          });
          return; // Exit on success
        } else {
          // No data returned - retry if attempts remain
          if (attempt < maxRetries) {
            console.log(`[fetchUserProfile] No profile data returned for user ${userId}, retrying in ${retryDelay}ms (attempt ${attempt}/${maxRetries})...`);
            // Correct Promise-based delay pattern
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          } else {
            // Final attempt failed
            console.error('[fetchUserProfile] Profile not found after all retry attempts');
            setRole(null);
            setProfile(null);
            return;
          }
        }
      } catch (error) {
        // Network or other errors - retry if attempts remain
        if (attempt < maxRetries) {
          console.log(`[fetchUserProfile] Error fetching profile (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`, error);
          // Correct Promise-based delay pattern
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        } else {
          // Final attempt failed
          console.error('[fetchUserProfile] Error fetching user profile after all retries:', error);
          setRole(null);
          setProfile(null);
          return;
        }
      }
    }
  };

  /**
   * Initialize auth state and set up listener
   */
  useEffect(() => {
    console.log('Auth Init check...');
    
    // Safety valve: Force loading to false after 3 seconds to prevent infinite spinner
    const safetyTimer = setTimeout(() => {
      console.warn('Auth check timed out. Forcing UI load.');
      setLoading(false);
    }, 3000);

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        // Handle session data
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // User is authenticated - fetch profile
          fetchUserProfile(session.user.id).finally(() => {
            console.log('Loading set to false (after profile fetch)');
            setLoading(false);
            clearTimeout(safetyTimer); // Clear safety timer since we completed normally
          });
        } else {
          // No session - user is not authenticated
          // Explicitly set loading to false
          console.log('Loading set to false (no session)');
          setLoading(false);
          clearTimeout(safetyTimer); // Clear safety timer since we completed normally
        }
      })
      .catch((error) => {
        // Handle any errors during session fetch
        console.error('Error getting session:', error);
        setSession(null);
        setUser(null);
        setRole(null);
        setProfile(null);
        console.log('Loading set to false (session error)');
        setLoading(false); // Ensure loading is set to false even on error
        clearTimeout(safetyTimer); // Clear safety timer since we handled the error
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
        // Clear profile when user signs out or session is null
        setRole(null);
        setProfile(null);
      }

      // Always set loading to false after auth state change
      console.log('Loading set to false (auth state change)');
      setLoading(false);
      clearTimeout(safetyTimer); // Clear safety timer since state changed
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer); // Cleanup safety timer on unmount
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
      // Get the current origin to ensure email redirects to the correct domain
      const emailRedirectTo = typeof window !== 'undefined' 
        ? `${window.location.origin}/login`
        : undefined;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
        },
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

