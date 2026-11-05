// ==============================================================================
// HAMMAD STUDYHUB — TEACHER ACCESS CONTROL & REAL-TIME NOTIFICATIONS TEST SUITE
// Tests all 9 Core Scenarios required by the Master Specification:
// 1. Teacher Login Redirect Target & Approved Roles
// 2. Multiple Assigned Subjects Access
// 3. Test Published Notification (Published triggers alert; Drafts NEVER trigger)
// 4. Anonymous Poll Notification & Real-Time Response Counter Updates
// 5. Anonymous Report Notification with ZERO Student Identity
// 6. Subject-Isolated Report Notifications (Only assigned teachers receive alert)
// 7. Assignment Submission Notifications to Subject Teachers
// 8. Offline Recovery & Unread Counter Accuracy
// 9. Security & Unauthorized Subject Access Rejection
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  submitTeacherRegistration,
  approveTeacherApplication,
  validateTeacherSubjectAccess,
  saveTeacherTest,
  getTeacherTests,
  saveQuestionBankItem,
  createAssignmentSubmission,
} from '../lib/teacherAssignmentStore';
import {
  createAnonymousQuestion,
  submitAnonymousResponse,
  submitAnonymousReport,
  getQuestionResponseSummary,
} from '../lib/anonymousStore';
import {
  getAllPersistentNotifications,
  createPersistentNotification,
  getNotificationsForUser,
  getUnreadNotificationCountForUser,
  markPersistentNotificationRead,
  markAllPersistentNotificationsRead,
  notifyTestPublished,
  notifyPollPublished,
  notifyMaterialUploaded,
  notifyAssignmentSubmitted,
  notifyAnonymousReportSubmitted,
  getDashboardUpdatesForStudent,
} from '../lib/notifications';
import { findStudentByEmail } from '../lib/demoStore';
import { UserProfile, AnonymousReport } from '../types';

