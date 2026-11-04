// ==============================================================================
// HAMMAD STUDYHUB — ANONYMOUS REPORT CREATION MODAL
// ==============================================================================

import React, { useState } from 'react';
import {
  ShieldAlert,
  X,
  Send,
  Eye,
  AlertTriangle,
  Info,
  CheckCircle,
  Copy,
  BookOpen,
  UserCheck,
  Building,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSubjects } from '../../hooks/useSubjects';
import { getTeacherApplications } from '../../lib/teacherAssignmentStore';
import {
  submitAnonymousReport,
  ReportCategory,
  ReportAudienceType,
} from '../../lib/anonymousStore';
import { Button } from '../common/Button';

interface AnonymousReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES: { label: string; value: ReportCategory; description: string }[] = [
  { label: 'Academic Concern', value: 'academic_concern', description: 'Curriculum, lectures, notes, syllabus coverage, or exams' },
  { label: 'Classroom Incident', value: 'classroom_incident', description: 'Disturbance, misconduct, or class disruption' },
  { label: 'Student Behaviour Concern', value: 'student_behaviour', description: 'Harassment, bullying, or inappropriate peer behaviour' },
  { label: 'Teaching or Learning Concern', value: 'teaching_learning', description: 'Speed, clarity, or teaching methodologies' },
  { label: 'Facilities or Infrastructure', value: 'facilities_infrastructure', description: 'Classrooms, equipment, projectors, or lighting' },
  { label: 'General Suggestion', value: 'general_suggestion', description: 'Ideas to improve the academic experience' },
  { label: 'Other', value: 'other', description: 'Other general concerns not listed above' },
];

