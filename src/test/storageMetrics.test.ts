// ==============================================================================
// HAMMAD STUDYHUB — UNIT TESTS: SYSTEM STORAGE METRICS & ALLOCATION
// ==============================================================================

import { describe, it, expect } from 'vitest';
import {
  parseFileSizeToBytes,
  formatStorageBytes,
  calculateStorageMetrics,
  DEFAULT_STORAGE_LIMIT_BYTES,
} from '../lib/storageMetrics';
import { Resource, Subject } from '../types';

describe('System Storage Metrics & Capacity Monitor', () => {
  it('accurately parses string sizes in B, KB, MB, and GB', () => {
    expect(parseFileSizeToBytes('500 B')).toBe(500);
    expect(parseFileSizeToBytes('2.5 KB')).toBe(2560);
    expect(parseFileSizeToBytes('10 MB')).toBe(10 * 1024 * 1024);
    expect(parseFileSizeToBytes('1.5 GB')).toBe(Math.round(1.5 * 1024 * 1024 * 1024));
    expect(parseFileSizeToBytes(undefined)).toBe(0);
    expect(parseFileSizeToBytes('')).toBe(0);
  });

  it('calculates size from base64 data URL if size string is omitted', () => {
    // 24 characters of base64 = 18 bytes
    const base64Data = 'data:application/pdf;base64,QUJDREVGR0hJSktMTU5PUFFSU1RVVldY';
    const bytes = parseFileSizeToBytes(undefined, base64Data);
    expect(bytes).toBeGreaterThan(0);
  });

  it('formats byte sizes into readable units', () => {
    expect(formatStorageBytes(0)).toBe('0 B');
    expect(formatStorageBytes(512)).toBe('512 B');
    expect(formatStorageBytes(2048)).toBe('2.0 KB');
    expect(formatStorageBytes(5 * 1024 * 1024)).toBe('5.00 MB');
    expect(formatStorageBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.50 GB');
  });

  it('calculates live used, available, and percentage storage metrics accurately', () => {
    const mockSubjects: Subject[] = [
      {
        id: 'sub_dld',
        name: 'Digital Logic Design',
        code: 'CS-DLD',
        slug: 'digital-logic-design',
        icon: 'cpu',
        color: 'indigo',
        is_featured: true,
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sub_fe',
        name: 'Functional English',
        code: 'CS-FE',
        slug: 'functional-english',
        icon: 'book-open',
        color: 'emerald',
        is_featured: false,
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const mockResources: Resource[] = [
      {
        id: 'res_1',
        subject_id: 'sub_dld',
        title: 'DLD Lecture 1: Binary Systems',
        slug: 'dld-lecture-1',
        resource_type: 'pdf',
        lesson_date: '2026-10-25',
        source_provider: 'supabase_storage',
        external_url: '',
        file_name: 'Lecture01.pdf',
        file_size: '2.00 MB',
        status: 'published',
        tags: ['dld'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'res_2',
        subject_id: 'sub_dld',
        title: 'DLD Slides: Boolean Algebra',
        slug: 'dld-slides-2',
        resource_type: 'presentation',
        lesson_date: '2026-10-26',
        source_provider: 'supabase_storage',
        external_url: '',
        file_name: 'BooleanAlgebra.pptx',
        file_size: '3.00 MB',
        status: 'published',
        tags: ['dld'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'res_3',
        subject_id: 'sub_fe',
        title: 'FE Handout: Essay Writing',
        slug: 'fe-handout-1',
        resource_type: 'pdf',
        lesson_date: '2026-10-27',
        source_provider: 'supabase_storage',
        external_url: '',
        file_name: 'EssayWriting.pdf',
        file_size: '5.00 MB',
        status: 'published',
        tags: ['english'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const customLimit = 100 * 1024 * 1024; // 100 MB Limit for test
    const metrics = calculateStorageMetrics(mockResources, mockSubjects, customLimit);

    // Total used = 2 MB + 3 MB + 5 MB = 10 MB
    expect(metrics.totalUsedBytes).toBe(10 * 1024 * 1024);
    expect(metrics.formattedUsed).toBe('10.00 MB');

    // Available = 100 MB - 10 MB = 90 MB
    expect(metrics.availableBytes).toBe(90 * 1024 * 1024);
    expect(metrics.formattedAvailable).toBe('90.00 MB');

    // Percentage = 10%
    expect(metrics.usedPercentage).toBe(10);
    expect(metrics.availablePercentage).toBe(90);
    expect(metrics.totalFilesCount).toBe(3);

    // Format Breakdown
    expect(metrics.byType.pdf.count).toBe(2);
    expect(metrics.byType.pdf.bytes).toBe(7 * 1024 * 1024); // 7 MB
    expect(metrics.byType.presentation.count).toBe(1);
    expect(metrics.byType.presentation.bytes).toBe(3 * 1024 * 1024); // 3 MB

    // Subject Breakdown
    expect(metrics.bySubject.length).toBe(2);
    const dldSubjectStats = metrics.bySubject.find((s) => s.subjectId === 'sub_dld');
    expect(dldSubjectStats?.bytes).toBe(5 * 1024 * 1024); // 5 MB
    expect(dldSubjectStats?.count).toBe(2);
  });
});

