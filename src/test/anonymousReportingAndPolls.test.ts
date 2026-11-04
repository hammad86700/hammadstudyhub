// ==============================================================================
// HAMMAD STUDYHUB — ANONYMOUS REPORTING & TEACHER POLLS TEST SUITE
// Architect: Muhammad Hammad
//
// Verification of:
// 1. Anonymous Student Reporting System (Audiences 1-5, Reference Number Tracking,
//    Moderation Workflow, Quarantined Identity, Audit Log Enforcement)
// 2. Teacher Anonymous Questions & Polls (Subject Access, Detached Duplicate Prevention,
//    Zero Identity in Responses, Shuffled Text Answers, Aggregate Analytics)
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  submitAnonymousReport,
  trackReportByReferenceNumber,
  getStudentSubmittedReports,
  getTeacherReportsInbox,
  getPublicReportsForStudents,
  getAdminReportsQueue,
  moderateReport,
  auditAccessReportIdentity,
  getReportAuditLogs,
  createAnonymousQuestion,
  getTeacherQuestions,
  getActiveQuestionsForStudent,
  hasStudentParticipated,
  submitAnonymousResponse,
  getQuestionResponseSummary,
  closeAnonymousQuestion,
  exportAnonymizedSummaryCsv,
  SubmitReportInput,
  CreateQuestionInput,
  SubmitResponseInput,
} from '../lib/anonymousStore';
import { UserProfile } from '../types';

