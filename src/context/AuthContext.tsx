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
  upsertRegisteredStudentLocally,
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

      // 2. If Supabase is configured, check the registered_students table first
      if (isSupabaseConfigured) {
        try {
          const { data: studentRecord, error: tableError } = await supabase
            .from('registered_students')
            .select('*')
            .ilike('email', cleanEmail)
            .maybeSingle();

          if (!tableError && studentRecord) {
            if (studentRecord.password && studentRecord.password !== password) {
              setIsLoading(false);
              return { error: 'Incorrect password. Please verify your password and try again.' };
            }

            // Student authenticated successfully
            const { password: _, ...safeProfile } = studentRecord;
            localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(safeProfile));
            localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
            upsertRegisteredStudentLocally(studentRecord);

            setUser({
              id: safeProfile.id,
              email: safeProfile.email,
              app_metadata: {},
              user_metadata: { display_name: safeProfile.display_name },
              aud: 'authenticated',
              created_at: safeProfile.created_at,
            } as User);
            setProfile(safeProfile as UserProfile);
            setIsLoading(false);
            return { profile: safeProfile as UserProfile };
          }
        } catch (dbErr) {
          console.warn('Supabase registered_students query notice:', dbErr);
        }

        // 3. Try standard Supabase Auth signInWithPassword (safe fallback)
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (!authError && authData?.user) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authData.user.id)
              .maybeSingle();

            const userProf: UserProfile = (profileData as UserProfile) || {
              id: authData.user.id,
              display_name: authData.user.user_metadata?.display_name || cleanEmail.split('@')[0],
              email: cleanEmail,
              role: 'student',
              gender: authData.user.user_metadata?.gender || 'male',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(userProf));
            localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
            setProfile(userProf);
            setIsLoading(false);
            return { profile: userProf };
          }
        } catch (authErr) {
          console.warn('Supabase auth attempt notice:', authErr);
        }
      }

      // 4. Local Registered Students Store (Fallback & Offline)
      const student = findStudentByEmail(cleanEmail);
      if (student) {
        if (student.password && student.password !== password) {
          setIsLoading(false);
          return { error: 'Incorrect password. Please verify your password and try again.' };
        }

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
        error: 'No account found with this email. Please check your spelling or click "Sign Up Now" to create an account.',
      };
    } catch (e: any) {
      setIsLoading(false);
      return { error: e.message || 'An unexpected authentication error occurred.' };
    }
  };

  const signUpStudent = async (
    input: StudentRegistrationInput
  ): Promise<{ error?: string; profile?: UserProfile }> => {
    setIsLoading(true);
    try {
      const newProfile = registerStudent(input);

      // Dual-write to Supabase registered_students if configured
      if (isSupabaseConfigured) {
        try {
          const { error: syncError } = await supabase.from('registered_students').upsert({
            id: newProfile.id,
            display_name: input.display_name.trim(),
            email: input.email.trim().toLowerCase(),
            password: input.password,
            role: newProfile.role,
            gender: input.gender,
            phone: input.phone?.trim() || '',
            roll_no: input.roll_no?.trim() || '',
            program_name: input.program_name?.trim() || '',
            semester: input.semester?.trim() || '',
            created_at: newProfile.created_at,
            updated_at: newProfile.updated_at,
          });
          if (syncError) {
            console.warn('Supabase student registration sync notice:', syncError.message);
          }
        } catch (syncEx) {
          console.warn('Supabase student registration sync exception:', syncEx);
        }

        // Also attempt Supabase Auth signup in background (safe, ignore error if email confirm needed)
        try {
          await supabase.auth.signUp({
            email: input.email.trim().toLowerCase(),
            password: input.password,
            options: {
              data: {
                display_name: input.display_name.trim(),
                gender: input.gender,
                roll_no: input.roll_no?.trim() || '',
              },
            },
          });
        } catch {
          // ignore
        }
      }

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
