// ==============================================================================
// HAMMAD STUDYHUB — UNIT TESTS: GOOGLE DRIVE & YOUTUBE INTEGRATION
// ==============================================================================

import { describe, it, expect } from 'vitest';
import {
  parseGoogleDriveUrl,
  parseYouTubeUrl,
  detectSourceProvider,
  resolveEmbedUrl,
} from '../lib/googleDrive';

describe('Google Drive URL Parser', () => {
  it('correctly parses standard Google Drive file URLs', () => {
    const url = 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OGvE2upms/view?usp=sharing';
    const result = parseGoogleDriveUrl(url);

    expect(result.isValid).toBe(true);
    expect(result.isFolder).toBe(false);
    expect(result.fileId).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OGvE2upms');
    expect(result.embedUrl).toBe('https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OGvE2upms/preview');
    expect(result.directDownloadUrl).toBe('https://drive.google.com/uc?export=download&id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OGvE2upms');
    expect(result.permissionNotice).toContain('Anyone with the link can view');
  });

  it('correctly parses Google Drive folder URLs', () => {
    const url = 'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ';
    const result = parseGoogleDriveUrl(url);

    expect(result.isValid).toBe(true);
    expect(result.isFolder).toBe(true);
    expect(result.folderId).toBe('1aBcDeFgHiJkLmNoPqRsTuVwXyZ');
    expect(result.embedUrl).toBe('https://drive.google.com/embeddedfolderview?id=1aBcDeFgHiJkLmNoPqRsTuVwXyZ#list');
  });

  it('correctly parses Google Docs URLs', () => {
    const url = 'https://docs.google.com/document/d/1234567890abcdef/edit?usp=sharing';
    const result = parseGoogleDriveUrl(url);

    expect(result.isValid).toBe(true);
    expect(result.resourceKind).toBe('document');
    expect(result.fileId).toBe('1234567890abcdef');
    expect(result.embedUrl).toBe('https://docs.google.com/document/d/1234567890abcdef/preview');
  });

  it('rejects invalid or non-drive URLs safely', () => {
    const result = parseGoogleDriveUrl('https://example.com/not-drive');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('YouTube Video URL Parser', () => {
  it('correctly extracts video ID from standard watch URL', () => {
    const url = 'https://www.youtube.com/watch?v=zOjov-2OZ0E';
    const result = parseYouTubeUrl(url);

    expect(result.isValid).toBe(true);
    expect(result.videoId).toBe('zOjov-2OZ0E');
    expect(result.embedUrl).toBe('https://www.youtube-nocookie.com/embed/zOjov-2OZ0E?rel=0');
  });

  it('correctly extracts video ID from short youtu.be URL', () => {
    const url = 'https://youtu.be/RO5alU6PpSU';
    const result = parseYouTubeUrl(url);

    expect(result.isValid).toBe(true);
    expect(result.videoId).toBe('RO5alU6PpSU');
  });

  it('rejects invalid YouTube URLs gracefully', () => {
    const result = parseYouTubeUrl('https://youtube.com/invalid');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('Source Provider Detection & Embed Resolution', () => {
  it('detects google_drive provider', () => {
    expect(detectSourceProvider('https://drive.google.com/file/d/123/view')).toBe('google_drive');
  });

  it('detects youtube provider', () => {
    expect(detectSourceProvider('https://youtu.be/12345678901')).toBe('youtube');
  });

  it('resolves embed URL for Google Drive', () => {
    const embed = resolveEmbedUrl('https://drive.google.com/file/d/test12345/view');
    expect(embed).toBe('https://drive.google.com/file/d/test12345/preview');
  });
});
