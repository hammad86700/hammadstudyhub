// ==============================================================================
// HAMMAD STUDYHUB — STORE (LOCAL PERSISTENCE ADAPTER)
// Zero dummy data. Provides client-side persistence for administrator, student
// accounts, CR/GR roles, social contact links, and gender-aware chat.
// ==============================================================================

import {
  Subject,
  Resource,
  Announcement,
  FeedbackSubmission,
  UserProfile,
  StudentRegistrationInput,
  PlatformSocials,
  ChatMessage,
  SharedMaterialAttachment,
  UserRole,
} from '../types';
import {
  INITIAL_DEMO_SUBJECTS,
  INITIAL_DEMO_RESOURCES,
  INITIAL_DEMO_ANNOUNCEMENTS,
} from './mockData';

const SUBJECTS_KEY = 'studyhub_subjects_clean';
const RESOURCES_KEY = 'studyhub_resources_clean';
const ANNOUNCEMENTS_KEY = 'studyhub_announcements_clean';
const FEEDBACK_KEY = 'studyhub_feedback_clean';
const STUDENTS_KEY = 'studyhub_students_v3';
const SOCIALS_KEY = 'studyhub_socials_v3';
const CHATS_KEY = 'studyhub_chats_v3';

// Default social media contact links for Muhammad Hammad
export const DEFAULT_SOCIALS: PlatformSocials = {
  whatsapp_number: '03242779514',
  instagram_id: 'not_urs_hammi',
  whatsapp_url: 'https://wa.me/923242779514?text=Hello%20Muhammad%20Hammad,%20I%20am%20a%20student%20on%20Hammad%20StudyHub%20and%20need%20learning%20materials.',
  instagram_url: 'https://instagram.com/not_urs_hammi',
};

function getStoredOrInit<T>(key: string, initial: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(item) as T;
  } catch {
    return initial;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Local store save error:', e);
  }
}

function isLegacyDemoId(id?: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return (
    id.startsWith('44444444-') ||
    id.startsWith('55555555-') ||
    id.startsWith('66666666-') ||
    id.startsWith('33333333-') ||
    id.startsWith('22222222-') ||
    id.startsWith('11111111-')
  );
}

