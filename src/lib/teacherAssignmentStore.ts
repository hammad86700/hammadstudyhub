// ==============================================================================
// HAMMAD STUDYHUB — TEACHER & STUDENT ASSIGNMENT PERSISTENCE ENGINE
// Architect: Muhammad Hammad
//
// Key Responsibilities:
// 1. Teacher Account Application & Admin Approval Workflow.
// 2. Strict Subject-Level Permission Isolation: Teachers only see their assigned subjects.
// 3. Privacy-Shielded Student Submissions: Teachers never see private personal info
//    (email, phone, CNIC, address, passwords) — only Name, Roll No, Subject, and Files.
// 4. Multi-File Handwritten & Document Uploads (Images + PDFs + Office Docs).
// 5. In-App Notifications for Subject Teachers upon Student Submissions.
// 6. Test & Quiz Management + Reusable Question Bank + CSV Bulk Import.
// ==============================================================================

import {
  TeacherApplication,
  TeacherRegistrationInput,
  StudentAssignmentSubmission,
  SubmissionFile,
  TeacherNotification,
  TeacherTest,
  TestQuestion,
  Subject,
  UserProfile,
} from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  getDemoSubjects,
  findStudentByEmail,
  upsertRegisteredStudentLocally,
  RegisteredStudentEntry,
} from './demoStore';

// Storage Keys
const TEACHER_APPLICATIONS_KEY = 'studyhub_teacher_applications_v1';
const SUBMISSIONS_KEY = 'studyhub_assignment_submissions_v1';
const TEACHER_NOTIFICATIONS_KEY = 'studyhub_teacher_notifications_v1';
const TEACHER_TESTS_KEY = 'studyhub_teacher_tests_v1';
const QUESTION_BANK_KEY = 'studyhub_question_bank_v1';

// Helper for LocalStorage
function getStored<T>(key: string, defaultValue: T): T {
  try {
    if (typeof localStorage === 'undefined') return defaultValue;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn(`[StudyHub] Failed reading storage key ${key}:`, e);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    console.warn(`[StudyHub] Failed writing storage key ${key}:`, e);
  }
}

function dispatchCustomEvent(name: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(name));
  }
}

// -----------------------------------------------------------------------------
// 1. TEACHER APPLICATIONS & APPROVAL WORKFLOW
// -----------------------------------------------------------------------------

export function getTeacherApplications(): TeacherApplication[] {
  return getStored<TeacherApplication[]>(TEACHER_APPLICATIONS_KEY, []);
}

export function getTeacherApplicationById(id: string): TeacherApplication | undefined {
  return getTeacherApplications().find((a) => a.id === id || a.teacher_id === id);
}

export function getTeacherApplicationByEmail(email: string): TeacherApplication | undefined {
  const clean = email.trim().toLowerCase();
  return getTeacherApplications().find((a) => a.email.toLowerCase() === clean);
}

/**
 * Registers a new teacher application in Pending Approval state.
 * Prevents immediate teacher access until reviewed and approved by Admin.
 */
