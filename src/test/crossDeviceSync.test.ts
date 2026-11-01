// ==============================================================================
// HAMMAD STUDYHUB — MULTI-DEVICE CLOUD SYNC & RECONCILIATION TEST SUITE
// Architect: Muhammad Hammad
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  mergeSubjectsLocally,
  mergeResourcesLocally,
  mergeRegisteredStudentsLocally,
  getDemoSubjects,
  getDemoResources,
  getRegisteredStudents,
  saveDemoSubject,
  saveDemoResource,
  deleteDemoResource,
  deleteDemoSubject,
  deleteStudent,
  upsertRegisteredStudentLocally,
  isTombstoned,
  getTombstones,
} from '../lib/demoStore';
import { calculateStorageMetrics } from '../lib/storageMetrics';
import { Subject, Resource } from '../types';
import handler from '../../api/sync';

describe('Cross-Device Real-Time Cloud Synchronization & Data Reconciliation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Reconciles Desktop (2 subjects) and Mobile (1 subject) into 2 unified subjects on both devices without data loss', () => {
    // Desktop initial state: Has 2 subjects
    const desktopSubject1: Subject = {
      id: 'subj-english',
      name: 'Functional English',
      slug: 'functional-english',
      code: 'CS-FUNC ENGLISH',
      description: 'Communication and grammar skills',
      icon: 'BookOpen',
      color: 'blue',
      is_featured: true,
      is_active: true,
      sort_order: 1,
      created_at: '2026-11-01T10:00:00Z',
      updated_at: '2026-11-01T10:00:00Z',
    };

    const desktopSubject2: Subject = {
      id: 'subj-programming',
      name: 'Programming Fundamentals',
      slug: 'programming-fundamentals',
      code: 'CS-101',
      description: 'Intro to C++ programming',
      icon: 'Code',
      color: 'emerald',
      is_featured: true,
      is_active: true,
      sort_order: 2,
      created_at: '2026-11-01T11:00:00Z',
      updated_at: '2026-11-01T11:00:00Z',
    };

    saveDemoSubject(desktopSubject1);
    saveDemoSubject(desktopSubject2);
    expect(getDemoSubjects().length).toBe(2);

    // Mobile initial state: Has only Subject 1
    const mobileSubjects: Subject[] = [desktopSubject1];

    // Merge incoming mobile state onto desktop: both subjects must remain intact
    const mergedOnDesktop = mergeSubjectsLocally(mobileSubjects);
    expect(mergedOnDesktop.length).toBe(2);
    expect(mergedOnDesktop.some((s) => s.id === 'subj-english')).toBe(true);
    expect(mergedOnDesktop.some((s) => s.id === 'subj-programming')).toBe(true);

    // Clear and simulate mobile device receiving desktop's 2 subjects
    localStorage.clear();
    saveDemoSubject(desktopSubject1);
    expect(getDemoSubjects().length).toBe(1);

    const mergedOnMobile = mergeSubjectsLocally([desktopSubject1, desktopSubject2]);
    expect(mergedOnMobile.length).toBe(2);
    expect(mergedOnMobile.some((s) => s.id === 'subj-programming')).toBe(true);
  });

  it('2. Reconciles Desktop (1 resource) and Mobile (3 resources) into 3 unified published resources on both devices', () => {
    // Desktop initial state: 1 Resource (PDF, 699.6 KB)
    const resource1: Resource = {
      id: 'res-pdf-lecture-1',
      subject_id: 'subj-english',
      title: 'Functional English Handout 1',
      slug: 'functional-english-handout-1',
      resource_type: 'pdf',
      lesson_date: '2026-11-01',
      status: 'published',
      file_name: 'English_Handout_01.pdf',
      file_size: '699.6 KB',
      mime_type: 'application/pdf',
      source_provider: 'supabase_storage',
      external_url: '',
      tags: ['english'],
      created_at: '2026-11-01T12:00:00Z',
      updated_at: '2026-11-01T12:00:00Z',
    };

    saveDemoResource(resource1);
    expect(getDemoResources().length).toBe(1);

    // Mobile initial state: Has Resource 1 + Resource 2 + Resource 3 (Total 3 resources, ~7.87 MB)
    const resource2: Resource = {
      id: 'res-pdf-lecture-2',
      subject_id: 'subj-english',
      title: 'Grammar and Syntax Handout',
      slug: 'grammar-and-syntax-handout',
      resource_type: 'pdf',
      lesson_date: '2026-11-01',
      status: 'published',
      file_name: 'Grammar_Notes.pdf',
      file_size: '3.5 MB',
      mime_type: 'application/pdf',
      source_provider: 'supabase_storage',
      external_url: '',
      tags: ['grammar'],
      created_at: '2026-11-01T13:00:00Z',
      updated_at: '2026-11-01T13:00:00Z',
    };

    const resource3: Resource = {
      id: 'res-pdf-lecture-3',
      subject_id: 'subj-english',
      title: 'Vocabulary & Comprehension Guide',
      slug: 'vocabulary-comprehension-guide',
      resource_type: 'pdf',
      lesson_date: '2026-11-01',
      status: 'published',
      file_name: 'Vocab_Guide.pdf',
      file_size: '3.7 MB',
      mime_type: 'application/pdf',
      source_provider: 'supabase_storage',
      external_url: '',
      tags: ['vocab'],
      created_at: '2026-11-01T14:00:00Z',
      updated_at: '2026-11-01T14:00:00Z',
    };

    const mobileResources = [resource1, resource2, resource3];

    // Merge mobile's resources into desktop: desktop now has all 3 resources!
    const mergedOnDesktop = mergeResourcesLocally(mobileResources);
    expect(mergedOnDesktop.length).toBe(3);
    expect(mergedOnDesktop.filter((r) => r.status === 'published').length).toBe(3);

    // Calculate storage metrics on all 3 resources
    const metrics = calculateStorageMetrics(mergedOnDesktop, []);
    expect(metrics.totalFilesCount).toBe(3);
    expect(metrics.totalUsedBytes).toBeGreaterThan(7 * 1024 * 1024); // ~7.87 MB
  });

  it('3. Reconciles Desktop (1 student) and Mobile (2 students) into 2 registered students on both devices', () => {
    // Desktop initial state: 1 registered student
    const student1 = {
      id: 'student-hammad',
      display_name: 'Muhammad Hammad',
      email: 'admin123@gmail.com',
      role: 'admin' as const,
      gender: 'male' as const,
      created_at: '2026-10-30T10:00:00Z',
      updated_at: '2026-10-30T10:00:00Z',
    };

    upsertRegisteredStudentLocally(student1);
    expect(getRegisteredStudents().length).toBe(1);

    // Mobile initial state: 2 registered students (including M Ali)
    const student2 = {
      id: 'student-ali',
      display_name: 'M Ali',
      email: 'm.ali@example.com',
      role: 'student' as const,
      gender: 'male' as const,
      created_at: '2026-11-01T15:00:00Z',
      updated_at: '2026-11-01T15:00:00Z',
    };

    const mergedStudents = mergeRegisteredStudentsLocally([student1, student2]);
    expect(mergedStudents.length).toBe(2);
    expect(mergedStudents.some((s) => s.display_name === 'M Ali')).toBe(true);
    expect(mergedStudents.some((s) => s.display_name === 'Muhammad Hammad')).toBe(true);
  });

  it('4. Serverless /api/sync endpoint correctly handles CORS preflight and merges datasets', async () => {
    let statusCode = 0;
    let responseData: any = null;
    const headers: Record<string, string> = {};

    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        responseData = data;
      },
      end() {},
      setHeader(k: string, v: string) {
        headers[k] = v;
      },
    };

    // 1. Test OPTIONS preflight
    await handler({ method: 'OPTIONS' } as any, mockRes);
    expect(statusCode).toBe(200);
    expect(headers['Access-Control-Allow-Origin']).toBe('*');

    // 2. Test POST sync with subjects and resources
    const testSubject = {
      id: 'sync-test-sub-1',
      name: 'Sync Test Subject',
      code: 'STS-101',
      created_at: new Date().toISOString(),
    };

    const testResource = {
      id: 'sync-test-res-1',
      title: 'Sync Test Resource',
      subject_id: 'sync-test-sub-1',
      status: 'published',
      created_at: new Date().toISOString(),
    };

    await handler(
      {
        method: 'POST',
        body: {
          action: 'sync',
          subjects: [testSubject],
          resources: [testResource],
          broadcast: false, // Don't trigger external network call in unit test
        },
      } as any,
      mockRes
    );

    expect(statusCode).toBe(200);
    expect(responseData?.success).toBe(true);
    expect(responseData?.snapshot?.subjects?.some((s: any) => s.id === 'sync-test-sub-1')).toBe(true);
    expect(responseData?.snapshot?.resources?.some((r: any) => r.id === 'sync-test-res-1')).toBe(true);
  });

  it('5. Permanently deletes resources across all devices using tombstones and prevents resurrection during sync', () => {
    // 1. Create a study resource
    const sampleResource: Resource = {
      id: 'res-perm-delete-test',
      subject_id: 'subj-english',
      title: 'Permanent Deletion Test PDF',
      slug: 'permanent-deletion-test-pdf',
      resource_type: 'pdf',
      lesson_date: '2026-11-01',
      status: 'published',
      file_name: 'test.pdf',
      file_size: '1.2 MB',
      mime_type: 'application/pdf',
      source_provider: 'supabase_storage',
      external_url: '',
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveDemoResource(sampleResource);
    expect(getDemoResources().some((r) => r.id === 'res-perm-delete-test')).toBe(true);

    // 2. Admin permanently deletes the resource
    deleteDemoResource('res-perm-delete-test');

    // 3. Verify it is removed from local store and tombstoned
    expect(getDemoResources().some((r) => r.id === 'res-perm-delete-test')).toBe(false);
    expect(isTombstoned('res-perm-delete-test')).toBe(true);

    // 4. Simulate an offline device sending the old deleted resource during sync
    const merged = mergeResourcesLocally([sampleResource]);

    // 5. Must NOT resurrect the deleted resource
    expect(merged.some((r) => r.id === 'res-perm-delete-test')).toBe(false);
    expect(getDemoResources().some((r) => r.id === 'res-perm-delete-test')).toBe(false);
  });

  it('6. Deleting a subject cascades permanent deletions to all associated resources and wipes storage', () => {
    const parentSubject: Subject = {
      id: 'subj-cascade-parent',
      name: 'Calculus & Analytical Geometry',
      slug: 'calculus-analytical-geometry',
      code: 'MATH-101',
      description: 'Mathematics coursework',
      icon: 'BookOpen',
      color: 'blue',
      is_featured: true,
      is_active: true,
      sort_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const childResource1: Resource = {
      id: 'res-calc-ch1',
      subject_id: 'subj-cascade-parent',
      title: 'Calculus Chapter 1 Derivatives',
      slug: 'calculus-ch1-derivatives',
      resource_type: 'pdf',
      lesson_date: '2026-11-01',
      status: 'published',
      file_name: 'Derivatives.pdf',
      file_size: '2.0 MB',
      mime_type: 'application/pdf',
      source_provider: 'supabase_storage',
      external_url: '',
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const childResource2: Resource = {
      id: 'res-calc-ch2',
      subject_id: 'subj-cascade-parent',
      title: 'Calculus Chapter 2 Integrals',
      slug: 'calculus-ch2-integrals',
      resource_type: 'pdf',
      lesson_date: '2026-11-01',
      status: 'published',
      file_name: 'Integrals.pdf',
      file_size: '3.0 MB',
      mime_type: 'application/pdf',
      source_provider: 'supabase_storage',
      external_url: '',
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveDemoSubject(parentSubject);
    saveDemoResource(childResource1);
    saveDemoResource(childResource2);

    expect(getDemoSubjects().some((s) => s.id === 'subj-cascade-parent')).toBe(true);
    expect(getDemoResources().filter((r) => r.subject_id === 'subj-cascade-parent').length).toBe(2);

    // Admin permanently deletes the parent subject
    deleteDemoSubject('subj-cascade-parent');

    // Both parent subject and all its children must be permanently deleted and tombstoned
    expect(getDemoSubjects().some((s) => s.id === 'subj-cascade-parent')).toBe(false);
    expect(isTombstoned('subj-cascade-parent')).toBe(true);
    expect(getDemoResources().filter((r) => r.subject_id === 'subj-cascade-parent').length).toBe(0);
    expect(isTombstoned('res-calc-ch1')).toBe(true);
    expect(isTombstoned('res-calc-ch2')).toBe(true);

    // Storage metrics should reflect 0 files for this subject
    const metrics = calculateStorageMetrics(getDemoResources(), getDemoSubjects());
    expect(metrics.totalFilesCount).toBe(0);
  });
});