// -----------------------------------------------------------------------------
// SUBJECTS
// -----------------------------------------------------------------------------
export function getDemoSubjects(): Subject[] {
  const raw = getStoredOrInit<Subject[]>(SUBJECTS_KEY, INITIAL_DEMO_SUBJECTS);
  const cleaned = raw.filter((s) => !isLegacyDemoId(s.id));
  if (cleaned.length !== raw.length) {
    setStored(SUBJECTS_KEY, cleaned);
  }
  return cleaned;
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
  const raw = getStoredOrInit<Resource[]>(RESOURCES_KEY, INITIAL_DEMO_RESOURCES);
  const cleaned = raw.filter((r) => !isLegacyDemoId(r.id) && !isLegacyDemoId(r.subject_id));
  if (cleaned.length !== raw.length) {
    setStored(RESOURCES_KEY, cleaned);
  }
  return cleaned;
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

// -----------------------------------------------------------------------------
// ANNOUNCEMENTS
// -----------------------------------------------------------------------------
export function getDemoAnnouncements(): Announcement[] {
  const raw = getStoredOrInit<Announcement[]>(ANNOUNCEMENTS_KEY, INITIAL_DEMO_ANNOUNCEMENTS);
  const cleaned = raw.filter(
    (a) =>
      !isLegacyDemoId(a.id) &&
      a.title !== 'Welcome to Hammad StudyHub Fall 2026!' &&
      a.title !== 'Mid-Term Examination Schedule Announced' &&
      a.title !== 'CS-101 Programming Lab 02 Submission Deadline'
  );
  if (cleaned.length !== raw.length) {
    setStored(ANNOUNCEMENTS_KEY, cleaned);
  }
  return cleaned;
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
  const list = getStoredOrInit<FeedbackSubmission[]>(FEEDBACK_KEY, []);
  list.unshift({
    ...feedback,
    id: `fb_${Date.now()}`,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
  setStored(FEEDBACK_KEY, list);
}

export function getDemoFeedback(): FeedbackSubmission[] {
  return getStoredOrInit<FeedbackSubmission[]>(FEEDBACK_KEY, []);
}

// -----------------------------------------------------------------------------
// STUDENT REGISTRATION & DIRECTORY
// -----------------------------------------------------------------------------
export interface RegisteredStudentEntry extends UserProfile {
  password?: string;
}

export function getRegisteredStudents(): RegisteredStudentEntry[] {
  return getStoredOrInit<RegisteredStudentEntry[]>(STUDENTS_KEY, []);
}

export function registerStudent(input: StudentRegistrationInput): UserProfile {
  const students = getRegisteredStudents();
  const existing = students.find((s) => s.email.toLowerCase() === input.email.trim().toLowerCase());
  if (existing) {
    throw new Error('An account with this email address already exists. Please log in.');
  }

  const now = new Date().toISOString();
  const newStudent: RegisteredStudentEntry = {
    id: `student_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    display_name: input.display_name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    role: 'student', // Initial role is always student. Admin appoints CR or GR.
    gender: input.gender,
    phone: input.phone?.trim() || '',
    roll_no: input.roll_no?.trim() || '',
    program_name: input.program_name?.trim() || '',
    semester: input.semester?.trim() || '',
    created_at: now,
    updated_at: now,
  };

  students.unshift(newStudent);
  setStored(STUDENTS_KEY, students);
  window.dispatchEvent(new Event('studyhub_students_updated'));

  // Return safe profile without password
  const { password, ...safeProfile } = newStudent;
  return safeProfile;
}

export function updateStudentRole(studentId: string, newRole: 'student' | 'cr' | 'gr'): void {
  const students = getRegisteredStudents();
  const index = students.findIndex((s) => s.id === studentId);
  if (index >= 0) {
    // If appointing a new CR or GR, ensure only one active CR / GR exists per appointment if desired, or allow multiple
    students[index].role = newRole;
    students[index].updated_at = new Date().toISOString();
    setStored(STUDENTS_KEY, students);
    window.dispatchEvent(new Event('studyhub_students_updated'));
  }
}

export function deleteStudent(studentId: string): void {
  const students = getRegisteredStudents();
  setStored(STUDENTS_KEY, students.filter((s) => s.id !== studentId));
  window.dispatchEvent(new Event('studyhub_students_updated'));
}

export function findStudentByEmail(email: string): RegisteredStudentEntry | undefined {
  const students = getRegisteredStudents();
  return students.find((s) => s.email.toLowerCase() === email.trim().toLowerCase());
}

export function upsertRegisteredStudentLocally(entry: RegisteredStudentEntry): void {
  const students = getRegisteredStudents();
  const index = students.findIndex((s) => s.id === entry.id || s.email.toLowerCase() === entry.email.toLowerCase());
  let updated: RegisteredStudentEntry[];
  if (index >= 0) {
    updated = [...students];
    updated[index] = { ...students[index], ...entry };
  } else {
    updated = [entry, ...students];
  }
  setStored(STUDENTS_KEY, updated);
  window.dispatchEvent(new Event('studyhub_students_updated'));
}

export function mergeRegisteredStudentsLocally(remoteList: RegisteredStudentEntry[]): RegisteredStudentEntry[] {
  const localList = getRegisteredStudents();
  const map = new Map<string, RegisteredStudentEntry>();
  localList.forEach((s) => map.set(s.id, s));
  remoteList.forEach((s) => {
    const existing = map.get(s.id) || localList.find((l) => l.email.toLowerCase() === s.email.toLowerCase());
    if (existing) {
      map.set(existing.id, { ...existing, ...s });
    } else {
      map.set(s.id, s);
    }
  });
  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  setStored(STUDENTS_KEY, merged);
  window.dispatchEvent(new Event('studyhub_students_updated'));
  return merged;
}

export function getActiveCR(): UserProfile | undefined {
  const students = getRegisteredStudents();
  return students.find((s) => s.role === 'cr');
}

export function getActiveGR(): UserProfile | undefined {
  const students = getRegisteredStudents();
  return students.find((s) => s.role === 'gr');
}

// -----------------------------------------------------------------------------
// SOCIAL MEDIA CONTACT LINKS (ADMIN MANAGED)
// -----------------------------------------------------------------------------
export function getPlatformSocials(): PlatformSocials {
  const data = getStoredOrInit<PlatformSocials>(SOCIALS_KEY, DEFAULT_SOCIALS);
  // Ensure formatted URLs
  const cleanPhone = (data.whatsapp_number || '03242779514').replace(/\D/g, '');
  const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.substring(1) : cleanPhone;
  const cleanInsta = (data.instagram_id || 'not_urs_hammi').replace('@', '').trim();

  return {
    ...data,
    whatsapp_url: `https://wa.me/${intlPhone}?text=Hello%20Muhammad%20Hammad,%20I%20am%20using%20Hammad%20StudyHub%20and%20would%20like%20to%20request%20learning%20materials.`,
    instagram_url: `https://instagram.com/${cleanInsta}`,
  };
}

export function savePlatformSocials(socials: Partial<PlatformSocials>): PlatformSocials {
  const current = getPlatformSocials();
  const updated: PlatformSocials = {
    ...current,
    whatsapp_number: socials.whatsapp_number?.trim() || current.whatsapp_number,
    instagram_id: socials.instagram_id?.replace('@', '').trim() || current.instagram_id,
  };

  const cleanPhone = updated.whatsapp_number.replace(/\D/g, '');
  const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.substring(1) : cleanPhone;
  const cleanInsta = updated.instagram_id.replace('@', '').trim();
  updated.whatsapp_url = `https://wa.me/${intlPhone}?text=Hello%20Muhammad%20Hammad,%20I%20am%20using%20Hammad%20StudyHub%20and%20would%20like%20to%20request%20learning%20materials.`;
  updated.instagram_url = `https://instagram.com/${cleanInsta}`;

  setStored(SOCIALS_KEY, updated);
  window.dispatchEvent(new Event('studyhub_socials_updated'));
  return updated;
}

// -----------------------------------------------------------------------------
// CHAT & IN-PLATFORM MESSAGING
// -----------------------------------------------------------------------------
export function getAllChatMessages(): ChatMessage[] {
  return getStoredOrInit<ChatMessage[]>(CHATS_KEY, []);
}

export function getConversationMessages(userId1: string, userId2: string): ChatMessage[] {
  const all = getAllChatMessages();
  return all.filter(
    (m) =>
      (m.sender_id === userId1 && m.receiver_id === userId2) ||
      (m.sender_id === userId2 && m.receiver_id === userId1)
  );
}

export function sendChatMessage(data: {
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  sender_gender?: 'male' | 'female';
  receiver_id: string;
  receiver_name: string;
  receiver_role: UserRole;
  message: string;
  attachment?: SharedMaterialAttachment;
}): ChatMessage {
  const all = getAllChatMessages();
  const newMsg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender_id: data.sender_id,
    sender_name: data.sender_name,
    sender_role: data.sender_role,
    sender_gender: data.sender_gender,
    receiver_id: data.receiver_id,
    receiver_name: data.receiver_name,
    receiver_role: data.receiver_role,
    message: data.message.trim(),
    attachment: data.attachment,
    created_at: new Date().toISOString(),
    read: false,
  };

  all.push(newMsg);
  setStored(CHATS_KEY, all);
  window.dispatchEvent(new Event('studyhub_chat_updated'));
  return newMsg;
}

export function getSharedMaterialsBetween(userId1: string, userId2: string): SharedMaterialAttachment[] {
  const msgs = getConversationMessages(userId1, userId2);
  const attachments: SharedMaterialAttachment[] = [];
  msgs.forEach((m) => {
    if (m.attachment) {
      attachments.push(m.attachment);
    }
  });
  return attachments;
}

export function publishSharedMaterialToHub(
  attachment: SharedMaterialAttachment,
  publishedBy: string
): Resource {
  const subjects = getDemoSubjects();
  // Find matching subject or pick first or create default
  let subject = subjects.find(
    (s) =>
      s.id === attachment.subject_id ||
      (attachment.subject_name && s.name.toLowerCase() === attachment.subject_name.toLowerCase())
  );

  if (!subject) {
    if (subjects.length > 0) {
      subject = subjects[0];
    } else {
      subject = {
        id: `subj_${Date.now()}`,
        name: attachment.subject_name || 'General Coursework',
        slug: (attachment.subject_name || 'general-coursework').toLowerCase().replace(/\s+/g, '-'),
        code: 'GEN101',
        description: 'Collaborative Class Subject',
        icon: 'BookOpen',
        color: 'blue',
        is_featured: true,
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveDemoSubject(subject);
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const newResource: Resource = {
    id: `res_shared_${Date.now()}`,
    subject_id: subject.id,
    title: attachment.title,
    slug: attachment.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    description: attachment.description || `Shared by ${publishedBy} via class representative exchange`,
    resource_type: attachment.resource_type,
    lesson_date: todayStr,
    source_provider: attachment.source_provider || (attachment.file_url.includes('youtube') ? 'youtube' : 'google_drive'),
    external_url: attachment.file_url,
    status: 'published',
    tags: ['Class Representative', 'Shared Material', subject.name],
    published_at: new Date().toISOString(),
    created_by: publishedBy,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subject,
  };

  saveDemoResource(newResource);
  window.dispatchEvent(new Event('studyhub_resources_updated'));
  return newResource;
}

// -----------------------------------------------------------------------------
// CLEAR / RESET STORE
// -----------------------------------------------------------------------------
export function clearAllStoredData(): void {
  localStorage.setItem(SUBJECTS_KEY, JSON.stringify([]));
  localStorage.setItem(RESOURCES_KEY, JSON.stringify([]));
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify([]));
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify([]));
  localStorage.setItem(STUDENTS_KEY, JSON.stringify([]));
  localStorage.setItem(CHATS_KEY, JSON.stringify([]));
  localStorage.setItem(SOCIALS_KEY, JSON.stringify(DEFAULT_SOCIALS));
  window.location.reload();
}

export function resetDemoData(): void {
  clearAllStoredData();
}
