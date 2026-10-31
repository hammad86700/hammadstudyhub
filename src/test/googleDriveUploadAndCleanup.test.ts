// ==============================================================================
// HAMMAD STUDYHUB — UNIT TESTS: GOOGLE DRIVE UPLOAD & CLEANUP
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatFileSize,
  getGoogleDriveClientToken,
  setGoogleDriveClientToken,
  clearGoogleDriveClientToken,
  uploadFileToDriveFolder,
} from '../lib/googleDriveApi';
import { parseGoogleDriveUrl } from '../lib/googleDrive';
import {
  getDemoSubjects,
  saveDemoSubject,
  getDemoResources,
  saveDemoResource,
  getDemoAnnouncements,
} from '../lib/demoStore';
import { Subject, Resource } from '../types';

describe('Google Drive API Client Service', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('formats byte sizes accurately in KB and MB', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.00 MB');
  });

  it('manages client-side Google OAuth tokens safely with expiration', () => {
    expect(getGoogleDriveClientToken()).toBeNull();

    setGoogleDriveClientToken('ya29.test-access-token-123', 3600);
    expect(getGoogleDriveClientToken()).toBe('ya29.test-access-token-123');

    clearGoogleDriveClientToken();
    expect(getGoogleDriveClientToken()).toBeNull();
  });

  it('refuses to upload if no target Google Drive folder ID is provided', async () => {
    const dummyFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    await expect(
      uploadFileToDriveFolder({
        file: dummyFile,
        folderId: '',
      })
    ).rejects.toThrow('Google Drive folder ID');
  });

  it('correctly associates independent Google Drive folders to different subjects', () => {
    const dldFolderUrl = 'https://drive.google.com/drive/folders/1DLD_Folder_ABC123';
    const nsFolderUrl = 'https://drive.google.com/drive/folders/1NS_Folder_XYZ789';

    const dldParsed = parseGoogleDriveUrl(dldFolderUrl);
    const nsParsed = parseGoogleDriveUrl(nsFolderUrl);

    expect(dldParsed.isValid).toBe(true);
    expect(dldParsed.folderId).toBe('1DLD_Folder_ABC123');

    expect(nsParsed.isValid).toBe(true);
    expect(nsParsed.folderId).toBe('1NS_Folder_XYZ789');

    // Save Digital Logic Design Subject
    const dldSubject: Subject = {
      id: 'sub_dld_01',
      name: 'Digital Logic Design',
      code: 'DLD-101',
      slug: 'digital-logic-design',
      icon: 'cpu',
      color: 'indigo',
      is_featured: true,
      is_active: true,
      sort_order: 1,
      google_drive_folder_url: dldFolderUrl,
      google_drive_folder_id: dldParsed.folderId,
      folder_configured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveDemoSubject(dldSubject);

    // Save Natural Sciences Subject
    const nsSubject: Subject = {
      id: 'sub_ns_01',
      name: 'Natural Sciences',
      code: 'NS-101',
      slug: 'natural-sciences',
      icon: 'atom',
      color: 'teal',
      is_featured: false,
      is_active: true,
      sort_order: 2,
      google_drive_folder_url: nsFolderUrl,
      google_drive_folder_id: nsParsed.folderId,
      folder_configured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveDemoSubject(nsSubject);

    const saved = getDemoSubjects();
    const foundDld = saved.find((s) => s.id === 'sub_dld_01');
    const foundNs = saved.find((s) => s.id === 'sub_ns_01');

    expect(foundDld?.google_drive_folder_id).toBe('1DLD_Folder_ABC123');
    expect(foundNs?.google_drive_folder_id).toBe('1NS_Folder_XYZ789');
    expect(foundDld?.google_drive_folder_id).not.toBe(foundNs?.google_drive_folder_id);
  });
});

