// ==============================================================================
// HAMMAD STUDYHUB — ADMIN REPORT MODERATION & INCIDENT MANAGEMENT
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  Lock,
  Unlock,
  FileText,
  User,
  History,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminReportsQueue,
  moderateReport,
  auditAccessReportIdentity,
  getReportAuditLogs,
  AnonymousReport,
  ReportCategory,
  ReportStatus,
  ReportIdentityLink,
  ReportAuditLog,
} from '../../lib/anonymousStore';
import { SEOHead } from '../../components/common/SEOHead';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatRelativeTime } from '../../lib/utils';

export const AdminReportsPage: React.FC = () => {
  const { profile, isAdmin } = useAuth();

  const [reports, setReports] = useState<AnonymousReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Moderation modal / prompt
  const [selectedReport, setSelectedReport] = useState<AnonymousReport | null>(null);
  const [moderationNote, setModerationNote] = useState('');
  const [activeAction, setActiveAction] = useState<'publish' | 'reject' | 'hide' | 'resolve' | null>(null);

  // Exceptional Identity Access State
  const [identityReport, setIdentityReport] = useState<AnonymousReport | null>(null);
  const [auditReason, setAuditReason] = useState('');
  const [unsealedIdentity, setUnsealedIdentity] = useState<ReportIdentityLink | null>(null);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<ReportAuditLog[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  const refreshData = () => {
    setReports(getAdminReportsQueue());
    setAuditLogs(getReportAuditLogs());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('studyhub_reports_updated', refreshData);
    return () => window.removeEventListener('studyhub_reports_updated', refreshData);
  }, []);

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          Only platform administrators may access the central report moderation queue.
        </p>
      </div>
    );
  }

  const handleAction = async (action: 'publish' | 'reject' | 'hide' | 'resolve') => {
    if (!selectedReport) return;
    await moderateReport(selectedReport.id, action, moderationNote, profile?.display_name);
    setSelectedReport(null);
    setModerationNote('');
    setActiveAction(null);
    refreshData();
  };

  const handleUnsealIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identityReport || !profile) return;
    setIdentityError(null);

    const result = await auditAccessReportIdentity(identityReport.id, profile, auditReason);
    if (result.success && result.identity) {
      setUnsealedIdentity(result.identity);
      refreshData();
    } else {
      setIdentityError(result.error || 'Failed to unseal identity.');
    }
  };

  const filtered = reports.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.reference_number.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = reports.filter((r) => r.status === 'pending_review').length;

  return (
    <div className="space-y-6">
      <SEOHead title="Report Moderation Queue — Hammad StudyHub" />

      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Report Moderation & Incident Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review incoming student reports, approve community publications, and manage campus concerns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-black text-xs">
              {pendingCount} Pending Moderation
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAuditLogs(!showAuditLogs)}
            leftIcon={<History className="w-4 h-4" />}
          >
            {showAuditLogs ? 'Hide Audit Logs' : 'Identity Audit Logs'}
          </Button>
        </div>
      </div>

      {/* Audit Logs Drawer / Section if toggled */}
      {showAuditLogs && (
        <Card className="p-5 space-y-4 border-amber-300 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-200">
            <History className="w-4 h-4" />
            <span>Exceptional Identity Access Audit Trail</span>
          </div>
          <p className="text-xs text-slate-500">
            Permanent log of every instance where an anonymous reporter&apos;s identity was accessed by administration.
          </p>
          {auditLogs.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{log.reference_number}</span>
                    <span className="text-slate-400 font-normal">{formatRelativeTime(log.timestamp)}</span>
                  </div>
                  <div>
                    Accessed by: <strong>{log.accessed_by}</strong> ({log.access_role})
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 italic">
                    Reason: &quot;{log.reason}&quot;
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">No identity unsealing actions recorded.</div>
          )}
        </Card>
      )}

      {/* Filters & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports by title, reference number, or keywords..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-950"
            >
              <option value="all">All Statuses</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
              <option value="hidden">Hidden</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-950"
            >
              <option value="all">All Categories</option>
              <option value="academic_concern">Academic Concern</option>
              <option value="classroom_incident">Classroom Incident</option>
              <option value="student_behaviour">Student Behaviour</option>
              <option value="teaching_learning">Teaching & Learning</option>
              <option value="facilities_infrastructure">Facilities</option>
              <option value="general_suggestion">Suggestion</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Queue */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((report) => (
            <Card key={report.id} className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      {report.reference_number}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {report.category}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-950 font-bold">
                      Audience: {report.audience_type}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {report.title}
                  </h3>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-slate-800">
                    {report.status}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {report.description}
              </p>

              {report.moderation_notes && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-bold">Moderation Note: </span>
                  {report.moderation_notes}
                </div>
              )}

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  {report.status !== 'published' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setSelectedReport(report);
                        setActiveAction('publish');
                      }}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Publish Report
                    </Button>
                  )}

                  {report.status !== 'resolved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReport(report);
                        setActiveAction('resolve');
                      }}
                      leftIcon={<CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                    >
                      Resolve
                    </Button>
                  )}

                  {report.status === 'published' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReport(report);
                        setActiveAction('hide');
                      }}
                      leftIcon={<EyeOff className="w-3.5 h-3.5" />}
                    >
                      Hide
                    </Button>
                  )}

                  {report.status !== 'rejected' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReport(report);
                        setActiveAction('reject');
                      }}
                      className="text-red-600"
                    >
                      Reject
                    </Button>
                  )}
                </div>

                {/* Exceptional Identity Access Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIdentityReport(report);
                    setUnsealedIdentity(null);
                    setAuditReason('');
                    setIdentityError(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-amber-600 text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Restricted safeguarding identity unsealing"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Safeguarding Review</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No reports match your filters"
          description="Try adjusting your status or category filters."
        />
      )}

      {/* Moderation Confirmation Modal */}
      {selectedReport && activeAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-navy-900 rounded-3xl p-6 shadow-modal border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
              {activeAction} Report: {selectedReport.reference_number}
            </h3>
            <p className="text-xs text-slate-500">
              Add optional notes or guidance regarding this action:
            </p>
            <textarea
              rows={3}
              value={moderationNote}
              onChange={(e) => setModerationNote(e.target.value)}
              placeholder="e.g. Approved for public view after verifying language..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedReport(null);
                  setActiveAction(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAction(activeAction)}
              >
                Confirm {activeAction}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exceptional Identity Access Modal (Safeguarding) */}
      {identityReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-navy-900 rounded-3xl p-6 shadow-modal border border-amber-300 dark:border-amber-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Restricted Reporter Identity Unsealing</span>
              </div>
              <button
                onClick={() => setIdentityReport(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold">Privacy Disclosure Notice (Section 2.F):</p>
              <p>
                Anonymous reporting guarantees anonymity to peers and teachers. Unsealing student identity is strictly restricted to platform administration for immediate safety threats or formal disciplinary abuse investigations. This action will be permanently logged in the audit trail.
              </p>
            </div>

            {identityError && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs">
                {identityError}
              </div>
            )}

            {unsealedIdentity ? (
              /* Display unsealed identity */
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Reporter Identity Unsealed & Logged</span>
                </div>
                <div className="text-xs space-y-1 pt-1">
                  <div>
                    Student Name: <strong>{unsealedIdentity.student_name}</strong>
                  </div>
                  <div>
                    Roll Number: <strong className="font-mono">{unsealedIdentity.roll_no}</strong>
                  </div>
                  <div>
                    Email: <strong className="font-mono">{unsealedIdentity.email}</strong>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Account ID: {unsealedIdentity.student_id}
                  </div>
                </div>
              </div>
            ) : (
              /* Request justification reason */
              <form onSubmit={handleUnsealIdentity} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Documented Justification Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={auditReason}
                    onChange={(e) => setAuditReason(e.target.value)}
                    placeholder="Enter formal justification (e.g. Safeguarding investigation regarding immediate student safety incident)..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-950"
                  />
                  <span className="text-[10px] text-slate-400">Minimum 8 characters required.</span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIdentityReport(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={auditReason.trim().length < 8}
                    leftIcon={<Unlock className="w-3.5 h-3.5" />}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Authorize & Unseal
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

