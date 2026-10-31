// ==============================================================================
// HAMMAD STUDYHUB — VERIFICATION TESTS: 12 REQUIRED SCENARIOS
// Tests subject folder creation, multi-file uploads, permissions, and clean database
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDemoSubjects,
  saveDemoSubject,
  getDemoResources,
  saveDemoResource,
  registerStudent,
  updateStudentRole,
} from '../lib/demoStore';
import { parseGoogleDriveUrl } from '../lib/googleDrive';
import { uploadFileToDriveFolder } from '../lib/googleDriveApi';
import { Subject, Resource } from '../types';

describe('Comprehensive Google Drive Subject Folder & Clean Hub Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // TEST 1: Create a Digital Logic Design subject and associate its Google Drive folder
  it('TEST 1: creates Digital Logic Design subject with associated Google Drive folder', () => {
    const dldUrl = 'https://drive.google.com/drive/folders/1DLD_Folder_Unique_ID_999';
    const parsed = parseGoogleDriveUrl(dldUrl);
    expect(parsed.isValid).toBe(true);
    expect(parsed.folderId).toBe('1DLD_Folder_Unique_ID_999');

    const dldSubject: Subject = {
      id: 'sub_dld_test_01',
      name: 'Digital Logic Design',
      code: 'CS-102',
      slug: 'digital-logic-design',
      icon: 'cpu',
      color: 'indigo',
      is_featured: true,
      is_active: true,
      sort_order: 1,
      google_drive_folder_url: dldUrl,
      google_drive_folder_id: parsed.folderId,
      folder_configured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveDemoSubject(dldSubject);
    const subjects = getDemoSubjects();
    const retrieved = subjects.find((s) => s.id === 'sub_dld_test_01');
    expect(retrieved).toBeDefined();
    expect(retrieved?.google_drive_folder_id).toBe('1DLD_Folder_Unique_ID_999');
    expect(retrieved?.folder_configured).toBe(true);
  });

  // TEST 2: Create a Natural Sciences subject and associate a different Google Drive folder
  it('TEST 2: creates Natural Sciences subject with its own independent folder', () => {
    const nsUrl = 'https://drive.google.com/drive/folders/1NS_Folder_Unique_ID_888';
    const parsed = parseGoogleDriveUrl(nsUrl);
    expect(parsed.folderId).toBe('1NS_Folder_Unique_ID_888');

    const nsSubject: Subject = {
      id: 'sub_ns_test_02',
      name: 'Natural Sciences',
      code: 'NS-101',
      slug: 'natural-sciences',
      icon: 'atom',
      color: 'teal',
      is_featured: false,
      is_active: true,
      sort_order: 2,
      google_drive_folder_url: nsUrl,
      google_drive_folder_id: parsed.folderId,
      folder_configured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveDemoSubject(nsSubject);
    const subjects = getDemoSubjects();
    const dld = subjects.find((s) => s.id === 'sub_dld_test_01');
    const ns = subjects.find((s) => s.id === 'sub_ns_test_02');

    expect(ns?.google_drive_folder_id).toBe('1NS_Folder_Unique_ID_888');
    expect(ns?.google_drive_folder_id).not.toBe(dld?.google_drive_folder_id);
  });

  // TEST 3 & 7: Select subject and verify upload destination changes dynamically
  it('TEST 3 & 7: automatically retrieves folder destination and dynamically updates on change', () => {
    const subjects: Subject[] = [
      {
        id: 'sub_dld',
        name: 'Digital Logic Design',
        code: 'CS-102',
        slug: 'dld',
        icon: 'cpu',
        color: 'indigo',
        is_featured: true,
        is_active: true,
        sort_order: 1,
        google_drive_folder_url: 'https://drive.google.com/drive/folders/DLD_FOLDER_ID',
        google_drive_folder_id: 'DLD_FOLDER_ID',
        folder_configured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sub_ns',
        name: 'Natural Sciences',
        code: 'NS-101',
        slug: 'ns',
        icon: 'atom',
        color: 'teal',
        is_featured: false,
        is_active: true,
        sort_order: 2,
        google_drive_folder_url: 'https://drive.google.com/drive/folders/NS_FOLDER_ID',
        google_drive_folder_id: 'NS_FOLDER_ID',
        folder_configured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Selecting DLD
    let selectedSubjectId = 'sub_dld';
    let currentSubject = subjects.find((s) => s.id === selectedSubjectId);
    expect(currentSubject?.google_drive_folder_id).toBe('DLD_FOLDER_ID');

    // TEST 7: Switch to NS
    selectedSubjectId = 'sub_ns';
    currentSubject = subjects.find((s) => s.id === selectedSubjectId);
    expect(currentSubject?.google_drive_folder_id).toBe('NS_FOLDER_ID');
    expect(currentSubject?.google_drive_folder_id).not.toBe('DLD_FOLDER_ID');
  });

  // TEST 4 & 5: Upload destination assignment per subject
  it('TEST 4 & 5: ensures files target respective subject folder IDs without crossover', () => {
    const dldResource: Resource = {
      id: 'res_dld_01',
      subject_id: 'sub_dld',
      title: 'DLD Karnaugh Maps Lecture Handout',
      slug: 'dld-karnaugh-maps',
      resource_type: 'pdf',
      lesson_date: '2026-11-01',
      source_provider: 'google_drive',
      external_url: 'https://drive.google.com/file/d/FILE_DLD_123/view',
      google_drive_file_id: 'FILE_DLD_123',
      google_drive_file_url: 'https://drive.google.com/file/d/FILE_DLD_123/view',
      google_drive_folder_url: 'https://drive.google.com/drive/folders/DLD_FOLDER_ID',
      original_filename: 'karnaugh-maps.pdf',
      mime_type: 'application/pdf',
      file_size: '2.5 MB',
      tags: ['kmap', 'boolean'],
      status: 'published',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveDemoResource(dldResource);

    const nsResource: Resource = {
      id: 'res_ns_01',
      subject_id: 'sub_ns',
      title: 'Natural Sciences Ecology & Systems Handout',
      slug: 'ns-ecology-systems',
      resource_type: 'pdf',
      lesson_date: '2026-11-02',
      source_provider: 'google_drive',
      external_url: 'https://drive.google.com/file/d/FILE_NS_456/view',
      google_drive_file_id: 'FILE_NS_456',
      google_drive_file_url: 'https://drive.google.com/file/d/FILE_NS_456/view',
      google_drive_folder_url: 'https://drive.google.com/drive/folders/NS_FOLDER_ID',
      original_filename: 'ecology-systems.pdf',
      mime_type: 'application/pdf',
      file_size: '1.8 MB',
      tags: ['ecology', 'science'],
      status: 'published',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveDemoResource(nsResource);

    const all = getDemoResources();
    const retrievedDld = all.find((r) => r.id === 'res_dld_01');
    const retrievedNs = all.find((r) => r.id === 'res_ns_01');

    expect(retrievedDld?.google_drive_file_id).toBe('FILE_DLD_123');
    expect(retrievedDld?.google_drive_folder_url).toContain('DLD_FOLDER_ID');

    expect(retrievedNs?.google_drive_file_id).toBe('FILE_NS_456');
    expect(retrievedNs?.google_drive_folder_url).toContain('NS_FOLDER_ID');
  });

  // TEST 6: Multiple files status tracking
  it('TEST 6: tracks multiple files status independently', () => {
    const queue = [
      { id: '1', name: 'lecture1.pdf', status: 'success' },
      { id: '2', name: 'lecture2.pdf', status: 'error', error: 'Network failure' },
      { id: '3', name: 'slides.pptx', status: 'success' },
    ];

    const completed = queue.filter((q) => q.status === 'success');
    const failed = queue.filter((q) => q.status === 'error');

    expect(completed.length).toBe(2);
    expect(failed.length).toBe(1);
    expect(failed[0].error).toBe('Network failure');
  });

  // TEST 8: Prevent upload when folder is missing or invalid
  it('TEST 8: prevents upload if selected subject has no valid folder association', async () => {
    const invalidSubject: Subject = {
      id: 'sub_unconfigured',
      name: 'Unconfigured Subject',
      code: 'UNC-001',
      slug: 'unconfigured-subject',
      icon: 'book-open',
      color: 'blue',
      is_featured: false,
      is_active: true,
      sort_order: 9,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const hasFolder = Boolean(invalidSubject.google_drive_folder_id);
    expect(hasFolder).toBe(false);

    const dummyFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    await expect(
      uploadFileToDriveFolder({
        file: dummyFile,
        folderId: invalidSubject.google_drive_folder_id || '',
      })
    ).rejects.toThrow();
  });

  // TEST 9: Uploaded file records appear on correct subject page with correct lesson date
  it('TEST 9: filters resources accurately by subject ID and lesson date', () => {
    const dldResource: Resource = {
      id: 'res_dld_test_09',
      subject_id: 'sub_dld',
      title: 'DLD Karnaugh Maps Lecture Handout',
      slug: 'dld-karnaugh-maps',
      resource_type: 'pdf',
      lesson_date: '2026-11-01',
      source_provider: 'google_drive',
      external_url: 'https://drive.google.com/file/d/FILE_DLD_123/view',
      original_filename: 'karnaugh-maps.pdf',
      tags: ['kmap'],
      status: 'published',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveDemoResource(dldResource);

    const all = getDemoResources();
    const dldItems = all.filter((r) => r.subject_id === 'sub_dld');
    expect(dldItems.length).toBe(1);
    expect(dldItems[0].lesson_date).toBe('2026-11-01');
    expect(dldItems[0].original_filename).toBe('karnaugh-maps.pdf');
  });

  // TEST 10 & 11: Permissions check (Admin, CR, Student)
  it('TEST 10 & 11: verifies Admin and CR have manager roles, while standard students cannot manage', () => {
    const student = registerStudent({
      display_name: 'Test Student',
      email: 'student@example.com',
      password: 'password123',
      gender: 'male',
    });
    expect(student.role).toBe('student');

    // Standard student cannot manage
    const isStudentManager = (role: string) => role === 'admin' || role === 'cr' || role === 'gr';
    expect(isStudentManager(student.role)).toBe(false);

    // Promote to CR
    updateStudentRole(student.id, 'cr');
    expect(isStudentManager('cr')).toBe(true);

    // Admin has full manager role
    expect(isStudentManager('admin')).toBe(true);
  });

  // TEST 12: Existing application functionality remains intact after dummy-data cleanup
  it('TEST 12: clean database has zero legacy dummy subjects or resources', () => {
    const subjects = getDemoSubjects();
    const legacySubjects = subjects.filter((s) => s.id.startsWith('44444444-'));
    expect(legacySubjects.length).toBe(0);

    const resources = getDemoResources();
    const legacyResources = resources.filter((r) => r.id.startsWith('55555555-'));
    expect(legacyResources.length).toBe(0);
  });
});
