// ==============================================================================
// HAMMAD STUDYHUB — PUBLIC NAVIGATION BAR
// Includes Student Login/Signup, Contact Admin (WhatsApp & Instagram), and Chat
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
  MessageSquare,
  MessageCircle,
  UserPlus,
  LogIn,
  LogOut,
  User,
  Crown,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getBookmarks } from '../../lib/storage';
import { ContactAdminModal } from '../common/ContactAdminModal';

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
    { label: 'Class Chat', href: '/chat', icon: MessageSquare },
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
    <>
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

            {/* Actions: Contact Admin, Search, Bookmarks, Theme Toggle, Auth */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Direct Contact Admin WhatsApp / Instagram Trigger */}
              <button
                onClick={() => setContactModalOpen(true)}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 transition-all shadow-xs"
                title="WhatsApp 03242779514 & Instagram not_urs_hammi"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-current" />
                <span>Contact Admin</span>
              </button>

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

              {/* Logged in User Indicator & Study Portal */}
              {isLoggedIn && profile ? (
                <div className="hidden sm:flex items-center gap-2">
                  {isStudyManager ? (
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-xs"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>{isAdmin ? 'Admin Portal' : isCR ? 'CR Portal' : 'GR Portal'}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs">
                      <User className="w-3.5 h-3.5 text-brand-600" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                        {profile.display_name.split(' ')[0]}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => signOut()}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5">
                  <Link
                    to="/login"
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-brand-600 dark:text-slate-300 dark:hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up</span>
                  </Link>
                </div>
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by topic, lesson, subject code, or tag..."
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700"
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
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <link.icon className="w-4 h-4 text-brand-500" />
                  <span>{link.label}</span>
                </Link>
              ))}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setContactModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 fill-current" />
                <span>Contact Admin (WhatsApp & Instagram)</span>
              </button>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {isLoggedIn && profile ? (
                  <>
                    <div className="px-3 py-1 text-xs text-slate-500">
                      Logged in as <strong>{profile.display_name}</strong> ({profile.role})
                    </div>
                    {isStudyManager && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-brand-600"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Manage Courses & Notes</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-500"
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
                      className="p-2 text-center text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 text-center text-xs font-semibold rounded-lg bg-brand-600 text-white"
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

      {/* Direct Contact Admin Modal */}
      <ContactAdminModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </>
  );
};
