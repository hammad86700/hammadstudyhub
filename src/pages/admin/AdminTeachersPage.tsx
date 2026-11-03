// ==============================================================================
// HAMMAD STUDYHUB — ADMIN TEACHER APPLICATIONS & APPROVAL MANAGEMENT
// Accessible ONLY to Master Administrator (Muhammad Hammad).
// Allows reviewing teacher applications, approving/rejecting, and assigning subjects.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  UserCheck,
  Users,
  Award,
  AlertCircle,
  Phone,
  Mail,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSubjects } from '../../hooks/useSubjects';
import { TeacherApplication } from '../../types';
import {
  getTeacherApplications,
  approveTeacherApplication,
  rejectTeacherApplication,
} from '../../lib/teacherAssignmentStore';
import { SEOHead } from '../../components/common/SEOHead';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatRelativeTime } from '../../lib/utils';

export const AdminTeachersPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { data: allSubjects = [] } = useSubjects();

  const [applications, setApplications] = useState<TeacherApplication[]>(() => getTeacherApplications());
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<TeacherApplication | null>(null);
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([]);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshApplications = () => {
    setApplications(getTeacherApplications());
  };

  useEffect(() => {
    refreshApplications();
    window.addEventListener('studyhub_teacher_applications_updated', refreshApplications);
    return () => window.removeEventListener('studyhub_teacher_applications_updated', refreshApplications);
  }, []);

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 mx-auto flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Restricted Administrator Access
        </h2>
        <p className="text-xs text-slate-500">
          Only the Master Administrator (Muhammad Hammad) can review teacher applications and assign subjects.
        </p>
      </div>
    );
  }

  const handleOpenReview = (app: TeacherApplication) => {
    setSelectedApp(app);
    // Pre-fill assigned subjects with either already approved or requested ones
    setAssignedSubjects(
      app.approved_subject_ids && app.approved_subject_ids.length > 0
        ? app.approved_subject_ids
        : app.requested_subject_ids || []
    );
    setActionSuccess(null);
    setActionError(null);
  };

  const toggleSubject = (subId: string) => {
    setAssignedSubjects((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    if (assignedSubjects.length === 0) {
      setActionError('Please assign at least one subject to this teacher.');
      return;
    }

    const res = await approveTeacherApplication(selectedApp.id, assignedSubjects);
    if (res.success) {
      setActionSuccess(`Teacher ${selectedApp.display_name} has been approved and activated!`);
      refreshApplications();
      setTimeout(() => {
        setSelectedApp(null);
        setActionSuccess(null);
      }, 1500);
    } else {
      setActionError(res.error || 'Failed to approve application.');
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    const res = await rejectTeacherApplication(selectedApp.id, 'Declined by Administrator');
    if (res.success) {
      setActionSuccess(`Application for ${selectedApp.display_name} marked as rejected.`);
      refreshApplications();
      setTimeout(() => {
        setSelectedApp(null);
        setActionSuccess(null);
      }, 1500);
    } else {
      setActionError(res.error || 'Failed to reject application.');
    }
  };

  const filtered = applications.filter((app) => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch =
      !search ||
      app.display_name.toLowerCase().includes(search.toLowerCase()) ||
      app.email.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const approvedCount = applications.filter((a) => a.status === 'approved').length;

  return (
    <div className="space-y-6">
      <SEOHead title="Teacher Applications & Approvals — Admin" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-600" />
            <span>Teacher Applications & Approvals</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review teacher registrations, approve accounts, and assign academic subjects for portal access.
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-700 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5" />
            <span>{pendingCount} Pending Approval</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{approvedCount} Active Teachers</span>
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by teacher name or email..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-navy-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {st === 'all' ? 'All Applications' : st}
            </button>
          ))}
        </div>
      </Card>

      {/* Applications Table / Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No Teacher Applications Found"
          description={
            search
              ? 'No applications match your search term.'
              : filterStatus === 'pending'
              ? 'There are no pending teacher applications awaiting review right now.'
              : 'No teacher accounts registered yet.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((app) => {
            const requestedSubs = allSubjects.filter((s) => app.requested_subject_ids?.includes(s.id));
            const approvedSubs = allSubjects.filter((s) => app.approved_subject_ids?.includes(s.id));

            return (
              <Card
                key={app.id}
                className="p-5 border border-slate-200 dark:border-slate-800 shadow-card flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Status Badge & Registration Time */}
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        app.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          : app.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                      }`}
                    >
                      {app.status === 'pending' && <Clock className="w-3 h-3" />}
                      {app.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                      {app.status === 'rejected' && <XCircle className="w-3 h-3" />}
                      <span className="capitalize">{app.status}</span>
                    </span>

                    <span className="text-[11px] text-slate-400">
                      {formatRelativeTime(app.created_at)}
                    </span>
                  </div>

                  {/* Teacher Info */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {app.display_name}
                    </h3>
                    <div className="mt-1 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{app.email}</span>
                      </div>
                      {app.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{app.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Requested / Approved Subjects */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {app.status === 'approved' ? 'Assigned Subjects:' : 'Requested Subjects:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(app.status === 'approved' ? approvedSubs : requestedSubs).map((s) => (
                        <span
                          key={s.id}
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                        >
                          {s.name} ({s.code})
                        </span>
                      ))}
                      {(app.status === 'approved' ? approvedSubs : requestedSubs).length === 0 && (
                        <span className="text-xs text-slate-400 italic">None specified</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    size="sm"
                    variant={app.status === 'pending' ? 'primary' : 'outline'}
                    className="w-full font-bold justify-center"
                    onClick={() => handleOpenReview(app)}
                  >
                    {app.status === 'pending' ? 'Review & Assign Subjects' : 'Edit Subject Assignments'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review & Approval Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Teacher Approval & Subject Assignment
                </h3>
                <p className="text-xs text-slate-500">
                  Application review for {selectedApp.display_name} ({selectedApp.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {actionSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {actionError && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 text-xs text-red-800 dark:text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Subject Selection for Approval */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Approved Subjects ({assignedSubjects.length} selected):
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Select the subjects this teacher is authorized to teach and manage submissions for:
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-slate-50 dark:bg-navy-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {allSubjects.map((sub) => {
                    const isChecked = assignedSubjects.includes(sub.id);
                    const wasRequested = selectedApp.requested_subject_ids?.includes(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => toggleSubject(sub.id)}
                        className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          isChecked
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{sub.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({sub.code})</span>
                            {wasRequested && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                Requested
                              </span>
                            )}
                          </div>
                          {sub.instructor && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Current Instructor: {sub.instructor}
                            </span>
                          )}
                        </div>

                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isChecked && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-slate-50 dark:bg-navy-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                Reject Application
              </button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedApp(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" className="font-bold px-5" onClick={handleApprove}>
                  Approve & Assign Subjects
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

