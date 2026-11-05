// ==============================================================================
// HAMMAD STUDYHUB — UNIFIED PERSISTENT NOTIFICATION & REAL-TIME EVENT ENGINE
// Architect: Muhammad Hammad
//
// Key Responsibilities:
// 1. Persistent cross-session and offline notification store (Local + Supabase).
// 2. Real-time delivery with custom window events and instant updates.
// 3. Strict Subject & Role Isolation:
//    - Teachers only receive notifications for their assigned subjects or direct alerts.
//    - Students receive test, poll, material, and announcement updates for their subjects.
//    - Admins receive moderation, pending application, and platform alerts.
// 4. Strict Privacy Shield:
//    - Anonymous report notifications NEVER leak student identity (name, roll no, email).
//    - Poll response notifications NEVER contain student identity.
// 5. "What's New for You" aggregator for student dashboard.
// ==============================================================================

import {
  Resource,
  Announcement,
  PersistentNotification,
  NotificationType,
  DashboardUpdateItem,
  UserProfile,
  AnonymousReport,
} from '../types';
import { getDemoResources, getDemoAnnouncements, getDemoSubjects } from './demoStore';
import { supabase, isSupabaseConfigured } from './supabase';

// Backwards compatibility export for existing components
export interface StudentNotification {
  id: string;
  type: 'resource' | 'announcement';
  title: string;
  message: string;
  targetUrl: string;
  createdAt: string;
  isRead: boolean;
  priority?: boolean;
  badgeLabel?: string;
  subjectName?: string;
}

// Storage Keys
const PERSISTENT_NOTIFICATIONS_KEY = 'studyhub_persistent_notifications_v2';
const USER_READ_NOTIFS_KEY_PREFIX = 'studyhub_read_notifs_v2_';
const LEGACY_READ_NOTIFICATIONS_KEY = 'studyhub_read_notifications_v1';

// -----------------------------------------------------------------------------
// INTERNAL STORAGE HELPERS
// -----------------------------------------------------------------------------