export const AnonymousReportModal: React.FC<AnonymousReportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { profile } = useAuth();
  const { data: subjects = [] } = useSubjects();

  // Load approved teachers
  const approvedTeachers = React.useMemo(() => {
    return getTeacherApplications().filter((t) => t.status === 'approved');
  }, [isOpen]);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReportCategory>('academic_concern');
  const [description, setDescription] = useState('');
  const [audienceType, setAudienceType] = useState<ReportAudienceType>('all_students');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdReference, setCreatedReference] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  React.useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  React.useEffect(() => {
    if (approvedTeachers.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(approvedTeachers[0].teacher_id);
    }
  }, [approvedTeachers, selectedTeacherId]);

  if (!isOpen) return null;

  // Selected subject & teacher names
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedTeacher = approvedTeachers.find((t) => t.teacher_id === selectedTeacherId);

  // Audience confirmation preview text
  const getAudiencePreview = (): { text: string; subtext: string; badgeColor: string } => {
    switch (audienceType) {
      case 'all_students':
        return {
          text: 'All Registered Students (Public)',
          subtext: 'Your report will be reviewed by platform moderation before being published to the student body.',
          badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        };
      case 'students_and_teachers':
        return {
          text: 'All Students and Faculty Teachers',
          subtext: 'Your report will be reviewed by platform moderation before appearing on both student and teacher dashboards.',
          badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        };
      case 'specific_subject':
        return {
          text: `Subject Community: ${selectedSubject?.name || 'Selected Subject'}`,
          subtext: `Visible to students enrolled in ${selectedSubject?.name || 'this subject'} and its assigned course teachers.`,
          badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'specific_teacher':
        return {
          text: `Private to ${selectedTeacher?.display_name || 'Selected Teacher'}`,
          subtext: `Delivered privately into ${selectedTeacher?.display_name || 'this teacher'}'s reporting inbox. Other students and teachers cannot see it.`,
          badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 'admin_only':
        return {
          text: 'Platform Administration Only (Confidential)',
          subtext: 'Delivered directly to Master Administration for sensitive complaints involving staff or urgent governance concerns.',
          badgeColor: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800',
        };
      default:
        return {
          text: 'Selected Audience',
          subtext: 'Your report will be handled confidentially.',
          badgeColor: 'bg-slate-50 text-slate-700 dark:bg-slate-950/60 dark:text-slate-300 border-slate-200 dark:border-slate-800',
        };
    }
  };

  const audiencePreview = getAudiencePreview();

  const handleCopyReference = () => {
    if (createdReference) {
      navigator.clipboard.writeText(createdReference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please provide a report title.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please provide a detailed description.');
      return;
    }
    if (audienceType === 'specific_subject' && !selectedSubjectId) {
      setErrorMessage('Please select a subject.');
      return;
    }
    if (audienceType === 'specific_teacher' && !selectedTeacherId) {
      setErrorMessage('Please select a teacher.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitAnonymousReport(
        {
          title,
          category,
          description,
          audience_type: audienceType,
          subject_id: audienceType === 'specific_subject' ? selectedSubjectId : undefined,
          subject_name: audienceType === 'specific_subject' ? selectedSubject?.name : undefined,
          target_teacher_id: audienceType === 'specific_teacher' ? selectedTeacherId : undefined,
          target_teacher_name: audienceType === 'specific_teacher' ? selectedTeacher?.display_name : undefined,
        },
        profile
      );

      if (result.success && result.reference_number) {
        setCreatedReference(result.reference_number);
        onSuccess?.();
      } else {
        setErrorMessage(result.error || 'Failed to submit report.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-navy-900 rounded-3xl shadow-modal border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-navy-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Submit Anonymous Report</h3>
              <p className="text-xs text-slate-300">
                Your name & roll number will never be shown to your chosen recipients.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdReference ? (
          /* Confirmation & Reference Token Screen */
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                Report Submitted Anonymously
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Your report has been received and routed securely to{' '}
                <strong className="text-slate-800 dark:text-slate-200">{audiencePreview.text}</strong>.
                Recipients will only see your report details, never your student identity.
              </p>
            </div>

            {/* Reference Number Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 max-w-sm mx-auto space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Your Private Tracking Reference
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-lg font-extrabold text-brand-600 dark:text-brand-400 tracking-wider">
                  {createdReference}
                </span>
                <button
                  type="button"
                  onClick={handleCopyReference}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  title="Copy reference number"
                >
                  {copiedRef ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Save this reference number to track the status of your report at any time.
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <Button
                variant="primary"
                onClick={onClose}
                className="px-8"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Report Submission Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Safety Guidelines Alert */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <Info className="w-4 h-4 text-brand-500 shrink-0" />
                <span>Responsible Reporting & Anonymity Disclosure</span>
              </div>
              <p className="leading-relaxed">
                Do not publish private personal phone numbers, addresses, CNICs, or passwords.
                If you are in immediate danger or witness a critical emergency, please contact university authorities or local emergency services directly.
              </p>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Report Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue or concern..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-950 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Report Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-950 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} — {cat.description}
                  </option>
                ))}
              </select>
            </div>

            {/* AUDIENCE SELECTION (Critical Requirement) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Who Should See This Report? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAudienceType('all_students')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    audienceType === 'all_students'
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-semibold">Option 1: All Students</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">Published to student body after moderation</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAudienceType('students_and_teachers')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    audienceType === 'students_and_teachers'
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-semibold">Option 2: Students & Teachers</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">Visible to students & faculty after moderation</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAudienceType('specific_subject')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    audienceType === 'specific_subject'
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-semibold">Option 3: Specific Subject</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">Course students and assigned subject teachers</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAudienceType('specific_teacher')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    audienceType === 'specific_teacher'
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-semibold">Option 4: Specific Teacher</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">Delivered privately to one teacher's inbox</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAudienceType('admin_only')}
                  className={`p-3 rounded-xl border text-left transition-all sm:col-span-2 ${
                    audienceType === 'admin_only'
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-semibold">Option 5: Administration Only (Confidential)</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">For sensitive staff complaints or urgent administration issues</div>
                </button>
              </div>
            </div>

            {/* Subject Selector (If Option 3) */}
            {audienceType === 'specific_subject' && (
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Select Course / Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-950 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Teacher Selector (If Option 4) */}
            {audienceType === 'specific_teacher' && (
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 animate-in fade-in">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Select Authorized Teacher <span className="text-red-500">*</span>
                </label>
                {approvedTeachers.length > 0 ? (
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-950 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {approvedTeachers.map((t) => (
                      <option key={t.teacher_id} value={t.teacher_id}>
                        {t.display_name} ({t.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    No approved teachers are registered yet. Please select Administration Only or All Students.
                  </div>
                )}
              </div>
            )}

            {/* AUDIENCE PREVIEW CONFIRMATION (Required Section 2.C) */}
            <div className={`p-4 rounded-2xl border ${audiencePreview.badgeColor} space-y-1`}>
              <div className="flex items-center gap-2 font-bold text-xs">
                <Eye className="w-4 h-4 shrink-0" />
                <span>Audience Preview: Your report will be visible to:</span>
              </div>
              <div className="text-xs font-extrabold">{audiencePreview.text}</div>
              <p className="text-[11px] opacity-90">{audiencePreview.subtext}</p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Clearly describe the incident, concern, or suggestion. Do not include your personal contact details in this text..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-950 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                leftIcon={isSubmitting ? undefined : <Send className="w-4 h-4" />}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Anonymous Report'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
