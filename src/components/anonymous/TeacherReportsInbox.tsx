// ==============================================================================
// HAMMAD STUDYHUB — TEACHER ANONYMOUS REPORTS INBOX
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  Clock,
  Filter,
  Eye,
  MessageSquare,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getTeacherReportsInbox,
  moderateReport,
  AnonymousReport,
  ReportCategory,
} from '../../lib/anonymousStore';
import { getTeacherAssignedSubjects } from '../../lib/teacherAssignmentStore';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { formatRelativeTime } from '../../lib/utils';

export const TeacherReportsInbox: React.FC = () => {
  const { profile } = useAuth();
  const assignedSubjects = React.useMemo(() => {
    return getTeacherAssignedSubjects(profile);
  }, [profile]);

  const [reports, setReports] = useState<AnonymousReport[]>([]);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const refreshReports = () => {
    if (profile?.id) {
      const subjectIds = assignedSubjects.map((s) => s.id);
      setReports(getTeacherReportsInbox(profile.id, subjectIds));
    }
  };

  useEffect(() => {
    refreshReports();
    window.addEventListener('studyhub_reports_updated', refreshReports);
    return () => window.removeEventListener('studyhub_reports_updated', refreshReports);
  }, [profile?.id, assignedSubjects.length]);

  const handleResolve = async (reportId: string) => {
    if (!resolutionText.trim()) return;
    await moderateReport(reportId, 'resolve', undefined, profile?.display_name);
    // Add resolution notes
    const note = resolutionText.trim();
    await moderateReport(reportId, 'resolve', note, profile?.display_name);
    setResolvingId(null);
    setResolutionText('');
    refreshReports();
  };

  const filtered = reports.filter((r) => {
    if (filter === 'unresolved') return r.status !== 'resolved';
    if (filter === 'resolved') return r.status === 'resolved';
    return true;
  });

  const getCategoryBadge = (category: ReportCategory) => {
    const map: Record<ReportCategory, { label: string; color: string }> = {
      academic_concern: { label: 'Academic Concern', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
      classroom_incident: { label: 'Classroom Incident', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
      student_behaviour: { label: 'Student Behaviour', color: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300' },
      teaching_learning: { label: 'Teaching & Learning', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
      facilities_infrastructure: { label: 'Facilities', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
      general_suggestion: { label: 'Suggestion', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
      other: { label: 'Other', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
    };
    const c = map[category] || map.other;
    return (
      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${c.color}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800/90 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Anonymous Reports Inbox
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            Reports directed privately to you or relevant to your assigned subjects. The reporter&apos;s identity is protected.
          </p>
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unresolved')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              filter === 'unresolved'
                ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Unresolved
          </button>
          <button
            type="button"
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              filter === 'resolved'
                ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Reports List */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((report) => (
            <Card key={report.id} className="p-5 space-y-3.5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {report.reference_number}
                    </span>
                    {getCategoryBadge(report.category)}
                    {report.subject_name && (
                      <span className="text-[11px] font-semibold text-slate-400">
                        &bull; {report.subject_name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {report.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {report.status === 'resolved' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Resolved</span>
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResolvingId(resolvingId === report.id ? null : report.id)}
                    >
                      {resolvingId === report.id ? 'Cancel' : 'Mark as Resolved'}
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {report.description}
              </p>

              {/* Resolution Note if resolved */}
              {report.resolution_notes && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                  <span className="font-bold">Resolution Notes: </span>
                  {report.resolution_notes}
                </div>
              )}

              {/* Resolution Form if active */}
              {resolvingId === report.id && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 space-y-2.5 animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Resolution Notes (Visible to reporting student and administration)
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Briefly state how this issue was handled or addressed..."
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-slate-100"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleResolve(report.id)}
                      disabled={!resolutionText.trim()}
                    >
                      Save Resolution
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3 text-brand-500" />
                  <span>Student identity protected by system</span>
                </span>
                <span>Received {formatRelativeTime(report.created_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No reports in your inbox"
          description="You currently have no anonymous reports assigned to you or your courses."
        />
      )}
    </div>
  );
};

