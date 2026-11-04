// ==============================================================================
// HAMMAD STUDYHUB — UNIFIED AUTHENTICATION & ROLE CONTEXT
// Supports Administrator (admin123@gmail.com), Class Representatives (CR & GR),
// and Registered Students with profile data and gender access control.
// ==============================================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole, StudentRegistrationInput, TeacherRegistrationInput, TeacherApplication } from '../types';
import {
  findStudentByEmail,
  registerStudent,
  getRegisteredStudents,
  upsertRegisteredStudentLocally,
} from '../lib/demoStore';
import {
  submitTeacherRegistration,
  getTeacherApplicationByEmail,
} from '../lib/teacherAssignmentStore';
import { broadcastDataChange } from '../lib/realtimeSync';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isCR: boolean;
  isGR: boolean;
  isStudyManager: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; profile?: UserProfile }>;
  signUpStudent: (input: StudentRegistrationInput) => Promise<{ error?: string; profile?: UserProfile }>;
  registerTeacher: (input: TeacherRegistrationInput) => Promise<{ success: boolean; application?: TeacherApplication; error?: string }>;
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

export const DEFAULT_CR_PROFILE: UserProfile = {
  id: 'virtual-cr-id',
  display_name: 'Class Representative (CR)',
  email: 'cr@hammadstudyhub.com',
  role: 'cr',
  gender: 'male',
  created_at: '2026-10-30T00:00:00Z',
  updated_at: '2026-10-30T00:00:00Z',
};

export const DEFAULT_GR_PROFILE: UserProfile = {
  id: 'virtual-gr-id',
  display_name: 'Girls Representative (GR)',
  email: 'gr@hammadstudyhub.com',
  role: 'gr',
  gender: 'female',
  created_at: '2026-10-30T00:00:00Z',
  updated_at: '2026-10-30T00:00:00Z',
};

const ACTIVE_USER_STORAGE_KEY = 'studyhub_active_user_v3';
const ADMIN_AUTH_STORAGE_KEY = 'studyhub_admin_auth_v3';