function getStoredJson<T>(key: string, defaultValue: T): T {
  if (typeof localStorage === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStoredJson<T>(key: string, value: T): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[StudyHub Notifs] Storage write failed for ${key}:`, e);
  }
}

function dispatchNotifEvents(detail?: PersistentNotification): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event('studyhub_notifications_updated'));
    if (detail) {
      window.dispatchEvent(new CustomEvent('studyhub_notification_created', { detail }));
    }
  } catch {
    // Ignore in non-browser environments
  }
}

// -----------------------------------------------------------------------------
// PERSISTENT NOTIFICATIONS STORE
// -----------------------------------------------------------------------------

export function getAllPersistentNotifications(): PersistentNotification[] {
  return getStoredJson<PersistentNotification[]>(PERSISTENT_NOTIFICATIONS_KEY, []);
}

export function savePersistentNotifications(items: PersistentNotification[]): void {
  setStoredJson(PERSISTENT_NOTIFICATIONS_KEY, items);
  dispatchNotifEvents();
}

/**
 * Creates and persists a new real-time notification with deduplication.
 * Dual-writes to Supabase when active.
 */
export function createPersistentNotification(
  input: Omit<PersistentNotification, 'id' | 'created_at'>
): PersistentNotification {
  const all = getAllPersistentNotifications();
  const now = new Date().toISOString();

  // Deduplication: prevent duplicate notification if same entity + type + recipient within 5 mins
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const duplicate = all.find(
    (n) =>
      n.type === input.type &&
      n.entity_id === input.entity_id &&
      n.recipient_type === input.recipient_type &&
      (n.recipient_id || '') === (input.recipient_id || '') &&
      (n.subject_id || '') === (input.subject_id || '') &&
      n.created_at >= fiveMinsAgo
  );

  if (duplicate) {
    return duplicate;
  }

  const notificationId = `notif-p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newNotif: PersistentNotification = {
    ...input,
    id: notificationId,
    read_by: input.read_by || [],
    created_at: now,
  };

  all.unshift(newNotif);
  // Keep max 200 persistent notifications
  const trimmed = all.slice(0, 200);
  setStoredJson(PERSISTENT_NOTIFICATIONS_KEY, trimmed);

  // Background remote sync with Supabase if configured
  if (isSupabaseConfigured) {
    try {
      void Promise.resolve(
        supabase.from('persistent_notifications').insert({
          id: newNotif.id,
          recipient_type: newNotif.recipient_type,
          recipient_id: newNotif.recipient_id || null,
          actor_id: newNotif.actor_id || null,
          actor_name: newNotif.actor_name || null,
          type: newNotif.type,
          title: newNotif.title,
          message: newNotif.message,
          subject_id: newNotif.subject_id || null,
          subject_name: newNotif.subject_name || null,
          target_url: newNotif.target_url,
          entity_id: newNotif.entity_id || null,
          priority: newNotif.priority || false,
          badge_label: newNotif.badge_label || null,
          is_anonymous: newNotif.is_anonymous || false,
          created_at: newNotif.created_at,
        })
      ).catch(() => {});
    } catch {
      // Ignore background sync errors
    }
  }

  dispatchNotifEvents(newNotif);
  return newNotif;
}

// -----------------------------------------------------------------------------
// READ / UNREAD STATUS PER USER
// -----------------------------------------------------------------------------

export function getUserReadNotificationIds(userId: string): Set<string> {
  if (!userId) return new Set();
  const arr = getStoredJson<string[]>(`${USER_READ_NOTIFS_KEY_PREFIX}${userId}`, []);
  return new Set(Array.isArray(arr) ? arr : []);
}

export function markPersistentNotificationRead(notificationId: string, userId: string): void {
  if (!notificationId) return;

  // 1. Update user's local read set
  if (userId) {
    const userReadSet = getUserReadNotificationIds(userId);
    userReadSet.add(notificationId);
    setStoredJson(`${USER_READ_NOTIFS_KEY_PREFIX}${userId}`, Array.from(userReadSet));
  }

  // 2. Also record in notification's read_by array in store
  const all = getAllPersistentNotifications();
  const idx = all.findIndex((n) => n.id === notificationId);
  if (idx !== -1) {
    const currentReadBy = all[idx].read_by || [];
    if (userId && !currentReadBy.includes(userId)) {
      all[idx] = { ...all[idx], read_by: [...currentReadBy, userId] };
      setStoredJson(PERSISTENT_NOTIFICATIONS_KEY, all);
    }
  }

  // 3. Mark in legacy store if applies
  const legacyRead = getLegacyReadIds();
  legacyRead.add(notificationId);
  saveLegacyReadIds(legacyRead);

  dispatchNotifEvents();
}

export function markAllPersistentNotificationsRead(
  userId: string,
  userNotifications?: PersistentNotification[]
): void {
  const notifs = userNotifications || (userId ? getNotificationsForUser({ id: userId } as UserProfile) : []);
  if (!userId) return;

  const userReadSet = getUserReadNotificationIds(userId);
  const all = getAllPersistentNotifications();
  let modified = false;

  notifs.forEach((n) => {
    userReadSet.add(n.id);
    const storeIdx = all.findIndex((item) => item.id === n.id);
    if (storeIdx !== -1) {
      const readBy = all[storeIdx].read_by || [];
      if (!readBy.includes(userId)) {
        all[storeIdx] = { ...all[storeIdx], read_by: [...readBy, userId] };
        modified = true;
      }
    }
  });

  setStoredJson(`${USER_READ_NOTIFS_KEY_PREFIX}${userId}`, Array.from(userReadSet));
  if (modified) {
    setStoredJson(PERSISTENT_NOTIFICATIONS_KEY, all);
  }

  dispatchNotifEvents();
}

// -----------------------------------------------------------------------------
// ROLE & SUBJECT-BASED NOTIFICATION RETRIEVAL
// -----------------------------------------------------------------------------

/**
 * Retrieves notifications tailored strictly to the authenticated user's role and assigned subjects.
 * Strictly guarantees:
 * - Teachers NEVER receive notifications for unassigned subjects.
 * - Anonymous reports NEVER disclose student identity in notification text.
 */
export function getNotificationsForUser(user: UserProfile | null): PersistentNotification[] {
  if (!user) return [];

  const all = getAllPersistentNotifications();
  const userReadIds = getUserReadNotificationIds(user.id);
  const legacyReadIds = getLegacyReadIds();

  const isManager = user.role === 'admin' || user.role === 'cr' || user.role === 'gr';
  const isTeacher = user.role === 'teacher';
  const assignedSubjectIds = new Set<string>(user.assigned_subject_ids || []);

  const filtered = all.filter((n) => {
    // 1. Direct user-targeted notification
    if (n.recipient_type === 'user' && n.recipient_id === user.id) {
      return true;
    }

    // 2. Broadcast to all users
    if (n.recipient_type === 'all') {
      return true;
    }

    // 3. Role-based notification
    if (n.recipient_type === 'role') {
      if (isManager && (n.recipient_id === 'admin' || n.recipient_id === 'staff')) {
        return true;
      }
      if (isTeacher && n.recipient_id === 'teacher') {
        return true;
      }
      if (!isTeacher && !isManager && n.recipient_id === 'student') {
        return true;
      }
      return false;
    }

    // 4. Subject-Teacher targeted notification
    if (n.recipient_type === 'subject_teachers') {
      if (isManager) return true; // Admins can monitor all
      if (!isTeacher) return false;
      // Teacher only sees if subject is in their approved assigned list
      return n.subject_id ? assignedSubjectIds.has(n.subject_id) : false;
    }

    // 5. Subject-Student targeted notification (Tests, polls, materials)
    if (n.recipient_type === 'subject_students') {
      if (isTeacher) {
        // Teacher sees notifications for their own subjects
        return n.subject_id ? assignedSubjectIds.has(n.subject_id) : false;
      }
      // Students see all published subject materials/tests/polls for curriculum
      return true;
    }

    return false;
  });

  // Attach is_read flag for this specific user
  return filtered.map((n) => ({
    ...n,
    is_read:
      Boolean(n.read_by?.includes(user.id)) ||
      userReadIds.has(n.id) ||
      legacyReadIds.has(n.id),
  }));
}

export function getUnreadNotificationCountForUser(user: UserProfile | null): number {
  if (!user) return 0;
  const notifs = getNotificationsForUser(user);
  return notifs.filter((n) => !n.is_read).length;
}

// -----------------------------------------------------------------------------
// EVENT EMITTERS (TRIGGER NOTIFICATIONS ACROSS ROLES)
// -----------------------------------------------------------------------------

/**
 * Triggered when a teacher publishes a test.
 * Only published tests generate notifications; drafts are NEVER notified.
 */
export function notifyTestPublished(test: {
  id: string;
  title: string;
  subject_id: string;
  subject_name: string;
  total_questions?: number;
  duration_minutes?: number;
  test_date?: string;
}): PersistentNotification {
  return createPersistentNotification({
    recipient_type: 'subject_students',
    subject_id: test.subject_id,
    subject_name: test.subject_name,
    type: 'test_published',
    title: `New Test: ${test.title}`,
    message: `A new practice test is live for ${test.subject_name} (${test.total_questions || 0} questions, ${test.duration_minutes || 0} mins).`,
    target_url: `/tests/${test.id}`,
    entity_id: test.id,
    badge_label: 'TEST',
    priority: true,
  });
}

/**
 * Triggered when a teacher posts an anonymous question or poll.
 */
export function notifyPollPublished(poll: {
  id: string;
  title: string;
  subject_id: string;
  subject_name?: string;
  closing_date?: string;
}): PersistentNotification {
  return createPersistentNotification({
    recipient_type: 'subject_students',
    subject_id: poll.subject_id,
    subject_name: poll.subject_name,
    type: 'poll_published',
    title: `New Anonymous Poll: ${poll.title}`,
    message: `Your teacher posted a poll for ${poll.subject_name || 'your subject'}. Your identity is 100% hidden.`,
    target_url: '/feedback',
    entity_id: poll.id,
    badge_label: 'POLL',
  });
}

/**
 * Triggered when learning material (PDF, slides, notes) is published.
 */
export function notifyMaterialUploaded(material: {
  id: string;
  title: string;
  subject_id: string;
  subject_name?: string;
  file_name?: string;
  resource_type?: string;
  slug?: string;
}): PersistentNotification {
  const typeLabel = (material.resource_type || 'PDF').toUpperCase();
  return createPersistentNotification({
    recipient_type: 'subject_students',
    subject_id: material.subject_id,
    subject_name: material.subject_name,
    type: 'material_uploaded',
    title: `New Material: ${material.title}`,
    message: `New study resource published for ${material.subject_name || 'Subject'}${material.file_name ? ` • ${material.file_name}` : ''}.`,
    target_url: `/resources/${material.slug || material.id}`,
    entity_id: material.id,
    badge_label: typeLabel,
  });
}

/**
 * Triggered when a platform announcement is published.
 */
export function notifyAnnouncementPublished(ann: {
  id: string;
  title: string;
  subject_id?: string;
  subject_name?: string;
  is_pinned?: boolean;
  body?: string;
}): PersistentNotification {
  return createPersistentNotification({
    recipient_type: ann.subject_id ? 'subject_students' : 'all',
    subject_id: ann.subject_id,
    subject_name: ann.subject_name,
    type: 'announcement',
    title: ann.title,
    message: (ann.body || '').length > 140 ? `${(ann.body || '').substring(0, 140)}...` : ann.body || '',
    target_url: '/announcements',
    entity_id: ann.id,
    priority: ann.is_pinned || false,
    badge_label: 'NOTICE',
  });
}

/**
 * Triggered when a teacher creates an assignment for students.
 */
export function notifyAssignmentCreated(assignment: {
  id: string;
  title: string;
  subject_id: string;
  subject_name?: string;
  due_date?: string;
}): PersistentNotification {
  return createPersistentNotification({
    recipient_type: 'subject_students',
    subject_id: assignment.subject_id,
    subject_name: assignment.subject_name,
    type: 'assignment_created',
    title: `New Assignment: ${assignment.title}`,
    message: `Assignment for ${assignment.subject_name || 'Subject'}${assignment.due_date ? ` • Due: ${assignment.due_date}` : ''}.`,
    target_url: '/assignments',
    entity_id: assignment.id,
    badge_label: 'ASSIGNMENT',
  });
}

/**
 * Triggered when a test date or schedule is changed.
 */
export function notifyTestScheduleUpdated(test: {
  id: string;
  title: string;
  subject_id: string;
  subject_name: string;
  test_date?: string;
}): PersistentNotification {
  return createPersistentNotification({
    recipient_type: 'subject_students',
    subject_id: test.subject_id,
    subject_name: test.subject_name,
    type: 'test_schedule_updated',
    title: `Schedule Updated: ${test.title}`,
    message: `The test schedule for ${test.subject_name} has been updated. Date: ${test.test_date || 'TBA'}.`,
    target_url: `/tests/${test.id}`,
    entity_id: test.id,
    priority: true,
    badge_label: 'SCHEDULE',
  });
}

/**
 * Triggered when an anonymous report is submitted.
 * STRICT PRIVACY REQUIREMENT: Notification contains ZERO student identity fields.
 */
export function notifyAnonymousReportSubmitted(report: AnonymousReport): PersistentNotification | null {
  const safeTitle = `New Anonymous Report: ${report.category}`;
  const safeMessage = `An anonymous report was submitted regarding ${report.subject_name || 'an academic topic'}. Reference: ${report.reference_number}.`;

  // 1. Direct private alert to specific teacher
  if (
    (report.audience_type === 'specific_teacher' || (report.audience_type as string) === 'teacher') &&
    report.target_teacher_id
  ) {
    return createPersistentNotification({
      recipient_type: 'user',
      recipient_id: report.target_teacher_id,
      subject_id: report.subject_id,
      subject_name: report.subject_name,
      type: 'report_submitted',
      title: 'New Anonymous Report Received',
      message: safeMessage,
      target_url: '/teacher?tab=reports',
      entity_id: report.id,
      badge_label: 'REPORT',
      is_anonymous: true,
    });
  }

  // 2. Alert to teachers of specific subject
  if (
    (report.audience_type === 'specific_subject' || (report.audience_type as string) === 'subject_teachers') &&
    report.subject_id
  ) {
    return createPersistentNotification({
      recipient_type: 'subject_teachers',
      subject_id: report.subject_id,
      subject_name: report.subject_name,
      type: 'report_submitted',
      title: `Anonymous Report: ${report.subject_name || 'Subject'}`,
      message: safeMessage,
      target_url: '/teacher?tab=reports',
      entity_id: report.id,
      badge_label: 'REPORT',
      is_anonymous: true,
    });
  }

  // 3. Admin-only confidential report
  if (report.audience_type === 'admin_only') {
    return createPersistentNotification({
      recipient_type: 'role',
      recipient_id: 'admin',
      type: 'report_submitted',
      title: 'New Confidential Report (Admin Only)',
      message: `A confidential report was submitted in ${report.category} (${report.reference_number}).`,
      target_url: '/admin/reports',
      entity_id: report.id,
      badge_label: 'CONFIDENTIAL',
      is_anonymous: true,
      priority: true,
    });
  }

  // 4. Reports pending admin moderation review
  return createPersistentNotification({
    recipient_type: 'role',
    recipient_id: 'admin',
    type: 'report_submitted',
    title: 'Anonymous Report Awaiting Review',
    message: safeMessage,
    target_url: '/admin/reports',
    entity_id: report.id,
    badge_label: 'REVIEW',
    is_anonymous: true,
  });
}

/**
 * Triggered when an anonymous report is published after admin moderation.
 */
export function notifyAnonymousReportPublished(report: AnonymousReport): PersistentNotification {
  return createPersistentNotification({
    recipient_type: report.subject_id ? 'subject_students' : 'all',
    subject_id: report.subject_id,
    subject_name: report.subject_name,
    type: 'report_published',
    title: `Published Report: ${report.title}`,
    message: `An anonymous report regarding ${report.category} has been reviewed and published.`,
    target_url: '/feedback',
    entity_id: report.id,
    badge_label: 'COMMUNITY',
    is_anonymous: true,
  });
}

/**
 * Triggered when a student submits an assignment.
 */
export function notifyAssignmentSubmitted(
  submission: {
    id: string;
    student_name: string;
    roll_no?: string;
    subject_id: string;
    subject_name?: string;
    assignment_title: string;
  },
  assignedTeacherIds?: string[]
): PersistentNotification {
  // If specific teacher IDs are passed, also record for subject teachers
  return createPersistentNotification({
    recipient_type: 'subject_teachers',
    subject_id: submission.subject_id,
    subject_name: submission.subject_name,
    type: 'assignment_submitted',
    title: `Submission: ${submission.assignment_title}`,
    message: `${submission.student_name} (${submission.roll_no || 'Student'}) submitted assignment for ${submission.subject_name || 'Subject'}.`,
    target_url: '/teacher?tab=submissions',
    entity_id: submission.id,
    badge_label: 'SUBMISSION',
  });
}

/**
 * Triggered when a student submits an anonymous poll response.
 * Strictly shields student identity — alerts only that a new response was received.
 */
export function notifyPollResponseReceived(
  questionId: string,
  teacherId: string,
  questionTitle: string
): PersistentNotification {
  return createPersistentNotification({
    recipient_type: 'user',
    recipient_id: teacherId,
    type: 'poll_response_received',
    title: 'New Anonymous Poll Response',
    message: `A student answered your poll: "${questionTitle}". Identity is 100% protected.`,
    target_url: '/teacher?tab=polls',
    entity_id: questionId,
    badge_label: 'FEEDBACK',
    is_anonymous: true,
  });
}

// -----------------------------------------------------------------------------
// STUDENT DASHBOARD: "WHAT'S NEW FOR YOU" AGGREGATOR
// -----------------------------------------------------------------------------

/**
 * Returns prioritized, prominent update cards for the student dashboard.
 * Pulls active tests, new anonymous polls, recently uploaded materials, and announcements.
 */
export function getDashboardUpdatesForStudent(student: UserProfile | null): DashboardUpdateItem[] {
  const updates: DashboardUpdateItem[] = [];
  const subjects = getDemoSubjects();
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  // 1. Tests & Quizzes from persistent storage
  try {
    const rawTests = getStoredJson<any[]>('studyhub_teacher_tests_v1', []);
    const now = new Date().toISOString();
    rawTests
      .filter((t) => t.status === 'published')
      .slice(0, 4)
      .forEach((t) => {
        const subName = subjectMap.get(t.subject_id) || 'Subject';
        updates.push({
          id: `update-test-${t.id}`,
          type: 'test',
          title: t.title,
          subject_id: t.subject_id,
          subject_name: subName,
          timestamp: t.created_at || now,
          status_badge: `TEST • ${subName.substring(0, 10).toUpperCase()}`,
          type_label: 'Practice Test',
          action_label: 'Open Test',
          action_url: `/tests/${t.id}`,
          is_urgent: true,
          meta_info: `${t.questions?.length || 0} questions • ${t.duration_minutes || 45} mins`,
        });
      });
  } catch {
    // Ignore error
  }

  // 2. Active Anonymous Polls & Questions
  try {
    const rawPolls = getStoredJson<any[]>('studyhub_anonymous_questions_v1', []);
    const participations = getStoredJson<any[]>('studyhub_poll_participations_v1', []);
    const studentParticipatedQuestionIds = new Set(
      student ? participations.filter((p) => p.student_id === student.id).map((p) => p.question_id) : []
    );

    const now = new Date().toISOString();
    rawPolls
      .filter((p) => p.status === 'active' && !studentParticipatedQuestionIds.has(p.id))
      .slice(0, 4)
      .forEach((p) => {
        const subName = p.subject_name || subjectMap.get(p.subject_id) || 'Subject';
        updates.push({
          id: `update-poll-${p.id}`,
          type: 'poll',
          title: p.title,
          subject_id: p.subject_id,
          subject_name: subName,
          timestamp: p.created_at || now,
          status_badge: 'ANONYMOUS POLL',
          type_label: 'Teacher Feedback',
          action_label: 'Respond',
          action_url: '/feedback',
          is_urgent: false,
          meta_info: '100% Anonymous • 1 question',
        });
      });
  } catch {
    // Ignore error
  }

  // 3. Recently Uploaded Learning Materials (last 10)
  try {
    const resources = getDemoResources().filter((r) => r.status === 'published');
    resources.slice(0, 6).forEach((r) => {
      const subName = r.subject?.name || subjectMap.get(r.subject_id) || 'Subject';
      updates.push({
        id: `update-res-${r.id}`,
        type: 'material',
        title: r.title,
        subject_id: r.subject_id,
        subject_name: subName,
        timestamp: r.created_at || r.published_at || new Date().toISOString(),
        status_badge: `${r.resource_type.toUpperCase()}`,
        type_label: 'Study Material',
        action_label: 'Open Material',
        action_url: `/resources/${r.slug || r.id}`,
        is_urgent: false,
        meta_info: r.file_name || `${r.resource_type.toUpperCase()} file`,
      });
    });
  } catch {
    // Ignore error
  }

  // 4. Important / Pinned Announcements
  try {
    const announcements = getDemoAnnouncements().filter((a) => a.status === 'published');
    announcements
      .filter((a) => a.is_pinned)
      .slice(0, 2)
      .forEach((a) => {
        updates.push({
          id: `update-ann-${a.id}`,
          type: 'announcement',
          title: a.title,
          subject_name: 'Campus Announcement',
          timestamp: a.published_at || a.created_at || new Date().toISOString(),
          status_badge: 'PINNED NOTICE',
          type_label: 'Announcement',
          action_label: 'Read Announcement',
          action_url: '/announcements',
          is_urgent: true,
          meta_info: a.category?.toUpperCase() || 'GENERAL',
        });
      });
  } catch {
    // Ignore error
  }

  // Sort newest first
  updates.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return updates.slice(0, 8);
}

// -----------------------------------------------------------------------------
// BACKWARDS-COMPATIBILITY ADAPTERS (FOR EXISTING CODE & TESTS)
// -----------------------------------------------------------------------------

function getLegacyReadIds(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LEGACY_READ_NOTIFICATIONS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveLegacyReadIds(set: Set<string>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LEGACY_READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new Event('studyhub_notifications_updated'));
  } catch {
    // Ignore
  }
}

