// ==============================================================================
// HAMMAD STUDYHUB — REDESIGNED STUDENT DASHBOARD
// Primary Focus: Students find and open their study materials immediately.
// Minimal, clean, modern, and educational SaaS visual design.
// ==============================================================================

import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Video,
  Layers,
  ArrowRight,
  Search,
  Bell,
  Bookmark,
  ExternalLink,
  Download,
  Eye,
  LogOut,
  User,
  ShieldCheck,
  MessageSquare,
  MessageCircle,
  Clock,
  Sparkles,
  ChevronRight,
  GraduationCap,
  ClipboardCheck,
  ShieldAlert,
  FileQuestion,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubjects } from '../hooks/useSubjects';
import { useResources } from '../hooks/useResources';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { getBookmarks, getRecentlyViewed } from '../lib/storage';
import { formatLessonDate, formatRelativeTime } from '../lib/utils';
import {
  getStudentNotifications,
  getUnreadNotificationCount,
} from '../lib/notifications';
import { StudentAssignmentsList } from '../components/assignment/StudentAssignmentsList';
import { StudentReportsSection } from '../components/anonymous/StudentReportsSection';
import { StudentQuestionsSection } from '../components/anonymous/StudentQuestionsSection';
import { SEOHead } from '../components/common/SEOHead';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { ResourceCard } from '../components/resource/ResourceCard';
import { ContactAdminModal } from '../components/common/ContactAdminModal';

