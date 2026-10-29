// ==============================================================================
// HAMMAD STUDYHUB — RECENTLY VIEWED RESOURCES PAGE
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Trash2, ExternalLink, Calendar, BookOpen } from 'lucide-react';
import { RecentlyViewedItem } from '../types';
import { getRecentlyViewed, clearRecentlyViewed } from '../lib/storage';
import { formatLessonDate, formatRelativeTime, getResourceTypeMeta } from '../lib/utils';
import { SEOHead } from '../components/common/SEOHead';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';

export const RecentPage: React.FC = () => {
  const [recentItems, setRecentItems] = useState<RecentlyViewedItem[]>(() => getRecentlyViewed());

  useEffect(() => {
    const handleUpdate = () => {
      setRecentItems(getRecentlyViewed());
    };
    window.addEventListener('studyhub_recent_updated', handleUpdate);
    return () => window.removeEventListener('studyhub_recent_updated', handleUpdate);
  }, []);

  const handleClear = () => {
    if (window.confirm('Clear your recently viewed history?')) {
      clearRecentlyViewed();
      setRecentItems([]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <SEOHead
        title="Recently Viewed Resources"
        description="Pick up right where you left off. Review recently opened notes and study materials."
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-brand-600" />
            <span>Recently Viewed History</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Automatically tracks study resources you have opened recently on this browser.
          </p>
        </div>

        {recentItems.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
          >
            Clear History
          </Button>
        )}
      </div>

      {recentItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentItems.map((item) => {
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
                    <span className="text-[10px] text-slate-400">
                      Viewed {formatRelativeTime(item.viewedAt)}
                    </span>
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
                    <span>Lesson: {formatLessonDate(item.lessonDate, { format: 'short' })}</span>
                  </span>
                  <Link
                    to={`/resources/${item.resourceId}`}
                    className="font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <span>Reopen</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No recent history"
          description="Resources you view will appear here so you can easily resume studying."
          actionLabel="Browse Subjects"
          onAction={() => window.location.assign('/subjects')}
        />
      )}
    </div>
  );
};
