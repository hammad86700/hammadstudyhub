// ==============================================================================
// HAMMAD STUDYHUB — GENDER-AWARE IN-PLATFORM MESSAGING & CHAT SYSTEM
// Communication Rules:
// - Boys only chat with CR (and Admin)
// - Girls can chat with CR and GR (and Admin)
// - CR chats with Boys, Girls, GR, and Admin
// - GR chats with Girls, CR, and Admin
// - Admin chats with all students and representatives
// ==============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  User,
  ShieldCheck,
  Crown,
  Award,
  Lock,
  Sparkles,
  Info,
  Clock,
  CheckCheck,
} from 'lucide-react';
import { useAuth, ADMIN_PROFILE } from '../context/AuthContext';
import {
  getRegisteredStudents,
  getConversationMessages,
  sendChatMessage,
  getActiveCR,
  getActiveGR,
} from '../lib/demoStore';
import { UserProfile, ChatMessage } from '../types';
import { SEOHead } from '../components/common/SEOHead';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { formatRelativeTime } from '../lib/utils';

export const ChatPage: React.FC = () => {
  const { profile, isLoggedIn } = useAuth();
  const [selectedContact, setSelectedContact] = useState<UserProfile | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allStudents, setAllStudents] = useState<UserProfile[]>(() => getRegisteredStudents());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync students and messages on updates
  useEffect(() => {
    const handleUpdate = () => {
      setAllStudents(getRegisteredStudents());
      if (profile && selectedContact) {
        setMessages(getConversationMessages(profile.id, selectedContact.id));
      }
    };

    window.addEventListener('studyhub_students_updated', handleUpdate);
    window.addEventListener('studyhub_chat_updated', handleUpdate);

    return () => {
      window.removeEventListener('studyhub_students_updated', handleUpdate);
      window.removeEventListener('studyhub_chat_updated', handleUpdate);
    };
  }, [profile, selectedContact]);

  // Load conversation when selectedContact changes
  useEffect(() => {
    if (profile && selectedContact) {
      setMessages(getConversationMessages(profile.id, selectedContact.id));
    }
  }, [profile, selectedContact]);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ---------------------------------------------------------------------------
  // GENDER & ROLE-BASED ALLOWED CONTACTS FILTER
  // ---------------------------------------------------------------------------
  const allowedContacts = useMemo<UserProfile[]>(() => {
    if (!profile) return [];

    const cr = allStudents.find((s) => s.role === 'cr');
    const gr = allStudents.find((s) => s.role === 'gr');
    const contacts: UserProfile[] = [];

    // Fallback virtual profiles for CR / GR if not appointed yet
    const crFallback: UserProfile = cr || {
      id: 'virtual-cr-id',
      display_name: 'Class Representative (CR)',
      email: 'cr@hammadstudyhub.com',
      role: 'cr',
      gender: 'male',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const grFallback: UserProfile = gr || {
      id: 'virtual-gr-id',
      display_name: 'Girls Representative (GR)',
      email: 'gr@hammadstudyhub.com',
      role: 'gr',
      gender: 'female',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Male Student Rule: Only CR and Admin
    if (profile.role === 'student' && profile.gender === 'male') {
      contacts.push(crFallback);
      contacts.push(ADMIN_PROFILE);
      return contacts;
    }

    // 2. Female Student Rule: Both CR, GR, and Admin
    if (profile.role === 'student' && profile.gender === 'female') {
      contacts.push(crFallback);
      contacts.push(grFallback);
      contacts.push(ADMIN_PROFILE);
      return contacts;
    }

    // 3. CR Rule: Chats with all students (boys & girls), GR, and Admin
    if (profile.role === 'cr') {
      contacts.push(ADMIN_PROFILE);
      if (gr) contacts.push(gr);
      allStudents
        .filter((s) => s.id !== profile.id && s.role === 'student')
        .forEach((s) => contacts.push(s));
      return contacts;
    }

    // 4. GR Rule: Chats with female students, CR, and Admin
    if (profile.role === 'gr') {
      contacts.push(ADMIN_PROFILE);
      if (cr) contacts.push(cr);
      allStudents
        .filter((s) => s.id !== profile.id && s.gender === 'female' && s.role === 'student')
        .forEach((s) => contacts.push(s));
      return contacts;
    }

    // 5. Admin Rule: Oversees and can chat with all students and representatives
    if (profile.role === 'admin') {
      if (cr) contacts.push(cr);
      if (gr) contacts.push(gr);
      allStudents
        .filter((s) => s.id !== profile.id)
        .forEach((s) => contacts.push(s));
      return contacts;
    }

    return contacts;
  }, [profile, allStudents]);

  // Set default contact
  useEffect(() => {
    if (allowedContacts.length > 0 && !selectedContact) {
      setSelectedContact(allowedContacts[0]);
    }
  }, [allowedContacts, selectedContact]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !profile || !selectedContact) return;

    sendChatMessage({
      sender_id: profile.id,
      sender_name: profile.display_name,
      sender_role: profile.role,
      sender_gender: profile.gender,
      receiver_id: selectedContact.id,
      receiver_name: selectedContact.display_name,
      receiver_role: selectedContact.role,
      message: messageText.trim(),
    });

    setMessageText('');
  };

  // If user is not logged in
  if (!isLoggedIn || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <SEOHead title="Student Messaging — Hammad StudyHub" />
        <div className="w-16 h-16 rounded-3xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            In-Platform Student Messaging
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Please sign in or create a student account to message your Class Representative (CR), Girls Representative (GR), or the Administrator.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link to="/login">
            <Button size="md" variant="primary">
              Sign In to Chat
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="md" variant="outline">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
          <ShieldCheck className="w-3 h-3 text-brand-600" /> Admin
        </span>
      );
    }
    if (role === 'cr') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <Crown className="w-3 h-3 text-amber-600" /> CR
        </span>
      );
    }
    if (role === 'gr') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
          <Award className="w-3 h-3 text-purple-600" /> GR
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        Student
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <SEOHead title="Representative Messaging & Class Chat" />

      {/* Top Banner Notice */}
      <aside className="p-3.5 rounded-2xl bg-brand-50/60 dark:bg-navy-900 border border-brand-200 dark:border-brand-900/60 flex items-start gap-2.5 text-xs text-brand-900 dark:text-brand-300">
        <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
        <p>
          <strong>Class Communication Protocol:</strong> Male students can message the Class Representative (CR) or Admin. Female students can message both the Class Representative (CR) or Girls Representative (GR), as well as the Admin.
        </p>
      </aside>

      {/* Main Chat Layout */}
      <Card className="h-[620px] sm:h-[680px] flex overflow-hidden border border-slate-200 dark:border-slate-800 shadow-card">
        {/* Left Contacts Sidebar */}
        <div className="w-full sm:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-navy-950/40">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Conversations</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {allowedContacts.length} Contacts
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {allowedContacts.map((contact) => {
              const isSelected = selectedContact?.id === contact.id;
              return (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                    isSelected
                      ? 'bg-brand-50 dark:bg-navy-900 border-l-4 border-brand-600'
                      : 'hover:bg-slate-100/70 dark:hover:bg-navy-900/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                    {contact.display_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {contact.display_name}
                      </span>
                      {getRoleBadge(contact.role)}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {contact.role === 'admin'
                        ? 'Master Platform Admin'
                        : contact.role === 'cr'
                        ? 'Class Representative (CR)'
                        : contact.role === 'gr'
                        ? 'Girls Representative (GR)'
                        : `${contact.roll_no || contact.email}`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Current User Card */}
          <div className="p-3 bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs">
              {profile.display_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {profile.display_name}
              </div>
              <div className="text-[10px] text-slate-400 capitalize">
                Signed in as {profile.role} ({profile.gender})
              </div>
            </div>
          </div>
        </div>

        {/* Right Chat Window */}
        <div className="flex-1 flex flex-col bg-white dark:bg-navy-900 min-w-0">
          {selectedContact ? (
            <>
              {/* Conversation Top Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-navy-950/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center shadow-xs">
                    {selectedContact.display_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {selectedContact.display_name}
                      </h3>
                      {getRoleBadge(selectedContact.role)}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {selectedContact.role === 'cr'
                        ? 'Class Representative for Course Coordination'
                        : selectedContact.role === 'gr'
                        ? 'Girls Representative for Female Student Support'
                        : selectedContact.role === 'admin'
                        ? 'Master Platform Administrator & Creator'
                        : `${selectedContact.program_name || 'Student'}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/20 dark:bg-navy-950/20">
                {messages.length > 0 ? (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === profile.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isMine
                              ? 'bg-brand-600 text-white rounded-br-none'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/80 rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatRelativeTime(msg.created_at)}</span>
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
                    <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      No messages yet with {selectedContact.display_name}
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm">
                      Send a message to coordinate study notes, request specific lecture materials, or ask question about upcoming tests.
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-navy-900"
              >
                <input
                  type="text"
                  placeholder={`Message ${selectedContact.display_name}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button
                  type="submit"
                  size="md"
                  disabled={!messageText.trim()}
                  rightIcon={<Send className="w-3.5 h-3.5" />}
                  className="shrink-0"
                >
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
              <p className="text-xs">Select a contact from the left list to begin messaging.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
