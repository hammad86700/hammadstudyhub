// ==============================================================================
// HAMMAD STUDYHUB — RESOURCE ACCESS & DOWNLOAD ACTIONS TESTS
// Tests both student options: Direct Online Preview and Direct File Download
// ==============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getResourceFileUrl,
  getDownloadFileName,
  canPreviewDirectly,
  isOfficeDocument,
  openResourceOnline,
  downloadResourceFile,
} from '../lib/resourceActions';
import { Resource } from '../types';

describe('Resource Access & Dual Student Options', () => {
  const mockResourcePdf: Resource = {
    id: 'res-101',
    subject_id: 'sub-dld',
    title: 'Digital Logic Design Handouts',
    slug: 'digital-logic-design-handouts',
    resource_type: 'pdf',
    lesson_date: '2026-11-01',
    source_provider: 'supabase_storage',
    external_url: '',
    file_name: 'DLD_Lecture_1.pdf',
    file_size: '2.50 MB',
    file_data: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr',
    tags: ['dld', 'handout'],
    status: 'published',
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
  };

  const mockResourceDocx: Resource = {
    id: 'res-102',
    subject_id: 'sub-eng',
    title: 'Functional English Syllabus',
    slug: 'functional-english-syllabus',
    resource_type: 'pdf',
    lesson_date: '2026-11-01',
    source_provider: 'supabase_storage',
    external_url: '',
    file_name: 'English_Course_Outline.docx',
    file_size: '1.20 MB',
    file_data: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQAA',
    tags: ['syllabus'],
    status: 'published',
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof window !== 'undefined') {
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/fake-blob');
      window.URL.revokeObjectURL = vi.fn();
    }
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('correctly retrieves resource file url from file_data or external_url', () => {
    expect(getResourceFileUrl(mockResourcePdf)).toBe('data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr');
  });

  it('determines if file is an office document', () => {
    expect(isOfficeDocument('lecture.docx')).toBe(true);
    expect(isOfficeDocument('slides.pptx')).toBe(true);
    expect(isOfficeDocument('grades.xlsx')).toBe(true);
    expect(isOfficeDocument('notes.pdf')).toBe(false);
    expect(isOfficeDocument('diagram.png')).toBe(false);
  });

  it('determines if file can be previewed directly in browser', () => {
    expect(canPreviewDirectly(mockResourcePdf)).toBe(true);
    expect(canPreviewDirectly({ ...mockResourcePdf, resource_type: 'video' })).toBe(true);
    expect(canPreviewDirectly({ ...mockResourcePdf, file_name: 'archive.zip', resource_type: 'other' })).toBe(false);
  });

  it('generates the appropriate download filename', () => {
    expect(getDownloadFileName(mockResourcePdf)).toBe('DLD_Lecture_1.pdf');
    expect(getDownloadFileName(mockResourceDocx)).toBe('English_Course_Outline.docx');

    const noNameRes: Resource = {
      ...mockResourcePdf,
      file_name: undefined,
      title: 'Midterm Past Papers 2026',
    };
    expect(getDownloadFileName(noNameRes)).toBe('midterm-past-papers-2026.pdf');
  });

  it('triggers window.open for OPTION 1 (View Online)', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as any);
    openResourceOnline(mockResourcePdf);
    expect(openSpy).toHaveBeenCalled();
  });

  it('triggers download for OPTION 2 (Download File)', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    downloadResourceFile(mockResourcePdf);

    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });
});
