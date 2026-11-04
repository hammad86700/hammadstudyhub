// ==============================================================================
// HAMMAD STUDYHUB — STUDENT ANONYMOUS REPORTS INTERFACE
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Eye,
  AlertCircle,
  XCircle,
  EyeOff,
  Sparkles,
  HelpCircle,
  Tag,
  Calendar,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSubjects } from '../../hooks/useSubjects';
import {
  getStudentSubmittedReports,
  getPublicReportsForStudents,
  trackReportByReferenceNumber,
  AnonymousReport,
  ReportCategory,
  ReportStatus,
} from '../../lib/anonymousStore';
import { AnonymousReportModal } from './AnonymousReportModal';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { formatLessonDate, formatRelativeTime } from '../../lib/utils';

export const StudentReportsSection: React.FC = () => {
  const { profile } = useAuth();
  const { data: allSubjects = [] } = useSubjects();

  const [activeSubTab, setActiveSubTab] = useState<'my_reports' | 'community'>('my_reports');
  const [modalOpen, setModalOpen] = useState(false);
  const [searchRef, setSearchRef] = useState('');
  const [trackedReport, setTrackedReport] = useState<AnonymousReport | null | undefined>(undefined);

  const [myReports, setMyReports] = useState<AnonymousReport[]>([]);
  const [communityReports, setCommunityReports] = useState<AnonymousReport[]>([]);

  const refreshData = () => {
    if (profile?.id) {
      setMyReports(getStudentSubmittedReports(profile.id));
    }
    const subjectIds = allSubjects.map((s) => s.id);
    setCommunityReports(getPublicReportsForStudents(subjectIds));
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('studyhub_reports_updated', refreshData);
    return () => window.removeEventListener('studyhub_reports_updated', refreshData);
  }, [profile?.id, allSubjects.length]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRef.trim()) {
      setTrackedReport(undefined);
      return;
    }
    const found = trackReportByReferenceNumber(searchRef.trim());
    setTrackedReport(found || null);
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            <span>Pending Moderation</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <CheckCircle className="w-3 h-3" />
            <span>Approved</span>
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Eye className="w-3 h-3" />
            <span>Published</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <CheckCircle className="w-3 h-3" />
            <span>Resolved</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
      case 'hidden':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <EyeOff className="w-3 h-3" />
            <span>Hidden</span>
          </span>
        );
    }
  };

  const getCategoryLabel = (category: ReportCategory) => {
    switch (category) {
      case 'academic_concern':
        return 'Academic Concern';
      case 'classroom_incident':
        return 'Classroom Incident';
      case 'student_behaviour':
        return 'Student Behaviour';
      case 'teaching_learning':
        return 'Teaching & Learning';
      case 'facilities_infrastructure':
        return 'Facilities & Infrastructure';
      case 'general_suggestion':
        return 'General Suggestion';
      case 'other':
        return 'Other';
    }
  };

  const getAudienceLabel = (r: AnonymousReport) => {
    switch (r.audience_type) {
      case 'all_students':
        return 'All Students';
      case 'students_and_teachers':
        return 'Students & Teachers';
      case 'specific_subject':
        return `Course: ${r.subject_name || 'Subject'}`;
      case 'specific_teacher':
        return `Teacher: ${r.target_teacher_name || 'Instructor'}`;
      case 'admin_only':
        return 'Administration Only';
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800/90 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Anonymous Student Reporting
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Report academic concerns, incidents, or suggestions safely. Your identity is strictly anonymous to your chosen recipients.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shrink-0 shadow-xs"
        >
          Create New Report
        </Button>
      </div>

      {/* Reference Number Tracker Box */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800">
        <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              placeholder="Track any report by reference number (e.g. REP-2026-X8Y9)..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase font-mono"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Track Status
          </Button>
          {trackedReport !== undefined && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchRef('');
                setTrackedReport(undefined);
              }}
            >
              Clear
            </Button>
          )}
        </form>

        {/* Tracked Report Result Modal/Card */}
        {trackedReport && (
          <div className="mt-3 p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                  {trackedReport.reference_number}
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {trackedReport.title}
                </span>
              </div>
              {getStatusBadge(trackedReport.status)}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
              {trackedReport.description}
            </p>
            <div className="text-[11px] text-slate-400 flex items-center gap-3">
              <span>Category: {getCategoryLabel(trackedReport.category)}</span>
              <span>&bull;</span>
              <span>Audience: {getAudienceLabel(trackedReport)}</span>
              <span>&bull;</span>
              <span>Submitted {formatRelativeTime(trackedReport.created_at)}</span>
            </div>
          </div>
        )}

        {trackedReport === null && (
          <div className="mt-2 text-xs text-red-500 font-medium">
            No report found matching reference number &quot;{searchRef.trim().toUpperCase()}&quot;.
          </div>
        )}
      </div>

      {/* Sub Tabs: My Reports vs Community Reports */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('my_reports')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeSubTab === 'my_reports'
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          My Submitted Reports ({myReports.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('community')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeSubTab === 'community'
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Published Community Reports ({communityReports.length})
        </button>
      </div>

      {/* Content Rendering */}
      {activeSubTab === 'my_reports' ? (
        myReports.length > 0 ? (
          <div className="space-y-3">
            {myReports.map((report) => (
              <Card key={report.id} className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-300">
                        {report.reference_number}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {getCategoryLabel(report.category)}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {report.title}
                    </h3>
                  </div>
                  {getStatusBadge(report.status)}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {report.description}
                </p>

                {report.moderation_notes && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Moderator Note: </span>
                    {report.moderation_notes}
                  </div>
                )}

                {report.resolution_notes && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="font-bold">Resolution: </span>
                    {report.resolution_notes}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Target: {getAudienceLabel(report)}</span>
                  <span>Submitted {formatRelativeTime(report.created_at)}</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No reports submitted yet"
            description="You have not submitted any anonymous reports. Use the button above if you need to report an incident or concern."
            actionLabel="Create Anonymous Report"
            onAction={() => setModalOpen(true)}
          />
        )
      ) : (
        communityReports.length > 0 ? (
          <div className="space-y-3">
            {communityReports.map((report) => (
              <Card key={report.id} className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                        {getCategoryLabel(report.category)}
                      </span>
                      {report.subject_name && (
                        <span className="text-[11px] font-semibold text-slate-400">
                          &bull; {report.subject_name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {report.title}
                    </h3>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                    Community Report
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {report.description}
                </p>

                {report.resolution_notes && (
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-300">
                    <span className="font-bold">Administrative Resolution: </span>
                    {report.resolution_notes}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="italic">Reported Anonymously</span>
                  <span>Published {formatRelativeTime(report.reviewed_at || report.created_at)}</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No published community reports"
            description="There are currently no public reports published for your courses or student community."
          />
        )
      )}

      {/* Creation Modal */}
      <AnonymousReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={refreshData}
      />
    </div>
  );
};

