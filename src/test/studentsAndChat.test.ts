// ==============================================================================
// HAMMAD STUDYHUB — UNIT TESTS: STUDENTS, ROLES (CR/GR), CHAT & SOCIALS
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerStudent,
  getRegisteredStudents,
  updateStudentRole,
  deleteStudent,
  getPlatformSocials,
  savePlatformSocials,
  sendChatMessage,
  getConversationMessages,
  getSharedMaterialsBetween,
  publishSharedMaterialToHub,
  getDemoResources,
  saveDemoResource,
  getDemoSubjects,
  saveDemoSubject,
  clearAllStoredData,
} from '../lib/demoStore';
import { parseYouTubeUrl } from '../lib/googleDrive';

describe('Student Registration and Role Management (CR & GR)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('registers a new student profile correctly', () => {
    const student = registerStudent({
      display_name: 'Usman Tariq',
      email: 'usman@gmail.com',
      password: 'password123',
      gender: 'male',
      roll_no: '24-CS-001',
      phone: '03001234567',
      program_name: 'ADP Computer Science',
      semester: '1st Semester',
    });

    expect(student.display_name).toBe('Usman Tariq');
    expect(student.email).toBe('usman@gmail.com');
    expect(student.gender).toBe('male');
    expect(student.role).toBe('student');

    const students = getRegisteredStudents();
    expect(students.length).toBe(1);
    expect(students[0].roll_no).toBe('24-CS-001');
  });

  it('prevents duplicate student registration with same email', () => {
    registerStudent({
      display_name: 'Zainab Bibi',
      email: 'zainab@gmail.com',
      password: 'password123',
      gender: 'female',
    });

    expect(() =>
      registerStudent({
        display_name: 'Zainab Duplicate',
        email: 'zainab@gmail.com',
        password: 'password456',
        gender: 'female',
      })
    ).toThrow();
  });

  it('allows Admin to appoint a student as CR and GR', () => {
    const boy = registerStudent({
      display_name: 'Hamza Boy',
      email: 'hamza@gmail.com',
      password: 'pass',
      gender: 'male',
    });

    const girl = registerStudent({
      display_name: 'Ayesha Girl',
      email: 'ayesha@gmail.com',
      password: 'pass',
      gender: 'female',
    });

    // Appoint Hamza as CR
    updateStudentRole(boy.id, 'cr');
    let fresh = getRegisteredStudents();
    expect(fresh.find((s) => s.id === boy.id)?.role).toBe('cr');

    // Appoint Ayesha as GR
    updateStudentRole(girl.id, 'gr');
    fresh = getRegisteredStudents();
    expect(fresh.find((s) => s.id === girl.id)?.role).toBe('gr');

    // Demote Hamza back to student
    updateStudentRole(boy.id, 'student');
    fresh = getRegisteredStudents();
    expect(fresh.find((s) => s.id === boy.id)?.role).toBe('student');
  });
});

describe('Social Media Contacts (WhatsApp & Instagram)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default WhatsApp 03242779514 and Instagram not_urs_hammi', () => {
    const socials = getPlatformSocials();
    expect(socials.whatsapp_number).toBe('03242779514');
    expect(socials.instagram_id).toBe('not_urs_hammi');
    expect(socials.whatsapp_url).toContain('923242779514');
    expect(socials.instagram_url).toContain('not_urs_hammi');
  });

  it('allows Admin to update social media contact details', () => {
    savePlatformSocials({
      whatsapp_number: '03009998877',
      instagram_id: 'hammad_official',
    });

    const updated = getPlatformSocials();
    expect(updated.whatsapp_number).toBe('03009998877');
    expect(updated.instagram_id).toBe('hammad_official');
    expect(updated.instagram_url).toContain('hammad_official');
  });
});

