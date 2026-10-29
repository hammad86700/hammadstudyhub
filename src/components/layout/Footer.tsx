// ==============================================================================
// HAMMAD STUDYHUB — FOOTER COMPONENT
// ==============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, BookOpen, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-950 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600 to-navy-900 p-0.5">
                <div className="w-full h-full rounded-[7px] bg-slate-900 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-brand-400" />
                </div>
              </div>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                Hammad StudyHub
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              <strong>Learn. Revise. Grow.</strong> Your studies, organized in one place.
              A streamlined, high-performance platform for daily lecture notes, whiteboard photos,
              handwritten summaries, past papers, and video lectures.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <span>Created by</span>
              <strong className="text-slate-900 dark:text-white font-semibold">Muhammad Hammad</strong>
            </div>
          </div>

          {/* Quick Access */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/subjects" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Subject Directory
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Global Search
                </Link>
              </li>
              <li>
                <Link to="/bookmarks" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Saved Bookmarks
                </Link>
              </li>
              <li>
                <Link to="/recent" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Recently Viewed
                </Link>
              </li>
              <li>
                <Link to="/announcements" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Announcements & Notices
                </Link>
              </li>
            </ul>
          </div>

          {/* Information & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
              Information
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/about" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  About Platform
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Feedback & Report Link
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors inline-flex items-center gap-1">
                  <span>Administrator Portal</span>
                  <Shield className="w-3 h-3 text-slate-400" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Academic Disclaimer & Copyright */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p className="text-center sm:text-left">
            &copy; {currentYear} <strong>Hammad StudyHub</strong>. Designed & developed by <strong>Muhammad Hammad</strong>. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <span>Built for academic excellence</span>
            <span>&bull;</span>
            <span className="text-slate-500">PWA Enabled</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