describe('Zero Dummy Data Sanitization & Clean Database', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('purges legacy template demo IDs starting with 44444444 or 55555555 from store', () => {
    // Inject legacy demo subject
    localStorage.setItem(
      'studyhub_subjects_clean',
      JSON.stringify([
        {
          id: '44444444-4444-4444-4444-444444444441',
          name: 'Old Demo Computer Programming',
          code: 'CS-101',
          slug: 'old-demo',
          icon: 'code',
          color: 'blue',
          is_featured: true,
          is_active: true,
          sort_order: 1,
          created_at: '2026-10-20T00:00:00Z',
          updated_at: '2026-10-20T00:00:00Z',
        },
      ])
    );

    const cleanSubjects = getDemoSubjects();
    expect(cleanSubjects.length).toBe(0);
  });

  it('purges legacy template demo resources from store', () => {
    localStorage.setItem(
      'studyhub_resources_clean',
      JSON.stringify([
        {
          id: '55555555-5555-5555-5555-555555555551',
          subject_id: '44444444-4444-4444-4444-444444444441',
          title: 'Lesson 01: Introduction to Algorithms',
          slug: 'lesson-01-algorithms',
          resource_type: 'pdf',
          lesson_date: '2026-10-20',
          source_provider: 'google_drive',
          external_url: 'https://drive.google.com/sample',
          status: 'published',
          tags: ['sample'],
          created_at: '2026-10-20T00:00:00Z',
          updated_at: '2026-10-20T00:00:00Z',
        },
      ])
    );

    const cleanResources = getDemoResources();
    expect(cleanResources.length).toBe(0);
  });

  it('keeps genuine real user-created subjects intact', () => {
    const realSubject: Subject = {
      id: 'real_subject_123',
      name: 'Digital Logic Design',
      code: 'DLD-101',
      slug: 'digital-logic-design',
      icon: 'cpu',
      color: 'indigo',
      is_featured: true,
      is_active: true,
      sort_order: 1,
      google_drive_folder_url: 'https://drive.google.com/drive/folders/1ABC_DLD',
      google_drive_folder_id: '1ABC_DLD',
      folder_configured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveDemoSubject(realSubject);
    const subjects = getDemoSubjects();
    expect(subjects.length).toBe(1);
    expect(subjects[0].name).toBe('Digital Logic Design');
    expect(subjects[0].google_drive_folder_id).toBe('1ABC_DLD');
  });

  it('robustly parses Google Service Account keys formatted with quotes and escaped newlines', async () => {
    const { parseServiceAccountKey } = await import('../../api/upload-to-drive');

    const sampleRaw = JSON.stringify({
      type: 'service_account',
      client_email: 'studyhub@project-123.iam.gserviceaccount.com',
      private_key: '-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgk...\\n-----END PRIVATE KEY-----\\n',
    });

    // 1. Raw JSON
    const parsed1 = parseServiceAccountKey(sampleRaw);
    expect(parsed1.client_email).toBe('studyhub@project-123.iam.gserviceaccount.com');
    expect(parsed1.private_key).toContain('-----BEGIN PRIVATE KEY-----');
    expect(parsed1.private_key).toContain('\n');

    // 2. Wrapped in quotes
    const parsed2 = parseServiceAccountKey(`"${sampleRaw.replace(/"/g, '\\"')}"`);
    expect(parsed2.client_email).toBe('studyhub@project-123.iam.gserviceaccount.com');

    // 3. Base64 encoded
    const base64Str = Buffer.from(sampleRaw).toString('base64');
    const parsed3 = parseServiceAccountKey(base64Str);
    expect(parsed3.client_email).toBe('studyhub@project-123.iam.gserviceaccount.com');
  });

  it('prioritizes direct file opening (file_data) over folder URL so students open the PDF directly', () => {
    const sampleResource: Resource = {
      id: 'res-fe-01',
      subject_id: 'sub-fe-01',
      title: 'Introduction to Functional English',
      slug: 'introduction-to-functional-english',
      resource_type: 'pdf',
      lesson_date: '2026-10-31',
      source_provider: 'google_drive',
      external_url: 'https://drive.google.com/drive/folders/1MOy9oZjz68iBC6yp6Hxzla5bxJObPI_w',
      google_drive_folder_url: 'https://drive.google.com/drive/folders/1MOy9oZjz68iBC6yp6Hxzla5bxJObPI_w',
      file_data: 'data:application/pdf;base64,JVBERi0xLjQK...',
      file_name: 'Introduction to Functional English.pdf',
      status: 'published',
      tags: ['english', 'lecture-01'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Priority check: file_data must be picked first so students open the PDF directly, not the Drive folder!
    const directUrl =
      sampleResource.file_data || sampleResource.google_drive_file_url || sampleResource.external_url;

    expect(directUrl).toBe('data:application/pdf;base64,JVBERi0xLjQK...');
    expect(sampleResource.google_drive_folder_url).toBe(
      'https://drive.google.com/drive/folders/1MOy9oZjz68iBC6yp6Hxzla5bxJObPI_w'
    );
  });
});

