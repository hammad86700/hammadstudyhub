// ==============================================================================
// HAMMAD STUDYHUB — HOMEPAGE
// ==============================================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  FileText,
  Video,
  Image as ImageIcon,
  ClipboardCheck,
  GraduationCap,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Calendar,
  Layers,
  Clock,
  Bell,
} from 'lucide-react';
import { useSubjects } from '../hooks/useSubjects';
import { useLatestResources } from '../hooks/useResources';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { getRecentlyViewed } from '../lib/storage';
import { formatLessonDate } from '../lib/utils';
import { SubjectCard } from '../components/subject/SubjectCard';
import { ResourceCard } from '../components/resource/ResourceCard';
import { SEOHead } from '../components/common/SEOHead';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { SubjectCardSkeleton, ResourceListSkeleton } from '../components/common/LoadingSkeleton';

export const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { data: subjects, isLoading: subjectsLoading } = useSubjects({ featuredOnly: true });
  const { data: latestResources, isLoading: resourcesLoading } = useLatestResources(6);
  const { data: announcements } = useAnnouncements();

  const [recentItems] = useState(() => getRecentlyViewed().slice(0, 4));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const categories = [
    { label: 'PDF Notes', type: 'pdf', icon: FileText, color: 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800' },
    { label: 'Lecture Videos', type: 'video', icon: Video, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
    { label: 'Whiteboards', type: 'whiteboard', icon: ImageIcon, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
    { label: 'Assignments', type: 'assignment', icon: ClipboardCheck, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
    { label: 'Past Papers', type: 'past_paper', icon: GraduationCap, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' },
  ];

  const pinnedNotice = announcements?.find((a) => a.is_pinned);

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      <SEOHead
        title="Hammad StudyHub — Learn. Revise. Grow."
        description="One platform. Every subject. Every lesson. Everything organized. High quality daily lecture notes, whiteboard photos, video lessons, and past papers by Muhammad Hammad."
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-brand-50/40 via-white to-slate-50 dark:from-navy-900/60 dark:via-navy-950 dark:to-navy-950">
        {/* Subtle decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-500/10 dark:bg-brand-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          {/* Creator & Mission Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">Hammad StudyHub</span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-600 dark:text-slate-400">Created by Muhammad Hammad</span>
          </div>

          {/* Primary Tagline & Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-[1.15]">
            One platform. Every subject.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400">
              Everything organized.
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            <strong>Learn. Revise. Grow.</strong> Access your daily classroom notes, whiteboard snapshots,
            recorded explanations, worksheets, and past papers organized day-by-day.
          </p>

          {/* Prominent Global Search Field */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto pt-4 relative flex items-center shadow-elevated rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 p-2"
          >
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, lesson, subject, course code, or tag..."
              className="w-full px-3 py-2 text-sm sm:text-base bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
            <Button type="submit" size="md" className="shrink-0 px-5 font-semibold">
              Search
            </Button>
          </form>

          {/* Quick-Access Content Categories */}
          <div className="pt-4 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.type}
                  to={`/search?type=${cat.type}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-transform hover:scale-105 active:scale-95 ${cat.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Pinned Announcement Notice (if any) */}
        {pinnedNotice && (
          <aside
            aria-label="Important announcement"
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-900 via-navy-900 to-indigo-950 text-white shadow-card flex items-start gap-3.5"
          >
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-300 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-500 text-white">
                  Notice
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white">{pinnedNotice.title}</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
                {pinnedNotice.body}
              </p>
            </div>
          </aside>
        )}

        {/* Recently Viewed Resources (When Local History Exists) */}
        {recentItems.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Continue Learning (Recently Viewed)
                </h2>
              </div>
              <Link
                to="/recent"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                View all history
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/resources/${item.resourceId}`}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 hover:border-brand-400 dark:hover:border-brand-600 transition-all shadow-subtle hover:shadow-sm space-y-2 block"
                >
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    {item.subjectName}
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatLessonDate(item.lessonDate, { format: 'short' })}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Subject Directory */}
        <section className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Academic Subjects
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Explore semester curricula, daily lesson materials, and lecture notes.
              </p>
            </div>
            <Link
              to="/subjects"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700"
            >
              <span>View All Subjects</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {subjectsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <SubjectCardSkeleton />
              <SubjectCardSkeleton />
              <SubjectCardSkeleton />
            </div>
          ) : subjects && subjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((sub) => (
                <SubjectCard key={sub.id} subject={sub} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No subjects published yet"
              description="The administrator can log into the administration portal to configure the first subject."
              actionLabel="Go to Admin Login"
              onAction={() => navigate('/admin/login')}
            />
          )}
        </section>

        {/* Latest Resources Feed */}
        <section className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Latest Published Resources
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Freshly uploaded lecture notes, whiteboard photos, worksheets, and model solutions.
              </p>
            </div>
            <Link
              to="/search"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700"
            >
              <span>Browse All Resources</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {resourcesLoading ? (
            <ResourceListSkeleton count={4} />
          ) : latestResources && latestResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {latestResources.map((res) => (
                <ResourceCard key={res.id} resource={res} showSubjectBadge />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No learning resources available yet"
              description="Class materials and lecture notes will appear here once published."
            />
          )}
        </section>

        {/* Direct Contact Admin for Learning Materials Section */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-navy-950 text-white border border-emerald-900/60 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <span>Direct Student Support</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Need Specific Lecture Notes or Chapter PDFs?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              If your desired chapter, worksheet, or whiteboard diagram isn&apos;t uploaded yet, contact Muhammad Hammad directly. Click below to reach out on WhatsApp or Instagram:
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <a
              href="https://wa.me/923242779514?text=Hello%20Muhammad%20Hammad,%20I%20am%20studying%20on%20Hammad%20StudyHub%20and%20need%20learning%20materials."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-transform hover:scale-105"
            >
              <span>WhatsApp Admin (03242779514)</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="https://instagram.com/not_urs_hammi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 hover:opacity-90 text-white shadow-md transition-transform hover:scale-105"
            >
              <span>Instagram (@not_urs_hammi)</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Value Proposition / Callout */}
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-card">
          <div className="max-w-3xl space-y-4 relative z-10">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-400 border border-brand-500/30">
              Academic Organization
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              Built for students who want every lesson at their fingertips.
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              No more searching through lost chat messages or unorganized folders.
              Find your lecture by exact calendar date, view Google Drive documents without leaving the browser, and bookmark revision materials effortlessly.
            </p>
            <div className="pt-2 flex items-center gap-4 flex-wrap">
              <Link to="/subjects">
                <Button size="md" variant="accent">
                  Explore Subjects Directory
                </Button>
              </Link>
              <Link to="/about">
                <Button size="md" variant="outline" className="text-white border-slate-700 hover:bg-slate-800">
                  About Muhammad Hammad
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
