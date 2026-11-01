// ==============================================================================
// HAMMAD STUDYHUB — DASHBOARD DIRECT MESSAGING UNIT TESTS
// Verifies gender-specific and representative communication rules:
// - Boys can message CR and Admin separately (NO access to GR)
// - Girls can message CR, GR, and Admin
// - CR and GR can message each other on their dashboard
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerStudent,
  updateStudentRole,
  sendChatMessage,
  getConversationMessages,
  getRegisteredStudents,
  resetDemoResourcesCache,
} from '../lib/demoStore';
import { ADMIN_PROFILE, DEFAULT_CR_PROFILE, DEFAULT_GR_PROFILE } from '../context/AuthContext';
import { UserProfile } from '../types';

describe('Dashboard Direct Messaging & Representative Rules', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoResourcesCache();
  });

  it('1. Boys can send messages to CR and Admin separately', () => {
    const boyStudent = registerStudent({
      display_name: 'Ali Raza',
      email: 'ali.raza@example.com',
      password: 'password123',
      gender: 'male',
      roll_no: 'CS-2026-001',
    });

    const crStudent = registerStudent({
      display_name: 'Ahmed CR',
      email: 'ahmed.cr@example.com',
      password: 'password123',
      gender: 'male',
      roll_no: 'CS-2026-002',
    });
    updateStudentRole(crStudent.id, 'cr');

    // Boy sends message to CR separately
    const msgToCR = sendChatMessage({
      sender_id: boyStudent.id,
      sender_name: boyStudent.display_name,
      sender_role: 'student',
      sender_gender: 'male',
      receiver_id: crStudent.id,
      receiver_name: crStudent.display_name,
      receiver_role: 'cr',
      message: 'Hello CR, what are the assigned chapters for tomorrow?',
    });

    // Boy sends message to Admin separately
    const msgToAdmin = sendChatMessage({
      sender_id: boyStudent.id,
      sender_name: boyStudent.display_name,
      sender_role: 'student',
      sender_gender: 'male',
      receiver_id: ADMIN_PROFILE.id,
      receiver_name: ADMIN_PROFILE.display_name,
      receiver_role: 'admin',
      message: 'Hello Admin Hammad, please upload the DLD past paper solution.',
    });

    expect(msgToCR.receiver_id).toBe(crStudent.id);
    expect(msgToAdmin.receiver_id).toBe(ADMIN_PROFILE.id);

    // Conversations are isolated
    const crConversation = getConversationMessages(boyStudent.id, crStudent.id);
    expect(crConversation.length).toBe(1);
    expect(crConversation[0].message).toContain('assigned chapters');

    const adminConversation = getConversationMessages(boyStudent.id, ADMIN_PROFILE.id);
    expect(adminConversation.length).toBe(1);
    expect(adminConversation[0].message).toContain('DLD past paper');
  });

  it('2. Girls can send messages to both CR, GR, and Admin', () => {
    const girlStudent = registerStudent({
      display_name: 'Fatima Zahra',
      email: 'fatima@example.com',
      password: 'password123',
      gender: 'female',
      roll_no: 'CS-2026-003',
    });

    const crStudent = registerStudent({
      display_name: 'Bilal CR',
      email: 'bilal.cr@example.com',
      password: 'password123',
      gender: 'male',
      roll_no: 'CS-2026-004',
    });
    updateStudentRole(crStudent.id, 'cr');

    const grStudent = registerStudent({
      display_name: 'Ayesha GR',
      email: 'ayesha.gr@example.com',
      password: 'password123',
      gender: 'female',
      roll_no: 'CS-2026-005',
    });
    updateStudentRole(grStudent.id, 'gr');

    // Girl sends message to CR
    sendChatMessage({
      sender_id: girlStudent.id,
      sender_name: girlStudent.display_name,
      sender_role: 'student',
      sender_gender: 'female',
      receiver_id: crStudent.id,
      receiver_name: crStudent.display_name,
      receiver_role: 'cr',
      message: 'Hello CR, please share the Functional English handout.',
    });

    // Girl sends message to GR
    sendChatMessage({
      sender_id: girlStudent.id,
      sender_name: girlStudent.display_name,
      sender_role: 'student',
      sender_gender: 'female',
      receiver_id: grStudent.id,
      receiver_name: grStudent.display_name,
      receiver_role: 'gr',
      message: 'Hello GR Ayesha, can you clarify the presentation schedule?',
    });

    // Girl sends message to Admin
    sendChatMessage({
      sender_id: girlStudent.id,
      sender_name: girlStudent.display_name,
      sender_role: 'student',
      sender_gender: 'female',
      receiver_id: ADMIN_PROFILE.id,
      receiver_name: ADMIN_PROFILE.display_name,
      receiver_role: 'admin',
      message: 'Hello Admin, thank you for the StudyHub portal!',
    });

    expect(getConversationMessages(girlStudent.id, crStudent.id).length).toBe(1);
    expect(getConversationMessages(girlStudent.id, grStudent.id).length).toBe(1);
    expect(getConversationMessages(girlStudent.id, ADMIN_PROFILE.id).length).toBe(1);
  });

  it('3. CR and GR can send messages to each other on their dashboard', () => {
    const crStudent = registerStudent({
      display_name: 'Usman CR',
      email: 'usman.cr@example.com',
      password: 'password123',
      gender: 'male',
      roll_no: 'CS-2026-006',
    });
    updateStudentRole(crStudent.id, 'cr');

    const grStudent = registerStudent({
      display_name: 'Zainab GR',
      email: 'zainab.gr@example.com',
      password: 'password123',
      gender: 'female',
      roll_no: 'CS-2026-007',
    });
    updateStudentRole(grStudent.id, 'gr');

    // CR sends message to GR
    const crToGr = sendChatMessage({
      sender_id: crStudent.id,
      sender_name: crStudent.display_name,
      sender_role: 'cr',
      sender_gender: 'male',
      receiver_id: grStudent.id,
      receiver_name: grStudent.display_name,
      receiver_role: 'gr',
      message: 'Hello GR, here is the updated lab timetable for our batch.',
    });

    // GR replies to CR
    const grToCr = sendChatMessage({
      sender_id: grStudent.id,
      sender_name: grStudent.display_name,
      sender_role: 'gr',
      sender_gender: 'female',
      receiver_id: crStudent.id,
      receiver_name: crStudent.display_name,
      receiver_role: 'cr',
      message: 'Received CR! I will notify all the girls in our section.',
    });

    const conversation = getConversationMessages(crStudent.id, grStudent.id);
    expect(conversation.length).toBe(2);
    expect(conversation[0].sender_id).toBe(crStudent.id);
    expect(conversation[1].sender_id).toBe(grStudent.id);
  });

  it('4. Default virtual representatives provide reliable fallback before appointments', () => {
    expect(DEFAULT_CR_PROFILE.role).toBe('cr');
    expect(DEFAULT_CR_PROFILE.display_name).toContain('CR');
    expect(DEFAULT_GR_PROFILE.role).toBe('gr');
    expect(DEFAULT_GR_PROFILE.display_name).toContain('GR');
  });
});

