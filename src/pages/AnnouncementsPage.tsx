// ==============================================================================
// HAMMAD STUDYHUB — ANNOUNCEMENTS & NOTICE BOARD
// ==============================================================================

import React from 'react';
import { Bell, Pin, Calendar, Tag, ShieldAlert } from 'lucide-react';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { formatRelativeTime } from '../lib/utils';
import { SEOHead } from '../components/common/SEOHead';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';

export const AnnouncementsPage: React.FC = () => {
  const { data: announcements, isLoading } = useAnnouncements();

  const getCategoryMeta = (category: string) => {
    switch (category) {
      case 'exam':
        return { label: 'Exam / Midterm', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800' };
      case 'assignment':
        return { label: 'Assignment Deadline', color: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' };
      case 'schedule':
        return { label: 'Timetable Schedule', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' };
      default:
        return { label: 'General Notice', color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-6 w-full max-w-full overflow-x-hidden">
      <SEOHead
        title="Announcements & Study Notices"
        description="Stay updated with class schedules, mid-term notifications, assignment deadlines, and academic notices on Hammad StudyHub."
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Bell className="w-7 h-7 text-brand-600" />
          <span>Announcements & Study Notices</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Official academic updates, exam schedules, and submission deadlines.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      ) : announcements && announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((item) => {
            const meta = getCategoryMeta(item.category);
            return (
              <Card
                key={item.id}
                className={`p-5 sm:p-6 space-y-3 ${
                  item.is_pinned
                    ? 'border-l-4 border-l-brand-600 dark:border-l-brand-500 bg-brand-50/20 dark:bg-navy-900'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${meta.color}`}
                    >
                      {meta.label}
                    </span>
                    {item.is_pinned && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2 py-0.5 rounded-full">
                        <Pin className="w-3 h-3 fill-current" />
                        <span>Pinned</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatRelativeTime(item.published_at)}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {item.body}
                </p>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No notices published"
          description="There are currently no active announcements. Check back later for exam and schedule updates."
        />
      )}
    </div>
  );
};