function getStoredActiveProfile(): UserProfile | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    if (localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'true') {
      return ADMIN_PROFILE;
    }
    const savedUserStr = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (savedUserStr) {
      const savedUser = JSON.parse(savedUserStr) as UserProfile;
      if (savedUser && savedUser.id && savedUser.email) {
        // Check teacher applications to preserve teacher elevation
        const teacherApp = getTeacherApplicationByEmail(savedUser.email);
        const isApprovedTeacher = teacherApp?.status === 'approved' || savedUser.role === 'teacher';

        const fresh = getRegisteredStudents().find(
          (s) => s.id === savedUser.id || s.email.toLowerCase() === savedUser.email.toLowerCase()
        );

        const effectiveRole = isApprovedTeacher ? 'teacher' : (fresh?.role || savedUser.role);
        const effectiveAssignedSubjects = isApprovedTeacher
          ? (teacherApp?.approved_subject_ids || fresh?.assigned_subject_ids || savedUser.assigned_subject_ids || [])
          : (fresh?.assigned_subject_ids || savedUser.assigned_subject_ids || []);

        return {
          ...savedUser,
          role: effectiveRole,
          display_name: fresh?.display_name || savedUser.display_name,
          assigned_subject_ids: effectiveAssignedSubjects,
          teacher_status: isApprovedTeacher ? 'approved' : (fresh?.teacher_status || savedUser.teacher_status),
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse active user profile from storage:', e);
  }
  return null;
}

function createSyntheticUser(p: UserProfile): User {
  return {
    id: p.id,
    email: p.email,
    app_metadata: {},
    user_metadata: { display_name: p.display_name, role: p.role, gender: p.gender },
    aud: 'authenticated',
    created_at: p.created_at || new Date().toISOString(),
  } as User;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialProfile = getStoredActiveProfile();
  const [profile, setProfile] = useState<UserProfile | null>(() => initialProfile);
  const [user, setUser] = useState<User | null>(() => (initialProfile ? createSyntheticUser(initialProfile) : null));
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !initialProfile);

  const isDemoMode = !isSupabaseConfigured;

  // Restore session
  const restoreLocalSession = (): boolean => {
    try {
      const active = getStoredActiveProfile();
      if (active) {
        setUser(createSyntheticUser(active));
        setProfile(active);
        return true;
      }
    } catch (e) {
      console.warn('Session restoration failed:', e);
    }
    return false;
  };

  useEffect(() => {
    // 1. Immediately check local session (covers Admin, CR, GR, and Student)
    const hasLocal = restoreLocalSession();

    // 2. Safety timeout: Never allow the application to remain stuck on a loading screen longer than 1.5 seconds
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        clearTimeout(safetyTimer);
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          fetchSupabaseProfile(session.user.id);
        } else {
          // If no Supabase Auth session, keep our local user if logged in (CR, GR, Student, Admin)
          const restored = restoreLocalSession();
          if (!restored) {
            setUser(null);
            setProfile(null);
          }
          setIsLoading(false);
        }
      }).catch(() => {
        clearTimeout(safetyTimer);
        setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          fetchSupabaseProfile(session.user.id);
        } else {
          // DO NOT blindly wipe profile on session null! Check if local session is active
          const restored = restoreLocalSession();
          if (!restored) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
          setIsLoading(false);
        }
      });

      return () => {
        clearTimeout(safetyTimer);
        subscription.unsubscribe();
      };
    } else {
      clearTimeout(safetyTimer);
      if (!hasLocal) {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    }
  }, []);

  // Listen for student role changes by admin in real-time across devices
  useEffect(() => {
    const checkRoleUpdates = async () => {
      if (!profile || profile.role === 'admin') return;

      // Do not demote an approved teacher
      const teacherApp = getTeacherApplicationByEmail(profile.email);
      if (teacherApp && teacherApp.status === 'approved') {
        if (profile.role !== 'teacher') {
          const updatedProfile = {
            ...profile,
            role: 'teacher' as UserRole,
            teacher_status: 'approved' as const,
            assigned_subject_ids: teacherApp.approved_subject_ids || [],
          };
          setProfile(updatedProfile);
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(updatedProfile));
        }
        return;
      }

      // 1. Check local registered students
      const fresh = getRegisteredStudents().find((s) => s.id === profile.id);
      if (fresh && fresh.role !== profile.role) {
        const updatedProfile = { ...profile, role: fresh.role };
        setProfile(updatedProfile);
        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(updatedProfile));
        return;
      }

      // 2. If Supabase configured, check remote database
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('registered_students')
            .select('role')
            .eq('id', profile.id)
            .maybeSingle();

          if (!error && data && data.role !== profile.role) {
            const updatedProfile = { ...profile, role: data.role as UserRole };
            setProfile(updatedProfile);
            localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(updatedProfile));
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('studyhub_students_updated', checkRoleUpdates);
    window.addEventListener('focus', checkRoleUpdates);
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkRoleUpdates();
      }
    }, 30000);

    return () => {
      window.removeEventListener('studyhub_students_updated', checkRoleUpdates);
      window.removeEventListener('focus', checkRoleUpdates);
      clearInterval(interval);
    };
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

      // 4. Local Registered Students & Teachers Store
      let student = findStudentByEmail(cleanEmail);

      // If not found in primary store, check teacher application directly
      if (!student) {
        const teacherApp = getTeacherApplicationByEmail(cleanEmail);
        if (teacherApp) {
          const legacyUsers = typeof localStorage !== 'undefined'
            ? JSON.parse(localStorage.getItem('studyhub_registered_students_v3') || '[]')
            : [];
          const legacyMatch = legacyUsers.find((u: any) => u.email && u.email.toLowerCase() === cleanEmail);
          const candidatePassword = legacyMatch?.password || teacherApp.password;

          const reconstructedTeacher = {
            id: teacherApp.teacher_id || teacherApp.id,
            display_name: teacherApp.display_name,
            email: cleanEmail,
            password: candidatePassword || '',
            role: teacherApp.status === 'approved' ? ('teacher' as UserRole) : ('student' as UserRole),
            gender: teacherApp.gender || ('male' as const),
            phone: teacherApp.phone || '',
            assigned_subject_ids: teacherApp.approved_subject_ids || [],
            teacher_status: teacherApp.status,
            created_at: teacherApp.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          upsertRegisteredStudentLocally(reconstructedTeacher);
          student = reconstructedTeacher;
        }
      }

      if (student) {
        if (student.password && student.password !== password) {
          setIsLoading(false);
          return { error: 'Incorrect password. Please verify your password and try again.' };
        }

        // Check if this is a pending or rejected teacher account
        const teacherApp = getTeacherApplicationByEmail(cleanEmail);
        const appStatus = teacherApp?.status || student.teacher_status;

        if (appStatus === 'pending') {
          setIsLoading(false);
          return {
            error: 'Your teacher account is pending administrator review and approval. Please check back later or contact Muhammad Hammad.',
          };
        }

        if (appStatus === 'rejected') {
          setIsLoading(false);
          return {
            error: 'Your teacher account application was reviewed and not approved. Please contact the administrator for more information.',
          };
        }

        const isApprovedTeacher = appStatus === 'approved' || student.role === 'teacher';
        const approvedSubjects = teacherApp?.approved_subject_ids || student.assigned_subject_ids || [];

        const { password: _, ...safeProfile } = student;
        if (isApprovedTeacher) {
          safeProfile.role = 'teacher';
          safeProfile.teacher_status = 'approved';
          safeProfile.assigned_subject_ids = approvedSubjects;

          // Crucial: ensure stored student record is elevated to teacher so role doesn't get demoted
          upsertRegisteredStudentLocally({
            ...student,
            role: 'teacher',
            teacher_status: 'approved',
            assigned_subject_ids: approvedSubjects,
          });
        }

        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(safeProfile));
        localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);

        setUser({
          id: safeProfile.id,
          email: safeProfile.email,
          app_metadata: {},
          user_metadata: { display_name: safeProfile.display_name, role: safeProfile.role },
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
      console.warn('Authentication error:', e);
      // Attempt local fallback in case network or remote DB threw
      let student = findStudentByEmail(cleanEmail);
      const teacherApp = getTeacherApplicationByEmail(cleanEmail);

      if (!student && teacherApp) {
        const legacyUsers = typeof localStorage !== 'undefined'
          ? JSON.parse(localStorage.getItem('studyhub_registered_students_v3') || '[]')
          : [];
        const legacyMatch = legacyUsers.find((u: any) => u.email && u.email.toLowerCase() === cleanEmail);
        const candidatePassword = legacyMatch?.password || teacherApp.password;

        student = {
          id: teacherApp.teacher_id || teacherApp.id,
          display_name: teacherApp.display_name,
          email: cleanEmail,
          password: candidatePassword || '',
          role: teacherApp.status === 'approved' ? 'teacher' : 'student',
          gender: teacherApp.gender || 'male',
          phone: teacherApp.phone || '',
          assigned_subject_ids: teacherApp.approved_subject_ids || [],
          teacher_status: teacherApp.status,
          created_at: teacherApp.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        upsertRegisteredStudentLocally(student);
      }

      if (student) {
        if (student.password && student.password !== password) {
          setIsLoading(false);
          return { error: 'Incorrect password. Please verify your password and try again.' };
        }

        const appStatus = teacherApp?.status || student.teacher_status;
        if (appStatus === 'pending') {
          setIsLoading(false);
          return {
            error: 'Your teacher account is pending administrator review and approval. Please check back later or contact Muhammad Hammad.',
          };
        }

        if (appStatus === 'rejected') {
          setIsLoading(false);
          return {
            error: 'Your teacher account application was reviewed and not approved. Please contact the administrator for more information.',
          };
        }

        const isApprovedTeacher = appStatus === 'approved' || student.role === 'teacher';
        const approvedSubjects = teacherApp?.approved_subject_ids || student.assigned_subject_ids || [];

        const { password: _, ...safeProfile } = student;
        if (isApprovedTeacher) {
          safeProfile.role = 'teacher';
          safeProfile.teacher_status = 'approved';
          safeProfile.assigned_subject_ids = approvedSubjects;
          upsertRegisteredStudentLocally({
            ...student,
            role: 'teacher',
            teacher_status: 'approved',
            assigned_subject_ids: approvedSubjects,
          });
        }

        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(safeProfile));
        localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
        setUser({
          id: safeProfile.id,
          email: safeProfile.email,
          app_metadata: {},
          user_metadata: { display_name: safeProfile.display_name, role: safeProfile.role },
          aud: 'authenticated',
          created_at: safeProfile.created_at,
        } as User);
        setProfile(safeProfile);
        setIsLoading(false);
        return { profile: safeProfile };
      }

      setIsLoading(false);
      const isTechnicalError =
        e?.message?.includes('Invalid path') ||
        e?.message?.includes('fetch') ||
        e?.message?.includes('Network');
      return {
        error: isTechnicalError
          ? 'Unable to connect to authentication server. Please click "Sign Up Now" to create your student account, or check your internet connection.'
          : e?.message || 'An unexpected authentication error occurred.',
      };
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

      // Broadcast new student registration across all devices immediately
      broadcastDataChange('students', 'create', newProfile);

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

  const registerTeacher = async (
    input: TeacherRegistrationInput
  ): Promise<{ success: boolean; application?: TeacherApplication; error?: string }> => {
    setIsLoading(true);
    const res = await submitTeacherRegistration(input);
    setIsLoading(false);
    return res;
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
  const isTeacher = profile?.role === 'teacher';
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
        isTeacher,
        isStudent,
        isLoggedIn,
        isLoading,
        isDemoMode,
        signIn,
        signUpStudent,
        registerTeacher,
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
