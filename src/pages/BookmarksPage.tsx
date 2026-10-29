// ==============================================================================
// HAMMAD STUDYHUB — SAVED BOOKMARKS PAGE
// Privacy-first, zero-sign-in bookmarks manager
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Trash2, ExternalLink, Calendar, Info, BookOpen } from 'lucide-react';
import { BookmarkItem } from '../types';
import { getBookmarks, removeBookmark } from '../lib/storage';
import { formatLessonDate, formatRelativeTime, getResourceTypeMeta } from '../lib/utils';
import { SEOHead } from '../components/common/SEOHead';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';

export const BookmarksPage: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => getBookmarks());

  useEffect(() => {
    const handleUpdate = () => {
      setBookmarks(getBookmarks());
    };
    window.addEventListener('studyhub_bookmarks_updated', handleUpdate);
    return () => window.removeEventListener('studyhub_bookmarks_updated', handleUpdate);
  }, []);

  const handleRemove = (resourceId: string) => {
    removeBookmark(resourceId);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all saved bookmarks?')) {
      bookmarks.forEach((b) => removeBookmark(b.resourceId));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <SEOHead
        title="Saved Bookmarks"
        description="Quick access to all your locally saved study resources and revision notes."
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bookmark className="w-7 h-7 text-brand-600 fill-current" />
            <span>Saved Bookmarks</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Quickly revisit your important class notes, past papers, and revision documents.
          </p>
        </div>

        {bookmarks.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Storage Information Banner */}
      <aside
        aria-label="Bookmark storage notice"
        className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-navy-900 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5"
      >
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p>
          <strong>Account-Free Storage:</strong> Bookmarks are securely saved in your local browser storage. They do not require an account and remain available whenever you return to this device.
        </p>
      </aside>

      {/* Bookmark Items List */}
      {bookmarks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map((item) => {
            const meta = getResourceTypeMeta(item.resourceType);
            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col justify-between space-y-3 hover:border-brand-300 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${meta.badgeClass}`}
                    >
                      {meta.shortLabel}
                    </span>
                    <button
                      onClick={() => handleRemove(item.resourceId)}
                      title="Remove bookmark"
                      className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    to={`/resources/${item.resourceId}`}
                    className="block text-sm font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-2"
                  >
                    {item.title}
                  </Link>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                    <Link
                      to={`/subjects/${item.subjectSlug}`}
                      className="hover:underline font-medium truncate"
                    >
                      {item.subjectName}
                    </Link>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatLessonDate(item.lessonDate, { format: 'short' })}</span>
                  </span>
                  <Link
                    to={`/resources/${item.resourceId}`}
                    className="font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No bookmarks saved yet"
          description="Click the bookmark icon on any resource card or viewer to keep quick access to your favorite notes."
          actionLabel="Explore Subjects"
          onAction={() => window.location.assign('/subjects')}
        />
      )}
    </div>
  );
};
