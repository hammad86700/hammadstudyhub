// ==============================================================================
// HAMMAD STUDYHUB — CROSS-DEVICE LEARNING MATERIAL ACCESS VERIFICATION TEST
// Tests:
// 1. Admin/CR/GR uploads learning materials (PDFs, notes, slides).
// 2. Cloud file storage resolution (Supabase Storage & serverless /api/files streaming).
// 3. Multi-student cross-device access (Student A & Student B on separate devices).
// 4. In-browser "View Online" & native "Download File" actions.
// 5. Automatic repair of existing legacy uploads.
// ==============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getResourceFileUrl,
  openResourceOnline,
  downloadResourceFile,
  getDownloadFileName,
  canPreviewDirectly,
} from '../lib/resourceActions';
import {
  mergeResourcesLocally,
  saveDemoResource,
  getDemoResources,
} from '../lib/demoStore';
import {
  resolveFileAccessUrl,
  repairAndSyncExistingResources,
} from '../lib/cloudFileStorage';
import { Resource } from '../types';

describe('Cross-Device Learning Materials Access & Download System', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('Scenario 1: Admin uploads a PDF file with live cloud URL accessible to all students', async () => {
    const adminUploadedResource: Resource = {
      id: 'res-admin-dld-001',
      subject_id: 'sub-dld-101',
      title: 'DLD Lecture 05 - Karnaugh Maps',
      slug: 'dld-lecture-05-karnaugh-maps',
      description: 'Comprehensive notes covering K-Maps and Boolean simplification.',
      resource_type: 'pdf',
      source_provider: 'supabase_storage',
      external_url: 'https://test-project.supabase.co/storage/v1/object/public/studyhub-materials/sub-dld-101/res-admin-dld-001_DLD_Notes.pdf',
      file_name: 'DLD_Notes.pdf',
      file_size: '2.4 MB',
      mime_type: 'application/pdf',
      chapter: 'Unit 2: Logic Minimization',
      topic: 'Karnaugh Maps',
      tags: ['dld', 'k-maps'],
      lesson_date: '2026-11-02',
      status: 'published',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveDemoResource(adminUploadedResource);

    // 1. Verify URL resolution
    const fileUrl = getResourceFileUrl(adminUploadedResource);
    expect(fileUrl).toBe(adminUploadedResource.external_url);
    expect(fileUrl).not.toBe('');
    expect(fileUrl).not.toBe('#');

    // 2. Verify can preview directly in browser
    expect(canPreviewDirectly(adminUploadedResource)).toBe(true);

    // 3. Verify download filename matches
    const downloadName = getDownloadFileName(adminUploadedResource);
    expect(downloadName).toBe('DLD_Notes.pdf');

    // 4. Verify openResourceOnline triggers window.open with the cloud URL
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    openResourceOnline(adminUploadedResource);
    expect(windowOpenSpy).toHaveBeenCalledWith(adminUploadedResource.external_url, '_blank');
  });

  it('Scenario 2: CR and GR upload presentations and notes accessible across devices', async () => {
    const crUploadedSlides: Resource = {
      id: 'res-cr-algo-002',
      subject_id: 'sub-algo-201',
      title: 'Algorithm Design - Dynamic Programming Slides',
      slug: 'algorithm-design-dp-slides',
      description: 'Uploaded by CR for Section A.',
      resource_type: 'presentation',
      source_provider: 'supabase_storage',
      external_url: 'https://test-project.supabase.co/storage/v1/object/public/studyhub-materials/sub-algo-201/res-cr-algo-002_DP_Slides.pptx',
      file_name: 'DP_Slides.pptx',
      file_size: '5.1 MB',
      mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      tags: ['algo', 'dp'],
      lesson_date: '2026-11-02',
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const grUploadedNotes: Resource = {
      id: 'res-gr-db-003',
      subject_id: 'sub-db-301',
      title: 'Database Normalization Handout',
      slug: 'database-normalization-handout',
      description: 'Uploaded by GR for all students.',
      resource_type: 'pdf',
      source_provider: 'supabase_storage',
      external_url: 'https://test-project.supabase.co/storage/v1/object/public/studyhub-materials/sub-db-301/res-gr-db-003_Normalization.pdf',
      file_name: 'Normalization.pdf',
      file_size: '1.8 MB',
      mime_type: 'application/pdf',
      tags: ['db', 'normalization'],
      lesson_date: '2026-11-02',
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveDemoResource(crUploadedSlides);
    saveDemoResource(grUploadedNotes);

    expect(getResourceFileUrl(crUploadedSlides)).toBe(crUploadedSlides.external_url);
    expect(getResourceFileUrl(grUploadedNotes)).toBe(grUploadedNotes.external_url);

    expect(getDownloadFileName(crUploadedSlides)).toBe('DP_Slides.pptx');
    expect(getDownloadFileName(grUploadedNotes)).toBe('Normalization.pdf');
  });

  it('Scenario 3: Student A and Student B receive material over sync without local binary and can open/download', async () => {
    // When syncing across devices over WebSocket/pubsub, file_data is stripped to stay under payload limits.
    // The incoming sync payload only contains metadata and external_url.
    const syncPayloadResource: Resource = {
      id: 'res-remote-sync-004',
      subject_id: 'sub-math-401',
      title: 'Calculus III Vector Fields Summary',
      slug: 'calculus-iii-vector-fields-summary',
      resource_type: 'pdf',
      source_provider: 'supabase_storage',
      external_url: 'https://test-project.supabase.co/storage/v1/object/public/studyhub-materials/sub-math-401/Vector_Fields.pdf',
      file_name: 'Vector_Fields.pdf',
      file_size: '1.1 MB',
      mime_type: 'application/pdf',
      tags: ['calculus', 'math'],
      lesson_date: '2026-11-02',
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Notice: file_data is undefined on remote student device!
      file_data: undefined,
    };

    // Student A's device ingests the sync payload
    const mergedListA = mergeResourcesLocally([syncPayloadResource]);
    const studentAResource = mergedListA.find((r) => r.id === syncPayloadResource.id);
    expect(studentAResource).toBeDefined();

    // Verify Student A can retrieve the file URL
    const urlForStudentA = getResourceFileUrl(studentAResource!);
    expect(urlForStudentA).toBe(syncPayloadResource.external_url);

    const windowOpenSpyA = vi.spyOn(window, 'open').mockImplementation(() => null);
    openResourceOnline(studentAResource!);
    expect(windowOpenSpyA).toHaveBeenCalledWith(syncPayloadResource.external_url, '_blank');

    // Student B's device (another laptop)
    const mergedListB = mergeResourcesLocally([syncPayloadResource]);
    const studentBResource = mergedListB.find((r) => r.id === syncPayloadResource.id);
    expect(studentBResource).toBeDefined();

    // Verify Student B downloads the file
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['dummy binary content'], { type: 'application/pdf' }),
    } as any);

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await downloadResourceFile(studentBResource!);
    expect(fetchSpy).toHaveBeenCalledWith(syncPayloadResource.external_url);
  });

  it('Scenario 4: Fallback to serverless /api/files streaming when cloud storage URL is missing', async () => {
    // If a resource was synced or created without an explicit Supabase storage URL
    const fallbackResource: Resource = {
      id: 'res-fallback-005',
      subject_id: 'sub-dld-101',
      title: 'DLD Lab Manual',
      slug: 'dld-lab-manual',
      resource_type: 'pdf',
      source_provider: 'supabase_storage',
      external_url: '#', // legacy or empty placeholder
      file_name: 'DLD_Lab_Manual.pdf',
      file_size: '3.2 MB',
      mime_type: 'application/pdf',
      tags: ['dld', 'lab'],
      lesson_date: '2026-11-02',
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Ingest onto student device
    const merged = mergeResourcesLocally([fallbackResource]);
    const resolved = merged.find((r) => r.id === 'res-fallback-005')!;

    // Must resolve to /api/files streaming endpoint
    expect(resolved.external_url).toBe('/api/files?id=res-fallback-005');

    const resolvedUrl = await resolveFileAccessUrl(resolved);
    expect(resolvedUrl).toBe('/api/files?id=res-fallback-005');

    // When student downloads, it requests /api/files?id=...&download=true
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await downloadResourceFile(resolved);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('Scenario 5: Auto-repair routine upgrades legacy resources with local file_data to live URLs', async () => {
    const legacyResource: Resource = {
      id: 'res-legacy-006',
      subject_id: 'sub-cs-501',
      title: 'Operating Systems Scheduling Notes',
      slug: 'operating-systems-scheduling-notes',
      resource_type: 'pdf',
      source_provider: 'supabase_storage',
      external_url: '#', // Broken legacy URL
      file_name: 'OS_Scheduling.pdf',
      file_size: '800 KB',
      mime_type: 'application/pdf',
      tags: ['os', 'scheduling'],
      file_data: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp...',
      lesson_date: '2026-11-01',
      status: 'published',
      created_at: '2026-11-01T10:00:00Z',
      updated_at: '2026-11-01T10:00:00Z',
    };

    saveDemoResource(legacyResource);

    // Mock /api/files POST response
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (typeof url === 'string' && url.includes('/api/files')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            id: 'res-legacy-006',
            url: '/api/files?id=res-legacy-006',
          }),
        } as any;
      }
      return { ok: true } as any;
    });

    const repairedCount = await repairAndSyncExistingResources();
    expect(repairedCount).toBeGreaterThanOrEqual(1);

    const updatedList = getDemoResources();
    const repairedRes = updatedList.find((r) => r.id === 'res-legacy-006');
    expect(repairedRes).toBeDefined();
    expect(repairedRes?.external_url).toBe('/api/files?id=res-legacy-006');
  });
});
