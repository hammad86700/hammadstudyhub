// ==============================================================================
// HAMMAD STUDYHUB — PUBLIC & STUDENT NAVIGATION BAR
// Clean, minimal, modern educational SaaS navigation
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
  LayoutDashboard,
  MessageSquare,
  MessageCircle,
  UserPlus,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getBookmarks } from '../../lib/storage';
import { getUnreadChatCount } from '../../lib/demoStore';
import { ContactAdminModal } from '../common/ContactAdminModal';
import { NotificationBell } from '../common/NotificationBell';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const { resolvedTheme, toggleTheme } = useTheme();
  const { profile, isLoggedIn, isAdmin, isCR, isGR, isStudyManager, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [bookmarkCount, setBookmarkCount] = useState(() => getBookmarks().length);
  const [unreadChatCount, setUnreadChatCount] = useState(() =>
    profile ? getUnreadChatCount(profile.id) : 0
  );

  React.useEffect(() => {
    const handleBookmarkChange = () => {
      setBookmarkCount(getBookmarks().length);
    };
    const handleChatChange = () => {
      if (profile) {
        setUnreadChatCount(getUnreadChatCount(profile.id));
      }
    };

    handleChatChange();
    window.addEventListener('studyhub_bookmarks_updated', handleBookmarkChange);
    window.addEventListener('studyhub_chat_updated', handleChatChange);
    return () => {
      window.removeEventListener('studyhub_bookmarks_updated', handleBookmarkChange);
      window.removeEventListener('studyhub_chat_updated', handleChatChange);
    };
  }, [profile]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Authenticated Student Nav vs Public Website Nav
  const publicNavLinks = [
    { label: 'About', href: '/about' },
    { label: 'Announcements', href: '/announcements' },
    { label: 'Feedback', href: '/feedback' },
  ];

  const studentNavLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Subjects', href: '/subjects', icon: BookOpen },
    { label: 'Recent', href: '/recent', icon: Clock },
    { label: 'Announcements', href: '/announcements', icon: Bell },
    { label: 'Class Chat', href: '/chat', icon: MessageSquare },
  ];

  const navLinks = isLoggedIn ? studentNavLinks : publicNavLinks;

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const roleLabel = isAdmin ? 'Admin' : isCR ? 'CR' : isGR ? 'GR' : 'Student';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-navy-950/95 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            {/* Logo & Brand Identity */}
            <Link
              to={isLoggedIn ? '/dashboard' : '/'}
              className="flex items-center gap-2.5 sm:gap-3 min-w-0 group focus:outline-none"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white truncate block leading-tight">
                  Hammad StudyHub
                </span>
                <span className="block text-[9px] sm:text-[10px] font-medium text-brand-600 dark:text-brand-400 tracking-wider uppercase truncate">
                  Student Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      active
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.href === '/chat' && unreadChatCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-brand-600 text-white animate-pulse">
                        {unreadChatCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Actions: Search, Bookmarks, Notifications, Theme, User */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Quick Search Button */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition-colors"
                aria-label="Search"
                title="Search materials (Ctrl+K)"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Bookmarks Counter (Students) */}
              <Link
                to="/bookmarks"
                className={`relative p-2 rounded-lg transition-colors ${
                  isActive('/bookmarks')
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
                title="Saved Bookmarks"
              >
                <Bookmark className="w-4 h-4" />
                {bookmarkCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {bookmarkCount}
                  </span>
                )}
              </Link>

              {/* Notification Bell */}
              {isLoggedIn && <NotificationBell />}

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

              {/* Authenticated User Pill & Dropdown / Portal Action */}
              {isLoggedIn && profile ? (
                <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
                  {isStudyManager ? (
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isAdmin ? 'Admin' : isCR ? 'CR Portal' : 'GR Portal'}</span>
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800/80 text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                      title="Your Dashboard"
                    >
                      <div className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {(profile.display_name || 'S').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                        {profile.display_name.split(' ')[0]}
                      </span>
                    </Link>
                  )}

                  <button
                    onClick={() => signOut()}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-brand-600 dark:text-slate-300 dark:hover:text-white transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-xs"
                  >
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Quick Search Dropdown Bar */}
          {searchOpen && (
            <div className="py-3 border-t border-slate-200/80 dark:border-slate-800/80 animate-in fade-in slide-in-from-top-1">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by topic, lesson, subject code, or tag..."
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700"
                >
                  Search
                </button>
              </form>
            </div>
          )}

          {/* Mobile Drawer Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold ${
                    isActive(link.href)
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.href === '/chat' && unreadChatCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-600 text-white animate-pulse">
                      {unreadChatCount} new
                    </span>
                  )}
                </Link>
              ))}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {isLoggedIn && profile ? (
                  <>
                    <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-900/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium truncate max-w-[180px]">
                        {profile.display_name}
                      </span>
                      <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                        {roleLabel}
                      </span>
                    </div>

                    {isStudyManager && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isAdmin ? 'Admin Dashboard' : isCR ? 'CR Portal' : 'GR Portal'}</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2 px-3 pt-1">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2.5 text-center text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2.5 text-center text-xs font-bold rounded-lg bg-brand-600 text-white shadow-xs"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Support / Contact Admin Modal */}
      <ContactAdminModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </>
  );
};

