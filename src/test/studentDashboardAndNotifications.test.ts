// ==============================================================================
// HAMMAD STUDYHUB — NOTIFICATIONS & STUDENT DASHBOARD TESTS
// Tests notifications derivation, unread badges, and live metric calculations
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStudentNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../lib/notifications';
import { Resource, Announcement } from '../types';

describe('Student Notifications & Dashboard Realtime Data', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockResources: Resource[] = [
    {
      id: 'res-notif-1',
      subject_id: 'sub-dld',
      title: 'Karnaugh Maps Handout',
      slug: 'karnaugh-maps-handout',
      resource_type: 'pdf',
      lesson_date: '2026-11-01',
      source_provider: 'supabase_storage',
      external_url: '',
      file_name: 'kmaps.pdf',
      file_size: '1.5 MB',
      tags: ['kmap'],
      status: 'published',
      created_at: '2026-11-01T10:00:00Z',
      updated_at: '2026-11-01T10:00:00Z',
    },
    {
      id: 'res-notif-2',
      subject_id: 'sub-eng',
      title: 'Grammar Quiz Solutions',
      slug: 'grammar-quiz-solutions',
      resource_type: 'assignment',
      lesson_date: '2026-10-31',
      source_provider: 'supabase_storage',
      external_url: '',
      file_name: 'quiz1.pdf',
      file_size: '800 KB',
      tags: ['quiz'],
      status: 'published',
      created_at: '2026-10-31T09:00:00Z',
      updated_at: '2026-10-31T09:00:00Z',
    },
    {
      id: 'res-notif-draft',
      subject_id: 'sub-eng',
      title: 'Unpublished Draft Notes',
      slug: 'unpublished-draft-notes',
      resource_type: 'pdf',
      lesson_date: '2026-10-30',
      source_provider: 'supabase_storage',
      external_url: '',
      tags: [],
      status: 'draft',
      created_at: '2026-10-30T00:00:00Z',
      updated_at: '2026-10-30T00:00:00Z',
    },
  ];

  const mockAnnouncements: Announcement[] = [
    {
      id: 'ann-notif-1',
      title: 'Midterm Date Sheet Released',
      body: 'Check the portal for full schedule and timetable.',
      category: 'exam',
      is_pinned: true,
      status: 'published',
      published_at: '2026-11-01T08:00:00Z',
      created_at: '2026-11-01T08:00:00Z',
      updated_at: '2026-11-01T08:00:00Z',
    },
  ];

  it('generates student notifications from published resources and announcements only', () => {
    const notifs = getStudentNotifications(mockResources, mockAnnouncements);

    // Drafts must be excluded
    const draftNotif = notifs.find((n) => n.id.includes('res-notif-draft'));
    expect(draftNotif).toBeUndefined();

    // Published resources and announcements must be included
    expect(notifs.some((n) => n.id === 'notif-res-res-notif-1')).toBe(true);
    expect(notifs.some((n) => n.id === 'notif-res-res-notif-2')).toBe(true);
    expect(notifs.some((n) => n.id === 'notif-ann-ann-notif-1')).toBe(true);
  });

  it('tracks unread notification count accurately', () => {
    const notifs = getStudentNotifications(mockResources, mockAnnouncements);
    const initialUnread = getUnreadNotificationCount(notifs);
    expect(initialUnread).toBe(3);

    // Mark 1 as read
    markNotificationAsRead('notif-res-res-notif-1');
    const updatedNotifs = getStudentNotifications(mockResources, mockAnnouncements);
    expect(getUnreadNotificationCount(updatedNotifs)).toBe(2);

    // Mark all as read
    markAllNotificationsAsRead(updatedNotifs);
    const finalNotifs = getStudentNotifications(mockResources, mockAnnouncements);
    expect(getUnreadNotificationCount(finalNotifs)).toBe(0);
  });

  it('sets priority badge for pinned announcements', () => {
    const notifs = getStudentNotifications(mockResources, mockAnnouncements);
    const annNotif = notifs.find((n) => n.id === 'notif-ann-ann-notif-1');
    expect(annNotif?.priority).toBe(true);
    expect(annNotif?.badgeLabel).toBe('EXAM');
  });
});