describe('In-Platform Messaging & Gender-Aware Rules', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sends and retrieves chat messages between two users', () => {
    const msg = sendChatMessage({
      sender_id: 'student-1',
      sender_name: 'Ali (Boy Student)',
      sender_role: 'student',
      sender_gender: 'male',
      receiver_id: 'cr-1',
      receiver_name: 'Ahmed (CR)',
      receiver_role: 'cr',
      message: 'Hello CR, please upload Chapter 3 notes.',
    });

    expect(msg.id).toBeDefined();
    expect(msg.message).toBe('Hello CR, please upload Chapter 3 notes.');

    const thread = getConversationMessages('student-1', 'cr-1');
    expect(thread.length).toBe(1);
    expect(thread[0].sender_name).toBe('Ali (Boy Student)');

    // Reverse lookup gets same conversation
    const reverseThread = getConversationMessages('cr-1', 'student-1');
    expect(reverseThread.length).toBe(1);
  });

  it('allows CR and GR to chat with each other and share study materials', () => {
    const crId = 'user-cr-101';
    const grId = 'user-gr-202';

    // 1. CR sends message to GR
    const crMsg = sendChatMessage({
      sender_id: crId,
      sender_name: 'Bilal (CR)',
      sender_role: 'cr',
      sender_gender: 'male',
      receiver_id: grId,
      receiver_name: 'Fatima (GR)',
      receiver_role: 'gr',
      message: 'Hello GR, did you collect the English assignment questions?',
    });
    expect(crMsg.id).toBeDefined();

    // 2. GR replies to CR and shares a PDF study material
    const grMsg = sendChatMessage({
      sender_id: grId,
      sender_name: 'Fatima (GR)',
      sender_role: 'gr',
      sender_gender: 'female',
      receiver_id: crId,
      receiver_name: 'Bilal (CR)',
      receiver_role: 'cr',
      message: 'Yes! Here is the complete PDF worksheet for English grammar.',
      attachment: {
        id: 'mat_eng_1',
        title: 'English Midterm Practice Worksheet',
        subject_name: 'Functional English',
        resource_type: 'pdf',
        file_url: 'https://drive.google.com/file/d/english-practice-pdf',
        description: 'Complete solved grammar worksheet for class preparation',
        created_at: new Date().toISOString(),
      },
    });
    expect(grMsg.attachment).toBeDefined();
    expect(grMsg.attachment?.title).toBe('English Midterm Practice Worksheet');

    // 3. Conversation contains both messages
    const thread = getConversationMessages(crId, grId);
    expect(thread.length).toBe(2);

    // 4. Verify Shared Materials between CR and GR
    const shared = getSharedMaterialsBetween(crId, grId);
    expect(shared.length).toBe(1);
    expect(shared[0].title).toBe('English Midterm Practice Worksheet');
    expect(shared[0].file_url).toContain('google.com');

    // 5. CR can publish the shared material directly to Hammad StudyHub library
    const publishedResource = publishSharedMaterialToHub(shared[0], 'Bilal (CR)');
    expect(publishedResource.id).toBeDefined();
    expect(publishedResource.title).toBe('English Midterm Practice Worksheet');
    expect(publishedResource.status).toBe('published');

    const libraryResources = getDemoResources();
    expect(libraryResources.some((r) => r.id === publishedResource.id)).toBe(true);
  });

  it('allows CR, GR, and Admin to add YouTube video lectures with title and optional description', () => {
    const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const parsed = parseYouTubeUrl(youtubeUrl);
    expect(parsed.isValid).toBe(true);
    expect(parsed.embedUrl).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');

    const subject = {
      id: 'subj_cs_101',
      name: 'Computer Programming',
      slug: 'computer-programming',
      code: 'CS101',
      icon: 'Code',
      color: 'blue',
      is_featured: true,
      is_active: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveDemoSubject(subject);

    const lecture = saveDemoResource({
      id: 'res_yt_test_1',
      subject_id: subject.id,
      title: 'Lecture 1: Introduction to Variables and Memory in C++',
      slug: 'lecture-1-intro-variables',
      description: 'Optional lecture notes on memory allocation and data types.',
      resource_type: 'video',
      source_provider: 'youtube',
      external_url: youtubeUrl,
      embed_url: parsed.embedUrl,
      lesson_date: '2026-10-30',
      chapter: 'Chapter 1',
      topic: 'Variables',
      tags: ['YouTube Lecture', 'Video', 'Computer Programming'],
      status: 'published',
      published_at: new Date().toISOString(),
      created_by: 'Muhammad Hammad (Admin)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subject,
    });

    expect(lecture.id).toBe('res_yt_test_1');
    expect(lecture.resource_type).toBe('video');
    expect(lecture.source_provider).toBe('youtube');
    expect(lecture.embed_url).toBe(parsed.embedUrl);
    expect(lecture.description).toBe('Optional lecture notes on memory allocation and data types.');

    const all = getDemoResources();
    expect(all.some((r) => r.id === 'res_yt_test_1' && r.source_provider === 'youtube')).toBe(true);
  });
});

