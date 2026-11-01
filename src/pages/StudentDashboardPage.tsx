// ==============================================================================
// HAMMAD STUDYHUB — MODERN STUDENT DASHBOARD
// Personal learning hub for authenticated students. Displays dynamic summary
// metrics, newest study uploads, announcements, course grid, and study history.
// ==============================================================================

import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Video,
  Image as ImageIcon,
  ClipboardCheck,
  GraduationCap,
  Sparkles,
  Calendar,
  Clock,
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
  FolderOpen,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubjects } from '../hooks/useSubjects';
import { useResources } from '../hooks/useResources';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { getBookmarks, getRecentlyViewed } from '../lib/storage';
import { formatLessonDate, formatRelativeTime, getResourceTypeMeta } from '../lib/utils';
import { openResourceOnline, downloadResourceFile } from '../lib/resourceActions';
import {
  getStudentNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from '../lib/notifications';
import { SEOHead } from '../components/common/SEOHead';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { ResourceCard } from '../components/resource/ResourceCard';
import { NotificationBell } from '../components/common/NotificationBell';
import { ContactAdminModal } from '../components/common/ContactAdminModal';
import { DashboardDirectMessaging } from '../components/chat/DashboardDirectMessaging';

export const StudentDashboardPage: React.FC = () => {
  const { profile, signOut, isStudyManager, isAdmin, isCR, isGR } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

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

  // New materials (uploaded in last 7 days)
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

  return (
    <div className="space-y-6 sm:space-y-10 pb-16 w-full max-w-full overflow-x-hidden">
      <SEOHead
        title={`Dashboard — ${profile?.display_name || 'Student'} | Hammad StudyHub`}
        description="Your personal Hammad StudyHub dashboard. Access subjects, latest lecture notes, whiteboard photos, and class announcements."
      />

      {/* 1. Header Welcome Bar */}
      <section className="bg-white dark:bg-navy-900 border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
            {/* Student Greeting */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  Student Learning Space
                </span>
                <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {todayFormatted}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
                Welcome back,{' '}
                <span className="text-brand-600 dark:text-brand-400">
                  {profile?.display_name || 'Student'}!
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Here is what is new in your courses today. Let&apos;s make progress.
              </p>
            </div>

            {/* Quick Actions & Profile Pills */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              {/* Chat Shortcut */}
              <Link
                to="/chat"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-navy-950 dark:hover:bg-slate-800 transition-colors"
                title="Open Class Chat"
              >
                <MessageSquare className="w-4 h-4 text-brand-500" />
                <span className="hidden sm:inline">Class Chat</span>
              </Link>

              {/* Profile Details Button */}
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/80 hover:bg-brand-100 dark:hover:bg-brand-950 transition-colors cursor-pointer min-w-0"
                title="View Student Profile"
              >
                <div className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {(profile?.display_name || 'S').charAt(0).toUpperCase()}
                </div>
                <span className="truncate max-w-[80px] sm:max-w-[130px]">
                  {profile?.display_name ? (profile.display_name.split(' ').length > 1 && profile.display_name.split(' ')[0].length <= 2 ? profile.display_name : profile.display_name.split(' ')[0]) : 'Profile'}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded uppercase font-bold bg-white dark:bg-navy-900 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 shrink-0">
                  {profile?.role || 'student'}
                </span>
              </button>

              {/* Study Manager Quick Switch (Admin/CR/GR) */}
              {isStudyManager && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isAdmin ? 'Admin' : isCR ? 'CR Portal' : 'GR Portal'}</span>
                </Link>
              )}

              {/* Logout Option */}
              <button
                type="button"
                onClick={() => signOut()}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="Log Out of StudyHub"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        {/* 2. Overview Summary Metrics (Actual Database Values) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
          {/* Metric 1: Available Subjects */}
          <Link
            to="/subjects"
            className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle hover:border-brand-500/50 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight truncate">
                Available Subjects
              </span>
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform shrink-0">
                <BookOpen className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
                {subjectsLoading ? '...' : totalSubjectsCount}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 block mt-0.5 truncate">Enrolled courses</span>
            </div>
          </Link>

          {/* Metric 2: Total Learning Materials */}
          <Link
            to="/search"
            className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle hover:border-indigo-500/50 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight truncate">
                Total Materials
              </span>
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shrink-0">
                <Layers className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
                {resourcesLoading ? '...' : totalResourcesCount}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 block mt-0.5 truncate">Notes, videos & slides</span>
            </div>
          </Link>

          {/* Metric 3: New Materials (Past 7 Days) */}
          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight truncate">
                New Materials
              </span>
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
                {resourcesLoading ? '...' : newMaterialsCount}
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5 truncate">
                Past 7 days
              </span>
            </div>
          </div>

          {/* Metric 4: Announcements */}
          <Link
            to="/announcements"
            className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle hover:border-amber-500/50 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight truncate">
                Announcements
              </span>
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0">
                <Bell className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
                {announcementsLoading ? '...' : announcements.length}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 block mt-0.5 truncate">
                {unreadAnnouncementsCount > 0 ? (
                  <strong className="text-brand-600 dark:text-brand-400">
                    {unreadAnnouncementsCount} unread
                  </strong>
                ) : (
                  'All caught up'
                )}
              </span>
            </div>
          </Link>
        </section>

        {/* Quick Search Field across all subjects & materials */}
        <section className="bg-white dark:bg-navy-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 sm:gap-2 w-full min-w-0">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 ml-1.5 sm:ml-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lessons by topic, title, chapter..."
              className="w-full min-w-0 flex-1 px-2 py-1.5 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
            <Button type="submit" size="sm" variant="primary" className="font-semibold shrink-0 text-xs px-3 py-1.5 h-8">
              Search
            </Button>
          </form>
        </section>

        {/* 3. Pinned / Important Announcement (if published) */}
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
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl line-clamp-3 break-words">
                  {pinnedAnnouncement.body}
                </p>
                <span className="text-[11px] text-slate-400 block pt-1">
                  Published {formatRelativeTime(pinnedAnnouncement.published_at || pinnedAnnouncement.created_at)}
                </span>
              </div>
            </div>

            <Link
              to="/announcements"
              className="text-xs font-bold text-brand-400 hover:text-brand-300 underline shrink-0 sm:self-center"
            >
              View All Announcements &rarr;
            </Link>
          </aside>
        )}

        {/* 3. Direct Class Messaging & Representative Communications (Boys -> CR/Admin, Girls -> CR/GR/Admin, CR <-> GR) */}
        <DashboardDirectMessaging />

        {/* 4. Latest Uploads Section (Newest First) */}
        <section className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Latest Uploads
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Recently added study materials, handouts, and whiteboard photos uploaded by administrators & CRs.
              </p>
            </div>

            <Link
              to="/search"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <span>Explore All Materials</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {resourcesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : latestUploads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {latestUploads.map((res) => (
                <div key={res.id} className="relative">
                  {/* Visual NEW Badge for items uploaded recently */}
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
              description="When your instructors or CR upload new lecture notes or past papers, they will appear right here."
            />
          )}
        </section>

        {/* 5. Subjects Section (Clean Grid) */}
        <section className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Your Subjects
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Browse courses by syllabus, calendar dates, lecture notes, and downloadable assets.
              </p>
            </div>

            <Link
              to="/subjects"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <span>All Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {subjectsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : subjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((sub) => {
                // Count resources in this subject
                const subResources = resources.filter(
                  (r) => r.subject_id === sub.id || r.subject?.slug === sub.slug
                );
                return (
                  <Card
                    key={sub.id}
                    hover
                    className="p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                          {sub.code || 'COURSE'}
                        </span>

                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-navy-950 text-slate-600 dark:text-slate-400">
                          {subResources.length} {subResources.length === 1 ? 'material' : 'materials'}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {sub.name}
                      </h3>

                      {sub.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {sub.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {sub.instructor ? `Instructor: ${sub.instructor}` : 'Semester Course'}
                      </span>

                      <Link to={`/subjects/${sub.slug}`}>
                        <Button size="sm" variant="primary" className="font-semibold text-xs">
                          <span>View Subject</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No subjects available yet"
              description="Courses will appear once configured by the administrator."
            />
          )}
        </section>

        {/* 6. Quick History & Bookmarks Side-by-Side */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recently Viewed */}
          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recently Viewed
                </h3>
              </div>
              <Link
                to="/recent"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                View History &rarr;
              </Link>
            </div>

            {recentlyViewed.length > 0 ? (
              <div className="space-y-2">
                {recentlyViewed.map((item) => (
                  <Link
                    key={item.id}
                    to={`/resources/${item.resourceId}`}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {item.subjectName} • {formatLessonDate(item.lessonDate, { format: 'short' })}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                Materials you view will appear here for fast revision.
              </p>
            )}
          </div>

          {/* Saved Bookmarks */}
          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Saved Bookmarks
                </h3>
              </div>
              <Link
                to="/bookmarks"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                View All Saved &rarr;
              </Link>
            </div>

            {bookmarks.length > 0 ? (
              <div className="space-y-2">
                {bookmarks.map((bm) => (
                  <Link
                    key={bm.id}
                    to={`/resources/${bm.resourceId}`}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {bm.title}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {bm.subjectName} • {formatLessonDate(bm.lessonDate, { format: 'short' })}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                Bookmark important lecture notes to access them quickly before exams.
              </p>
            )}
          </div>
        </section>

        {/* 7. Need Help or Missing Notes Banner */}
        <section className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-900 text-white shadow-card border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 min-w-0">
          <div className="space-y-1.5 max-w-xl min-w-0">
            <h4 className="text-base sm:text-lg font-bold text-white break-words">
              Need a Missing Handout or Chapter Diagram?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              If a specific handout or assignment solution hasn&apos;t been published yet, message Muhammad Hammad directly.
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setContactModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              <span>WhatsApp Muhammad Hammad</span>
            </button>

            <Link to="/chat">
              <Button size="sm" variant="outline" className="font-bold text-white border-slate-700 hover:bg-slate-800 text-xs py-2">
                Class Chat
              </Button>
            </Link>
          </div>
        </section>
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

      {/* WhatsApp / Support Modal */}
      <ContactAdminModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        initialTopic="Learning Material Request"
      />
    </div>
  );
};

