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
  clearAllStoredData,
} from '../lib/demoStore';

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
});