export async function submitTeacherRegistration(
  input: TeacherRegistrationInput
): Promise<{ success: boolean; application?: TeacherApplication; error?: string }> {
  try {
    const cleanEmail = input.email.trim().toLowerCase();
    const existing = getTeacherApplicationByEmail(cleanEmail);
    if (existing) {
      if (existing.status === 'pending') {
        return {
          success: false,
          error: 'An application with this email is already awaiting Administrator approval.',
        };
      } else if (existing.status === 'approved') {
        return {
          success: false,
          error: 'This teacher account is already approved. Please sign in directly.',
        };
      }
    }

    const teacherId = `teacher-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const application: TeacherApplication = {
      id: `tapp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      teacher_id: teacherId,
      display_name: input.display_name.trim(),
      email: cleanEmail,
      phone: input.phone?.trim(),
      gender: input.gender || 'male',
      requested_subject_ids: input.requested_subject_ids || [],
      approved_subject_ids: [],
      status: 'pending',
      password: input.password,
      created_at: now,
      updated_at: now,
    };

    // Save locally
    const applications = getTeacherApplications();
    applications.unshift(application);
    setStored(TEACHER_APPLICATIONS_KEY, applications);

    // Save pending teacher user credentials in user registry (STUDENTS_KEY)
    const teacherUserEntry: RegisteredStudentEntry = {
      id: teacherId,
      display_name: input.display_name.trim(),
      email: cleanEmail,
      password: input.password,
      role: 'student', // Stored as student/restricted until Admin explicitly changes to 'teacher'
      gender: input.gender || 'male',
      phone: input.phone?.trim() || '',
      assigned_subject_ids: [],
      teacher_status: 'pending',
      created_at: now,
      updated_at: now,
    };
    upsertRegisteredStudentLocally(teacherUserEntry);

    // Also persist in legacy key for backwards compatibility
    const storedUsers = getStored<any[]>('studyhub_registered_students_v3', []);
    storedUsers.unshift(teacherUserEntry);
    setStored('studyhub_registered_students_v3', storedUsers);

    // Remote sync with Supabase if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from('teacher_applications').upsert({
          id: application.id,
          teacher_id: teacherId,
          display_name: application.display_name,
          email: application.email,
          phone: application.phone || '',
          gender: application.gender,
          requested_subject_ids: application.requested_subject_ids,
          approved_subject_ids: [],
          status: 'pending',
          created_at: now,
          updated_at: now,
        });
      } catch (dbErr) {
        console.warn('[StudyHub] Supabase teacher application sync notice:', dbErr);
      }
    }

    dispatchCustomEvent('studyhub_teacher_applications_updated');
    return { success: true, application };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to submit teacher registration.' };
  }
}

/**
 * Admin Action: Approve teacher application and assign approved subjects
 */
export async function approveTeacherApplication(
  applicationId: string,
  approvedSubjectIds: string[],
  adminId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const applications = getTeacherApplications();
    const appIndex = applications.findIndex((a) => a.id === applicationId);
    if (appIndex === -1) {
      return { success: false, error: 'Application not found.' };
    }

    const app = applications[appIndex];
    const now = new Date().toISOString();
    app.status = 'approved';
    app.approved_subject_ids = approvedSubjectIds;
    app.reviewed_by = adminId || 'Administrator';
    app.updated_at = now;
    applications[appIndex] = app;
    setStored(TEACHER_APPLICATIONS_KEY, applications);

    // Upgrade teacher in user directory
    const existingStudent = findStudentByEmail(app.email);
    const updatedUserEntry: RegisteredStudentEntry = {
      id: existingStudent?.id || app.teacher_id,
      display_name: existingStudent?.display_name || app.display_name,
      email: app.email,
      password: existingStudent?.password || app.password || '',
      role: 'teacher', // Elevated to Teacher
      gender: existingStudent?.gender || app.gender || 'male',
      phone: existingStudent?.phone || app.phone || '',
      assigned_subject_ids: approvedSubjectIds,
      teacher_status: 'approved',
      created_at: existingStudent?.created_at || app.created_at,
      updated_at: now,
    };
    upsertRegisteredStudentLocally(updatedUserEntry);

    // Also upgrade in legacy key 'studyhub_registered_students_v3'
    const storedUsers = getStored<any[]>('studyhub_registered_students_v3', []);
    const userIndex = storedUsers.findIndex(
      (u) => u.id === app.teacher_id || u.email.toLowerCase() === app.email.toLowerCase()
    );
    if (userIndex !== -1) {
      storedUsers[userIndex] = {
        ...storedUsers[userIndex],
        ...updatedUserEntry,
      };
      setStored('studyhub_registered_students_v3', storedUsers);
    } else {
      storedUsers.unshift(updatedUserEntry);
      setStored('studyhub_registered_students_v3', storedUsers);
    }

    // If this teacher is currently signed in, immediately reflect approval in active profile
    try {
      if (typeof localStorage !== 'undefined') {
        const activeStr = localStorage.getItem('studyhub_active_user_v3');
        if (activeStr) {
          const active = JSON.parse(activeStr);
          if (active.email && active.email.toLowerCase() === app.email.toLowerCase()) {
            const updatedActive = {
              ...active,
              role: 'teacher',
              assigned_subject_ids: approvedSubjectIds,
              teacher_status: 'approved',
            };
            localStorage.setItem('studyhub_active_user_v3', JSON.stringify(updatedActive));
          }
        }
      }
    } catch {}

    // Remote sync
    if (isSupabaseConfigured) {
      try {
        await supabase.from('teacher_applications').update({
          status: 'approved',
          approved_subject_ids: approvedSubjectIds,
          reviewed_by: adminId || 'admin',
          updated_at: now,
        }).eq('id', applicationId);

        await supabase.from('registered_students').update({
          role: 'teacher',
          assigned_subject_ids: approvedSubjectIds,
          updated_at: now,
        }).eq('id', app.teacher_id);
      } catch (sErr) {
        console.warn('[StudyHub] Supabase approval update notice:', sErr);
      }
    }

    dispatchCustomEvent('studyhub_teacher_applications_updated');
    dispatchCustomEvent('studyhub_students_updated');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to approve teacher application.' };
  }
}

