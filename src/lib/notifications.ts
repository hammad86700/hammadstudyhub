// ==============================================================================
// HAMMAD STUDYHUB — STUDENT NOTIFICATIONS ENGINE
// Tracks new academic uploads, important announcements, and read/unread status
// ==============================================================================

import { Resource, Announcement } from '../types';
import { getDemoResources, getDemoAnnouncements, getDemoSubjects } from './demoStore';

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

const READ_NOTIFICATIONS_KEY = 'studyhub_read_notifications_v1';

function getReadIds(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_NOTIFICATIONS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(set: Set<string>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new Event('studyhub_notifications_updated'));
  } catch {
    // Ignore
  }
}

/**
 * Derives dynamic student notifications from live published resources and announcements
 */
export function getStudentNotifications(
  resourcesList?: Resource[],
  announcementsList?: Announcement[]
): StudentNotification[] {
  const readSet = getReadIds();
  const subjects = getDemoSubjects();
  const resources = resourcesList || getDemoResources();
  const announcements = announcementsList || getDemoAnnouncements();

  const notifications: StudentNotification[] = [];

  // 1. Notifications from Announcements
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

  // 2. Notifications from Learning Resources (Published materials)
  resources
    .filter((r) => r.status === 'published')
    .slice(0, 15) // Recent 15
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

  // Sort newest first
  notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return notifications;
}

/**
 * Returns the unread notification count
 */
export function getUnreadNotificationCount(notifications?: StudentNotification[]): number {
  const notifs = notifications || getStudentNotifications();
  return notifs.filter((n) => !n.isRead).length;
}

/**
 * Marks a single notification as read
 */
export function markNotificationAsRead(id: string): void {
  const readSet = getReadIds();
  readSet.add(id);
  saveReadIds(readSet);
}

/**
 * Marks all notifications as read
 */
export function markAllNotificationsAsRead(notifications?: StudentNotification[]): void {
  const notifs = notifications || getStudentNotifications();
  const readSet = getReadIds();
  notifs.forEach((n) => readSet.add(n.id));
  saveReadIds(readSet);
}

