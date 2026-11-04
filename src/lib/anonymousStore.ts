// ==============================================================================
// HAMMAD STUDYHUB — ANONYMOUS STUDENT REPORTING & TEACHER POLLS STORE
// Architect: Muhammad Hammad
//
// Key Responsibilities & Strict Privacy Protections:
// 1. Five Audience Routing Options:
//    - All Students (public after moderation)
//    - Students & Teachers (public after moderation)
//    - Specific Subject (subject students + assigned teachers)
//    - Specific Teacher (private directly to teacher's inbox)
//    - Admin Only (sensitive complaints directly to platform administration)
// 2. Full Moderation Workflow (pending_review, approved, published, rejected, hidden, resolved).
// 3. Quarantined Report Identity Registry: Kept completely separate from normal report queries.
//    Exceptional access requires documented reason and is permanently logged in audit trail.
// 4. Teacher-Created Anonymous Questions, Polls & Student Feedback:
//    - Single-choice MCQ, Multi-choice MCQ, Rating Scale (1-5), Short Answer, Student Feedback.
// 5. Zero Identity Leakage: Responses are stored without student ID, name, roll no, or IP.
// 6. Detached Participation Registry: Enforces one-response-per-student without linking identity to answer.
// 7. Shuffled Written Answers: Teachers view written feedback in randomized order with no timestamps.
// ==============================================================================

import {
  AnonymousReport,
  ReportCategory,
  ReportAudienceType,
  ReportStatus,
  ReportIdentityLink,
  ReportAuditLog,
  AnonymousQuestion,
  AnonymousQuestionType,
  AnonymousQuestionStatus,
  AnonymousResponse,
  PollParticipation,
  QuestionResponseSummary,
  UserProfile,
} from '../types';

export type {
  AnonymousReport,
  ReportCategory,
  ReportAudienceType,
  ReportStatus,
  ReportIdentityLink,
  ReportAuditLog,
  AnonymousQuestion,
  AnonymousQuestionType,
  AnonymousQuestionStatus,
  AnonymousResponse,
  PollParticipation,
  QuestionResponseSummary,
  UserProfile,
};
import { supabase, isSupabaseConfigured } from './supabase';

// Local Storage Keys
const REPORTS_KEY = 'studyhub_anonymous_reports_v1';
const REPORT_IDENTITIES_KEY = 'studyhub_report_identities_v1';
const REPORT_AUDIT_LOGS_KEY = 'studyhub_report_audit_logs_v1';
const QUESTIONS_KEY = 'studyhub_anonymous_questions_v1';
const RESPONSES_KEY = 'studyhub_anonymous_responses_v1';
const PARTICIPATIONS_KEY = 'studyhub_poll_participations_v1';

// Helpers
function getStored<T>(key: string, defaultValue: T): T {
  try {
    if (typeof localStorage === 'undefined') return defaultValue;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn(`[StudyHub Anonymous] Failed reading storage key ${key}:`, e);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    console.warn(`[StudyHub Anonymous] Failed writing storage key ${key}:`, e);
  }
}

function dispatchCustomEvent(name: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(name));
  }
}

/**
 * Generates an academic reference number, e.g. "REP-2026-X8Y9"
 */