/**
 * Admin Action: Reject teacher application
 */
export async function rejectTeacherApplication(
  applicationId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const applications = getTeacherApplications();
    const appIndex = applications.findIndex((a) => a.id === applicationId);
    if (appIndex === -1) return { success: false, error: 'Application not found.' };

    const app = applications[appIndex];
    const now = new Date().toISOString();
    app.status = 'rejected';
    app.rejection_reason = reason;
    app.updated_at = now;
    applications[appIndex] = app;
    setStored(TEACHER_APPLICATIONS_KEY, applications);

    const existingStudent = findStudentByEmail(app.email);
    if (existingStudent) {
      upsertRegisteredStudentLocally({
        ...existingStudent,
        role: 'student',
        teacher_status: 'rejected',
        updated_at: now,
      });
    }

    const storedUsers = getStored<any[]>('studyhub_registered_students_v3', []);
    const userIndex = storedUsers.findIndex(
      (u) => u.id === app.teacher_id || u.email.toLowerCase() === app.email.toLowerCase()
    );
    if (userIndex !== -1) {
      storedUsers[userIndex] = {
        ...storedUsers[userIndex],
        role: 'student',
        teacher_status: 'rejected',
        updated_at: now,
      };
      setStored('studyhub_registered_students_v3', storedUsers);
    }

    dispatchCustomEvent('studyhub_teacher_applications_updated');
    dispatchCustomEvent('studyhub_students_updated');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to reject application.' };
  }
}

/**
 * Retrieves the full list of Subjects assigned to a specific teacher
 */
export function getTeacherAssignedSubjects(teacher: UserProfile | null): Subject[] {
  if (!teacher) return [];
  const all = getDemoSubjects();
  if (teacher.role === 'admin') return all; // Admin can see all subjects

  // Look in user profile assigned_subject_ids, or application approved_subject_ids
  let subjectIds = teacher.assigned_subject_ids || [];
  if (subjectIds.length === 0) {
    const app = getTeacherApplicationById(teacher.id) || getTeacherApplicationByEmail(teacher.email);
    if (app?.status === 'approved') {
      subjectIds = app.approved_subject_ids || [];
    }
  }

  return all.filter((s) => subjectIds.includes(s.id) || subjectIds.includes(s.slug));
}

// -----------------------------------------------------------------------------
// 2. STUDENT ASSIGNMENT SUBMISSIONS & PRIVACY PROTECTION
// -----------------------------------------------------------------------------

export function getAllSubmissions(): StudentAssignmentSubmission[] {
  return getStored<StudentAssignmentSubmission[]>(SUBMISSIONS_KEY, []);
}

/**
 * Returns submissions for the logged in student only.
 * Students cannot see submissions of any other student.
 */
export function getStudentSubmissions(studentId: string): StudentAssignmentSubmission[] {
  if (!studentId) return [];
  return getAllSubmissions().filter((s) => s.student_id === studentId);
}

/**
 * Returns submissions for the teacher's assigned subjects only.
 * PRIVACY SHIELD ENFORCED:
 * Completely strips student email, phone, CNIC, and passwords.
 * Only returns: Student Name, Roll Number, Subject, Title, Files, Date, and Review Status.
 */
