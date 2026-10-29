// ==============================================================================
// HAMMAD STUDYHUB — UNIT TESTS: DATE & UTILITY FUNCTIONS
// ==============================================================================

import { describe, it, expect } from 'vitest';
import {
  formatLessonDate,
  slugify,
  groupResourcesByDate,
  formatRelativeTime,
} from '../lib/utils';
import { Resource } from '../types';

describe('Date Formatting Utilities', () => {
  it('formats YYYY-MM-DD date string reliably without timezone offset bugs', () => {
    const formatted = formatLessonDate('2026-10-25', { format: 'short' });
    expect(formatted).toBe('Oct 25, 2026');

    const withDay = formatLessonDate('2026-10-25', { includeDayOfWeek: true });
    expect(withDay).toBe('Sunday, Oct 25, 2026');
  });

  it('handles empty or malformed date strings gracefully', () => {
    expect(formatLessonDate('')).toBe('');
    expect(formatLessonDate('invalid')).toBe('invalid');
  });

  it('formats relative time reasonably', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('Just now');
  });
});

describe('URL Slug Generator', () => {
  it('generates clean URL slugs', () => {
    expect(slugify('Computer Programming & Problem Solving')).toBe('computer-programming-and-problem-solving');
    expect(slugify('Digital Logic Design: Midterm Past Papers!')).toBe('digital-logic-design-midterm-past-papers');
    expect(slugify('  CS 101 - Algorithms  ')).toBe('cs-101-algorithms');
  });
});

describe('Resource Grouping by Lesson Date', () => {
  it('groups resources into descending chronological date buckets', () => {
    const mockResources: Partial<Resource>[] = [
      { id: '1', title: 'Lesson A', lesson_date: '2026-10-20' },
      { id: '2', title: 'Lesson B', lesson_date: '2026-10-25' },
      { id: '3', title: 'Lesson C', lesson_date: '2026-10-25' },
      { id: '4', title: 'Lesson D', lesson_date: '2026-10-22' },
    ];

    const grouped = groupResourcesByDate(mockResources as Resource[]);

    expect(grouped.length).toBe(3);
    // Newest date first
    expect(grouped[0].date).toBe('2026-10-25');
    expect(grouped[0].resources.length).toBe(2);

    expect(grouped[1].date).toBe('2026-10-22');
    expect(grouped[1].resources.length).toBe(1);

    expect(grouped[2].date).toBe('2026-10-20');
    expect(grouped[2].resources.length).toBe(1);
  });
});
