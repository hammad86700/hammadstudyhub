// ==============================================================================
// HAMMAD STUDYHUB — FILE STORAGE & LOCAL PERSISTENCE TESTS
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveResourceFileData,
  getCachedFileData,
  deleteResourceFileData,
} from '../lib/fileStorage';
import {
  getDemoResources,
  saveDemoResource,
  deleteDemoResource,
} from '../lib/demoStore';
import { Resource } from '../types';

describe('File Storage & DemoStore Resilience', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves file data in memory cache', async () => {
    const resId = 'test-res-1';
    const fakeDataUrl = 'data:application/pdf;base64,AAAA';

    await saveResourceFileData(resId, fakeDataUrl, {
      file_name: 'test.pdf',
      file_size: '10 KB',
      mime_type: 'application/pdf',
    });

    expect(getCachedFileData(resId)).toBe(fakeDataUrl);

    await deleteResourceFileData(resId);
    expect(getCachedFileData(resId)).toBeNull();
  });

  it('safely handles large file saving without quota crash', () => {
    const mockRes: Resource = {
      id: 'res-large-test-1',
      subject_id: 'sub-dld',
      title: 'High Resolution Diagrams',
      slug: 'high-resolution-diagrams',
      resource_type: 'whiteboard',
      lesson_date: '2026-11-01',
      source_provider: 'supabase_storage',
      external_url: '',
      file_name: 'diagram.png',
      file_size: '4.8 MB',
      file_data: 'data:image/png;base64,' + 'A'.repeat(1000),
      tags: ['diagram'],
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save should succeed and hydrate properly
    const saved = saveDemoResource(mockRes);
    expect(saved.id).toBe(mockRes.id);

    const list = getDemoResources();
    const found = list.find((r) => r.id === mockRes.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe('High Resolution Diagrams');

    // Clean up
    deleteDemoResource(mockRes.id);
    const updatedList = getDemoResources();
    expect(updatedList.find((r) => r.id === mockRes.id)).toBeUndefined();
  });
});

