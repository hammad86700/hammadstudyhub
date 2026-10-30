// ==============================================================================
// HAMMAD STUDYHUB — STORE (LOCAL PERSISTENCE ADAPTER)
// Zero dummy data. Provides client-side persistence for administrator-created content.
// ==============================================================================

import { Subject, Resource, Announcement, FeedbackSubmission } from '../types';
import {
  INITIAL_DEMO_SUBJECTS,
  INITIAL_DEMO_RESOURCES,
  INITIAL_DEMO_ANNOUNCEMENTS,
} from './mockData';

const SUBJECTS_KEY = 'studyhub_subjects_clean';
const RESOURCES_KEY = 'studyhub_resources_clean';
const ANNOUNCEMENTS_KEY = 'studyhub_announcements_clean';
const FEEDBACK_KEY = 'studyhub_feedback_clean';

// Automatically clean up any legacy dummy data from previous sessions
try {
  localStorage.removeItem('studyhub_demo_subjects_v1');
  localStorage.removeItem('studyhub_demo_resources_v1');
  localStorage.removeItem('studyhub_demo_announcements_v1');
  localStorage.removeItem('studyhub_demo_feedback_v1');
  localStorage.removeItem('studyhub_demo_admin_auth');
} catch {
  // Ignore in environments without window/localStorage
}

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
    console.warn('Local store save error:', e);
  }
}

// -----------------------------------------------------------------------------
// SUBJECTS
// -----------------------------------------------------------------------------
export function getDemoSubjects(): Subject[] {
  return getStoredOrInit<Subject>(SUBJECTS_KEY, INITIAL_DEMO_SUBJECTS);
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
  setStored(SUBJECTS_KEY, updated);
  return subject;
}

export function deleteDemoSubject(id: string): void {
  const list = getDemoSubjects();
  setStored(SUBJECTS_KEY, list.filter((s) => s.id !== id));
}

// -----------------------------------------------------------------------------
// RESOURCES
// -----------------------------------------------------------------------------
export function getDemoResources(): Resource[] {
  return getStoredOrInit<Resource>(RESOURCES_KEY, INITIAL_DEMO_RESOURCES);
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
  setStored(RESOURCES_KEY, updated);
  return resource;
}

export function deleteDemoResource(id: string): void {
  const list = getDemoResources();
  setStored(RESOURCES_KEY, list.filter((r) => r.id !== id));
}

export function clearAllStoredData(): void {
  localStorage.setItem(SUBJECTS_KEY, JSON.stringify([]));
  localStorage.setItem(RESOURCES_KEY, JSON.stringify([]));
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify([]));
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify([]));
  window.location.reload();
}

export function resetDemoData(): void {
  clearAllStoredData();
}

// -----------------------------------------------------------------------------
// ANNOUNCEMENTS
// -----------------------------------------------------------------------------
export function getDemoAnnouncements(): Announcement[] {
  return getStoredOrInit<Announcement>(ANNOUNCEMENTS_KEY, INITIAL_DEMO_ANNOUNCEMENTS);
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
  setStored(ANNOUNCEMENTS_KEY, updated);
  return announcement;
}

export function deleteDemoAnnouncement(id: string): void {
  const list = getDemoAnnouncements();
  setStored(ANNOUNCEMENTS_KEY, list.filter((a) => a.id !== id));
}

// -----------------------------------------------------------------------------
// FEEDBACK
// -----------------------------------------------------------------------------
export function submitDemoFeedback(feedback: FeedbackSubmission): void {
  const list = getStoredOrInit<FeedbackSubmission>(FEEDBACK_KEY, []);
  list.unshift({
    ...feedback,
    id: `fb_${Date.now()}`,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
  setStored(FEEDBACK_KEY, list);
}

export function getDemoFeedback(): FeedbackSubmission[] {
  return getStoredOrInit<FeedbackSubmission>(FEEDBACK_KEY, []);
}
