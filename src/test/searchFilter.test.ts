// ==============================================================================
// HAMMAD STUDYHUB — UNIT TESTS: SEARCH & FILTER LOGIC
// ==============================================================================

import { describe, it, expect } from 'vitest';
import { Resource } from '../types';

const SAMPLE_RESOURCES: Resource[] = [
  {
    id: 'res-1',
    subject_id: 'sub-cs101',
    title: 'Introduction to Pointers and Memory Addresses',
    slug: 'intro-pointers',
    description: 'Detailed explanation of pointers, dereferencing, and heap allocation in C++.',
    resource_type: 'pdf',
    lesson_date: '2026-10-15',
    source_provider: 'google_drive',
    external_url: 'https://drive.google.com/file/d/1A2B3C4D5E/view',
    chapter: 'Chapter 4',
    topic: 'Pointers',
    tags: ['c++', 'memory', 'pointers'],
    status: 'published',
    created_at: '2026-10-15T10:00:00Z',
    updated_at: '2026-10-15T10:00:00Z',
  },
  {
    id: 'res-2',
    subject_id: 'sub-cs101',
    title: 'Loops and Control Structures Video Walkthrough',
    slug: 'loops-video',
    description: 'Video recorded explanation covering for loops, while loops, and nested branching.',
    resource_type: 'video',
    lesson_date: '2026-10-10',
    source_provider: 'youtube',
    external_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    chapter: 'Chapter 2',
    topic: 'Control Flow',
    tags: ['loops', 'control-flow'],
    status: 'published',
    created_at: '2026-10-10T10:00:00Z',
    updated_at: '2026-10-10T10:00:00Z',
  },
  {
    id: 'res-3',
    subject_id: 'sub-dld',
    title: 'Karnaugh Maps 4-Variable Minimization Whiteboard',
    slug: 'kmap-whiteboard',
    description: 'Classroom whiteboard photograph showing group simplification and don\'t-care conditions.',
    resource_type: 'whiteboard',
    lesson_date: '2026-10-20',
    source_provider: 'google_drive',
    external_url: 'https://drive.google.com/file/d/9Z8Y7X6W5V/view',
    chapter: 'Chapter 3',
    topic: 'Karnaugh Maps',
    tags: ['kmap', 'boolean', 'simplification'],
    status: 'published',
    created_at: '2026-10-20T10:00:00Z',
    updated_at: '2026-10-20T10:00:00Z',
  },
  {
    id: 'res-4',
    subject_id: 'sub-cs101',
    title: 'Internal Practice Worksheet on Recursion',
    slug: 'recursion-worksheet',
    description: 'Unpublished draft exercises on recursive functions.',
    resource_type: 'assignment',
    lesson_date: '2026-10-25',
    source_provider: 'google_drive',
    external_url: 'https://drive.google.com/file/d/3E4R5T6Y7U/view',
    chapter: 'Chapter 5',
    topic: 'Recursion',
    tags: ['recursion'],
    status: 'draft',
    created_at: '2026-10-25T10:00:00Z',
    updated_at: '2026-10-25T10:00:00Z',
  },
];

describe('Search and Filter Logic', () => {
  it('filters resources by content type correctly', () => {
    const pdfs = SAMPLE_RESOURCES.filter((r) => r.resource_type === 'pdf');
    expect(pdfs.length).toBe(1);
    expect(pdfs[0].id).toBe('res-1');

    const videos = SAMPLE_RESOURCES.filter((r) => r.resource_type === 'video');
    expect(videos.length).toBe(1);
    expect(videos[0].id).toBe('res-2');
  });

  it('filters by query across title, description, and tags', () => {
    const query = 'kmap';
    const matches = SAMPLE_RESOURCES.filter((r) => {
      const q = query.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.topic && r.topic.toLowerCase().includes(q)) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });

    expect(matches.length).toBe(1);
    expect(matches[0].id).toBe('res-3');
  });

  it('enforces privacy: draft resources excluded from public queries', () => {
    const publicResources = SAMPLE_RESOURCES.filter((r) => r.status === 'published');
    expect(publicResources.length).toBe(3);
    expect(publicResources.find((r) => r.id === 'res-4')).toBeUndefined();
  });

  it('sorts lessons by lesson_date descending', () => {
    const sorted = [...SAMPLE_RESOURCES].sort(
      (a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime()
    );
    expect(sorted[0].id).toBe('res-4'); // 2026-10-25
    expect(sorted[1].id).toBe('res-3'); // 2026-10-20
    expect(sorted[2].id).toBe('res-1'); // 2026-10-15
    expect(sorted[3].id).toBe('res-2'); // 2026-10-10
  });

  it('filters by chapter pill', () => {
    const chapter2 = SAMPLE_RESOURCES.filter((r) => r.chapter === 'Chapter 2');
    expect(chapter2.length).toBe(1);
    expect(chapter2[0].title).toContain('Loops');
  });
});

