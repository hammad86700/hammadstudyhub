// ==============================================================================
// HAMMAD STUDYHUB — PUBLIC NAVIGATION BAR
// ==============================================================================

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bookmark,
  Sun,
  Moon,
  Menu,
  X,
  BookOpen,
  Bell,
  ShieldAlert,
  Info,
  Clock,
  LayoutDashboard,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getBookmarks } from '../../lib/storage';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { resolvedTheme, toggleTheme } = useTheme();
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [bookmarkCount, setBookmarkCount] = useState(() => getBookmarks().length);

  React.useEffect(() => {
    const handleBookmarkChange = () => {
      setBookmarkCount(getBookmarks().length);
    };
    window.addEventListener('studyhub_bookmarks_updated', handleBookmarkChange);
    return () => window.removeEventListener('studyhub_bookmarks_updated', handleBookmarkChange);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'Subjects', href: '/subjects', icon: BookOpen },
    { label: 'Recent', href: '/recent', icon: Clock },
    { label: 'Announcements', href: '/announcements', icon: Bell },
    { label: 'About', href: '/about', icon: Info },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-navy-950/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand Mark */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group focus:outline-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-navy-900 p-0.5 shadow-sm group-hover:shadow transition-shadow">
              <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-brand-400 group-hover:scale-105 transition-transform"
                  viewBox="0 0 512 512"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="176" y="160" width="40" height="192" rx="12" fill="#60A5FA" />
                  <rect x="296" y="160" width="40" height="192" rx="12" fill="#60A5FA" />
                  <path d="M188 256 L324 256" stroke="#F59E0B" strokeWidth="36" strokeLinecap="round" />
                  <path d="M256 100 L264 124 L288 132 L264 140 L256 164 L248 140 L224 132 L248 124 Z" fill="#F59E0B" />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Hammad StudyHub
              </span>
              <span className="block text-[10px] font-medium tracking-wide text-brand-600 dark:text-brand-400 uppercase">
                By Muhammad Hammad
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions: Search, Bookmarks, Theme Toggle, Admin */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Search Trigger */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition-colors"
              aria-label="Open search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Bookmarks Counter */}
            <Link
              to="/bookmarks"
              className={`relative p-2 rounded-lg transition-colors ${
                isActive('/bookmarks')
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
              title="Saved Bookmarks"
              aria-label="Bookmarks"
            >
              <Bookmark className="w-4 h-4" />
              {bookmarkCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {bookmarkCount}
                </span>
              )}
            </Link>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Admin Portal Indicator / Link */}
            {isAdmin ? (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            ) : (
              <Link
                to="/admin/login"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                title="Administrator Login"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search Expansion Bar */}
        {searchOpen && (
          <div className="py-3 border-t border-slate-200/80 dark:border-slate-800/80 animate-in fade-in slide-in-from-top-1">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search subjects, PDF notes, lectures, topics, or past papers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1 animate-in fade-in">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    active
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-3">
              <Link
                to={isAdmin ? '/admin' : '/admin/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-1.5 py-1"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isAdmin ? 'Admin Dashboard' : 'Admin Login'}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
