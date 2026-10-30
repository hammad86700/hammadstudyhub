// ==============================================================================
// HAMMAD STUDYHUB — UNIT TESTS: PWA MANIFEST & SPECIFICATION
// ==============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA Manifest & Configuration', () => {
  it('loads valid web manifest file', () => {
    const manifestPath = path.resolve(__dirname, '../../public/manifest.webmanifest');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw);

    expect(manifest.name).toBe('Hammad StudyHub');
    expect(manifest.short_name).toBe('StudyHub');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.theme_color).toBe('#1e3a8a');
    expect(manifest.background_color).toBe('#0a1324');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(1);
  });

  it('contains essential shortcut links', () => {
    const manifestPath = path.resolve(__dirname, '../../public/manifest.webmanifest');
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw);

    const shortcutUrls = manifest.shortcuts.map((s: any) => s.url);
    expect(shortcutUrls).toContain('/subjects');
    expect(shortcutUrls).toContain('/search');
    expect(shortcutUrls).toContain('/bookmarks');
  });

  it('verifies service worker file exists and caches app shell', () => {
    const swPath = path.resolve(__dirname, '../../public/sw.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).toContain('hammad-studyhub');
    expect(swContent).toContain('STATIC_ASSETS');
    expect(swContent).toContain('/index.html');
    expect(swContent).toContain('/admin'); // checks admin exemption
  });
});