export const StudentDashboardPage: React.FC = () => {
  const { profile, signOut, isStudyManager, isAdmin, isCR, isGR, isTeacher } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'materials' | 'assignments' | 'reports' | 'polls'>('materials');

  // Live Database Queries
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: resources = [], isLoading: resourcesLoading } = useResources(
    undefined,
    undefined,
    { includeDrafts: false }
  );
  const { data: announcements = [], isLoading: announcementsLoading } = useAnnouncements();

  // Local student state
  const [bookmarks] = useState(() => getBookmarks().slice(0, 4));
  const [recentlyViewed] = useState(() => getRecentlyViewed().slice(0, 4));

  // Current formatted date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Compute live overview metrics
  const totalSubjectsCount = subjects.length;
  const totalResourcesCount = resources.length;

  // New materials (past 7 days)
  const newMaterialsCount = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().substring(0, 10);
    return resources.filter((r) => r.lesson_date >= cutoff || (r.created_at && r.created_at >= cutoff)).length;
  }, [resources]);

  // Unread announcements
  const unreadAnnouncementsCount = useMemo(() => {
    return getUnreadNotificationCount();
  }, [announcements, resources]);

  // Latest 6 Uploads sorted by newest
  const latestUploads = useMemo(() => {
    const list = [...resources];
    list.sort((a, b) => {
      const dateA = a.created_at || a.published_at || a.lesson_date;
      const dateB = b.created_at || b.published_at || b.lesson_date;
      return dateB.localeCompare(dateA);
    });
    return list.slice(0, 6);
  }, [resources]);

  // Priority Announcement
  const pinnedAnnouncement = useMemo(() => {
    return announcements.find((a) => a.is_pinned && a.status === 'published') || announcements[0];
  }, [announcements]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isRecentMaterial = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const itemDate = new Date(dateStr).getTime();
    const now = Date.now();
    return now - itemDate < 7 * 24 * 60 * 60 * 1000;
  };

  // Extract clean first name
  const studentFirstName = useMemo(() => {
    if (!profile?.display_name) return 'Student';
    const parts = profile.display_name.trim().split(/\s+/);
    return parts[0].length <= 2 && parts.length > 1 ? profile.display_name : parts[0];
  }, [profile?.display_name]);

  const roleBadge = isAdmin ? 'Admin' : isCR ? 'CR' : isGR ? 'GR' : 'Student';

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 w-full max-w-full overflow-x-hidden">
      <SEOHead
        title={`Dashboard — ${profile?.display_name || 'Student'} | Hammad StudyHub`}
        description="Your personal Hammad StudyHub dashboard. Access subjects, latest lecture notes, whiteboard photos, and class announcements."
      />

      {/* 1. Header Hero Welcome & Fast Search */}
      <section className="bg-white dark:bg-navy-900 border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>{todayFormatted}</span>
                <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                <span className="text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider text-[11px]">
                  Semester Portal
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Welcome back,{' '}
                <span className="text-brand-600 dark:text-brand-400">{studentFirstName}!</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Select any subject below to immediately view lecture notes, slides, and syllabus.
              </p>
            </div>

            {/* Profile & Role Quick Pill */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-navy-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title="View Account Details"
              >
                <div className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {(profile?.display_name || 'S').charAt(0).toUpperCase()}
                </div>
                <span className="truncate max-w-[120px]">{studentFirstName}</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                  {roleBadge}
                </span>
              </button>

              {isTeacher && (
                <Link
                  to="/teacher"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Teacher Portal</span>
                </Link>
              )}

              {isStudyManager && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isAdmin ? 'Admin' : isCR ? 'CR Portal' : 'GR Portal'}</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => signOut()}
                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Integrated Clean Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-2xl pt-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick search any lesson, topic, or document title..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* 2. Pinned Important Announcement Banner (if any) */}
        {pinnedAnnouncement && (
          <aside
            aria-label="Important Notice"
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-navy-900 to-indigo-950 text-white shadow-card border border-slate-800 flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 min-w-0"
          >
            <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {pinnedAnnouncement.is_pinned && (
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                      Important Notice
                    </span>
                  )}
                  <h3 className="text-sm sm:text-base font-bold text-white break-words">
                    {pinnedAnnouncement.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl line-clamp-2 break-words">
                  {pinnedAnnouncement.body}
                </p>
                <span className="text-[11px] text-slate-400 block pt-0.5">
                  Published {formatRelativeTime(pinnedAnnouncement.published_at || pinnedAnnouncement.created_at)}
                </span>
              </div>
            </div>

            <Link
              to="/announcements"
              className="text-xs font-bold text-brand-400 hover:text-brand-300 underline shrink-0 sm:self-center"
            >
              All Announcements &rarr;
            </Link>
          </aside>
        )}

        {/* Navigation Mode Switcher: Study Materials vs Assignment Submissions vs Anonymous Reports vs Questions */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 w-full overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'materials'
                ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-subtle'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Subjects & Study Materials</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold">
              {subjects.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'assignments'
                ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-subtle'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>My Assignments</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-subtle'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Anonymous Reports</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('polls')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'polls'
                ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-subtle'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            <span>Teacher Polls & Questions</span>
          </button>
        </div>

        {activeTab === 'assignments' ? (
          <StudentAssignmentsList />
        ) : activeTab === 'reports' ? (
          <StudentReportsSection />
        ) : activeTab === 'polls' ? (
          <StudentQuestionsSection />
        ) : (
          <>
            {/* 3. YOUR SUBJECTS — THE PRIMARY FOCUS OF THE PLATFORM */}
            <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Your Subjects
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select any course to immediately browse lecture PDFs, slides, and class notes.
                </p>
              </div>
            </div>

            <Link
              to="/subjects"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <span>View All ({subjects.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {subjectsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : subjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {subjects.map((sub) => {
                const subResources = resources.filter(
                  (r) => r.subject_id === sub.id || r.subject?.slug === sub.slug
                );
                return (
                  <Link
                    key={sub.id}
                    to={`/subjects/${sub.slug}`}
                    className="group p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800/90 shadow-subtle hover:border-brand-500/60 hover:shadow-card transition-all flex flex-col justify-between space-y-4 cursor-pointer"
                  >
                    <div className="space-y-2.5">
                      {/* Top Badge Row */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60">
                          {sub.code || 'COURSE'}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-950 text-slate-600 dark:text-slate-300">
                          {subResources.length} {subResources.length === 1 ? 'material' : 'materials'}
                        </span>
                      </div>

                      {/* Subject Name */}
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug">
                        {sub.name}
                      </h3>

                      {/* Description or Instructor */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {sub.description || (sub.instructor ? `Instructor: ${sub.instructor}` : 'Academic semester course materials and handouts.')}
                      </p>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {sub.instructor ? `Instructor: ${sub.instructor}` : 'Semester Subject'}
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition-transform">
                        <span>Open Subject</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No subjects available yet"
              description="Courses will appear once added by the administrator."
            />
          )}
        </section>

        {/* 4. RECENTLY UPLOADED MATERIALS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Recently Uploaded
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Newest lecture notes, slides, and handouts uploaded by Admin, CR, and GR.
                </p>
              </div>
            </div>

            <Link
              to="/search"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <span>Explore All ({resources.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {resourcesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : latestUploads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {latestUploads.map((res) => (
                <div key={res.id} className="relative">
                  {isRecentMaterial(res.created_at || res.lesson_date) && (
                    <span className="absolute -top-2 -right-2 z-20 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-600 text-white shadow-xs">
                      NEW
                    </span>
                  )}
                  <ResourceCard resource={res} showSubjectBadge />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No materials uploaded yet"
              description="Uploaded lecture notes and slides will appear here automatically."
            />
          )}
        </section>
      </>
    )}

        {/* 5. ANNOUNCEMENTS & REVISION TOOLS (Clean 2-Column Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Announcements Section (2 Columns) */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Class Announcements
                </h3>
              </div>
              <Link
                to="/announcements"
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
              >
                View All &rarr;
              </Link>
            </div>

            {announcementsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800/90 shadow-subtle space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {formatRelativeTime(item.published_at || item.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                No active announcements at the moment.
              </div>
            )}
          </section>

          {/* Quick Revision & Communication Sidebar (1 Column) */}
          <aside className="space-y-5">
            {/* Bookmarks */}
            <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800/90 shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <Bookmark className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Saved Bookmarks</span>
                </div>
                <Link to="/bookmarks" className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  View All &rarr;
                </Link>
              </div>

              {bookmarks.length > 0 ? (
                <div className="space-y-2">
                  {bookmarks.map((bm) => (
                    <Link
                      key={bm.id}
                      to={`/resources/${bm.resourceId}`}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {bm.title}
                        </p>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {bm.subjectName}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 text-center py-2">
                  Save important notes with the bookmark icon for quick exam revision.
                </p>
              )}
            </div>

            {/* Help & Support Secondary Card */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-subtle space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Need Help or Missing Notes?
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Contact Muhammad Hammad or message your class representatives.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>WhatsApp Muhammad Hammad</span>
                </button>
                <Link
                  to="/chat"
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
                  <span>Open Class Chat</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Student Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-navy-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-elevated space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white text-lg font-black flex items-center justify-center shadow-md">
                  {(profile?.display_name || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {profile?.display_name}
                  </h3>
                  <p className="text-xs text-slate-400">{profile?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Student Role:</span>
                <span className="font-bold uppercase text-brand-600 dark:text-brand-400">
                  {profile?.role || 'Student'}
                </span>
              </div>
              {profile?.roll_no && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-500">Roll Number:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {profile.roll_no}
                  </span>
                </div>
              )}
              {profile?.program_name && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-500">Program:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile.program_name}
                  </span>
                </div>
              )}
              {profile?.semester && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-500">Semester:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile.semester}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full font-bold"
                onClick={() => setProfileModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="w-full font-bold"
                onClick={() => {
                  setProfileModalOpen(false);
                  signOut();
                }}
              >
                Log Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Support / Contact Modal */}
      <ContactAdminModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        initialTopic="Learning Material Request"
      />
    </div>
  );
};
