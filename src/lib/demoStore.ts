// ==============================================================================
// HAMMAD STUDYHUB — DEMO STORE (LOCAL PERSISTENCE ADAPTER)
// Powers full CRUD capability in Demo Mode without requiring cloud credentials
// ==============================================================================

import { Subject, Resource, Announcement, FeedbackSubmission } from '../types';
import {
  INITIAL_DEMO_SUBJECTS,
  INITIAL_DEMO_RESOURCES,
  INITIAL_DEMO_ANNOUNCEMENTS,
} from './mockData';

const DEMO_SUBJECTS_KEY = 'studyhub_demo_subjects_v1';
const DEMO_RESOURCES_KEY = 'studyhub_demo_resources_v1';
const DEMO_ANNOUNCEMENTS_KEY = 'studyhub_demo_announcements_v1';
const DEMO_FEEDBACK_KEY = 'studyhub_demo_feedback_v1';

function getStoredOrInit<T>(key: string, initial: T[]): T[] {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(item) as T[];
  } catch {
    return initial;
  }
}

function setStored<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Local demo store save error:', e);
  }
}

// -----------------------------------------------------------------------------
// SUBJECTS
// -----------------------------------------------------------------------------
export function getDemoSubjects(): Subject[] {
  return getStoredOrInit<Subject>(DEMO_SUBJECTS_KEY, INITIAL_DEMO_SUBJECTS);
}

export function saveDemoSubject(subject: Subject): Subject {
  const list = getDemoSubjects();
  const index = list.findIndex((s) => s.id === subject.id);
  let updated: Subject[];
  if (index >= 0) {
    updated = [...list];
    updated[index] = { ...subject, updated_at: new Date().toISOString() };
  } else {
    updated = [{ ...subject, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...list];
  }
  setStored(DEMO_SUBJECTS_KEY, updated);
  return subject;
}

export function deleteDemoSubject(id: string): void {
  const list = getDemoSubjects();
  setStored(DEMO_SUBJECTS_KEY, list.filter((s) => s.id !== id));
}

// -----------------------------------------------------------------------------
// RESOURCES
// -----------------------------------------------------------------------------
export function getDemoResources(): Resource[] {
  return getStoredOrInit<Resource>(DEMO_RESOURCES_KEY, INITIAL_DEMO_RESOURCES);
}

export function saveDemoResource(resource: Resource): Resource {
  const list = getDemoResources();
  const index = list.findIndex((r) => r.id === resource.id);
  let updated: Resource[];
  if (index >= 0) {
    updated = [...list];
    updated[index] = { ...resource, updated_at: new Date().toISOString() };
  } else {
    updated = [{ ...resource, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...list];
  }
  setStored(DEMO_RESOURCES_KEY, updated);
  return resource;
}

export function deleteDemoResource(id: string): void {
  const list = getDemoResources();
  setStored(DEMO_RESOURCES_KEY, list.filter((r) => r.id !== id));
}

export function resetDemoData(): void {
  localStorage.setItem(DEMO_SUBJECTS_KEY, JSON.stringify(INITIAL_DEMO_SUBJECTS));
  localStorage.setItem(DEMO_RESOURCES_KEY, JSON.stringify(INITIAL_DEMO_RESOURCES));
  localStorage.setItem(DEMO_ANNOUNCEMENTS_KEY, JSON.stringify(INITIAL_DEMO_ANNOUNCEMENTS));
  localStorage.setItem(DEMO_FEEDBACK_KEY, JSON.stringify([]));
  window.location.reload();
}

// -----------------------------------------------------------------------------
// ANNOUNCEMENTS
// -----------------------------------------------------------------------------
export function getDemoAnnouncements(): Announcement[] {
  return getStoredOrInit<Announcement>(DEMO_ANNOUNCEMENTS_KEY, INITIAL_DEMO_ANNOUNCEMENTS);
}

export function saveDemoAnnouncement(announcement: Announcement): Announcement {
  const list = getDemoAnnouncements();
  const index = list.findIndex((a) => a.id === announcement.id);
  let updated: Announcement[];
  if (index >= 0) {
    updated = [...list];
    updated[index] = { ...announcement, updated_at: new Date().toISOString() };
  } else {
    updated = [announcement, ...list];
  }
  setStored(DEMO_ANNOUNCEMENTS_KEY, updated);
  return announcement;
}

export function deleteDemoAnnouncement(id: string): void {
  const list = getDemoAnnouncements();
  setStored(DEMO_ANNOUNCEMENTS_KEY, list.filter((a) => a.id !== id));
}

// -----------------------------------------------------------------------------
// FEEDBACK
// -----------------------------------------------------------------------------
export function submitDemoFeedback(feedback: FeedbackSubmission): void {
  const list = getStoredOrInit<FeedbackSubmission>(DEMO_FEEDBACK_KEY, []);
  list.unshift({
    ...feedback,
    id: `fb_${Date.now()}`,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
  setStored(DEMO_FEEDBACK_KEY, list);
}

export function getDemoFeedback(): FeedbackSubmission[] {
  return getStoredOrInit<FeedbackSubmission>(DEMO_FEEDBACK_KEY, []);
}
