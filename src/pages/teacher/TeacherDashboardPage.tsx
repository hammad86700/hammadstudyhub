// ==============================================================================
// HAMMAD STUDYHUB — DEDICATED TEACHER PORTAL & MANAGEMENT DASHBOARD
// Architect: Muhammad Hammad
//
// Key Responsibilities:
// 1. Overview & Assigned Subjects: Teachers strictly only see their Admin-approved subjects.
// 2. Student Assignment Submissions: Filterable, searchable by Roll No / Name.
//    PRIVACY SHIELD: Never displays student email, phone, CNIC, or passwords.
// 3. Document & Multi-Image In-App Previewer: Native previews for JPG, PNG, WEBP, PDF,
//    and direct download for DOCX & PPTX.
// 4. Test & Quiz Management: MCQ, True/False, Short, Descriptive, shuffling, timing.
// 5. Bulk Question Import from CSV with validation & Question Bank reuse.
// 6. Learning Material Uploads directly into the platform curriculum.
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  HelpCircle,
  Upload,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Bell,
  Calendar,
  Layers,
  Award,
  AlertCircle,
  FileSpreadsheet,
  Shuffle,
  FileCode,
  X,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSubjects } from '../../hooks/useSubjects';
import { useResources, useResourceMutations } from '../../hooks/useResources';
import {
  Subject,
  StudentAssignmentSubmission,
  SubmissionFile,
  TeacherNotification,
  TeacherTest,
  TestQuestion,
  Resource,
} from '../../types';
import {
  getTeacherAssignedSubjects,
  getTeacherSubmissions,
  reviewAssignmentSubmission,
  getTeacherNotifications,
  markTeacherNotificationRead,
  markAllTeacherNotificationsRead,
  getTeacherUnreadNotificationCount,
  getTeacherTests,
  saveTeacherTest,
  deleteTeacherTest,
  getQuestionBank,
  saveQuestionBankItem,
  generateQuestionTemplateCsv,
  parseQuestionsCsv,
} from '../../lib/teacherAssignmentStore';
import { uploadLearningMaterialFile } from '../../lib/cloudFileStorage';
import { SEOHead } from '../../components/common/SEOHead';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatLessonDate, formatRelativeTime } from '../../lib/utils';

