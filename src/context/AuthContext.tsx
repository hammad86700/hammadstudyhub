// ==============================================================================
// HAMMAD STUDYHUB — AUTHENTICATION CONTEXT
// Configured for administrator account: admin123@gmail.com
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
  signInAsDemoAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PROFILE: UserProfile = {
  id: 'admin-hammad-id',
  display_name: 'Muhammad Hammad (Admin)',
  role: 'admin',
  created_at: '2026-10-30T00:00:00Z',
  updated_at: '2026-10-30T00:00:00Z',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if saved admin session exists in local storage
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('studyhub_admin_auth') === 'true';
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
      // 2. Local Mode with admin123@gmail.com
      if (isAdminLoggedIn) {
        setUser({
          id: ADMIN_PROFILE.id,
          email: 'admin123@gmail.com',
          app_metadata: {},
          user_metadata: { display_name: ADMIN_PROFILE.display_name },
          aud: 'authenticated',
          created_at: ADMIN_PROFILE.created_at,
        } as User);
        setProfile(ADMIN_PROFILE);
      }
      setIsLoading(false);
    }
  }, [isAdminLoggedIn]);

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error fetching user profile:', error.message);
        setProfile({
          id: userId,
          display_name: 'Administrator',
          role: 'student',
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
        // Authenticate admin account: admin123@gmail.com / admin@123
        if (
          email.trim().toLowerCase() === 'admin123@gmail.com' &&
          password === 'admin@123'
        ) {
          setIsAdminLoggedIn(true);
          localStorage.setItem('studyhub_admin_auth', 'true');
          setUser({
            id: ADMIN_PROFILE.id,
            email: 'admin123@gmail.com',
            app_metadata: {},
            user_metadata: { display_name: ADMIN_PROFILE.display_name },
            aud: 'authenticated',
            created_at: ADMIN_PROFILE.created_at,
          } as User);
          setProfile(ADMIN_PROFILE);
          setIsLoading(false);
          return {};
        }

        setIsLoading(false);
        return {
          error: 'Invalid credentials. Administrator email: admin123@gmail.com',
        };
      }
    } catch (e: any) {
      setIsLoading(false);
      return { error: e.message || 'An unexpected authentication error occurred.' };
    }
  };

  const signInAsDemoAdmin = () => {
    setIsAdminLoggedIn(true);
    localStorage.setItem('studyhub_admin_auth', 'true');
    setUser({
      id: ADMIN_PROFILE.id,
      email: 'admin123@gmail.com',
      app_metadata: {},
      user_metadata: { display_name: ADMIN_PROFILE.display_name },
      aud: 'authenticated',
      created_at: ADMIN_PROFILE.created_at,
    } as User);
    setProfile(ADMIN_PROFILE);
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem('studyhub_admin_auth');
      localStorage.removeItem('studyhub_demo_admin_auth');
    } catch {}
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
