// ==============================================================================
// HAMMAD STUDYHUB — ROUTE PROTECTION GUARD
// Protects student and administrator routes from unauthenticated public visitors
// ==============================================================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTeacherApplicationByEmail } from '../../lib/teacherAssignmentStore';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requireAdmin?: boolean;
  requireTeacher?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireTeacher = false,
}) => {
  const { isLoggedIn, isLoading, isStudyManager, isTeacher, isAdmin, profile, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-10 h-10 rounded-full border-3 border-brand-500 border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Loading Hammad StudyHub...
        </p>
      </div>
    );
  }

  // 1. Not logged in -> redirect to login
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Admin/CR restricted page requested by a non-manager
  if (requireAdmin && !isStudyManager) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Teacher restricted page requested by non-teacher / non-admin
  if (requireTeacher && !isTeacher && !isAdmin) {
    const isPending =
      profile?.teacher_status === 'pending' ||
      Boolean(profile?.email && getTeacherApplicationByEmail(profile.email)?.status === 'pending');

    if (isPending) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-amber-200 dark:border-amber-900/50 shadow-elevated text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Application Status: Pending
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Teacher Application Pending Approval
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Your teacher registration is currently under review by the platform administrator (<strong>Muhammad Hammad</strong>). You will gain full access to your teaching portal and assigned subjects once approved.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Check Approval Status</span>
              </button>
              <button
                type="button"
                onClick={() => signOut()}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