export const TeacherDashboardPage: React.FC = () => {
  const { profile, isTeacher, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: allSubjects = [] } = useSubjects();
  const { createResource } = useResourceMutations();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'tests' | 'questions' | 'upload'>('overview');

  // Teacher Assigned Subjects (Strict isolation)
  const assignedSubjects = useMemo(() => {
    return getTeacherAssignedSubjects(profile);
  }, [profile, allSubjects]);

  const assignedSubjectIds = useMemo(() => assignedSubjects.map((s) => s.id), [assignedSubjects]);

  // Submissions state
  const [submissions, setSubmissions] = useState<StudentAssignmentSubmission[]>([]);
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionSubjectFilter, setSubmissionSubjectFilter] = useState<string>('all');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<'all' | 'submitted' | 'reviewed'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<StudentAssignmentSubmission | null>(null);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewMarks, setReviewMarks] = useState('');
  const [reviewingSub, setReviewingSub] = useState<StudentAssignmentSubmission | null>(null);

  // File preview modal state
  const [activePreviewFile, setActivePreviewFile] = useState<SubmissionFile | null>(null);

  // Notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);
  const unreadNotifCount = useMemo(() => {
    return profile ? getTeacherUnreadNotificationCount(profile.id) : 0;
  }, [profile, notifications]);

  // Tests & Question Bank state
  const [tests, setTests] = useState<TeacherTest[]>([]);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [newTest, setNewTest] = useState<Partial<TeacherTest>>({
    title: '',
    subject_id: assignedSubjectIds[0] || '',
    duration_minutes: 45,
    total_marks: 20,
    attempts_allowed: 1,
    test_date: new Date().toISOString().substring(0, 10),
    shuffle_questions: true,
    shuffle_options: true,
    status: 'draft',
    questions: [],
  });

  // Bulk Question Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importSubjectId, setImportSubjectId] = useState<string>(assignedSubjectIds[0] || '');
  const [importCsvText, setImportCsvText] = useState('');
  const [importParsedQuestions, setImportParsedQuestions] = useState<TestQuestion[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Material upload state
  const [uploadSubjectId, setUploadSubjectId] = useState<string>(assignedSubjectIds[0] || '');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadResourceType, setUploadResourceType] = useState<'pdf' | 'presentation' | 'assignment'>('pdf');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [uploadSuccessBanner, setUploadSuccessBanner] = useState<string | null>(null);

  // Refresh data
  const refreshAllData = () => {
    if (!profile) return;
    const subs = getTeacherSubmissions(assignedSubjectIds);
    setSubmissions(subs);
    setNotifications(getTeacherNotifications(profile.id));
    setTests(getTeacherTests(profile.id));
    setQuestions(getQuestionBank());
  };

  useEffect(() => {
    refreshAllData();
    window.addEventListener('studyhub_assignment_submissions_updated', refreshAllData);
    window.addEventListener('studyhub_teacher_notifications_updated', refreshAllData);
    window.addEventListener('studyhub_teacher_tests_updated', refreshAllData);
    window.addEventListener('studyhub_question_bank_updated', refreshAllData);

    return () => {
      window.removeEventListener('studyhub_assignment_submissions_updated', refreshAllData);
      window.removeEventListener('studyhub_teacher_notifications_updated', refreshAllData);
      window.removeEventListener('studyhub_teacher_tests_updated', refreshAllData);
      window.removeEventListener('studyhub_question_bank_updated', refreshAllData);
    };
  }, [profile, assignedSubjectIds]);

  // Update default subject IDs when assignedSubjects loads
  useEffect(() => {
    if (assignedSubjectIds.length > 0) {
      if (!newTest.subject_id) setNewTest((prev) => ({ ...prev, subject_id: assignedSubjectIds[0] }));
      if (!importSubjectId) setImportSubjectId(assignedSubjectIds[0]);
      if (!uploadSubjectId) setUploadSubjectId(assignedSubjectIds[0]);
    }
  }, [assignedSubjectIds]);

  // Security check: Only verified teachers and administrators can access
  if (!isTeacher && !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          Teacher Portal Access Restricted
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
          This portal is reserved for approved faculty and teachers. If you recently applied, your account is
          awaiting approval by Muhammad Hammad.
        </p>
        <div className="pt-2">
          <Link to="/signup?role=teacher">
            <Button variant="primary">Submit Teacher Application</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSubject = submissionSubjectFilter === 'all' || sub.subject_id === submissionSubjectFilter;
      const matchesStatus = submissionStatusFilter === 'all' || sub.status === submissionStatusFilter;
      const cleanSearch = submissionSearch.trim().toLowerCase();
      const matchesSearch =
        !cleanSearch ||
        sub.student_name.toLowerCase().includes(cleanSearch) ||
        (sub.roll_no && sub.roll_no.toLowerCase().includes(cleanSearch)) ||
        sub.title.toLowerCase().includes(cleanSearch);

      return matchesSubject && matchesStatus && matchesSearch;
    });
  }, [submissions, submissionSubjectFilter, submissionStatusFilter, submissionSearch]);

  const pendingSubmissionsCount = useMemo(() => {
    return submissions.filter((s) => s.status === 'submitted').length;
  }, [submissions]);

  const activeTestsCount = useMemo(() => {
    return tests.filter((t) => t.status === 'published').length;
  }, [tests]);

  const upcomingTestsCount = useMemo(() => {
    return tests.filter((t) => t.status === 'scheduled').length;
  }, [tests]);

  // Handle Review submission
  const handleOpenReviewModal = (sub: StudentAssignmentSubmission) => {
    setReviewingSub(sub);
    setReviewFeedback(sub.review_feedback || '');
    setReviewMarks(sub.review_marks || '');
    setReviewModalOpen(true);
  };

  const handleSaveReview = async () => {
    if (!reviewingSub) return;
    if (!reviewFeedback.trim()) {
      alert('Please enter your academic review feedback.');
      return;
    }

    await reviewAssignmentSubmission(reviewingSub.id, reviewFeedback, reviewMarks, profile?.display_name);
    setReviewModalOpen(false);
    setReviewingSub(null);
    refreshAllData();
  };

  // Handle Test Creation
  const handleSaveTest = () => {
    if (!newTest.title?.trim()) {
      alert('Please enter a test title.');
      return;
    }
    if (!newTest.subject_id) {
      alert('Please select an assigned subject.');
      return;
    }

    const testId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullTest: TeacherTest = {
      id: testId,
      teacher_id: profile?.id || 'teacher',
      subject_id: newTest.subject_id!,
      title: newTest.title.trim(),
      instructions: newTest.instructions || '',
      test_date: newTest.test_date || new Date().toISOString().substring(0, 10),
      start_time: newTest.start_time || '09:00',
      end_time: newTest.end_time || '10:00',
      duration_minutes: Number(newTest.duration_minutes) || 45,
      total_marks: Number(newTest.total_marks) || 20,
      attempts_allowed: Number(newTest.attempts_allowed) || 1,
      shuffle_questions: Boolean(newTest.shuffle_questions),
      shuffle_options: Boolean(newTest.shuffle_options),
      status: (newTest.status as any) || 'draft',
      questions: newTest.questions || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveTeacherTest(fullTest);
    setTestModalOpen(false);
    setNewTest({
      title: '',
      subject_id: assignedSubjectIds[0] || '',
      duration_minutes: 45,
      total_marks: 20,
      attempts_allowed: 1,
      test_date: new Date().toISOString().substring(0, 10),
      shuffle_questions: true,
      shuffle_options: true,
      status: 'draft',
      questions: [],
    });
    refreshAllData();
  };

  // Handle CSV Bulk Question Parsing
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportCsvText(text);
      const parsed = parseQuestionsCsv(text, importSubjectId);
      setImportParsedQuestions(parsed.questions);
      setImportErrors(parsed.errors);
      setImportSuccess(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCommitImportQuestions = () => {
    if (importParsedQuestions.length === 0) return;
    importParsedQuestions.forEach((q) => {
      saveQuestionBankItem(q);
    });
    setImportSuccess(`Successfully imported ${importParsedQuestions.length} questions into Question Bank!`);
    setImportParsedQuestions([]);
    refreshAllData();
    setTimeout(() => {
      setImportModalOpen(false);
      setImportSuccess(null);
    }, 1500);
  };

  // Download Question CSV Template
  const handleDownloadTemplate = () => {
    const csv = generateQuestionTemplateCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'studyhub-questions-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Material Upload by Teacher
  const handleUploadMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      alert('Please enter a material title.');
      return;
    }
    if (!uploadSubjectId) {
      alert('Please select an assigned subject.');
      return;
    }
    if (!uploadFile) {
      alert('Please select a PDF or document file to upload.');
      return;
    }

    setIsUploadingMaterial(true);
    try {
      const resId = `res-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const uploadResult = await uploadLearningMaterialFile(uploadFile, resId, uploadSubjectId);

      await createResource.mutateAsync({
        title: uploadTitle.trim(),
        subject_id: uploadSubjectId,
        resource_type: uploadResourceType,
        lesson_date: new Date().toISOString().substring(0, 10),
        source_provider: uploadResult.sourceProvider,
        external_url: uploadResult.fileUrl,
        file_name: uploadFile.name,
        original_filename: uploadFile.name,
        mime_type: uploadFile.type || 'application/pdf',
        file_size: `${Math.round(uploadFile.size / 1024)} KB`,
        file_data: uploadResult.fileData,
        description: uploadDescription.trim(),
        tags: ['teacher-upload'],
        status: 'published',
      } as any);

      setUploadSuccessBanner(`Learning material "${uploadTitle}" uploaded and published successfully!`);
      setUploadTitle('');
      setUploadDescription('');
      setUploadFile(null);
      setTimeout(() => setUploadSuccessBanner(null), 5000);
    } catch (err: any) {
      alert(err?.message || 'Failed to upload learning material.');
    } finally {
      setIsUploadingMaterial(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SEOHead title="Teacher Dashboard — Hammad StudyHub" />

      {/* Header & Teacher Greeting */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-xs font-bold text-brand-700 dark:text-brand-300">
            <Award className="w-3.5 h-3.5 text-brand-600" />
            <span>Teacher Portal</span>
            {isAdmin && <span className="opacity-75">(Administrator Access)</span>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
            Welcome, {profile?.display_name || 'Teacher'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage your assigned subjects, student assignment submissions, test schedules, and learning materials.
          </p>
        </div>

        {/* Action Header Pills: Notifications & Quick Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Notifications Drawer Toggle */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-navy-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 relative transition-colors cursor-pointer"
              title="Student Submission Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <Bell className="w-4 h-4 text-brand-600" />
                    <span>Submission Notifications</span>
                  </div>
                  {unreadNotifCount > 0 && (
                    <button
                      onClick={() => profile && markAllTeacherNotificationsRead(profile.id)}
                      className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications yet. You will be alerted whenever a student submits an assignment.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markTeacherNotificationRead(n.id);
                          setActiveTab('submissions');
                          setNotificationsOpen(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer space-y-1 ${
                          !n.read ? 'bg-brand-50/40 dark:bg-brand-950/30' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                            {n.student_name} ({n.roll_no})
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatRelativeTime(n.submission_time)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-1">
                          Submitted "{n.assignment_title}" in {n.subject_name}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            size="md"
            variant="primary"
            onClick={() => setActiveTab('upload')}
            leftIcon={<Upload className="w-4 h-4" />}
            className="font-bold shadow-md shadow-brand-600/20"
          >
            Upload Material
          </Button>
        </div>
      </div>

      {/* Metric Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Subjects</p>
          <p className="text-2xl font-black text-brand-600 dark:text-brand-400">{assignedSubjects.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Submissions</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{submissions.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Reviews</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingSubmissionsCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Tests</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeTestsCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Upcoming Tests</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{upcomingTestsCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Question Bank</p>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{questions.length}</p>
        </div>
      </div>

      {/* Tab Navigation Navigation Bar */}
      <div className="flex p-1.5 bg-slate-100 dark:bg-navy-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-2xs">
        {[
          { id: 'overview', label: 'Overview & Subjects', icon: BookOpen },
          { id: 'submissions', label: `Student Submissions (${pendingSubmissionsCount})`, icon: ClipboardCheck },
          { id: 'tests', label: 'Tests & Quizzes', icon: Clock },
          { id: 'questions', label: 'Question Bank', icon: HelpCircle },
          { id: 'upload', label: 'Upload Materials', icon: Upload },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW & MY SUBJECTS                                      */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Assigned Subjects</h2>
              <p className="text-xs text-slate-500">
                You are authorized to manage assessments and learning materials for the following subjects:
              </p>
            </div>
          </div>

          {assignedSubjects.length === 0 ? (
            <EmptyState
              title="No Subjects Assigned Yet"
              description="Your account is approved, but the administrator has not yet assigned any subjects to you. Please contact Muhammad Hammad."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {assignedSubjects.map((sub) => {
                const subSubmissions = submissions.filter((s) => s.subject_id === sub.id);
                const subTests = tests.filter((t) => t.subject_id === sub.id);

                return (
                  <Card
                    key={sub.id}
                    className="p-6 border border-slate-200 dark:border-slate-800 shadow-card flex flex-col justify-between space-y-4 hover:border-brand-300 dark:hover:border-brand-800 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                          {sub.code}
                        </span>
                        <span className="text-xs text-slate-400">Semester Course</span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{sub.name}</h3>
                        {sub.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">{sub.description}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-950">
                          <span className="text-[10px] text-slate-400 block font-semibold">Submissions</span>
                          <span className="font-bold text-slate-900 dark:text-white">{subSubmissions.length} Received</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-950">
                          <span className="text-[10px] text-slate-400 block font-semibold">Active Tests</span>
                          <span className="font-bold text-slate-900 dark:text-white">{subTestTestsCount(subTests)} Scheduled</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        className="flex-1 font-bold text-xs"
                        onClick={() => {
                          setSubmissionSubjectFilter(sub.id);
                          setActiveTab('submissions');
                        }}
                      >
                        View Submissions
                      </Button>
                      <Link to={`/subjects/${sub.slug}`} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-brand-600">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 2: STUDENT ASSIGNMENT SUBMISSIONS (PRIVACY SHIELD ENFORCED)     */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'submissions' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-brand-600" />
                <span>Student Assignment Submissions</span>
              </h2>
              <p className="text-xs text-slate-500">
                View handwritten photos, documents, and mark reviews. Student private info (email/phone) is strictly protected.
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={submissionSubjectFilter}
                onChange={(e) => setSubmissionSubjectFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Assigned Subjects</option>
                {assignedSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>

              <select
                value={submissionStatusFilter}
                onChange={(e) => setSubmissionStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Pending Review</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={submissionSearch}
              onChange={(e) => setSubmissionSearch(e.target.value)}
              placeholder="Search by student name, roll number, or assignment title..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Submissions Table */}
          {filteredSubmissions.length === 0 ? (
            <EmptyState
              title="No Student Submissions Found"
              description="No assignments have been submitted by students matching the selected criteria yet."
            />
          ) : (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-navy-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Student & Roll No</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Assignment Title</th>
                      <th className="py-3 px-4">Submitted Date</th>
                      <th className="py-3 px-4">Files / Attachments</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          <div>{sub.student_name}</div>
                          <span className="text-[10px] font-mono text-brand-600 dark:text-brand-400 font-normal">
                            {sub.roll_no || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {sub.subject_name || 'Subject'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium max-w-xs truncate text-slate-800 dark:text-slate-200">
                          {sub.title}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {formatLessonDate(sub.submitted_at.substring(0, 10))}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {sub.files?.map((f, i) => (
                              <button
                                key={f.id || i}
                                onClick={() => setActivePreviewFile(f)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 transition-colors cursor-pointer"
                                title={`Preview or download ${f.file_name}`}
                              >
                                <span>📄 {f.file_name}</span>
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === 'reviewed'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            }`}
                          >
                            {sub.status === 'reviewed' ? 'Reviewed' : 'Submitted'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant={sub.status === 'reviewed' ? 'outline' : 'primary'}
                            className="font-bold text-xs"
                            onClick={() => handleOpenReviewModal(sub)}
                          >
                            {sub.status === 'reviewed' ? 'Edit Review' : 'Review & Grade'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 3: TEST AND QUIZ MANAGEMENT                                    */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'tests' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-600" />
                <span>Test & Quiz Management</span>
              </h2>
              <p className="text-xs text-slate-500">
                Create scheduled assessments, multiple-choice quizzes, and descriptive tests for assigned subjects.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setImportModalOpen(true)}
                leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              >
                Bulk Import Questions
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setTestModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create New Test
              </Button>
            </div>
          </div>

          {tests.length === 0 ? (
            <EmptyState
              title="No Tests Created Yet"
              description="Create a test or import questions from CSV to schedule assessments for your students."
              actionLabel="Create First Test"
              onAction={() => setTestModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tests.map((test) => {
                const sub = assignedSubjects.find((s) => s.id === test.subject_id);
                return (
                  <Card key={test.id} className="p-6 border border-slate-200 dark:border-slate-800 shadow-card space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                        {sub?.code || 'Subject'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          test.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : test.status === 'scheduled'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {test.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{test.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Date: {test.test_date} • Duration: {test.duration_minutes} mins • Total Marks: {test.total_marks}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{test.questions?.length || 0} Questions</span>
                      <button
                        onClick={() => deleteTeacherTest(test.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 4: REUSABLE QUESTION BANK                                      */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'questions' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand-600" />
                <span>Reusable Question Bank</span>
              </h2>
              <p className="text-xs text-slate-500">
                Organized by subject, chapter, type, and difficulty. Reuse saved questions when creating tests.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleDownloadTemplate} leftIcon={<Download className="w-4 h-4" />}>
                Download Template (.csv)
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setImportModalOpen(true)}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Import Questions
              </Button>
            </div>
          </div>

          {questions.length === 0 ? (
            <EmptyState
              title="Question Bank is Empty"
              description="Download the question template and upload your questions using the bulk import tool."
              actionLabel="Import Questions Now"
              onAction={() => setImportModalOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <Card key={q.id || idx} className="p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-600 uppercase text-[10px]">{q.question_type}</span>
                      {q.chapter && <span className="text-slate-400 font-medium">• {q.chapter}</span>}
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{q.marks} Marks</span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    {idx + 1}. {q.question_text}
                  </p>

                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`p-1.5 rounded-lg border text-[11px] ${
                            opt === q.correct_answer
                              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {opt} {opt === q.correct_answer && '✓ (Correct)'}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 5: LEARNING MATERIAL MANAGEMENT (UPLOAD PDF / NOTES)           */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'upload' && (
        <section className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-brand-600" />
              <span>Upload Learning Material</span>
            </h2>
            <p className="text-xs text-slate-500">
              Publish lecture notes, slides, or worksheets directly to your assigned subject's student timeline.
            </p>
          </div>

          {uploadSuccessBanner && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccessBanner}</span>
            </div>
          )}

          <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card">
            <form onSubmit={handleUploadMaterialSubmit} className="space-y-4">
              {/* Subject Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Assigned Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadSubjectId}
                  onChange={(e) => setUploadSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white font-medium"
                >
                  {assignedSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Material Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Sequential Logic Circuits & Flip Flops Notes"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description / Topic Notes
                </label>
                <textarea
                  rows={3}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Summary of concepts covered in this lesson..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                />
              </div>

              {/* Resource Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Resource Type
                </label>
                <select
                  value={uploadResourceType}
                  onChange={(e) => setUploadResourceType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                >
                  <option value="pdf">PDF Lecture Notes / Handout</option>
                  <option value="presentation">Presentation Slides (.pptx)</option>
                  <option value="assignment">Class Worksheet / Assignment</option>
                </select>
              </div>

              {/* File Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Document File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 dark:file:bg-brand-950 dark:file:text-brand-300 cursor-pointer"
                />
              </div>

              <Button
                type="submit"
                size="md"
                variant="primary"
                className="w-full font-bold mt-2"
                isLoading={isUploadingMaterial}
              >
                Publish to Student Portal
              </Button>
            </form>
          </Card>
        </section>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* REVIEW & FEEDBACK MODAL                                            */}
      {/* ------------------------------------------------------------------- */}
      {reviewModalOpen && reviewingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Review Student Assignment</h3>
                <p className="text-xs text-slate-400">
                  {reviewingSub.student_name} ({reviewingSub.roll_no}) • {reviewingSub.subject_name}
                </p>
              </div>
              <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Feedback & Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="e.g. Excellent work on Boolean simplification. Question 3 needs proper derivation steps."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Marks / Grade (Optional)
                </label>
                <input
                  type="text"
                  value={reviewMarks}
                  onChange={(e) => setReviewMarks(e.target.value)}
                  placeholder="e.g. 9 / 10 or Grade A"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-navy-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" className="font-bold" onClick={handleSaveReview}>
                Save & Mark as Reviewed
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* FILE PREVIEW & DOWNLOAD MODAL                                      */}
      {/* ------------------------------------------------------------------- */}
      {activePreviewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="w-full max-w-4xl bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-md">
                  📄 {activePreviewFile.file_name}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Size: {activePreviewFile.file_size} • Type: {activePreviewFile.mime_type}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={activePreviewFile.file_data || activePreviewFile.file_url}
                  download={activePreviewFile.file_name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setActivePreviewFile(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-slate-950 flex items-center justify-center min-h-[350px]">
              {activePreviewFile.mime_type.startsWith('image/') ||
              activePreviewFile.file_name.match(/\.(png|jpg|jpeg|webp)$/i) ? (
                <img
                  src={activePreviewFile.file_data || activePreviewFile.file_url}
                  alt={activePreviewFile.file_name}
                  className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-md"
                />
              ) : activePreviewFile.mime_type.includes('pdf') ||
                activePreviewFile.file_name.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={activePreviewFile.file_data || activePreviewFile.file_url}
                  title={activePreviewFile.file_name}
                  className="w-full h-[70vh] border-0 rounded-lg bg-white"
                />
              ) : (
                <div className="p-8 text-center text-white space-y-3">
                  <FileText className="w-12 h-12 text-brand-400 mx-auto" />
                  <p className="text-sm font-semibold">Office Document Preview</p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    This file format (.docx / .pptx) is ready for download to your device.
                  </p>
                  <a
                    href={activePreviewFile.file_data || activePreviewFile.file_url}
                    download={activePreviewFile.file_name}
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

      {/* ------------------------------------------------------------------- */}
      {/* BULK QUESTION IMPORT MODAL                                         */}
      {/* ------------------------------------------------------------------- */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Bulk Question Import</h3>
                <p className="text-xs text-slate-500">
                  Upload questions via CSV/Excel, preview validation errors, and import to your Question Bank.
                </p>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {importSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs">
                  {importSuccess}
                </div>
              )}

              {/* Subject Selection for Questions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Imported Questions to Subject:
                </label>
                <select
                  value={importSubjectId}
                  onChange={(e) => setImportSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                >
                  {assignedSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload Area */}
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Upload Completed Question Template (.csv)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select your CSV file containing MCQ, True/False, or Short Answer questions.
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCsvFileUpload}
                  className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 cursor-pointer"
                />
              </div>

              {/* Validation Errors */}
              {importErrors.length > 0 && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-700 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    Validation Notices ({importErrors.length}):
                  </p>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                    {importErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Parsed Questions Preview */}
              {importParsedQuestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Preview Questions ({importParsedQuestions.length} Valid):
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {importParsedQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                          <span>{q.question_type}</span>
                          <span>{q.marks} Marks</span>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-white mt-1">{q.question_text}</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                          Correct Answer: {q.correct_answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-navy-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Button size="sm" variant="outline" onClick={handleDownloadTemplate} leftIcon={<Download className="w-3.5 h-3.5" />}>
                Template CSV
              </Button>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setImportModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="font-bold"
                  disabled={importParsedQuestions.length === 0}
                  onClick={handleCommitImportQuestions}
                >
                  Import {importParsedQuestions.length} Questions
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* CREATE NEW TEST MODAL                                              */}
      {/* ------------------------------------------------------------------- */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Test / Quiz</h3>
                <p className="text-xs text-slate-500">Configure assessment timing, duration, and question settings.</p>
              </div>
              <button onClick={() => setTestModalOpen(false)} className="text-slate-400 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Test Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTest.title}
                  onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                  placeholder="e.g. Midterm Quiz: Boolean Algebra & Karnaugh Maps"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={newTest.subject_id}
                  onChange={(e) => setNewTest({ ...newTest, subject_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                >
                  {assignedSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Assessment
                  </label>
                  <input
                    type="date"
                    value={newTest.test_date}
                    onChange={(e) => setNewTest({ ...newTest, test_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={newTest.duration_minutes}
                    onChange={(e) => setNewTest({ ...newTest, duration_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={newTest.total_marks}
                    onChange={(e) => setNewTest({ ...newTest, total_marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Publication Status
                  </label>
                  <select
                    value={newTest.status}
                    onChange={(e) => setNewTest({ ...newTest, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                  >
                    <option value="draft">Draft (Private)</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              {/* Shuffling Options */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-950 space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={newTest.shuffle_questions}
                    onChange={(e) => setNewTest({ ...newTest, shuffle_questions: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Shuffle question order for each student</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={newTest.shuffle_options}
                    onChange={(e) => setNewTest({ ...newTest, shuffle_options: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Shuffle answer options for multiple choice questions</span>
                </label>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-navy-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setTestModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" className="font-bold" onClick={handleSaveTest}>
                Save Test Assessment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function subTestTestsCount(testsList: TeacherTest[]): number {
  return testsList.filter((t) => t.status === 'scheduled' || t.status === 'published').length;
}

