// ==============================================================================
// HAMMAD STUDYHUB — AUTHENTICATION CONTEXT
// Supabase Auth Integration with safe local fallback for zero-config demonstration
// ==============================================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  // For demo testing only
  signInAsDemoAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ADMIN_PROFILE: UserProfile = {
  id: 'demo-admin-id',
  display_name: 'Muhammad Hammad (Admin)',
  role: 'admin',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if saved demo admin session exists
  const [isDemoAdminLoggedIn, setIsDemoAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('studyhub_demo_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  const isDemoMode = !isSupabaseConfigured;

  // Initialize Auth
  useEffect(() => {
    if (isSupabaseConfigured) {
      // 1. Live Supabase Auth
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // 2. Demo Mode
      if (isDemoAdminLoggedIn) {
        setUser({
          id: DEMO_ADMIN_PROFILE.id,
          email: 'admin@hammadstudyhub.com',
          app_metadata: {},
          user_metadata: { display_name: DEMO_ADMIN_PROFILE.display_name },
          aud: 'authenticated',
          created_at: DEMO_ADMIN_PROFILE.created_at,
        } as User);
        setProfile(DEMO_ADMIN_PROFILE);
      }
      setIsLoading(false);
    }
  }, [isDemoAdminLoggedIn]);

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error fetching user profile:', error.message);
        // Fallback profile if record hasn't synced yet
        setProfile({
          id: userId,
          display_name: 'Administrator',
          role: 'student', // Security default: not admin until verified
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else if (data) {
        setProfile(data as UserProfile);
      }
    } catch (e) {
      console.error('Failed to fetch profile:', e);
    } finally {
      setIsLoading(false);
    }
  }

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }

        if (data.user) {
          // Verify role from profiles
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profileData?.role !== 'admin') {
            await supabase.auth.signOut();
            setIsLoading(false);
            return {
              error: 'Access denied. Your account does not have administrator privileges.',
            };
          }
        }

        setIsLoading(false);
        return {};
      } else {
        // Safe Demo Mode authentication simulation
        if (
          (email.trim().toLowerCase() === 'admin@hammadstudyhub.com' && password === 'admin123') ||
          (email.trim().toLowerCase() === 'hammad@studyhub.com' && password === 'admin123')
        ) {
          signInAsDemoAdmin();
          setIsLoading(false);
          return {};
        }

        setIsLoading(false);
        return {
          error:
            'Invalid credentials in Demo Mode. Try: admin@hammadstudyhub.com / admin123 (or connect Supabase in .env)',
        };
      }
    } catch (e: any) {
      setIsLoading(false);
      return { error: e.message || 'An unexpected authentication error occurred.' };
    }
  };

  const signInAsDemoAdmin = () => {
    setIsDemoAdminLoggedIn(true);
    localStorage.setItem('studyhub_demo_admin_auth', 'true');
    setUser({
      id: DEMO_ADMIN_PROFILE.id,
      email: 'admin@hammadstudyhub.com',
      app_metadata: {},
      user_metadata: { display_name: DEMO_ADMIN_PROFILE.display_name },
      aud: 'authenticated',
      created_at: DEMO_ADMIN_PROFILE.created_at,
    } as User);
    setProfile(DEMO_ADMIN_PROFILE);
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      setIsDemoAdminLoggedIn(false);
      localStorage.removeItem('studyhub_demo_admin_auth');
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsLoading(false);
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isLoading,
        isDemoMode,
        signIn,
        signOut,
        signInAsDemoAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