export function generateReportReferenceNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REP-2026-${code}`;
}

/**
 * Fisher-Yates array shuffle for anonymized response presentation
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ==============================================================================
// 1. ANONYMOUS STUDENT REPORTING SYSTEM
// ==============================================================================

export interface SubmitReportInput {
  title: string;
  category: ReportCategory;
  description: string;
  audience_type: ReportAudienceType;
  subject_id?: string;
  subject_name?: string;
  target_teacher_id?: string;
  target_teacher_name?: string;
}

/**
 * Submits a new anonymous student report.
 * - Generates unique tracking reference number.
 * - Assigns initial moderation status based on audience.
 * - Stores public report object without any student identity.
 * - Quarantines student identity in a separated, restricted table for anti-abuse protection.
 */
export async function submitAnonymousReport(
  input: SubmitReportInput,
  reporter: UserProfile
): Promise<{ success: boolean; report?: AnonymousReport; reference_number?: string; error?: string }> {
  try {
    if (!input.title || !input.title.trim()) {
      return { success: false, error: 'Report title is required.' };
    }
    if (!input.description || !input.description.trim()) {
      return { success: false, error: 'Report description is required.' };
    }
    if (input.audience_type === 'specific_subject' && !input.subject_id) {
      return { success: false, error: 'Please select a subject for subject-specific reports.' };
    }
    if (input.audience_type === 'specific_teacher' && !input.target_teacher_id) {
      return { success: false, error: 'Please select an authorized teacher.' };
    }

    const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const referenceNumber = generateReportReferenceNumber();
    const now = new Date().toISOString();

    // Default status:
    // - Specific Teacher private report: 'approved' (directly accessible to selected teacher)
    // - Admin Only: 'pending_review' (direct to admin queue)
    // - Public/Subject: 'pending_review' (moderation required before public publication)
    const initialStatus: ReportStatus =
      input.audience_type === 'specific_teacher' ? 'approved' : 'pending_review';

    const report: AnonymousReport = {
      id: reportId,
      reference_number: referenceNumber,
      title: input.title.trim(),
      category: input.category,
      description: input.description.trim(),
      audience_type: input.audience_type,
      subject_id: input.subject_id,
      subject_name: input.subject_name,
      target_teacher_id: input.target_teacher_id,
      target_teacher_name: input.target_teacher_name,
      status: initialStatus,
      created_at: now,
      updated_at: now,
    };

    // Save report in main reports store
    const reports = getStored<AnonymousReport[]>(REPORTS_KEY, []);
    reports.unshift(report);
    setStored(REPORTS_KEY, reports);

    // Save isolated identity link (QUARANTINED)
    const identityLinks = getStored<ReportIdentityLink[]>(REPORT_IDENTITIES_KEY, []);
    identityLinks.unshift({
      report_id: reportId,
      reference_number: referenceNumber,
      student_id: reporter.id,
      student_name: reporter.display_name,
      roll_no: reporter.roll_no || 'N/A',
      email: reporter.email,
      created_at: now,
    });
    setStored(REPORT_IDENTITIES_KEY, identityLinks);

    // Sync to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from('anonymous_reports').insert({
          id: report.id,
          reference_number: report.reference_number,
          title: report.title,
          category: report.category,
          description: report.description,
          audience_type: report.audience_type,
          subject_id: report.subject_id,
          subject_name: report.subject_name,
          target_teacher_id: report.target_teacher_id,
          target_teacher_name: report.target_teacher_name,
          status: report.status,
          created_at: now,
          updated_at: now,
        });

        await supabase.from('report_identity_links').insert({
          report_id: reportId,
          reference_number: referenceNumber,
          student_id: reporter.id,
          student_name: reporter.display_name,
          roll_no: reporter.roll_no || 'N/A',
          email: reporter.email,
          created_at: now,
        });
      } catch (sErr) {
        console.warn('[StudyHub Anonymous] Supabase report insert notice:', sErr);
      }
    }

    dispatchCustomEvent('studyhub_reports_updated');
    return { success: true, report, reference_number: referenceNumber };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to submit report.' };
  }
}

/**
 * Gets all reports submitted by the logged-in student (for private student tracking)
 */
export function getStudentSubmittedReports(studentId: string): AnonymousReport[] {
  if (!studentId) return [];
  const identities = getStored<ReportIdentityLink[]>(REPORT_IDENTITIES_KEY, []);
  const studentReportIds = identities.filter((i) => i.student_id === studentId).map((i) => i.report_id);
  const reports = getStored<AnonymousReport[]>(REPORTS_KEY, []);
  return reports.filter((r) => studentReportIds.includes(r.id));
}

/**
 * Tracks a report by its unique reference number (e.g. "REP-2026-X8Y9").
 * Returns the report's category, audience, date, and status without exposing any identity.
 */
export function trackReportByReferenceNumber(refNum: string): AnonymousReport | undefined {
  if (!refNum) return undefined;
  const clean = refNum.trim().toUpperCase();
  const reports = getStored<AnonymousReport[]>(REPORTS_KEY, []);
  return reports.find((r) => r.reference_number.toUpperCase() === clean);
}

/**
 * Retrieves public approved reports for the student body.
 * - Only includes status === 'published'.
 * - Filtered by audience: all_students, students_and_teachers, or specific enrolled subjects.
 */
export function getPublicReportsForStudents(enrolledSubjectIds: string[] = []): AnonymousReport[] {
  const reports = getStored<AnonymousReport[]>(REPORTS_KEY, []);
  return reports.filter((r) => {
    if (r.status !== 'published') return false;
    if (r.audience_type === 'all_students' || r.audience_type === 'students_and_teachers') {
      return true;
    }
    if (r.audience_type === 'specific_subject' && r.subject_id) {
      return enrolledSubjectIds.includes(r.subject_id);
    }
    return false;
  });
}

/**
 * Retrieves reports directed to a specific teacher.
 * PRIVACY SHIELD:
 * - Only reports where target_teacher_id === teacherId, OR specific subject in teacher's assigned subjects, OR students_and_teachers (published).
 * - Strictly NO student name, roll no, email, or profile ID is returned.
 */
export function getTeacherReportsInbox(
  teacherId: string,
  assignedSubjectIds: string[] = []
): AnonymousReport[] {
  if (!teacherId) return [];
  const reports = getStored<AnonymousReport[]>(REPORTS_KEY, []);

  return reports.filter((r) => {
    // 1. Direct private report to this specific teacher
    if (r.audience_type === 'specific_teacher' && r.target_teacher_id === teacherId) {
      return r.status !== 'rejected' && r.status !== 'hidden';
    }

    // 2. Specific subject report for subjects this teacher is assigned to
    if (
      r.audience_type === 'specific_subject' &&
      r.subject_id &&
      assignedSubjectIds.includes(r.subject_id)
    ) {
      return r.status === 'published' || r.status === 'approved';
    }

    // 3. General students and teachers report
    if (r.audience_type === 'students_and_teachers') {
      return r.status === 'published';
    }

    return false;
  });
}

/**
 * Retrieves all reports for Administrator moderation and incident review.
 */
export function getAdminReportsQueue(): AnonymousReport[] {
  return getStored<AnonymousReport[]>(REPORTS_KEY, []);
}

/**
 * Moderates a report (Admin or Authorized Moderator).
 */
export async function moderateReport(
  reportId: string,
  action: 'approve' | 'publish' | 'reject' | 'hide' | 'resolve',
  notes?: string,
  adminName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const reports = getStored<AnonymousReport[]>(REPORTS_KEY, []);
    const idx = reports.findIndex((r) => r.id === reportId);
    if (idx === -1) return { success: false, error: 'Report not found.' };

    const report = reports[idx];
    const now = new Date().toISOString();

    if (action === 'approve') {
      report.status = 'approved';
      report.reviewed_by = adminName || 'Administrator';
      report.reviewed_at = now;
      if (notes) report.moderation_notes = notes;
    } else if (action === 'publish') {
      report.status = 'published';
      report.reviewed_by = adminName || 'Administrator';
      report.reviewed_at = now;
      if (notes) report.moderation_notes = notes;
    } else if (action === 'reject') {
      report.status = 'rejected';
      report.reviewed_by = adminName || 'Administrator';
      report.reviewed_at = now;
      if (notes) report.moderation_notes = notes;
    } else if (action === 'hide') {
      report.status = 'hidden';
      if (notes) report.moderation_notes = notes;
    } else if (action === 'resolve') {
      report.status = 'resolved';
      report.resolved_at = now;
      if (notes) report.resolution_notes = notes;
    }

    report.updated_at = now;
    reports[idx] = report;
    setStored(REPORTS_KEY, reports);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('anonymous_reports')
          .update({
            status: report.status,
            moderation_notes: report.moderation_notes,
            reviewed_by: report.reviewed_by,
            reviewed_at: report.reviewed_at,
            resolution_notes: report.resolution_notes,
            resolved_at: report.resolved_at,
            updated_at: now,
          })
          .eq('id', reportId);
      } catch (sErr) {
        console.warn('[StudyHub Anonymous] Supabase report update notice:', sErr);
      }
    }

    dispatchCustomEvent('studyhub_reports_updated');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update report status.' };
  }
}

/**
 * Exceptional Identity Link Access (Protected by Audit Trail).
 * Allowed ONLY for emergency safeguarding or formal administrative investigations.
 * Requires a documented justification reason.
 */
export async function auditAccessReportIdentity(
  reportId: string,
  adminUser: UserProfile,
  reason: string
): Promise<{ success: boolean; identity?: ReportIdentityLink; error?: string }> {
  try {
    if (!adminUser || adminUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Only Master Administrator may request identity review.' };
    }
    if (!reason || reason.trim().length < 8) {
      return { success: false, error: 'A valid, documented justification reason (minimum 8 characters) is required.' };
    }

    const identities = getStored<ReportIdentityLink[]>(REPORT_IDENTITIES_KEY, []);
    const match = identities.find((i) => i.report_id === reportId);
    if (!match) {
      return { success: false, error: 'No identity linkage record found for this report.' };
    }

    // Record in audit log
    const auditLogs = getStored<ReportAuditLog[]>(REPORT_AUDIT_LOGS_KEY, []);
    const logEntry: ReportAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      report_id: reportId,
      reference_number: match.reference_number,
      accessed_by: adminUser.display_name,
      access_role: adminUser.role,
      reason: reason.trim(),
      timestamp: new Date().toISOString(),
    };
    auditLogs.unshift(logEntry);
    setStored(REPORT_AUDIT_LOGS_KEY, auditLogs);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('report_audit_logs').insert(logEntry);
      } catch (sErr) {
        console.warn('[StudyHub Anonymous] Supabase audit log insert notice:', sErr);
      }
    }

    return { success: true, identity: match };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to access identity linkage.' };
  }
}

export function getReportAuditLogs(): ReportAuditLog[] {
  return getStored<ReportAuditLog[]>(REPORT_AUDIT_LOGS_KEY, []);
}

// ==============================================================================
// 2. TEACHER ANONYMOUS QUESTIONS & POLLS SYSTEM
// ==============================================================================

export interface CreateQuestionInput {
  teacher_id: string;
  teacher_name?: string;
  subject_id: string;
  subject_name?: string;
  title: string;
  description?: string;
  question_type: AnonymousQuestionType;
  options?: string[];
  rating_min?: number;
  rating_max?: number;
  rating_labels?: { min_label?: string; max_label?: string };
  is_anonymous?: boolean;
  start_date?: string;
  closing_date: string;
  min_responses_threshold?: number;
  hide_results_until_closed?: boolean;
}

/**
 * Creates a new teacher question, poll, or anonymous feedback prompt.
 */
export async function createAnonymousQuestion(
  input: CreateQuestionInput
): Promise<{ success: boolean; question?: AnonymousQuestion; error?: string }> {
  try {
    if (!input.title || !input.title.trim()) {
      return { success: false, error: 'Question title is required.' };
    }
    if (!input.subject_id) {
      return { success: false, error: 'Assigned subject selection is required.' };
    }
    if (!input.closing_date) {
      return { success: false, error: 'Closing date and time is required.' };
    }

    if (
      (input.question_type === 'single_choice' || input.question_type === 'multiple_choice') &&
      (!input.options || input.options.filter((o) => o && o.trim()).length < 2)
    ) {
      return { success: false, error: 'Multiple choice questions require at least two answer options.' };
    }

    const questionId = `qpoll-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const question: AnonymousQuestion = {
      id: questionId,
      teacher_id: input.teacher_id,
      teacher_name: input.teacher_name,
      subject_id: input.subject_id,
      subject_name: input.subject_name,
      title: input.title.trim(),
      description: input.description?.trim(),
      question_type: input.question_type,
      options: input.options?.filter((o) => o && o.trim()) || [],
      rating_min: input.rating_min || 1,
      rating_max: input.rating_max || 5,
      rating_labels: input.rating_labels || { min_label: 'Poor', max_label: 'Excellent' },
      is_anonymous: input.is_anonymous ?? true,
      start_date: input.start_date || now,
      closing_date: input.closing_date,
      status: 'active',
      min_responses_threshold: input.min_responses_threshold || 1,
      hide_results_until_closed: input.hide_results_until_closed ?? false,
      created_at: now,
      updated_at: now,
    };

    const questions = getStored<AnonymousQuestion[]>(QUESTIONS_KEY, []);
    questions.unshift(question);
    setStored(QUESTIONS_KEY, questions);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('anonymous_questions').insert({
          id: question.id,
          teacher_id: question.teacher_id,
          teacher_name: question.teacher_name,
          subject_id: question.subject_id,
          subject_name: question.subject_name,
          title: question.title,
          description: question.description,
          question_type: question.question_type,
          options: question.options,
          rating_min: question.rating_min,
          rating_max: question.rating_max,
          rating_labels: question.rating_labels,
          is_anonymous: question.is_anonymous,
          start_date: question.start_date,
          closing_date: question.closing_date,
          status: question.status,
          min_responses_threshold: question.min_responses_threshold,
          hide_results_until_closed: question.hide_results_until_closed,
          created_at: now,
          updated_at: now,
        });
      } catch (sErr) {
        console.warn('[StudyHub Anonymous] Supabase question insert notice:', sErr);
      }
    }

    dispatchCustomEvent('studyhub_polls_updated');
    return { success: true, question };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create question.' };
  }
}

