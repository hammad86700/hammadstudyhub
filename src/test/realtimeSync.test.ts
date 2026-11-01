// ==============================================================================
// HAMMAD STUDYHUB — MULTI-DEVICE REALTIME SYNC UNIT TESTS
// Verifies real-time event broadcasting, hydration, and cross-device sync
// ==============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  handleIncomingSyncEvent,
  broadcastDataChange,
  DEVICE_ID,
  RealtimeSyncPayload,
} from '../lib/realtimeSync';
import {
  getDemoResources,
  saveDemoResource,
  getDemoSubjects,
  getDemoAnnouncements,
  getRegisteredStudents,
  registerStudent,
  resetDemoResourcesCache,
} from '../lib/demoStore';
import { Resource, Subject, Announcement } from '../types';

describe('Multi-Device Real-Time Synchronization Engine', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    resetDemoResourcesCache();
    queryClient = new QueryClient();
    vi.spyOn(queryClient, 'invalidateQueries');
  });

  it('1. Hydrates and updates local resources when receiving remote resource creation', () => {
    const remoteResource: Resource = {
      id: 'res-sync-mobile-001',
      title: 'Mobile Uploaded Lecture - CS-DLD',
      slug: 'mobile-uploaded-lecture-cs-dld',
      subject_id: 'sub-dld-001',
      resource_type: 'pdf',
      status: 'published',
      source_provider: 'direct_url',
      external_url: '',
      tags: [],
      lesson_date: '2026-11-01',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const payload: RealtimeSyncPayload = {
      entity: 'resources',
      action: 'create',
      data: remoteResource,
      senderDeviceId: 'mobile-phone-device-xyz',
      timestamp: new Date().toISOString(),
    };

    let eventFired = false;
    const listener = () => {
      eventFired = true;
    };
    window.addEventListener('studyhub_resources_updated', listener);

    handleIncomingSyncEvent(payload, queryClient);

    expect(eventFired).toBe(true);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['resources'] });

    const localList = getDemoResources();
    const found = localList.find((r) => r.id === 'res-sync-mobile-001');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Mobile Uploaded Lecture - CS-DLD');

    window.removeEventListener('studyhub_resources_updated', listener);
  });

  it('2. Deletes local resource when receiving remote delete broadcast', () => {
    const initialResource: Resource = {
      id: 'res-to-delete-123',
      title: 'Resource To Delete',
      slug: 'resource-to-delete',
      subject_id: 'sub-dld-001',
      resource_type: 'pdf',
      status: 'published',
      source_provider: 'direct_url',
      external_url: '',
      tags: [],
      lesson_date: '2026-11-01',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveDemoResource(initialResource);
    expect(getDemoResources().some((r) => r.id === 'res-to-delete-123')).toBe(true);

    const deletePayload: RealtimeSyncPayload = {
      entity: 'resources',
      action: 'delete',
      id: 'res-to-delete-123',
      senderDeviceId: 'mobile-phone-device-xyz',
      timestamp: new Date().toISOString(),
    };

    handleIncomingSyncEvent(deletePayload, queryClient);

    expect(getDemoResources().some((r) => r.id === 'res-to-delete-123')).toBe(false);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['resources'] });
  });

  it('3. Syncs subjects created from mobile to laptop store', () => {
    const remoteSubject: Subject = {
      id: 'sub-remote-999',
      name: 'Mobile Added Subject - Mobile Dev',
      code: 'CS-MDEV',
      slug: 'cs-mdev',
      description: 'Mobile App Development course added from phone',
      icon: 'book',
      color: 'blue',
      is_active: true,
      sort_order: 1,
      is_featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const payload: RealtimeSyncPayload = {
      entity: 'subjects',
      action: 'create',
      data: remoteSubject,
      senderDeviceId: 'mobile-phone-device-xyz',
      timestamp: new Date().toISOString(),
    };

    handleIncomingSyncEvent(payload, queryClient);

    const subjects = getDemoSubjects();
    expect(subjects.some((s) => s.id === 'sub-remote-999')).toBe(true);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['subjects'] });
  });

  it('4. Syncs announcements posted on mobile to laptop', () => {
    const remoteAnnouncement: Announcement = {
      id: 'ann-sync-999',
      title: 'Emergency Class Rescheduled to Hall 3',
      body: 'Today class is moved to Hall 3 due to seminar.',
      category: 'schedule',
      status: 'published',
      is_pinned: true,
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const payload: RealtimeSyncPayload = {
      entity: 'announcements',
      action: 'create',
      data: remoteAnnouncement,
      senderDeviceId: 'mobile-phone-device-xyz',
      timestamp: new Date().toISOString(),
    };

    handleIncomingSyncEvent(payload, queryClient);

    const announcements = getDemoAnnouncements();
    expect(announcements.some((a) => a.id === 'ann-sync-999')).toBe(true);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['announcements'] });
  });

  it('5. Syncs student role promotions across devices immediately', () => {
    const student = registerStudent({
      display_name: 'Ahmed Student',
      email: 'ahmed.student@example.com',
      password: 'password123',
      gender: 'male',
      roll_no: 'BSE-22-045',
    });

    expect(student.role).toBe('student');

    // Admin on mobile promotes Ahmed to CR
    const payload: RealtimeSyncPayload = {
      entity: 'students',
      action: 'update',
      data: {
        ...student,
        role: 'cr',
        updated_at: new Date().toISOString(),
      },
      senderDeviceId: 'mobile-phone-device-xyz',
      timestamp: new Date().toISOString(),
    };

    handleIncomingSyncEvent(payload, queryClient);

    const freshStudents = getRegisteredStudents();
    const updated = freshStudents.find((s) => s.id === student.id);
    expect(updated?.role).toBe('cr');
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['students'] });
  });

  it('6. broadcastDataChange dispatches window events and invalidates query client', async () => {
    let fired = false;
    const onResourcesUpdated = () => {
      fired = true;
    };
    window.addEventListener('studyhub_resources_updated', onResourcesUpdated);

    await broadcastDataChange('resources', 'create', {
      id: 'test-res-broadcast',
      title: 'Broadcast Test Resource',
    });

    expect(fired).toBe(true);
    window.removeEventListener('studyhub_resources_updated', onResourcesUpdated);
  });
});
