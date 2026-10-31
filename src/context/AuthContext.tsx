// ==============================================================================
// HAMMAD STUDYHUB — UNIFIED AUTHENTICATION & ROLE CONTEXT
// Supports Administrator (admin123@gmail.com), Class Representatives (CR & GR),
// and Registered Students with profile data and gender access control.
// ==============================================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole, StudentRegistrationInput } from '../types';
import {
  findStudentByEmail,
  registerStudent,
  getRegisteredStudents,
} from '../lib/demoStore';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isCR: boolean;
  isGR: boolean;
  isStudyManager: boolean;
  isStudent: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; profile?: UserProfile }>;
  signUpStudent: (input: StudentRegistrationInput) => Promise<{ error?: string; profile?: UserProfile }>;
  signOut: () => Promise<void>;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ADMIN_PROFILE: UserProfile = {
  id: 'admin-hammad-id',
  display_name: 'Muhammad Hammad (Admin)',
  email: 'admin123@gmail.com',
  role: 'admin',
  gender: 'male',
  created_at: '2026-10-30T00:00:00Z',
  updated_at: '2026-10-30T00:00:00Z',
};

const ACTIVE_USER_STORAGE_KEY = 'studyhub_active_user_v3';
const ADMIN_AUTH_STORAGE_KEY = 'studyhub_admin_auth_v3';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDemoMode = !isSupabaseConfigured;

  // Restore session
  const restoreLocalSession = () => {
    try {
      if (localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'true') {
        setUser({
          id: ADMIN_PROFILE.id,
          email: ADMIN_PROFILE.email,
          app_metadata: {},
          user_metadata: { display_name: ADMIN_PROFILE.display_name },
          aud: 'authenticated',
          created_at: ADMIN_PROFILE.created_at,
        } as User);
        setProfile(ADMIN_PROFILE);
        return;
      }

      const savedUserStr = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr) as UserProfile;
        // Verify current role from registered students in case admin promoted to CR/GR
        const fresh = getRegisteredStudents().find((s) => s.id === savedUser.id);
        const activeProfile = fresh ? { ...savedUser, role: fresh.role } : savedUser;

        setUser({
          id: activeProfile.id,
          email: activeProfile.email,
          app_metadata: {},
          user_metadata: { display_name: activeProfile.display_name },
          aud: 'authenticated',
          created_at: activeProfile.created_at,
        } as User);
        setProfile(activeProfile);
      }
    } catch (e) {
      console.warn('Session restoration failed:', e);
    }
  };

  useEffect(() => {
    // 1. If master admin session is stored locally, restore it immediately
    if (localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'true') {
      setUser({
        id: ADMIN_PROFILE.id,
        email: ADMIN_PROFILE.email,
        app_metadata: {},
        user_metadata: { display_name: ADMIN_PROFILE.display_name },
        aud: 'authenticated',
        created_at: ADMIN_PROFILE.created_at,
      } as User);
      setProfile(ADMIN_PROFILE);
      setIsLoading(false);
      return;
    }

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchSupabaseProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchSupabaseProfile(session.user.id);
        } else {
          if (localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'true') {
            setUser({
              id: ADMIN_PROFILE.id,
              email: ADMIN_PROFILE.email,
              app_metadata: {},
              user_metadata: { display_name: ADMIN_PROFILE.display_name },
              aud: 'authenticated',
              created_at: ADMIN_PROFILE.created_at,
            } as User);
            setProfile(ADMIN_PROFILE);
            setIsLoading(false);
            return;
          }
          setProfile(null);
          setIsLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      restoreLocalSession();
      setIsLoading(false);
    }
  }, []);

  // Listen for student role changes by admin in real-time
  useEffect(() => {
    const handleStudentsUpdated = () => {
      if (profile && profile.role !== 'admin') {
        const fresh = getRegisteredStudents().find((s) => s.id === profile.id);
        if (fresh && fresh.role !== profile.role) {
          const updatedProfile = { ...profile, role: fresh.role };
          setProfile(updatedProfile);
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(updatedProfile));
        }
      }
    };

    window.addEventListener('studyhub_students_updated', handleStudentsUpdated);
    return () => window.removeEventListener('studyhub_students_updated', handleStudentsUpdated);
  }, [profile]);

  async function fetchSupabaseProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        setProfile({
          id: userId,
          display_name: 'Student',
          email: '',
          role: 'student',
          gender: 'male',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        setProfile(data as UserProfile);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error?: string; profile?: UserProfile }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Master Administrator Check (Works universally on live and local)
      if (cleanEmail === 'admin123@gmail.com' && password === 'admin@123') {
        localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'true');
        localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);

        setUser({
          id: ADMIN_PROFILE.id,
          email: ADMIN_PROFILE.email,
          app_metadata: {},
          user_metadata: { display_name: ADMIN_PROFILE.display_name },
          aud: 'authenticated',
          created_at: ADMIN_PROFILE.created_at,
        } as User);
        setProfile(ADMIN_PROFILE);
        setIsLoading(false);
        return { profile: ADMIN_PROFILE };
      }

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }

        if (data.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const userProf = profileData as UserProfile;
          setProfile(userProf);
          setIsLoading(false);
          return { profile: userProf };
        }
      } else {
        // 2. Check Registered Students / CR / GR in Store
        const student = findStudentByEmail(cleanEmail);
        if (student && student.password === password) {
          const { password: _, ...safeProfile } = student;
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(safeProfile));
          localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);

          setUser({
            id: safeProfile.id,
            email: safeProfile.email,
            app_metadata: {},
            user_metadata: { display_name: safeProfile.display_name },
            aud: 'authenticated',
            created_at: safeProfile.created_at,
          } as User);
          setProfile(safeProfile);
          setIsLoading(false);
          return { profile: safeProfile };
        }

        setIsLoading(false);
        return {
          error: 'Invalid email or password. Please verify your credentials or create a student account.',
        };
      }
    } catch (e: any) {
      setIsLoading(false);
      return { error: e.message || 'An unexpected authentication error occurred.' };
    }

    setIsLoading(false);
    return { error: 'Unknown authentication error.' };
  };

  const signUpStudent = async (
    input: StudentRegistrationInput
  ): Promise<{ error?: string; profile?: UserProfile }> => {
    setIsLoading(true);
    try {
      const newProfile = registerStudent(input);

      // Auto log in newly registered student
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(newProfile));
      localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);

      setUser({
        id: newProfile.id,
        email: newProfile.email,
        app_metadata: {},
        user_metadata: { display_name: newProfile.display_name },
        aud: 'authenticated',
        created_at: newProfile.created_at,
      } as User);
      setProfile(newProfile);
      setIsLoading(false);
      return { profile: newProfile };
    } catch (e: any) {
      setIsLoading(false);
      return { error: e.message || 'Registration failed. Please try again.' };
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsLoading(false);
  };

  const refreshProfile = () => {
    restoreLocalSession();
  };

  const isAdmin = profile?.role === 'admin';
  const isCR = profile?.role === 'cr';
  const isGR = profile?.role === 'gr';
  const isStudyManager = isAdmin || isCR || isGR;
  const isStudent = profile?.role === 'student';
  const isLoggedIn = Boolean(profile);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isCR,
        isGR,
        isStudyManager,
        isStudent,
        isLoggedIn,
        isLoading,
        isDemoMode,
        signIn,
        signUpStudent,
        signOut,
        refreshProfile,
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