/**
 * Retrieves questions created by a teacher.
 */
export function getTeacherQuestions(
  teacherId: string,
  subjectId?: string
): AnonymousQuestion[] {
  if (!teacherId) return [];
  const questions = getStored<AnonymousQuestion[]>(QUESTIONS_KEY, []);
  let filtered = questions.filter((q) => q.teacher_id === teacherId);
  if (subjectId) {
    filtered = filtered.filter((q) => q.subject_id === subjectId);
  }
  return filtered;
}

/**
 * Retrieves active anonymous questions available to a student based on their subjects.
 */
export function getActiveQuestionsForStudent(
  studentSubjectIds: string[] = []
): AnonymousQuestion[] {
  const questions = getStored<AnonymousQuestion[]>(QUESTIONS_KEY, []);
  const now = new Date().toISOString();

  return questions.filter((q) => {
    if (q.status !== 'active') return false;
    if (studentSubjectIds.length > 0 && !studentSubjectIds.includes(q.subject_id)) {
      return false;
    }
    // Check if open by date
    if (q.start_date && q.start_date > now) return false;
    if (q.closing_date && q.closing_date < now) return false;
    return true;
  });
}

/**
 * Checks if a student has already answered this question.
 */
export function hasStudentParticipated(questionId: string, studentId: string): boolean {
  if (!questionId || !studentId) return false;
  const participations = getStored<PollParticipation[]>(PARTICIPATIONS_KEY, []);
  return participations.some((p) => p.question_id === questionId && p.student_id === studentId);
}

