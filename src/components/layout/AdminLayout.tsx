// ==============================================================================
// HAMMAD STUDYHUB — PROTECTED ADMIN LAYOUT
// ==============================================================================

import React, { useState } from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Bell,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Sun,
  Moon,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';

export const AdminLayout: React.FC = () => {
  const { user, profile, isAdmin, isLoading, isDemoMode, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Verifying administrator authorization...</p>
        </div>
      </div>
    );
  }

  // Route protection
  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const navItems = [
    { label: 'Dashboard Overview', href: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Subjects Management', href: '/admin/subjects', icon: BookOpen },
    { label: 'Resource Management', href: '/admin/resources', icon: FileText },
    { label: 'Announcements', href: '/admin/announcements', icon: Bell },
    { label: 'Platform Settings', href: '/admin/settings', icon: Settings },
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
              <span className="font-bold text-sm text-white tracking-tight">StudyHub Admin</span>
              <span className="block text-[10px] text-brand-400">Muhammad Hammad</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage Mode Badge */}
        {isDemoMode && (
          <div className="m-3 p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[11px] text-brand-400">
              <Database className="w-3.5 h-3.5" />
              <span>Local Storage Active</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Published materials save directly in local storage. Connect Supabase in .env for multi-device sync.
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
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
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-slate-800 space-y-1">
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
        {/* Admin Top Header */}
        <header className="h-16 px-4 sm:px-6 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline font-medium">Administrator Session:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {profile?.display_name || user?.email || 'Muhammad Hammad'}
              </span>
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
