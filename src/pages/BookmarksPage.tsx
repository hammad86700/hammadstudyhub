// ==============================================================================
// HAMMAD STUDYHUB — SAVED BOOKMARKS & STUDY REVISION CHECKLIST
// Privacy-first, zero-sign-in student productivity hub
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Trash2,
  ExternalLink,
  Calendar,
  Info,
  BookOpen,
  CheckCircle2,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { BookmarkItem, ChecklistItem } from '../types';
import {
  getBookmarks,
  removeBookmark,
  getChecklist,
  toggleChecklistItem,
  clearChecklist,
} from '../lib/storage';
import { formatLessonDate, formatRelativeTime, getResourceTypeMeta } from '../lib/utils';
import { SEOHead } from '../components/common/SEOHead';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';

export const BookmarksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'checklist'>('bookmarks');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => getBookmarks());
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => getChecklist());

  useEffect(() => {
    const handleBookmarkUpdate = () => {
      setBookmarks(getBookmarks());
    };
    const handleChecklistUpdate = () => {
      setChecklist(getChecklist());
    };

    window.addEventListener('studyhub_bookmarks_updated', handleBookmarkUpdate);
    window.addEventListener('studyhub_checklist_updated', handleChecklistUpdate);

    return () => {
      window.removeEventListener('studyhub_bookmarks_updated', handleBookmarkUpdate);
      window.removeEventListener('studyhub_checklist_updated', handleChecklistUpdate);
    };
  }, []);

  const handleRemoveBookmark = (resourceId: string) => {
    removeBookmark(resourceId);
  };

  const handleClearAllBookmarks = () => {
    if (window.confirm('Are you sure you want to remove all saved bookmarks?')) {
      bookmarks.forEach((b) => removeBookmark(b.resourceId));
    }
  };

  const handleToggleChecklist = (item: ChecklistItem) => {
    toggleChecklistItem(item.id, item.subjectSlug, item.title);
  };

  const handleClearAllChecklist = () => {
    if (window.confirm('Clear all completed items from your study revision checklist?')) {
      clearChecklist();
    }
  };

  const completedChecklist = checklist.filter((c) => c.isCompleted);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <SEOHead
        title={activeTab === 'bookmarks' ? 'Saved Bookmarks' : 'Study Revision Checklist'}
        description="Quick access to all your locally saved study resources and revision progress."
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            {activeTab === 'bookmarks' ? (
              <>
                <Bookmark className="w-7 h-7 text-brand-600 fill-current" />
                <span>Saved Bookmarks</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                <span>Study Revision Checklist</span>
              </>
            )}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {activeTab === 'bookmarks'
              ? 'Quickly revisit your important class notes, past papers, and revision documents.'
              : 'Track which lecture topics and assignments you have mastered and revised.'}
          </p>
        </div>

        {activeTab === 'bookmarks' && bookmarks.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAllBookmarks}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
          >
            Clear All Bookmarks
          </Button>
        )}

        {activeTab === 'checklist' && completedChecklist.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAllChecklist}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
          >
            Clear Checklist
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'bookmarks'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Bookmarks</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-navy-900 text-slate-700 dark:text-slate-300">
            {bookmarks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'checklist'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Revision Checklist</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
            {completedChecklist.length}
          </span>
        </button>
      </div>

      {/* Storage Information Banner */}
      <aside
        aria-label="Student productivity storage notice"
        className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-navy-900 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5"
      >
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p>
          <strong>Account-Free Storage:</strong> All bookmarks and study revision checklist items are saved privately inside your browser&apos;s local storage. They do not require a sign-in and survive page refreshes, staying on this device.
        </p>
      </aside>

      {/* Tab 1: Bookmarks View */}
      {activeTab === 'bookmarks' && (
        <>
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
                          onClick={() => handleRemoveBookmark(item.resourceId)}
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
        </>
      )}

      {/* Tab 2: Revision Checklist View */}
      {activeTab === 'checklist' && (
        <>
          {completedChecklist.length > 0 ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2 font-semibold">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    You have marked {completedChecklist.length} learning{' '}
                    {completedChecklist.length === 1 ? 'topic' : 'topics'} as revised!
                  </span>
                </div>
                <span>Keep up the great momentum!</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedChecklist.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex items-start justify-between gap-3 hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleChecklist(item)}
                        className="mt-0.5 text-emerald-600 hover:text-slate-400 transition-colors p-0.5 shrink-0"
                        title="Click to uncheck"
                      >
                        <CheckCircle className="w-5 h-5 fill-emerald-100 dark:fill-emerald-950" />
                      </button>

                      <div className="space-y-1 min-w-0">
                        <Link
                          to={`/resources/${item.id}`}
                          className="block text-sm font-bold text-slate-900 dark:text-white hover:text-brand-600 transition-colors line-clamp-2"
                        >
                          {item.title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Link
                            to={`/subjects/${item.subjectSlug}`}
                            className="font-medium hover:underline text-brand-600 dark:text-brand-400 truncate"
                          >
                            Course: {item.subjectSlug.toUpperCase()}
                          </Link>
                          {item.completedAt && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>{formatRelativeTime(item.completedAt)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/resources/${item.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
                      title="Open resource"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No topics on your revision checklist yet"
              description="On any lesson or resource card, click the checkmark icon to mark a topic as revised. It will appear here for structured exam revision."
              actionLabel="Explore Subjects"
              onAction={() => window.location.assign('/subjects')}
            />
          )}
        </>
      )}
    </div>
  );
};