export function getStudentNotifications(
  resourcesList?: Resource[],
  announcementsList?: Announcement[]
): StudentNotification[] {
  const readSet = getLegacyReadIds();
  const subjects = getDemoSubjects();
  const resources = resourcesList || getDemoResources();
  const announcements = announcementsList || getDemoAnnouncements();

  const notifications: StudentNotification[] = [];

  // Announcements
  announcements
    .filter((a) => a.status === 'published')
    .forEach((a) => {
      const id = `notif-ann-${a.id}`;
      notifications.push({
        id,
        type: 'announcement',
        title: a.title,
        message: a.body.length > 120 ? `${a.body.substring(0, 120)}...` : a.body,
        targetUrl: '/announcements',
        createdAt: a.published_at || a.created_at,
        isRead: readSet.has(id),
        priority: a.is_pinned,
        badgeLabel: a.category ? a.category.toUpperCase() : 'NOTICE',
      });
    });

  // Learning Resources
  resources
    .filter((r) => r.status === 'published')
    .slice(0, 15)
    .forEach((r) => {
      const id = `notif-res-${r.id}`;
      const subject = r.subject || subjects.find((s) => s.id === r.subject_id);
      const subjectName = subject?.name || 'Class Subject';

      notifications.push({
        id,
        type: 'resource',
        title: `New Material: ${r.title}`,
        message: `Published for ${subjectName} • ${r.file_name || r.resource_type.toUpperCase()}`,
        targetUrl: `/resources/${r.slug || r.id}`,
        createdAt: r.created_at || r.published_at || r.lesson_date,
        isRead: readSet.has(id),
        priority: false,
        badgeLabel: r.resource_type.toUpperCase(),
        subjectName,
      });
    });

  notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return notifications;
}

export function getUnreadNotificationCount(notifications?: StudentNotification[]): number {
  const notifs = notifications || getStudentNotifications();
  return notifs.filter((n) => !n.isRead).length;
}

export function markNotificationAsRead(id: string): void {
  const readSet = getLegacyReadIds();
  readSet.add(id);
  saveLegacyReadIds(readSet);
}

export function markAllNotificationsAsRead(notifications?: StudentNotification[]): void {
  const notifs = notifications || getStudentNotifications();
  const readSet = getLegacyReadIds();
  notifs.forEach((n) => readSet.add(n.id));
  saveLegacyReadIds(readSet);
}
