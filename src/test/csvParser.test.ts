// ==============================================================================
// HAMMAD STUDYHUB — UNIT TESTS: CSV BULK IMPORT PARSER
// ==============================================================================

import { describe, it, expect } from 'vitest';
import { parseResourcesCSV } from '../lib/utils';

describe('CSV Bulk Resource Parser', () => {
  it('correctly parses valid CSV rows into resources', () => {
    const csvContent = `Title,Subject,Type,Lesson Date,Topic,Chapter,Tags,Status,External URL
"Lesson 01 Notes","Computer Programming",pdf,2026-10-25,"Basic Concepts","Chapter 1","intro;c++",published,"https://drive.google.com/file/d/1sample_link/view"
"Lesson 02 Video","Computer Programming",video,2026-10-27,"Loops Analysis","Chapter 2","loops",published,"https://www.youtube.com/watch?v=sample12345"`;

    const parsed = parseResourcesCSV(csvContent, 'subj-default');

    expect(parsed.length).toBe(2);
    expect(parsed[0].isValid).toBe(true);
    expect(parsed[0].data?.title).toBe('Lesson 01 Notes');
    expect(parsed[0].data?.resource_type).toBe('pdf');
    expect(parsed[0].data?.lesson_date).toBe('2026-10-25');
    expect(parsed[0].data?.tags).toEqual(['intro', 'c++']);

    expect(parsed[1].isValid).toBe(true);
    expect(parsed[1].data?.resource_type).toBe('video');
  });

  it('flags rows with missing required titles or URLs', () => {
    const csvContent = `Title,Subject,Type,Lesson Date,Topic,Chapter,Tags,Status,External URL
"","Computer Programming",pdf,2026-10-25,"","","",published,""`;

    const parsed = parseResourcesCSV(csvContent, 'subj-default');

    expect(parsed.length).toBe(1);
    expect(parsed[0].isValid).toBe(false);
    expect(parsed[0].errors).toContain('Title is required.');
    expect(parsed[0].errors).toContain('External URL is required.');
  });

  it('rejects invalid resource types and invalid date formats', () => {
    const csvContent = `Title,Subject,Type,Lesson Date,Topic,Chapter,Tags,Status,External URL
"Sample Note","Subject",invalid_type,25-10-2026,"","","",published,"https://drive.google.com/file/d/123/view"`;

    const parsed = parseResourcesCSV(csvContent, 'subj-default');

    expect(parsed.length).toBe(1);
    expect(parsed[0].isValid).toBe(false);
    expect(parsed[0].errors.some((e) => e.includes('Invalid resource type'))).toBe(true);
    expect(parsed[0].errors).toContain('Lesson date must be in YYYY-MM-DD format.');
  });
});
