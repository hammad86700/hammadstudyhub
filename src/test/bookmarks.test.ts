// ==============================================================================
// HAMMAD STUDYHUB — UNIT TESTS: BOOKMARKS & LOCAL STORAGE
// ==============================================================================

import { describe, it, expect } from 'vitest';
import {
  getBookmarks,
  addBookmark,
  removeBookmark,
  isBookmarked,
  getRecentlyViewed,
  addRecentlyViewed,
  toggleChecklistItem,
  isChecklistCompleted,
} from '../lib/storage';

describe('Local Bookmarks Manager', () => {
  it('starts with an empty bookmark collection', () => {
    expect(getBookmarks()).toEqual([]);
  });

  it('adds and verifies bookmarks in local storage', () => {
    addBookmark({
      resourceId: 'res-101',
      title: 'Digital Logic Gates Notes',
      resourceType: 'pdf',
      subjectName: 'Digital Logic Design',
      subjectSlug: 'digital-logic-design',
      lessonDate: '2026-10-25',
    });

    expect(isBookmarked('res-101')).toBe(true);
    expect(isBookmarked('res-999')).toBe(false);

    const bookmarks = getBookmarks();
    expect(bookmarks.length).toBe(1);
    expect(bookmarks[0].title).toBe('Digital Logic Gates Notes');
  });

  it('prevents duplicate bookmarks for same resource', () => {
    addBookmark({
      resourceId: 'res-duplicate',
      title: 'Intro to C++',
      resourceType: 'pdf',
      subjectName: 'Computer Programming',
      subjectSlug: 'computer-programming',
      lessonDate: '2026-10-20',
    });

    addBookmark({
      resourceId: 'res-duplicate',
      title: 'Intro to C++',
      resourceType: 'pdf',
      subjectName: 'Computer Programming',
      subjectSlug: 'computer-programming',
      lessonDate: '2026-10-20',
    });

    const bookmarks = getBookmarks().filter((b) => b.resourceId === 'res-duplicate');
    expect(bookmarks.length).toBe(1);
  });

  it('removes bookmark correctly', () => {
    addBookmark({
      resourceId: 'res-to-remove',
      title: 'Temporary item',
      resourceType: 'video',
      subjectName: 'English',
      subjectSlug: 'english',
      lessonDate: '2026-10-21',
    });

    expect(isBookmarked('res-to-remove')).toBe(true);
    removeBookmark('res-to-remove');
    expect(isBookmarked('res-to-remove')).toBe(false);
  });
});

describe('Study Revision Checklist', () => {
  it('toggles resource completion state', () => {
    expect(isChecklistCompleted('res-chk-1')).toBe(false);

    const firstToggle = toggleChecklistItem('res-chk-1', 'cs-101', 'Loops Lesson');
    expect(firstToggle).toBe(true);
    expect(isChecklistCompleted('res-chk-1')).toBe(true);

    const secondToggle = toggleChecklistItem('res-chk-1', 'cs-101', 'Loops Lesson');
    expect(secondToggle).toBe(false);
    expect(isChecklistCompleted('res-chk-1')).toBe(false);
  });
});
