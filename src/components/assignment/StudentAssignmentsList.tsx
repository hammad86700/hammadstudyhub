// ==============================================================================
// HAMMAD STUDYHUB — STUDENT ASSIGNMENT SUBMISSIONS LIST
// Displays the authenticated student's assignment history, review marks, and files.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  Download,
  Eye,
  Calendar,
  AlertCircle,
  Award,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSubjects } from '../../hooks/useSubjects';
import { StudentAssignmentSubmission, SubmissionFile } from '../../types';
import { getStudentSubmissions } from '../../lib/teacherAssignmentStore';
import { StudentAssignmentUploadModal } from './StudentAssignmentUploadModal';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { formatLessonDate, formatRelativeTime } from '../../lib/utils';

export const StudentAssignmentsList: React.FC = () => {
  const { profile } = useAuth();
  const { data: subjects = [] } = useSubjects();

  const [submissions, setSubmissions] = useState<StudentAssignmentSubmission[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<SubmissionFile | null>(null);

  const refreshSubmissions = () => {
    if (profile?.id) {
      setSubmissions(getStudentSubmissions(profile.id));
    }
  };

  useEffect(() => {
    refreshSubmissions();
    window.addEventListener('studyhub_assignment_submissions_updated', refreshSubmissions);
    return () => window.removeEventListener('studyhub_assignment_submissions_updated', refreshSubmissions);
  }, [profile?.id]);

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              My Assignment Submissions
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload handwritten assignment pictures or documents, and view your teacher's feedback and marks.
          </p>
        </div>

        <Button
          size="md"
          variant="primary"
          onClick={() => setUploadModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="font-bold shadow-md shadow-brand-600/20 shrink-0"
        >
          Upload New Assignment
        </Button>
      </div>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <EmptyState
          title="No Assignments Submitted Yet"
          description="When you complete handwritten or digital assignments, upload them here to submit them directly to your subject teachers."
          actionLabel="Upload First Assignment"
          onAction={() => setUploadModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <Card
              key={sub.id}
              className="p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-card space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              {/* Top Meta: Subject & Status */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                    {sub.subject_name || 'Subject'}
                  </span>
                  <span className="text-slate-400 font-medium">
                    Submitted {formatRelativeTime(sub.submitted_at)}
                  </span>
                </div>

                {/* Status Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    sub.status === 'reviewed'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {sub.status === 'reviewed' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  <span>{sub.status === 'reviewed' ? 'Reviewed by Teacher' : 'Submitted (Pending Review)'}</span>
                </span>
              </div>

              {/* Assignment Title & Description */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {sub.title}
                </h3>
                {sub.description && (
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {sub.description}
                  </p>
                )}
              </div>

              {/* Teacher Academic Review Feedback (if reviewed) */}
              {sub.status === 'reviewed' && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>Teacher Remarks:</span>
                    </span>
                    {sub.review_marks && (
                      <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px]">
                        Grade: {sub.review_marks}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    "{sub.review_feedback}"
                  </p>
                  {sub.reviewed_by && (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block pt-1 font-semibold">
                      — Reviewed by {sub.reviewed_by}
                    </span>
                  )}
                </div>
              )}

              {/* Uploaded Files & Attachments */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Submitted Files ({sub.files?.length || 0}):
                </span>

                <div className="flex items-center gap-2 flex-wrap">
                  {sub.files?.map((file, i) => (
                    <button
                      key={file.id || i}
                      onClick={() => setPreviewFile(file)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-navy-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand-500" />
                      <span className="truncate max-w-[180px]">{file.file_name}</span>
                      <span className="text-[10px] text-slate-400">({file.file_size})</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <StudentAssignmentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        subjects={subjects}
        onSuccess={() => {
          refreshSubmissions();
        }}
      />

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-md">
                  📄 {previewFile.file_name}
                </h4>
                <p className="text-[11px] text-slate-400">Size: {previewFile.file_size}</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewFile.file_data || previewFile.file_url}
                  download={previewFile.file_name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-slate-950 flex items-center justify-center min-h-[300px]">
              {previewFile.mime_type.startsWith('image/') || previewFile.file_name.match(/\.(png|jpg|jpeg|webp)$/i) ? (
                <img
                  src={previewFile.file_data || previewFile.file_url}
                  alt={previewFile.file_name}
                  className="max-h-[65vh] max-w-full rounded-lg object-contain shadow-md"
                />
              ) : previewFile.mime_type.includes('pdf') || previewFile.file_name.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewFile.file_data || previewFile.file_url}
                  title={previewFile.file_name}
                  className="w-full h-[65vh] border-0 rounded-lg bg-white"
                />
              ) : (
                <div className="p-8 text-center text-white space-y-3">
                  <FileText className="w-12 h-12 text-brand-400 mx-auto" />
                  <p className="text-sm font-semibold">Ready for Download</p>
                  <a
                    href={previewFile.file_data || previewFile.file_url}
                    download={previewFile.file_name}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File Directly</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

