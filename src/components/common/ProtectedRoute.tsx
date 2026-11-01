// ==============================================================================
// HAMMAD STUDYHUB — ROUTE PROTECTION GUARD
// Protects student and administrator routes from unauthenticated public visitors
// ==============================================================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { isLoggedIn, isLoading, isStudyManager } = useAuth();
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

  // 1. Not logged in -> redirect to student login
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Admin/CR restricted page requested by a regular student
  if (requireAdmin && !isStudyManager) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