export function getTeacherSubmissions(
  assignedSubjectIds: string[]
): Omit<StudentAssignmentSubmission, never>[] {
  if (!assignedSubjectIds || assignedSubjectIds.length === 0) return [];

  const all = getAllSubmissions();
  const filtered = all.filter((s) => assignedSubjectIds.includes(s.subject_id));

  // Security & Privacy sanitization
  return filtered.map((sub) => ({
    id: sub.id,
    student_id: sub.student_id,
    student_name: sub.student_name,
    roll_no: sub.roll_no || 'N/A',
    subject_id: sub.subject_id,
    subject_name: sub.subject_name || 'Subject',
    title: sub.title,
    description: sub.description,
    files: sub.files,
    status: sub.status,
    review_feedback: sub.review_feedback,
    review_marks: sub.review_marks,
    reviewed_at: sub.reviewed_at,
    reviewed_by: sub.reviewed_by,
    submitted_at: sub.submitted_at,
    updated_at: sub.updated_at,
  }));
}

/**
 * Creates and saves a new student assignment submission with multi-file support.
 * Automatically sends an in-app notification to the subject's assigned teachers.
 */
export async function createAssignmentSubmission(
  input: Omit<StudentAssignmentSubmission, 'id' | 'status' | 'submitted_at' | 'updated_at'>
): Promise<{ success: boolean; submission?: StudentAssignmentSubmission; error?: string }> {
  try {
    if (!input.student_id) return { success: false, error: 'Student authentication required.' };
    if (!input.subject_id) return { success: false, error: 'Subject selection is required.' };
    if (!input.title || !input.title.trim()) return { success: false, error: 'Assignment title is required.' };
    if (!input.files || input.files.length === 0) return { success: false, error: 'At least one file must be uploaded.' };

    const now = new Date().toISOString();
    const submissionId = `subm-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const submission: StudentAssignmentSubmission = {
      ...input,
      id: submissionId,
      status: 'submitted',
      submitted_at: now,
      updated_at: now,
    };

    // Save to local submissions registry
    const all = getAllSubmissions();
    all.unshift(submission);
    setStored(SUBMISSIONS_KEY, all);

    // Identify teachers assigned to this subject & generate notifications
    createNotificationsForSubjectTeachers(submission);

    // Dual-write to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from('student_assignment_submissions').insert({
          id: submission.id,
          student_id: submission.student_id,
          student_name: submission.student_name,
          roll_no: submission.roll_no,
          subject_id: submission.subject_id,
          subject_name: submission.subject_name,
          title: submission.title,
          description: submission.description || '',
          files: submission.files,
          status: 'submitted',
          submitted_at: now,
          updated_at: now,
        });
      } catch (dbErr) {
        console.warn('[StudyHub] Supabase assignment submission insert notice:', dbErr);
      }
    }

    dispatchCustomEvent('studyhub_assignment_submissions_updated');
    return { success: true, submission };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to submit assignment.' };
  }
}

/**
 * Teacher Action: Review a student submission with feedback and optional marks
 */
export async function reviewAssignmentSubmission(
  submissionId: string,
  feedback: string,
  marks?: string,
  reviewerName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const all = getAllSubmissions();
    const idx = all.findIndex((s) => s.id === submissionId);
    if (idx === -1) return { success: false, error: 'Submission not found.' };

    const now = new Date().toISOString();
    all[idx] = {
      ...all[idx],
      status: 'reviewed',
      review_feedback: feedback.trim(),
      review_marks: marks?.trim() || undefined,
      reviewed_at: now,
      reviewed_by: reviewerName || 'Subject Teacher',
      updated_at: now,
    };

    setStored(SUBMISSIONS_KEY, all);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('student_assignment_submissions').update({
          status: 'reviewed',
          review_feedback: feedback.trim(),
          review_marks: marks?.trim() || null,
          reviewed_at: now,
          reviewed_by: reviewerName || 'Subject Teacher',
          updated_at: now,
        }).eq('id', submissionId);
      } catch (sErr) {
        console.warn('[StudyHub] Supabase review update notice:', sErr);
      }
    }

    dispatchCustomEvent('studyhub_assignment_submissions_updated');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update review.' };
  }
}

// -----------------------------------------------------------------------------
// 3. TEACHER NOTIFICATIONS
// -----------------------------------------------------------------------------

export function getTeacherNotifications(teacherId: string): TeacherNotification[] {
  if (!teacherId) return [];
  const all = getStored<TeacherNotification[]>(TEACHER_NOTIFICATIONS_KEY, []);
  return all.filter((n) => n.teacher_id === teacherId);
}

export function markTeacherNotificationRead(notificationId: string): void {
  const all = getStored<TeacherNotification[]>(TEACHER_NOTIFICATIONS_KEY, []);
  const updated = all.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
  setStored(TEACHER_NOTIFICATIONS_KEY, updated);
  dispatchCustomEvent('studyhub_teacher_notifications_updated');
}

export function markAllTeacherNotificationsRead(teacherId: string): void {
  const all = getStored<TeacherNotification[]>(TEACHER_NOTIFICATIONS_KEY, []);
  const updated = all.map((n) => (n.teacher_id === teacherId ? { ...n, read: true } : n));
  setStored(TEACHER_NOTIFICATIONS_KEY, updated);
  dispatchCustomEvent('studyhub_teacher_notifications_updated');
}

export function getTeacherUnreadNotificationCount(teacherId: string): number {
  return getTeacherNotifications(teacherId).filter((n) => !n.read).length;
}

function createNotificationsForSubjectTeachers(submission: StudentAssignmentSubmission): void {
  try {
    const applications = getTeacherApplications().filter((a) => a.status === 'approved');
    const teachers = getStored<any[]>('studyhub_registered_students_v3', []).filter((u) => u.role === 'teacher');

    const matchingTeacherIds = new Set<string>();

    applications.forEach((app) => {
      if (app.approved_subject_ids?.includes(submission.subject_id)) {
        matchingTeacherIds.add(app.teacher_id);
      }
    });

    teachers.forEach((t) => {
      if (t.assigned_subject_ids?.includes(submission.subject_id)) {
        matchingTeacherIds.add(t.id);
      }
    });

    if (matchingTeacherIds.size === 0) return;

    const allNotifications = getStored<TeacherNotification[]>(TEACHER_NOTIFICATIONS_KEY, []);
    const now = new Date().toISOString();

    matchingTeacherIds.forEach((tId) => {
      allNotifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        teacher_id: tId,
        submission_id: submission.id,
        student_name: submission.student_name,
        roll_no: submission.roll_no || 'N/A',
        subject_id: submission.subject_id,
        subject_name: submission.subject_name || 'Subject',
        assignment_title: submission.title,
        submission_time: submission.submitted_at || now,
        read: false,
        created_at: now,
      });
    });

    setStored(TEACHER_NOTIFICATIONS_KEY, allNotifications);
    dispatchCustomEvent('studyhub_teacher_notifications_updated');
  } catch (e) {
    console.warn('[StudyHub] Notification generation notice:', e);
  }
}

// -----------------------------------------------------------------------------
// 4. TESTS, QUIZZES & QUESTION BANK
// -----------------------------------------------------------------------------

export function getTeacherTests(teacherId?: string, subjectId?: string): TeacherTest[] {
  let all = getStored<TeacherTest[]>(TEACHER_TESTS_KEY, []);
  if (teacherId) all = all.filter((t) => t.teacher_id === teacherId);
  if (subjectId) all = all.filter((t) => t.subject_id === subjectId);
  return all;
}

export function saveTeacherTest(test: TeacherTest): TeacherTest {
  const all = getTeacherTests();
  const existingIdx = all.findIndex((t) => t.id === test.id);
  const now = new Date().toISOString();

  if (existingIdx !== -1) {
    all[existingIdx] = { ...test, updated_at: now };
  } else {
    all.unshift({ ...test, created_at: test.created_at || now, updated_at: now });
  }

  setStored(TEACHER_TESTS_KEY, all);
  dispatchCustomEvent('studyhub_teacher_tests_updated');
  return test;
}

export function deleteTeacherTest(testId: string): void {
  const all = getTeacherTests().filter((t) => t.id !== testId);
  setStored(TEACHER_TESTS_KEY, all);
  dispatchCustomEvent('studyhub_teacher_tests_updated');
}

export function getQuestionBank(subjectId?: string): TestQuestion[] {
  let all = getStored<TestQuestion[]>(QUESTION_BANK_KEY, []);
  if (subjectId) all = all.filter((q) => q.subject_id === subjectId);
  return all;
}

export function saveQuestionBankItem(question: TestQuestion): TestQuestion {
  const all = getQuestionBank();
  const existingIdx = all.findIndex((q) => q.id === question.id);
  if (existingIdx !== -1) {
    all[existingIdx] = question;
  } else {
    all.unshift(question);
  }
  setStored(QUESTION_BANK_KEY, all);
  dispatchCustomEvent('studyhub_question_bank_updated');
  return question;
}

/**
 * Standard CSV Template generator for Bulk Question Import
 */
export function generateQuestionTemplateCsv(): string {
  const headers = [
    'Question Type (mcq/true_false/short_answer/descriptive)',
    'Question Text',
    'Option A',
    'Option B',
    'Option C',
    'Option D',
    'Correct Answer',
    'Marks',
    'Difficulty (easy/medium/hard)',
    'Topic or Chapter',
  ].join(',');

  const sampleRows = [
    'mcq,"What logic gate outputs 1 only when all inputs are 1?",AND,OR,NOT,XOR,AND,2,easy,"Chapter 2: Logic Gates"',
    'true_false,"A NAND gate is an inverted AND gate.",True,False,,,True,1,easy,"Chapter 2: Logic Gates"',
    'short_answer,"State De Morgan\'s First Theorem.",,,,,(A+B)\'=A\'.B\',3,medium,"Chapter 3: Boolean Algebra"',
    'descriptive,"Explain the operation of a Master-Slave J-K Flip Flop with truth table.",,,,,Descriptive,5,hard,"Chapter 5: Sequential Circuits"',
  ].join('\n');

  return `${headers}\n${sampleRows}\n`;
}

/**
 * Parses and validates uploaded CSV question file
 */
export function parseQuestionsCsv(
  csvContent: string,
  subjectId: string
): { questions: TestQuestion[]; errors: string[] } {
  const questions: TestQuestion[] = [];
  const errors: string[] = [];

  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) {
    errors.push('The file appears to be empty or contains only headers.');
    return { questions, errors };
  }

  // Helper for CSV row parsing with quote handling
  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Skip header row
  for (let idx = 1; idx < lines.length; idx++) {
    const row = parseRow(lines[idx]);
    if (row.length < 2 || !row[0]) continue;

    const rawType = (row[0] || '').toLowerCase().trim();
    let qType: TestQuestion['question_type'] = 'mcq';
    if (rawType.includes('true') || rawType.includes('false')) qType = 'true_false';
    else if (rawType.includes('short')) qType = 'short_answer';
    else if (rawType.includes('desc')) qType = 'descriptive';
    else qType = 'mcq';

    const questionText = row[1];
    if (!questionText) {
      errors.push(`Row ${idx + 1}: Question text is missing.`);
      continue;
    }

    const optA = row[2] || '';
    const optB = row[3] || '';
    const optC = row[4] || '';
    const optD = row[5] || '';
    const correctAnswer = row[6] || '';
    const marks = parseInt(row[7] || '2', 10) || 2;
    const rawDiff = (row[8] || 'medium').toLowerCase();
    const difficulty: TestQuestion['difficulty'] =
      rawDiff.includes('easy') ? 'easy' : rawDiff.includes('hard') ? 'hard' : 'medium';
    const topic = row[9] || '';

    const options: string[] = [];
    if (qType === 'mcq') {
      if (optA) options.push(optA);
      if (optB) options.push(optB);
      if (optC) options.push(optC);
      if (optD) options.push(optD);
      if (options.length < 2) {
        errors.push(`Row ${idx + 1}: Multiple Choice question requires at least 2 options.`);
        continue;
      }
    } else if (qType === 'true_false') {
      options.push('True', 'False');
    }

    questions.push({
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      subject_id: subjectId,
      chapter: topic,
      topic,
      question_type: qType,
      question_text: questionText,
      options: options.length > 0 ? options : undefined,
      correct_answer: correctAnswer || (options[0] || 'Answer'),
      marks,
      difficulty,
      created_at: new Date().toISOString(),
    });
  }

  return { questions, errors };
}