export interface SubmitResponseInput {
  question_id: string;
  subject_id: string;
  question_type: AnonymousQuestionType;
  selected_option?: string;
  selected_options?: string[];
  rating_value?: number;
  written_text?: string;
}

/**
 * Submits an anonymous student response.
 * STRICT IDENTITY SEPARATION:
 * - Student ID is recorded ONLY in the detached participation table to prevent duplicates.
 * - The response record itself has ZERO student identifiers (no name, no roll no, no email, no ID).
 */
export async function submitAnonymousResponse(
  input: SubmitResponseInput,
  studentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!studentId) return { success: false, error: 'Student authentication required.' };

    const questions = getStored<AnonymousQuestion[]>(QUESTIONS_KEY, []);
    const question = questions.find((q) => q.id === input.question_id);
    if (!question) return { success: false, error: 'Question not found.' };

    if (question.status !== 'active') {
      return { success: false, error: 'This question is closed and no longer accepting responses.' };
    }

    const now = new Date().toISOString();
    if (question.closing_date && question.closing_date < now) {
      return { success: false, error: 'This question has expired.' };
    }

    // Check duplicate
    if (hasStudentParticipated(input.question_id, studentId)) {
      return { success: false, error: 'You have already submitted an answer to this question.' };
    }

    // Validate answer content
    if (input.question_type === 'single_choice' && !input.selected_option) {
      return { success: false, error: 'Please select an option.' };
    }
    if (
      input.question_type === 'multiple_choice' &&
      (!input.selected_options || input.selected_options.length === 0)
    ) {
      return { success: false, error: 'Please select at least one option.' };
    }
    if (
      input.question_type === 'rating_scale' &&
      (input.rating_value === undefined || input.rating_value < 1)
    ) {
      return { success: false, error: 'Please choose a rating.' };
    }
    if (
      (input.question_type === 'short_answer' || input.question_type === 'student_feedback') &&
      (!input.written_text || !input.written_text.trim())
    ) {
      return { success: false, error: 'Please write your response.' };
    }

    const responseId = `resp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // 1. Save Anonymous Response (STRICTLY NO STUDENT IDENTIFIER)
    const anonymousResponse: AnonymousResponse = {
      id: responseId,
      question_id: input.question_id,
      subject_id: input.subject_id,
      question_type: input.question_type,
      selected_option: input.selected_option,
      selected_options: input.selected_options,
      rating_value: input.rating_value,
      written_text: input.written_text?.trim(),
      created_at: now,
    };

    const responses = getStored<AnonymousResponse[]>(RESPONSES_KEY, []);
    responses.push(anonymousResponse);
    setStored(RESPONSES_KEY, responses);

    // 2. Save Detached Participation (Prevents duplicate answer)
    const participations = getStored<PollParticipation[]>(PARTICIPATIONS_KEY, []);
    participations.push({
      question_id: input.question_id,
      student_id: studentId,
      participated_at: now,
    });
    setStored(PARTICIPATIONS_KEY, participations);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('anonymous_responses').insert(anonymousResponse);
        await supabase.from('poll_participations').insert({
          id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          question_id: input.question_id,
          student_id: studentId,
          participated_at: now,
        });
      } catch (sErr) {
        console.warn('[StudyHub Anonymous] Supabase response insert notice:', sErr);
      }
    }

    dispatchCustomEvent('studyhub_polls_updated');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to submit response.' };
  }
}

/**
 * Computes teacher-facing aggregate response summary:
 * - Option percentages and counts for MCQs.
 * - Rating scale average & distribution.
 * - Shuffled written text answers with NO student names, roll numbers, or submission order.
 * - Enforces minimum threshold privacy shield.
 */
export function getQuestionResponseSummary(questionId: string): QuestionResponseSummary {
  const questions = getStored<AnonymousQuestion[]>(QUESTIONS_KEY, []);
  const question = questions.find((q) => q.id === questionId);
  const responses = getStored<AnonymousResponse[]>(RESPONSES_KEY, []).filter(
    (r) => r.question_id === questionId
  );

  const total = responses.length;
  const minThreshold = question?.min_responses_threshold || 1;
  const isThresholdMet = total >= minThreshold;

  // Initialize return summary
  const summary: QuestionResponseSummary = {
    question_id: questionId,
    total_responses: total,
    is_threshold_met: isThresholdMet,
    min_threshold: minThreshold,
  };

  if (!isThresholdMet) {
    return summary;
  }

  // 1. MCQ Single / Multiple Choice
  if (
    question?.question_type === 'single_choice' ||
    question?.question_type === 'multiple_choice'
  ) {
    const counts: Record<string, number> = {};
    (question.options || []).forEach((opt) => {
      counts[opt] = 0;
    });

    responses.forEach((r) => {
      if (r.selected_option && counts[r.selected_option] !== undefined) {
        counts[r.selected_option]++;
      }
      if (Array.isArray(r.selected_options)) {
        r.selected_options.forEach((opt) => {
          if (counts[opt] !== undefined) counts[opt]++;
        });
      }
    });

    const percentages: Record<string, number> = {};
    Object.keys(counts).forEach((opt) => {
      percentages[opt] = total > 0 ? Math.round((counts[opt] / total) * 100) : 0;
    });

    summary.option_counts = counts;
    summary.option_percentages = percentages;
  }

  // 2. Rating Scale
  if (question?.question_type === 'rating_scale') {
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    let ratedCount = 0;

    responses.forEach((r) => {
      if (r.rating_value && r.rating_value >= 1 && r.rating_value <= 5) {
        distribution[r.rating_value] = (distribution[r.rating_value] || 0) + 1;
        sum += r.rating_value;
        ratedCount++;
      }
    });

    summary.rating_distribution = distribution;
    summary.average_rating = ratedCount > 0 ? parseFloat((sum / ratedCount).toFixed(2)) : 0;
  }

  // 3. Short Written & Student Feedback (SHUFFLED, NO IDS, NO TIMESTAMPS)
  if (
    question?.question_type === 'short_answer' ||
    question?.question_type === 'student_feedback'
  ) {
    const textAnswers = responses
      .map((r) => r.written_text?.trim())
      .filter((t): t is string => Boolean(t && t.length > 0));

    // Fisher-Yates shuffle order so arrival sequence is non-deterministic
    summary.shuffled_text_responses = shuffleArray(textAnswers);
  }

  return summary;
}

/**
 * Closes an active question manually.
 */
export async function closeAnonymousQuestion(
  questionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const questions = getStored<AnonymousQuestion[]>(QUESTIONS_KEY, []);
    const idx = questions.findIndex((q) => q.id === questionId);
    if (idx === -1) return { success: false, error: 'Question not found.' };

    const now = new Date().toISOString();
    questions[idx].status = 'closed';
    questions[idx].closing_date = now;
    questions[idx].updated_at = now;
    setStored(QUESTIONS_KEY, questions);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('anonymous_questions')
          .update({ status: 'closed', closing_date: now, updated_at: now })
          .eq('id', questionId);
      } catch (sErr) {
        console.warn('[StudyHub Anonymous] Supabase question close notice:', sErr);
      }
    }

    dispatchCustomEvent('studyhub_polls_updated');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to close question.' };
  }
}

/**
 * Generates an anonymized export CSV string with zero student identities.
 */
export function exportAnonymizedSummaryCsv(questionId: string): string {
  const questions = getStored<AnonymousQuestion[]>(QUESTIONS_KEY, []);
  const question = questions.find((q) => q.id === questionId);
  if (!question) return '';

  const summary = getQuestionResponseSummary(questionId);
  const rows: string[] = [];

  rows.push(`"Question Title","${question.title.replace(/"/g, '""')}"`);
  rows.push(`"Subject","${(question.subject_name || '').replace(/"/g, '""')}"`);
  rows.push(`"Question Type","${question.question_type}"`);
  rows.push(`"Total Anonymous Responses",${summary.total_responses}`);
  rows.push('');

  if (summary.option_counts && summary.option_percentages) {
    rows.push('"Option","Count","Percentage"');
    Object.keys(summary.option_counts).forEach((opt) => {
      rows.push(
        `"${opt.replace(/"/g, '""')}",${summary.option_counts![opt]},${summary.option_percentages![opt]}%`
      );
    });
  } else if (summary.average_rating !== undefined && summary.rating_distribution) {
    rows.push(`"Average Rating",${summary.average_rating} / 5`);
    rows.push('"Star Rating","Count"');
    Object.keys(summary.rating_distribution).forEach((star) => {
      rows.push(`"${star} Star",${summary.rating_distribution![Number(star)]}`);
    });
  } else if (summary.shuffled_text_responses) {
    rows.push('"Anonymous Response #"');
    summary.shuffled_text_responses.forEach((ans, idx) => {
      rows.push(`"Response ${idx + 1}","${ans.replace(/"/g, '""')}"`);
    });
  }

  return rows.join('\r\n');
}