describe('Teacher Access Control, Subject Restrictions & Real-Time Notification System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 1: Teacher Login & Role Verification
  // ---------------------------------------------------------------------------
  describe('Scenario 1: Teacher Login & Dashboard Access', () => {
    it('verifies approved teacher role, assigned subjects, and destination routing', async () => {
      // Register teacher
      const reg = await submitTeacherRegistration({
        display_name: 'Dr. Sarah Farooq',
        email: 'sarah.farooq@studyhub.edu',
        password: 'Password123!',
        phone: '03009876543',
        gender: 'female',
        requested_subject_ids: ['sub-dld-01', 'sub-oop-02'],
      });
      expect(reg.success).toBe(true);

      // Approve application
      const approval = await approveTeacherApplication(
        reg.application!.id,
        ['sub-dld-01', 'sub-oop-02'],
        'admin-hammad'
      );
      expect(approval.success).toBe(true);

      // Verify upgraded user record
      const student = findStudentByEmail('sarah.farooq@studyhub.edu');
      expect(student).toBeDefined();
      expect(student?.role).toBe('teacher');
      expect(student?.teacher_status).toBe('approved');
      expect(student?.assigned_subject_ids).toEqual(['sub-dld-01', 'sub-oop-02']);

      // Destination routing logic check: Teachers route directly to /teacher
      const targetRoute = student?.role === 'teacher' ? '/teacher' : '/dashboard';
      expect(targetRoute).toBe('/teacher');
    });
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 2: Multiple Assigned Subjects
  // ---------------------------------------------------------------------------
  describe('Scenario 2: Multiple Assigned Subjects Access', () => {
    it('permits teacher to manage assigned subjects and denies unassigned subjects', () => {
      const teacher: UserProfile = {
        id: 't-sarah',
        display_name: 'Dr. Sarah',
        email: 'sarah@studyhub.edu',
        role: 'teacher',
        gender: 'female',
        assigned_subject_ids: ['sub-dld-01', 'sub-oop-02'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Valid for Subject 1 (DLD)
      expect(validateTeacherSubjectAccess(teacher, 'sub-dld-01')).toBe(true);
      // Valid for Subject 2 (OOP)
      expect(validateTeacherSubjectAccess(teacher, 'sub-oop-02')).toBe(true);
      // Denied for Subject 3 (Calculus / sub-math-03)
      expect(validateTeacherSubjectAccess(teacher, 'sub-math-03')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 3: Test Published Notification
  // ---------------------------------------------------------------------------
  describe('Scenario 3: Test Published Notification', () => {
    it('notifies students when a test is published, but NEVER when draft', () => {
      const teacher: UserProfile = {
        id: 't-sarah',
        display_name: 'Dr. Sarah',
        email: 'sarah@studyhub.edu',
        role: 'teacher',
        gender: 'female',
        assigned_subject_ids: ['sub-dld-01'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const student: UserProfile = {
        id: 's-hamza',
        display_name: 'Hamza Khan',
        email: 'hamza@studyhub.edu',
        role: 'student',
        gender: 'male',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 1. Save as draft -> No notifications generated
      saveTeacherTest(
        {
          id: 'test-draft-01',
          teacher_id: teacher.id,
          subject_id: 'sub-dld-01',
          title: 'Draft Quiz on Logic Gates',
          test_date: '2026-11-15',
          duration_minutes: 30,
          total_marks: 10,
          attempts_allowed: 1,
          shuffle_questions: true,
          shuffle_options: true,
          status: 'draft',
          questions: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        teacher
      );

      let studentNotifs = getNotificationsForUser(student);
      expect(studentNotifs.filter((n) => n.type === 'test_published').length).toBe(0);

      // 2. Publish test -> Student immediately receives persistent notification
      saveTeacherTest(
        {
          id: 'test-draft-01',
          teacher_id: teacher.id,
          subject_id: 'sub-dld-01',
          title: 'Draft Quiz on Logic Gates',
          test_date: '2026-11-15',
          duration_minutes: 30,
          total_marks: 10,
          attempts_allowed: 1,
          shuffle_questions: true,
          shuffle_options: true,
          status: 'published',
          questions: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        teacher
      );

      studentNotifs = getNotificationsForUser(student);
      const testNotif = studentNotifs.find((n) => n.type === 'test_published');
      expect(testNotif).toBeDefined();
      expect(testNotif?.title).toContain('Draft Quiz on Logic Gates');
      expect(testNotif?.target_url).toBe('/tests/test-draft-01');
    });
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 4: Anonymous Poll Notification & Real-Time Response Updates
  // ---------------------------------------------------------------------------
  describe('Scenario 4: Anonymous Poll Notification & Response Update', async () => {
    it('notifies students of new poll and updates teacher response counter with zero identity', async () => {
      const teacher: UserProfile = {
        id: 't-ahmed',
        display_name: 'Sir Ahmed',
        email: 'ahmed@studyhub.edu',
        role: 'teacher',
        gender: 'male',
        assigned_subject_ids: ['sub-dld-01'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const student: UserProfile = {
        id: 's-ali',
        display_name: 'Ali Raza',
        email: 'ali@studyhub.edu',
        role: 'student',
        gender: 'male',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Teacher creates an active poll
      const pollRes = await createAnonymousQuestion(
        {
          teacher_id: teacher.id,
          teacher_name: teacher.display_name,
          subject_id: 'sub-dld-01',
          subject_name: 'Digital Logic Design',
          title: 'How confident are you with Karnaugh Maps?',
          question_type: 'rating_scale',
          rating_min: 1,
          rating_max: 5,
          closing_date: '2026-12-01T23:59:59Z',
        },
        teacher
      );

      expect(pollRes.success).toBe(true);

      // Student receives notification
      const studentNotifs = getNotificationsForUser(student);
      const pollNotif = studentNotifs.find((n) => n.type === 'poll_published');
      expect(pollNotif).toBeDefined();
      expect(pollNotif?.title).toContain('How confident are you with Karnaugh Maps?');

      // Student submits response
      const submitRes = await submitAnonymousResponse(
        {
          question_id: pollRes.question!.id,
          subject_id: 'sub-dld-01',
          question_type: 'rating_scale',
          rating_value: 4,
        },
        student.id
      );
      expect(submitRes.success).toBe(true);

      // Teacher's poll view receives response count increment with zero student identifiers
      const summary = getQuestionResponseSummary(pollRes.question!.id);
      expect(summary.total_responses).toBe(1);
      expect(summary.average_rating).toBe(4);

      // Teacher receives notification that an anonymous response arrived
      const teacherNotifs = getNotificationsForUser(teacher);
      const respNotif = teacherNotifs.find((n) => n.type === 'poll_response_received');
      expect(respNotif).toBeDefined();
      expect(respNotif?.message).not.toContain('Ali Raza');
      expect(respNotif?.message).not.toContain('ali@studyhub.edu');
    });
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 5: Anonymous Report Notification & Zero Student Identity
  // ---------------------------------------------------------------------------
  describe('Scenario 5: Anonymous Report Notification & Zero Student Identity', () => {
    it('routes notification to target teacher with strict zero student identity', async () => {
      const student: UserProfile = {
        id: 's-fatima',
        display_name: 'Fatima Noor',
        email: 'fatima@studyhub.edu',
        roll_no: 'BSE-2024-042',
        role: 'student',
        gender: 'female',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const teacher: UserProfile = {
        id: 't-kamran',
        display_name: 'Sir Kamran',
        email: 'kamran@studyhub.edu',
        role: 'teacher',
        gender: 'male',
        assigned_subject_ids: ['sub-dld-01'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Student submits private report targeting Sir Kamran
      const reportRes = await submitAnonymousReport(
        {
          title: 'Difficulty with Lecture 5 pace',
          category: 'teaching_learning',
          description: 'The pace in digital circuit simplification was a bit too fast.',
          audience_type: 'specific_teacher',
          subject_id: 'sub-dld-01',
          subject_name: 'Digital Logic Design',
          target_teacher_id: teacher.id,
          target_teacher_name: teacher.display_name,
        },
        student
      );
      expect(reportRes.success).toBe(true);

      // Teacher inspects notification
      const teacherNotifs = getNotificationsForUser(teacher);
      const reportNotif = teacherNotifs.find((n) => n.type === 'report_submitted');
      expect(reportNotif).toBeDefined();

      // Zero identity verification
      expect(reportNotif?.message).not.toContain('Fatima Noor');
      expect(reportNotif?.message).not.toContain('BSE-2024-042');
      expect(reportNotif?.message).not.toContain('fatima@studyhub.edu');
      expect(reportNotif?.message).toContain(reportRes.reference_number);
    });
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 6: Subject-Isolated Report Notifications
  // ---------------------------------------------------------------------------
  describe('Scenario 6: Subject-Isolated Report Notifications', () => {
    it('delivers subject report only to teachers assigned to that subject', async () => {
      const student: UserProfile = {
        id: 's-student-1',
        display_name: 'Student 1',
        email: 'student1@studyhub.edu',
        role: 'student',
        gender: 'male',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const teacherDLD: UserProfile = {
        id: 't-dld',
        display_name: 'Teacher DLD',
        email: 'teacher.dld@studyhub.edu',
        role: 'teacher',
        gender: 'female',
        assigned_subject_ids: ['sub-dld-01'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const teacherMath: UserProfile = {
        id: 't-math',
        display_name: 'Teacher Math',
        email: 'teacher.math@studyhub.edu',
        role: 'teacher',
        gender: 'male',
        assigned_subject_ids: ['sub-math-02'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Report for DLD
      await submitAnonymousReport(
        {
          title: 'Lab equipment shortage',
          category: 'facilities_infrastructure',
          description: 'Not enough breadboards in lab.',
          audience_type: 'specific_subject',
          subject_id: 'sub-dld-01',
          subject_name: 'Digital Logic Design',
        },
        student
      );

      // DLD teacher receives notification
      const dldNotifs = getNotificationsForUser(teacherDLD);
      expect(dldNotifs.some((n) => n.type === 'report_submitted' && n.subject_id === 'sub-dld-01')).toBe(true);

      // Math teacher does NOT receive notification
      const mathNotifs = getNotificationsForUser(teacherMath);
      expect(mathNotifs.some((n) => n.type === 'report_submitted' && n.subject_id === 'sub-dld-01')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 7: Assignment Submission Notifications
  // ---------------------------------------------------------------------------
  describe('Scenario 7: Assignment Submission Notification', () => {
    it('alerts subject teachers upon student assignment submission', async () => {
      const teacher: UserProfile = {
        id: 't-dld-teacher',
        display_name: 'Sir Usman',
        email: 'usman@studyhub.edu',
        role: 'teacher',
        gender: 'male',
        assigned_subject_ids: ['sub-dld-01'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const submRes = await createAssignmentSubmission({
        student_id: 's-bilal',
        student_name: 'Bilal Ahmed',
        roll_no: 'BSE-2024-010',
        subject_id: 'sub-dld-01',
        subject_name: 'Digital Logic Design',
        title: 'Assignment 1: Logic Gates Truth Tables',
        files: [
          {
            id: 'f1',
            file_name: 'assignment1.pdf',
            file_size: '120 KB',
            mime_type: 'application/pdf',
            file_url: '#',
          },
        ],
      });
      expect(submRes.success).toBe(true);

      // Teacher receives submission notification
      const teacherNotifs = getNotificationsForUser(teacher);
      const subNotif = teacherNotifs.find((n) => n.type === 'assignment_submitted');
      expect(subNotif).toBeDefined();
      expect(subNotif?.message).toContain('Bilal Ahmed');
      expect(subNotif?.target_url).toBe('/teacher?tab=submissions');
    });
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 8: Offline Recovery & Unread Notification Tracking
  // ---------------------------------------------------------------------------
  describe('Scenario 8: Offline Recovery & Read Status', () => {
    it('recovers all unread notifications across reloads and manages per-user read state', () => {
      const student: UserProfile = {
        id: 's-offline-user',
        display_name: 'Offline Student',
        email: 'offline@studyhub.edu',
        role: 'student',
        gender: 'male',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 3 notifications generated while user is offline
      notifyTestPublished({
        id: 'test-rec-1',
        title: 'Midterm Prep Test',
        subject_id: 'sub-dld-01',
        subject_name: 'Digital Logic Design',
      });

      notifyPollPublished({
        id: 'poll-rec-2',
        title: 'Weekly Teaching Feedback',
        subject_id: 'sub-dld-01',
        subject_name: 'Digital Logic Design',
      });

      notifyMaterialUploaded({
        id: 'mat-rec-3',
        title: 'Complete Course Syllabus',
        subject_id: 'sub-dld-01',
        subject_name: 'Digital Logic Design',
        resource_type: 'pdf',
      });

      // User connects / logs in
      const unreadCount = getUnreadNotificationCountForUser(student);
      expect(unreadCount).toBe(3);

      const notifs = getNotificationsForUser(student);
      expect(notifs.length).toBe(3);
      expect(notifs.every((n) => !n.is_read)).toBe(true);

      // Mark single notification read
      markPersistentNotificationRead(notifs[0].id, student.id);
      expect(getUnreadNotificationCountForUser(student)).toBe(2);

      // Mark all read
      markAllPersistentNotificationsRead(student.id);
      expect(getUnreadNotificationCountForUser(student)).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 9: Security & Unauthorized Subject Access Rejection
  // ---------------------------------------------------------------------------
  describe('Scenario 9: Security & Unauthorized Subject Access Rejection', async () => {
    it('strictly rejects test creation and question bank uploads for unassigned subjects', async () => {
      const teacher: UserProfile = {
        id: 't-isolated',
        display_name: 'Prof. Jameel',
        email: 'jameel@studyhub.edu',
        role: 'teacher',
        gender: 'male',
        assigned_subject_ids: ['sub-dld-01'], // Assigned ONLY to DLD
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 1. Attempt to create test for Calculus (unassigned) -> Store throws access error
      expect(() => {
        saveTeacherTest(
          {
            id: 'test-unauthorized',
            teacher_id: teacher.id,
            subject_id: 'sub-math-02', // Tampered subject ID!
            title: 'Hacked Math Test',
            test_date: '2026-11-20',
            duration_minutes: 40,
            total_marks: 20,
            attempts_allowed: 1,
            shuffle_questions: true,
            shuffle_options: true,
            status: 'published',
            questions: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          teacher
        );
      }).toThrow(/Access Denied/i);

      // 2. Attempt to add question bank item for unassigned subject -> Store throws error
      expect(() => {
        saveQuestionBankItem(
          {
            id: 'q-unauthorized',
            subject_id: 'sub-math-02',
            chapter: 'Calculus',
            topic: 'Integration',
            question_type: 'mcq',
            question_text: 'What is the integral of x dx?',
            correct_answer: 'x^2 / 2',
            marks: 2,
            difficulty: 'easy',
            created_at: new Date().toISOString(),
          },
          teacher
        );
      }).toThrow(/Access Denied/i);

      // 3. Attempt to create poll for unassigned subject -> Rejection returned
      const pollAttempt = await createAnonymousQuestion(
        {
          teacher_id: teacher.id,
          teacher_name: teacher.display_name,
          subject_id: 'sub-math-02', // Unassigned!
          title: 'Unauthorized Poll',
          question_type: 'short_answer',
          closing_date: '2026-12-01T00:00:00Z',
        },
        teacher
      );
      expect(pollAttempt.success).toBe(false);
      expect(pollAttempt.error).toContain('Access Denied');
    });
  });

  // ---------------------------------------------------------------------------
  // "What's New for You" Aggregator Verification
  // ---------------------------------------------------------------------------
  describe("Student Dashboard: What's New for You Aggregator", () => {
    it('aggregates active tests, polls, and uploaded materials with direct actions', () => {
      const student: UserProfile = {
        id: 's-zahid',
        display_name: 'Zahid Mehmood',
        email: 'zahid@studyhub.edu',
        role: 'student',
        gender: 'male',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Seed a published test
      saveTeacherTest({
        id: 'test-agg-1',
        teacher_id: 't-1',
        subject_id: 'sub-dld-01',
        title: 'Combinational Logic Assessment',
        test_date: '2026-11-18',
        duration_minutes: 45,
        total_marks: 25,
        attempts_allowed: 1,
        shuffle_questions: true,
        shuffle_options: true,
        status: 'published',
        questions: [{ id: 'q1', question_type: 'mcq', question_text: 'Q1', correct_answer: 'A', marks: 2, difficulty: 'easy', subject_id: 'sub-dld-01', created_at: '' }],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const updates = getDashboardUpdatesForStudent(student);
      expect(updates.length).toBeGreaterThan(0);

      const testItem = updates.find((u) => u.id === 'update-test-test-agg-1');
      expect(testItem).toBeDefined();
      expect(testItem?.action_label).toBe('Open Test');
      expect(testItem?.action_url).toBe('/tests/test-agg-1');
    });
  });
});
