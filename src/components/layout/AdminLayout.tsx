// ==============================================================================
// HAMMAD STUDYHUB — PROTECTED MANAGEMENT LAYOUT (ADMIN, CR, & GR)
// - Admin: Access to all features, student directory, social links, settings
// - CR & GR: Access to study resource upload/edit, subjects, and announcements
// ==============================================================================

import React, { useState } from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Bell,
  Settings,
  Users,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Sun,
  Moon,
  ShieldCheck,
  Crown,
  Award,
  Database,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';

export const AdminLayout: React.FC = () => {
  const { user, profile, isAdmin, isCR, isGR, isStudyManager, isLoading, isDemoMode, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  // Route protection: Only Admin, CR, or GR can access the management panel
  if (!isStudyManager) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Navigation Items according to role permissions
  // CR and GR can manage study materials, but CANNOT see student data or admin settings
  const navItems = [
    ...(isAdmin ? [{ label: 'Dashboard Overview', href: '/admin', icon: LayoutDashboard, exact: true }] : []),
    { label: 'Resource Management', href: '/admin/resources', icon: FileText },
    { label: 'Subjects Management', href: '/admin/subjects', icon: BookOpen },
    { label: 'Announcements', href: '/admin/announcements', icon: Bell },
    ...(isAdmin
      ? [
          { label: 'Student Directory & CR/GR', href: '/admin/students', icon: Users },
          { label: 'Platform & Social Settings', href: '/admin/settings', icon: Settings },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-navy-950 text-slate-900 dark:text-slate-100">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:shrink-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              H
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight">StudyHub Portal</span>
              <span className="block text-[10px] text-brand-400">
                {isAdmin
                  ? 'Muhammad Hammad (Admin)'
                  : isCR
                  ? 'CR Study Portal'
                  : 'GR Study Portal'}
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Privileges Badge */}
        <div className="m-3 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-bold text-[11px] text-white">
            {isAdmin ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Master Administrator</span>
              </>
            ) : isCR ? (
              <>
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Class Representative (CR)</span>
              </>
            ) : (
              <>
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <span>Girls Representative (GR)</span>
              </>
            )}
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {isAdmin
              ? 'Full platform authority: student records, CR/GR appointments & settings.'
              : 'Authorized to upload, edit, and organize course notes, PDFs, and notices.'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.exact}
              onClick={() => setMobileSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Quick Chat Link */}
          <NavLink
            to="/chat"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <MessageSquare className="w-4 h-4 shrink-0 text-brand-400" />
            <span>Class Messages / Chat</span>
          </NavLink>
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-brand-400" />
            <span>Student Dashboard</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Website</span>
          </Link>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 px-4 sm:px-6 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="hidden sm:inline font-medium">Administrator:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile?.display_name || 'Muhammad Hammad'}
                  </span>
                </>
              ) : isCR ? (
                <>
                  <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="hidden sm:inline font-medium">Class Representative (CR):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile?.display_name}
                  </span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4 text-purple-500 shrink-0" />
                  <span className="hidden sm:inline font-medium">Girls Representative (GR):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile?.display_name}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
              className="hidden sm:inline-flex text-xs py-1.5"
            >
              Sign Out
            </Button>
          </div>
        </header>

        {/* Body View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
