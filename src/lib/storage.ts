// ==============================================================================
// HAMMAD STUDYHUB — LOCAL BROWSER STORAGE UTILITIES
// Privacy-first, zero-sign-in persistence for students
// ==============================================================================

import { BookmarkItem, RecentlyViewedItem, ChecklistItem } from '../types';

const BOOKMARKS_KEY = 'hammad_studyhub_bookmarks';
const RECENT_KEY = 'hammad_studyhub_recent';
const CHECKLIST_KEY = 'hammad_studyhub_checklist';
const THEME_KEY = 'hammad_studyhub_theme';

// Safely access localStorage with error fallback (e.g. private browsing mode)
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('LocalStorage write failed:', e);
  }
}

// -----------------------------------------------------------------------------
// 1. BOOKMARKS
// -----------------------------------------------------------------------------
export function getBookmarks(): BookmarkItem[] {
  const data = safeGetItem(BOOKMARKS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as BookmarkItem[];
  } catch {
    return [];
  }
}

export function addBookmark(item: Omit<BookmarkItem, 'id' | 'savedAt'>): BookmarkItem {
  const current = getBookmarks();
  // Prevent duplicate bookmarks
  const existing = current.find((b) => b.resourceId === item.resourceId);
  if (existing) return existing;

  const newBookmark: BookmarkItem = {
    ...item,
    id: `bm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    savedAt: new Date().toISOString(),
  };

  const updated = [newBookmark, ...current];
  safeSetItem(BOOKMARKS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('studyhub_bookmarks_updated'));
  return newBookmark;
}

export function removeBookmark(resourceId: string): void {
  const current = getBookmarks();
  const updated = current.filter((b) => b.resourceId !== resourceId);
  safeSetItem(BOOKMARKS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('studyhub_bookmarks_updated'));
}

export function isBookmarked(resourceId: string): boolean {
  return getBookmarks().some((b) => b.resourceId === resourceId);
}

// -----------------------------------------------------------------------------
// 2. RECENTLY VIEWED
// -----------------------------------------------------------------------------
export function getRecentlyViewed(): RecentlyViewedItem[] {
  const data = safeGetItem(RECENT_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as RecentlyViewedItem[];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(item: Omit<RecentlyViewedItem, 'id' | 'viewedAt'>): void {
  const current = getRecentlyViewed();
  // Filter out existing occurrence
  const filtered = current.filter((r) => r.resourceId !== item.resourceId);

  const newItem: RecentlyViewedItem = {
    ...item,
    id: `recent_${Date.now()}`,
    viewedAt: new Date().toISOString(),
  };

  // Keep top 20 items max
  const updated = [newItem, ...filtered].slice(0, 20);
  safeSetItem(RECENT_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('studyhub_recent_updated'));
}

export function clearRecentlyViewed(): void {
  safeSetItem(RECENT_KEY, JSON.stringify([]));
  window.dispatchEvent(new Event('studyhub_recent_updated'));
}

// -----------------------------------------------------------------------------
// 3. STUDY CHECKLIST
// -----------------------------------------------------------------------------
export function getChecklist(): ChecklistItem[] {
  const data = safeGetItem(CHECKLIST_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as ChecklistItem[];
  } catch {
    return [];
  }
}

export function toggleChecklistItem(id: string, subjectSlug: string, title: string): boolean {
  const current = getChecklist();
  const existingIndex = current.findIndex((item) => item.id === id);

  let isNowCompleted = false;
  if (existingIndex >= 0) {
    // Toggle existing
    current[existingIndex].isCompleted = !current[existingIndex].isCompleted;
    current[existingIndex].completedAt = current[existingIndex].isCompleted ? new Date().toISOString() : undefined;
    isNowCompleted = current[existingIndex].isCompleted;
  } else {
    // Add new completed
    current.push({
      id,
      subjectSlug,
      title,
      isCompleted: true,
      completedAt: new Date().toISOString(),
    });
    isNowCompleted = true;
  }

  safeSetItem(CHECKLIST_KEY, JSON.stringify(current));
  window.dispatchEvent(new Event('studyhub_checklist_updated'));
  return isNowCompleted;
}

export function isChecklistCompleted(id: string): boolean {
  const item = getChecklist().find((c) => c.id === id);
  return !!item?.isCompleted;
}

export function clearChecklist(): void {
  safeSetItem(CHECKLIST_KEY, JSON.stringify([]));
  window.dispatchEvent(new Event('studyhub_checklist_updated'));
}

// -----------------------------------------------------------------------------
// 4. THEME PREFERENCE
// -----------------------------------------------------------------------------
export function getStoredTheme(): 'light' | 'dark' | 'system' {
  const saved = safeGetItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  return 'system';
}

export function setStoredTheme(theme: 'light' | 'dark' | 'system'): void {
  safeSetItem(THEME_KEY, theme);
}