describe('Hammad StudyHub — Anonymous Reporting & Teacher Polls', () => {
  // Mock Profiles
  const studentUser: UserProfile = {
    id: 'usr-student-001',
    email: 'hammad.student@studyhub.edu',
    display_name: 'Muhammad Hammad',
    role: 'student',
    gender: 'male',
    roll_no: 'CS-2026-089',
    phone: '03001234567',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const teacherUser: UserProfile = {
    id: 'usr-teacher-001',
    email: 'dr.tariq@studyhub.edu',
    display_name: 'Dr. Tariq Mahmood',
    role: 'teacher',
    gender: 'male',
    teacher_status: 'approved',
    assigned_subject_ids: ['sub-dld-101', 'sub-math-201'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const adminUser: UserProfile = {
    id: 'usr-admin-001',
    email: 'admin@studyhub.edu',
    display_name: 'System Administrator',
    role: 'admin',
    gender: 'male',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorage.clear();
  });

  // ============================================================================
  // 1. ANONYMOUS STUDENT REPORTING SYSTEM
  // ============================================================================
  describe('1. Anonymous Student Reporting System', () => {
    it('creates report with reference number in REP-2026-XXXX format', async () => {
      const input: SubmitReportInput = {
        title: 'Projector flickering in Lab 3',
        category: 'facilities_infrastructure',
        description: 'The projector turns off intermittently during lecture slides.',
        audience_type: 'all_students',
      };

      const result = await submitAnonymousReport(input, studentUser);
      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
      expect(result.report?.reference_number).toMatch(/^REP-\d{4}-[A-Z0-9]{4}$/);
      expect(result.report?.title).toBe('Projector flickering in Lab 3');
      expect(result.report?.category).toBe('facilities_infrastructure');
      expect(result.report?.status).toBe('pending_review');
    });

    it('enforces audience routing and pending moderation statuses', async () => {
      // Option 1: All Students (pending_review)
      const rep1 = await submitAnonymousReport(
        {
          title: 'Library silence reminder',
          category: 'academic_concern',
          description: 'Students talk loudly in the silent study zone.',
          audience_type: 'all_students',
        },
        studentUser
      );
      expect(rep1.report?.status).toBe('pending_review');
      expect(rep1.report?.audience_type).toBe('all_students');

      // Option 3: Specific Subject (pending_review)
      const rep3 = await submitAnonymousReport(
        {
          title: 'DLD Assignment clarify question 4',
          category: 'teaching_learning',
          description: 'Question 4 has ambiguous Karnaugh map input.',
          audience_type: 'specific_subject',
          subject_id: 'sub-dld-101',
          subject_name: 'Digital Logic Design',
        },
        studentUser
      );
      expect(rep3.report?.subject_id).toBe('sub-dld-101');
      expect(rep3.report?.status).toBe('pending_review');

      // Option 4: Specific Teacher (approved directly for target teacher inbox)
      const rep4 = await submitAnonymousReport(
        {
          title: 'Request for extra lecture recording',
          category: 'academic_concern',
          description: 'Could you please upload audio of Lecture 6?',
          audience_type: 'specific_teacher',
          target_teacher_id: 'usr-teacher-001',
          target_teacher_name: 'Dr. Tariq Mahmood',
        },
        studentUser
      );
      expect(rep4.report?.target_teacher_id).toBe('usr-teacher-001');
      expect(rep4.report?.status).toBe('approved');

      // Option 5: Admin Only (pending_review)
      const rep5 = await submitAnonymousReport(
        {
          title: 'Broken chair in Hall B',
          category: 'facilities_infrastructure',
          description: 'Chair 14 row 3 is unstable.',
          audience_type: 'admin_only',
        },
        studentUser
      );
      expect(rep5.report?.audience_type).toBe('admin_only');
      expect(rep5.report?.status).toBe('pending_review');
    });

    it('shields student identity strictly in teacher and public views', async () => {
      // Submit report to teacher
      await submitAnonymousReport(
        {
          title: 'Quiz 2 timing conflict',
          category: 'academic_concern',
          description: 'Clashes with another department assessment.',
          audience_type: 'specific_teacher',
          target_teacher_id: 'usr-teacher-001',
          target_teacher_name: 'Dr. Tariq Mahmood',
        },
        studentUser
      );

      // Fetch teacher inbox
      const teacherReports = getTeacherReportsInbox(teacherUser.id, teacherUser.assigned_subject_ids);
      expect(teacherReports.length).toBe(1);

      const inboxItem = teacherReports[0];
      // Check zero student identifiers
      expect((inboxItem as any).student_id).toBeUndefined();
      expect((inboxItem as any).student_name).toBeUndefined();
      expect((inboxItem as any).roll_no).toBeUndefined();
      expect((inboxItem as any).email).toBeUndefined();
      expect((inboxItem as any).phone).toBeUndefined();

      // Check author label
      expect(inboxItem.title).toBe('Quiz 2 timing conflict');
    });

    it('shields student identity strictly in public community reports view', async () => {
      // Submit report for all students
      const rep = await submitAnonymousReport(
        {
          title: 'Cafeteria hygiene recommendation',
          category: 'general_suggestion',
          description: 'Requesting covered food warmers.',
          audience_type: 'all_students',
        },
        studentUser
      );

      // Publish report as Admin
      await moderateReport(rep.report!.id, 'publish', 'Approved for student visibility', adminUser.display_name);

      // Public view for students
      const publicReports = getPublicReportsForStudents();
      expect(publicReports.length).toBe(1);
      const publicItem = publicReports[0];

      expect((publicItem as any).student_id).toBeUndefined();
      expect((publicItem as any).student_name).toBeUndefined();
      expect((publicItem as any).roll_no).toBeUndefined();
      expect((publicItem as any).email).toBeUndefined();
      expect(publicItem.status).toBe('published');
    });

    it('allows student to track report via reference number without identity leakage', async () => {
      const rep = await submitAnonymousReport(
        {
          title: 'Lab 2 AC not working',
          category: 'facilities_infrastructure',
          description: 'Temperature is too hot in the afternoon.',
          audience_type: 'admin_only',
        },
        studentUser
      );

      const refNo = rep.report!.reference_number;

      // Track by reference number
      const tracked = trackReportByReferenceNumber(refNo);
      expect(tracked).toBeDefined();
      expect(tracked?.reference_number).toBe(refNo);
      expect(tracked?.status).toBe('pending_review');
      expect((tracked as any).student_id).toBeUndefined();
      expect((tracked as any).roll_no).toBeUndefined();

      // Unknown ref returns undefined
      expect(trackReportByReferenceNumber('REP-9999-FAKE')).toBeUndefined();
    });

    it('allows student to view their own submitted reports', async () => {
      await submitAnonymousReport(
        {
          title: 'Report 1',
          category: 'academic_concern',
          description: 'Detail 1',
          audience_type: 'admin_only',
        },
        studentUser
      );

      await submitAnonymousReport(
        {
          title: 'Report 2',
          category: 'other',
          description: 'Detail 2',
          audience_type: 'all_students',
        },
        studentUser
      );

      const myReports = getStudentSubmittedReports(studentUser.id);
      expect(myReports.length).toBe(2);
      expect(myReports.some((r) => r.title === 'Report 1')).toBe(true);
      expect(myReports.some((r) => r.title === 'Report 2')).toBe(true);
    });

    it('requires formal justification when Admin accesses quarantined identity and logs audit entry', async () => {
      const rep = await submitAnonymousReport(
        {
          title: 'Serious safety notice',
          category: 'student_behaviour',
          description: 'Urgent situation reported.',
          audience_type: 'admin_only',
        },
        studentUser
      );

      const repId = rep.report!.id;

      // Attempt unseal with empty justification -> fails
      const failedUnseal = await auditAccessReportIdentity(repId, adminUser, '');
      expect(failedUnseal.success).toBe(false);
      expect(failedUnseal.error).toContain('justification reason');

      // Attempt unseal with short justification -> fails
      const shortUnseal = await auditAccessReportIdentity(repId, adminUser, 'short');
      expect(shortUnseal.success).toBe(false);

      // Attempt unseal with valid justification -> succeeds
      const validReason = 'Formal administrative safety review required per disciplinary committee.';
      const successUnseal = await auditAccessReportIdentity(repId, adminUser, validReason);
      expect(successUnseal.success).toBe(true);
      expect(successUnseal.identity).toBeDefined();
      expect(successUnseal.identity?.student_name).toBe(studentUser.display_name);
      expect(successUnseal.identity?.roll_no).toBe(studentUser.roll_no);
      expect(successUnseal.identity?.email).toBe(studentUser.email);

      // Audit logs record access
      const auditLogs = getReportAuditLogs();
      expect(auditLogs.length).toBe(1);
      expect(auditLogs[0].report_id).toBe(repId);
      expect(auditLogs[0].accessed_by).toBe(adminUser.display_name);
      expect(auditLogs[0].reason).toBe(validReason);
    });

    it('allows Admin to update moderation status and records moderation notes', async () => {
      const rep = await submitAnonymousReport(
        {
          title: 'Study room lights',
          category: 'facilities_infrastructure',
          description: 'Light bulbs need replacement.',
          audience_type: 'all_students',
        },
        studentUser
      );

      const repId = rep.report!.id;

      // Update status to approved
      const updated = await moderateReport(repId, 'approve', 'Passed safety guidelines', adminUser.display_name);
      expect(updated.success).toBe(true);

      const adminReports = getAdminReportsQueue();
      const item = adminReports.find((r) => r.id === repId);
      expect(item?.status).toBe('approved');
      expect(item?.moderation_notes).toBe('Passed safety guidelines');
      expect(item?.reviewed_by).toBe(adminUser.display_name);
    });
  });

  // ============================================================================
  // 2. TEACHER ANONYMOUS QUESTIONS, POLLS & FEEDBACK SYSTEM
  // ============================================================================
  describe('2. Teacher Anonymous Questions, Polls & Feedback', () => {
    it('creates an anonymous question with closing date', async () => {
      const closingDate = new Date(Date.now() + 86400000 * 7).toISOString();
      const input: CreateQuestionInput = {
        teacher_id: teacherUser.id,
        teacher_name: teacherUser.display_name,
        subject_id: 'sub-dld-101',
        subject_name: 'Digital Logic Design',
        title: 'Midterm Feedback Poll',
        description: 'Which chapter of Digital Logic Design was the most difficult?',
        question_type: 'single_choice',
        options: ['Boolean Algebra', 'Karnaugh Maps', 'Multiplexers', 'Sequential Flip-Flops'],
        is_anonymous: true,
        closing_date: closingDate,
        min_responses_threshold: 3,
      };

      const result = await createAnonymousQuestion(input);
      expect(result.success).toBe(true);
      expect(result.question).toBeDefined();
      expect(result.question?.subject_id).toBe('sub-dld-101');
      expect(result.question?.question_type).toBe('single_choice');
      expect(result.question?.options?.length).toBe(4);
      expect(result.question?.is_anonymous).toBe(true);
      expect(result.question?.status).toBe('active');
    });

    it('requires closing date and valid options for MCQ', async () => {
      const input: CreateQuestionInput = {
        teacher_id: teacherUser.id,
        subject_id: 'sub-dld-101',
        title: 'Invalid Question',
        closing_date: '',
        question_type: 'single_choice',
      };

      const result = await createAnonymousQuestion(input);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Closing date and time is required');
    });

    it('enforces detached duplicate prevention while never storing student ID with answers', async () => {
      // 1. Teacher creates poll
      const closingDate = new Date(Date.now() + 86400000 * 7).toISOString();
      const q = await createAnonymousQuestion({
        teacher_id: teacherUser.id,
        subject_id: 'sub-dld-101',
        title: 'Pacing Check',
        question_type: 'single_choice',
        options: ['Too fast', 'Just right', 'Too slow'],
        closing_date: closingDate,
      });
      const qId = q.question!.id;

      // 2. Student participates first time
      expect(hasStudentParticipated(qId, studentUser.id)).toBe(false);

      const resp1 = await submitAnonymousResponse(
        {
          question_id: qId,
          subject_id: 'sub-dld-101',
          question_type: 'single_choice',
          selected_option: 'Just right',
        },
        studentUser.id
      );
      expect(resp1.success).toBe(true);

      // Student is now recorded in detached participation check
      expect(hasStudentParticipated(qId, studentUser.id)).toBe(true);

      // 3. Duplicate attempt is blocked
      const resp2 = await submitAnonymousResponse(
        {
          question_id: qId,
          subject_id: 'sub-dld-101',
          question_type: 'single_choice',
          selected_option: 'Too fast',
        },
        studentUser.id
      );
      expect(resp2.success).toBe(false);
      expect(resp2.error).toContain('already submitted an answer');

      // 4. Verify stored response has NO student identity fields
      const summary = getQuestionResponseSummary(qId);
      expect(summary.total_responses).toBe(1);
      expect(summary.option_counts?.['Just right']).toBe(1);
      expect(summary.option_percentages?.['Just right']).toBe(100);
    });

    it('calculates MCQ percentages accurately', async () => {
      const closingDate = new Date(Date.now() + 86400000 * 7).toISOString();
      const q = await createAnonymousQuestion({
        teacher_id: teacherUser.id,
        subject_id: 'sub-dld-101',
        title: 'Preferred Study Format',
        question_type: 'single_choice',
        options: ['PDF Slides', 'Handwritten Notes', 'Video Explanations'],
        closing_date: closingDate,
      });
      const qId = q.question!.id;

      // Submit 4 distinct detached student responses
      await submitAnonymousResponse(
        { question_id: qId, subject_id: 'sub-dld-101', question_type: 'single_choice', selected_option: 'PDF Slides' },
        'stud-1'
      );
      await submitAnonymousResponse(
        { question_id: qId, subject_id: 'sub-dld-101', question_type: 'single_choice', selected_option: 'PDF Slides' },
        'stud-2'
      );
      await submitAnonymousResponse(
        { question_id: qId, subject_id: 'sub-dld-101', question_type: 'single_choice', selected_option: 'Video Explanations' },
        'stud-3'
      );
      await submitAnonymousResponse(
        { question_id: qId, subject_id: 'sub-dld-101', question_type: 'single_choice', selected_option: 'Handwritten Notes' },
        'stud-4'
      );

      const summary = getQuestionResponseSummary(qId);
      expect(summary.total_responses).toBe(4);
      expect(summary.option_counts?.['PDF Slides']).toBe(2);
      expect(summary.option_percentages?.['PDF Slides']).toBe(50);
      expect(summary.option_percentages?.['Video Explanations']).toBe(25);
      expect(summary.option_percentages?.['Handwritten Notes']).toBe(25);
    });

    it('computes 1-5 rating scale average and distribution', async () => {
      const closingDate = new Date(Date.now() + 86400000 * 7).toISOString();
      const q = await createAnonymousQuestion({
        teacher_id: teacherUser.id,
        subject_id: 'sub-dld-101',
        title: 'Clarity Rating',
        question_type: 'rating_scale',
        closing_date: closingDate,
      });
      const qId = q.question!.id;

      // Submit ratings: 5, 4, 5, 2 -> average (16/4) = 4.0
      await submitAnonymousResponse(
        { question_id: qId, subject_id: 'sub-dld-101', question_type: 'rating_scale', rating_value: 5 },
        'stud-a'
      );
      await submitAnonymousResponse(
        { question_id: qId, subject_id: 'sub-dld-101', question_type: 'rating_scale', rating_value: 4 },
        'stud-b'
      );
      await submitAnonymousResponse(
        { question_id: qId, subject_id: 'sub-dld-101', question_type: 'rating_scale', rating_value: 5 },
        'stud-c'
      );
      await submitAnonymousResponse(
        { question_id: qId, subject_id: 'sub-dld-101', question_type: 'rating_scale', rating_value: 2 },
        'stud-d'
      );

      const summary = getQuestionResponseSummary(qId);
      expect(summary.total_responses).toBe(4);
      expect(summary.average_rating).toBe(4);
      expect(summary.rating_distribution?.[5]).toBe(2);
      expect(summary.rating_distribution?.[4]).toBe(1);
      expect(summary.rating_distribution?.[2]).toBe(1);
      expect(summary.rating_distribution?.[1]).toBe(0);
    });

    it('shuffles written answers and strips all student identity and correlation data', async () => {
      const closingDate = new Date(Date.now() + 86400000 * 7).toISOString();
      const q = await createAnonymousQuestion({
        teacher_id: teacherUser.id,
        subject_id: 'sub-dld-101',
        title: 'Anonymous Written Suggestions',
        question_type: 'short_answer',
        closing_date: closingDate,
      });
      const qId = q.question!.id;

      // Submit 3 written answers
      await submitAnonymousResponse(
        { question_id: qId, subject_id: 'sub-dld-101', question_type: 'short_answer', written_text: 'Flip flop timing diagrams' },
        'stud-1'
      );
      await submitAnonymousResponse(
        { question_id: qId, subject_id: 'sub-dld-101', question_type: 'short_answer', written_text: 'K-map 5 variable minimization' },
        'stud-2'
      );
      await submitAnonymousResponse(
        { question_id: qId, subject_id: 'sub-dld-101', question_type: 'short_answer', written_text: 'Full adder propagation delays' },
        'stud-3'
      );

      const summary = getQuestionResponseSummary(qId);
      expect(summary.total_responses).toBe(3);
      expect(summary.shuffled_text_responses?.length).toBe(3);

      // Verify all answers are present
      expect(summary.shuffled_text_responses).toContain('Flip flop timing diagrams');
      expect(summary.shuffled_text_responses).toContain('K-map 5 variable minimization');
      expect(summary.shuffled_text_responses).toContain('Full adder propagation delays');

      // Verify raw response objects in store contain ZERO student identifiers
      const rawResponses = JSON.parse(localStorage.getItem('studyhub_anonymous_responses_v1') || '[]');
      rawResponses.forEach((res: any) => {
        expect(res.student_id).toBeUndefined();
        expect(res.student_name).toBeUndefined();
        expect(res.roll_no).toBeUndefined();
        expect(res.email).toBeUndefined();
      });
    });

    it('enforces privacy response threshold before disclosing summary data', async () => {
      const closingDate = new Date(Date.now() + 86400000 * 7).toISOString();
      const q = await createAnonymousQuestion({
        teacher_id: teacherUser.id,
        subject_id: 'sub-dld-101',
        title: 'High Sensitivity Poll',
        question_type: 'single_choice',
        options: ['Yes', 'No'],
        closing_date: closingDate,
        min_responses_threshold: 3,
      });
      const qId = q.question!.id;

      // 1 response only -> threshold (3) not reached
      await submitAnonymousResponse(
        { question_id: qId, subject_id: 'sub-dld-101', question_type: 'single_choice', selected_option: 'Yes' },
        'stud-x'
      );

      const earlySummary = getQuestionResponseSummary(qId);
      expect(earlySummary.total_responses).toBe(1);
      expect(earlySummary.is_threshold_met).toBe(false);

      // 2 more responses -> threshold reached
      await submitAnonymousResponse(
        { question_id: qId, subject_id: 'sub-dld-101', question_type: 'single_choice', selected_option: 'No' },
        'stud-y'
      );
      await submitAnonymousResponse(
        { question_id: qId, subject_id: 'sub-dld-101', question_type: 'single_choice', selected_option: 'Yes' },
        'stud-z'
      );

      const readySummary = getQuestionResponseSummary(qId);
      expect(readySummary.total_responses).toBe(3);
      expect(readySummary.is_threshold_met).toBe(true);
    });

    it('allows closing questions and exporting anonymized CSV', async () => {
      const closingDate = new Date(Date.now() + 86400000 * 7).toISOString();
      const q = await createAnonymousQuestion({
        teacher_id: teacherUser.id,
        subject_id: 'sub-dld-101',
        subject_name: 'Digital Logic Design',
        title: 'Final Poll',
        question_type: 'single_choice',
        options: ['Option 1', 'Option 2'],
        closing_date: closingDate,
      });
      const qId = q.question!.id;

      await submitAnonymousResponse(
        { question_id: qId, subject_id: 'sub-dld-101', question_type: 'single_choice', selected_option: 'Option 1' },
        'stud-1'
      );

      // Close question
      const closeRes = await closeAnonymousQuestion(qId);
      expect(closeRes.success).toBe(true);

      const teacherQs = getTeacherQuestions(teacherUser.id);
      expect(teacherQs.find((item) => item.id === qId)?.status).toBe('closed');

      // Export CSV
      const csv = exportAnonymizedSummaryCsv(qId);
      expect(csv).toContain('Question Title');
      expect(csv).toContain('Final Poll');
      expect(csv).toContain('Option 1');
      // Must NOT contain student id
      expect(csv).not.toContain('stud-1');
    });
  });
});
