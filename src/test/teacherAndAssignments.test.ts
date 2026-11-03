import { describe, it, expect, beforeEach } from 'vitest';
import {
  submitTeacherRegistration,
  getTeacherApplications,
  approveTeacherApplication,
  rejectTeacherApplication,
  getTeacherAssignedSubjects,
  createAssignmentSubmission,
  getStudentSubmissions,
  getTeacherSubmissions,
  saveTeacherTest,
  getTeacherTests,
  generateQuestionTemplateCsv,
  parseQuestionsCsv,
} from '../lib/teacherAssignmentStore';
import { TeacherRegistrationInput } from '../types';

describe('Hammad StudyHub — Teacher Portal & Student Assignment Submissions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Teacher Registration & Admin Approval Workflow', () => {
    it('creates teacher registration in pending approval status', async () => {
      const input: TeacherRegistrationInput = {
        display_name: 'Sir Tariq Mahmood',
        email: 'tariq@studyhub.edu',
        password: 'Password123!',
        phone: '03001234567',
        gender: 'male',
        requested_subject_ids: ['sub-dld-01', 'sub-math-02'],
      };

      const result = await submitTeacherRegistration(input);
      expect(result.success).toBe(true);
      expect(result.application).toBeDefined();
      expect(result.application?.status).toBe('pending');
      expect(result.application?.approved_subject_ids).toEqual([]);

      const all = getTeacherApplications();
      expect(all.length).toBe(1);
      expect(all[0].email).toBe('tariq@studyhub.edu');
    });

    it('prevents duplicate pending teacher applications', async () => {
      const input: TeacherRegistrationInput = {
        display_name: 'Prof. Aisha',
        email: 'aisha@studyhub.edu',
        password: 'Password123!',
        requested_subject_ids: ['sub-eng-01'],
      };

      await submitTeacherRegistration(input);
      const duplicate = await submitTeacherRegistration(input);
      expect(duplicate.success).toBe(false);
      expect(duplicate.error).toContain('already awaiting Administrator approval');
    });

    it('allows Admin to approve application and assign approved subjects', async () => {
      const input: TeacherRegistrationInput = {
        display_name: 'Dr. Zulfiqar',
        email: 'zulfiqar@studyhub.edu',
        password: 'Password123!',
        requested_subject_ids: ['sub-dld-01', 'sub-eng-01'],
      };
      const reg = await submitTeacherRegistration(input);
      const appId = reg.application!.id;

      // Admin approves and assigns subjects
      const approval = await approveTeacherApplication(appId, ['sub-dld-01']);
      expect(approval.success).toBe(true);

      const applications = getTeacherApplications();
      const updated = applications.find((a) => a.id === appId);
      expect(updated?.status).toBe('approved');
      expect(updated?.approved_subject_ids).toEqual(['sub-dld-01']);
    });

    it('allows Admin to reject application with optional reason', async () => {
      const input: TeacherRegistrationInput = {
        display_name: 'Guest Applicant',
        email: 'guest@studyhub.edu',
        password: 'Password123!',
        requested_subject_ids: ['sub-dld-01'],
      };
      const reg = await submitTeacherRegistration(input);
      const rejection = await rejectTeacherApplication(reg.application!.id, 'Incomplete credentials');
      expect(rejection.success).toBe(true);

      const applications = getTeacherApplications();
      expect(applications[0].status).toBe('rejected');
      expect(applications[0].rejection_reason).toBe('Incomplete credentials');
    });
  });

  describe('2. Student Privacy Shield (Section 4.F Protection)', () => {
    it('strictly hides student email, phone, CNIC, and password from Teacher submission views', async () => {
      // Create student submission with sensitive profile info
      await createAssignmentSubmission({
        student_id: 'std-secret-999',
        student_name: 'Usman Ali',
        roll_no: 'CS-2026-042',
        subject_id: 'sub-dld-01',
        subject_name: 'Digital Logic Design',
        title: 'Karnaugh Maps Assignment #2',
        description: 'Completed circuit diagrams for 4-variable K-maps',
        files: [
          {
            id: 'file-01',
            file_name: 'kmap_page1.jpg',
            file_size: '240 KB',
            mime_type: 'image/jpeg',
            file_url: 'data:image/jpeg;base64,mockjpg1234',
          },
        ],
      });

      // Teacher reviews submissions for their assigned subject
      const teacherAssignedSubjects = ['sub-dld-01'];
      const submissions = getTeacherSubmissions(teacherAssignedSubjects);

      expect(submissions.length).toBe(1);
      const sub = submissions[0];

      // Legitimate academic fields present
      expect(sub.student_name).toBe('Usman Ali');
      expect(sub.roll_no).toBe('CS-2026-042');
      expect(sub.subject_name).toBe('Digital Logic Design');
      expect(sub.title).toBe('Karnaugh Maps Assignment #2');
      expect(sub.files.length).toBe(1);
      expect(sub.files[0].file_name).toBe('kmap_page1.jpg');

      // CRITICAL PRIVACY CHECKS: Student private fields must NEVER exist on the object
      expect((sub as any).email).toBeUndefined();
      expect((sub as any).phone).toBeUndefined();
      expect((sub as any).contact_number).toBeUndefined();
      expect((sub as any).cnic).toBeUndefined();
      expect((sub as any).address).toBeUndefined();
      expect((sub as any).password).toBeUndefined();
    });

    it('enforces subject isolation — teachers never see submissions of subjects they do not teach', async () => {
      await createAssignmentSubmission({
        student_id: 'std-101',
        student_name: 'Fatima',
        roll_no: 'CS-2026-015',
        subject_id: 'sub-history-99',
        subject_name: 'Pakistan Studies',
        title: 'Independence Movement Essay',
        files: [
          {
            id: 'file-02',
            file_name: 'essay.pdf',
            file_size: '100 KB',
            mime_type: 'application/pdf',
            file_url: 'data:application/pdf;base64,mock',
          },
        ],
      });

      // Teacher only teaches Digital Logic Design
      const dldTeacherSubmissions = getTeacherSubmissions(['sub-dld-01']);
      expect(dldTeacherSubmissions.length).toBe(0);
    });
  });

  describe('3. Multi-File Handwritten & Document Uploads', () => {
    it('supports multiple photos/documents per assignment submission', async () => {
      const files = [
        { id: 'f-1', file_name: 'diagram_pg1.jpg', file_size: '120 KB', mime_type: 'image/jpeg', file_url: 'data:image/jpeg;base64,1' },
        { id: 'f-2', file_name: 'diagram_pg2.jpg', file_size: '130 KB', mime_type: 'image/jpeg', file_url: 'data:image/jpeg;base64,2' },
        { id: 'f-3', file_name: 'verilog_code.docx', file_size: '45 KB', mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', file_url: 'data:application/docx;base64,3' },
      ];

      const res = await createAssignmentSubmission({
        student_id: 'std-202',
        student_name: 'Hamza Khan',
        roll_no: 'CS-2026-088',
        subject_id: 'sub-dld-01',
        title: 'Verilog Full Adder Implementation',
        files,
      });

      expect(res.success).toBe(true);
      expect(res.submission?.files.length).toBe(3);

      const studentSubs = getStudentSubmissions('std-202');
      expect(studentSubs.length).toBe(1);
      expect(studentSubs[0].files.length).toBe(3);
    });
  });

  describe('4. Test Builder, Question Bank & CSV Bulk Import', () => {
    it('creates test with timing, duration, and question shuffle settings', () => {
      const test = saveTeacherTest({
        id: 'test-101',
        teacher_id: 'teacher-101',
        subject_id: 'sub-dld-01',
        title: 'DLD Midterm Quiz',
        instructions: 'Attempt all 10 questions. Calculator allowed.',
        test_date: '2026-11-10',
        duration_minutes: 30,
        attempts_allowed: 1,
        total_marks: 3,
        shuffle_questions: true,
        shuffle_options: true,
        status: 'published',
        questions: [
          {
            id: 'q-1',
            subject_id: 'sub-dld-01',
            question_type: 'mcq',
            question_text: 'How many select lines does an 8-to-1 multiplexer have?',
            options: ['1', '2', '3', '8'],
            correct_answer: '3',
            marks: 2,
            created_at: new Date().toISOString(),
          },
          {
            id: 'q-2',
            subject_id: 'sub-dld-01',
            question_type: 'true_false',
            question_text: 'A NAND gate is a universal logic gate.',
            correct_answer: 'true',
            marks: 1,
            created_at: new Date().toISOString(),
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      expect(test.id).toBe('test-101');
      expect(test.total_marks).toBe(3);
      expect(test.questions.length).toBe(2);

      const saved = getTeacherTests(undefined, 'sub-dld-01');
      expect(saved.length).toBe(1);
      expect(saved[0].title).toBe('DLD Midterm Quiz');
    });

    it('generates downloadable standard CSV question template', () => {
      const csv = generateQuestionTemplateCsv();
      expect(csv).toContain('Question Type (mcq/true_false/short_answer/descriptive),Question Text');
      expect(csv).toContain('mcq');
      expect(csv).toContain('true_false');
    });

    it('parses bulk CSV questions correctly into structured question objects', () => {
      const csvContent = `Question Type (mcq/true_false/short_answer/descriptive),Question Text,Option A,Option B,Option C,Option D,Correct Answer,Marks,Difficulty,Topic
mcq,What is the base of the hexadecimal number system?,8,10,16,2,16,2,easy,Number Systems
true_false,De Morgan's theorem applies to boolean algebra,True,False,,,True,1,easy,Boolean Algebra
short_answer,Name the circuit used to store 1 bit of memory,,,,,flip-flop,2,medium,Sequential Logic`;

      const result = parseQuestionsCsv(csvContent, 'sub-dld-01');
      expect(result.errors.length).toBe(0);
      expect(result.questions.length).toBe(3);

      expect(result.questions[0].question_type).toBe('mcq');
      expect(result.questions[0].question_text).toBe('What is the base of the hexadecimal number system?');
      expect(result.questions[0].correct_answer).toBe('16');
      expect(result.questions[0].options).toEqual(['8', '10', '16', '2']);

      expect(result.questions[1].question_type).toBe('true_false');
      expect(result.questions[1].correct_answer).toBe('True');

      expect(result.questions[2].question_type).toBe('short_answer');
      expect(result.questions[2].marks).toBe(2);
    });
  });
});
