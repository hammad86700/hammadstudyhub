// ==============================================================================
// HAMMAD STUDYHUB — DASHBOARD DIRECT MESSAGING & REPRESENTATIVE SUPPORT
// Architect: Muhammad Hammad
//
// Communication Rules:
// - Boys: Can send messages to CR and Admin separately (NO access to GR).
// - Girls: Can send messages to both CR, GR, and Admin.
// - CR: Can send messages to GR (peer rep), Admin, and students.
// - GR: Can send messages to CR (peer rep), Admin, and female students.
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  User,
  ShieldCheck,
  Crown,
  Award,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth, ADMIN_PROFILE, DEFAULT_CR_PROFILE, DEFAULT_GR_PROFILE } from '../../context/AuthContext';
import {
  getRegisteredStudents,
  sendChatMessage,
  getConversationMessages,
  RegisteredStudentEntry,
} from '../../lib/demoStore';
import { broadcastDataChange } from '../../lib/realtimeSync';
import { UserProfile, ChatMessage } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export const DashboardDirectMessaging: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [allStudents, setAllStudents] = useState<RegisteredStudentEntry[]>(() =>
    getRegisteredStudents()
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [targetContact, setTargetContact] = useState<UserProfile | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Sync registered students when updated
  useEffect(() => {
    const handleStudentsUpdated = () => {
      setAllStudents(getRegisteredStudents());
    };
    window.addEventListener('studyhub_students_updated', handleStudentsUpdated);
    return () => window.removeEventListener('studyhub_students_updated', handleStudentsUpdated);
  }, []);

  // Identify appointed CR and GR
  const crProfile: UserProfile = useMemo(() => {
    const cr = allStudents.find((s) => s.role === 'cr');
    return cr || DEFAULT_CR_PROFILE;
  }, [allStudents]);

  const grProfile: UserProfile = useMemo(() => {
    const gr = allStudents.find((s) => s.role === 'gr');
    return gr || DEFAULT_GR_PROFILE;
  }, [allStudents]);

  const handleOpenCompose = (contact: UserProfile) => {
    setTargetContact(contact);
    setMessageText('');
    setSuccessNotice(null);
    setErrorNotice(null);
    setModalOpen(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !profile || !targetContact) {
      setErrorNotice('Please write a message before sending.');
      return;
    }

    setIsSending(true);
    setErrorNotice(null);

    try {
      const newMsg = sendChatMessage({
        sender_id: profile.id,
        sender_name: profile.display_name,
        sender_role: profile.role,
        sender_gender: profile.gender,
        receiver_id: targetContact.id,
        receiver_name: targetContact.display_name,
        receiver_role: targetContact.role,
        message: messageText.trim(),
      });

      // Broadcast immediately across all devices (Mobile + Laptop)
      await broadcastDataChange('chat', 'create', newMsg);

      setIsSending(false);
      setMessageText('');
      setSuccessNotice(
        `Message delivered to ${targetContact.display_name}! They will see it immediately on their device.`
      );
    } catch (err: any) {
      setIsSending(false);
      setErrorNotice(err?.message || 'Failed to send message. Please try again.');
    }
  };

  // If no profile, do not render
  if (!profile) return null;

  const isBoy = profile.role === 'student' && profile.gender === 'male';
  const isGirl = profile.role === 'student' && profile.gender === 'female';
  const isCR = profile.role === 'cr';
  const isGR = profile.role === 'gr';
  const isAdmin = profile.role === 'admin';

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {isCR || isGR
                ? 'Representative Peer Messaging & Support'
                : 'Direct Class Messaging & Support'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isBoy &&
              'Communicate separately with your Class Representative (CR) or Master Administrator.'}
            {isGirl &&
              'Communicate with your Class Representative (CR), Girls Representative (GR), or Master Administrator.'}
            {isCR &&
              'Coordinate with Girls Representative (GR), contact Master Admin, or view student inquiries.'}
            {isGR &&
              'Coordinate with Class Representative (CR), contact Master Admin, or support female students.'}
            {isAdmin &&
              'Direct administrative channels to Class Representatives and enrolled students.'}
          </p>
        </div>

        <Link
          to="/chat"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 group shrink-0"
        >
          <span>Open Full Chat Portal</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ========================================================================= */}
        {/* 1. CLASS REPRESENTATIVE (CR) OPTION                                       */}
        {/* Shown to: Boys, Girls, GR (Peer rep), and Admin                           */}
        {/* ========================================================================= */}
        {(!isCR || isAdmin) && (
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle hover:border-blue-400/60 dark:hover:border-blue-500/40 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  {isGR ? 'Peer Representative' : 'Class Representative'}
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Message CR ({crProfile.display_name.replace(' (CR)', '')})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {isGR
                    ? 'Coordinate course handouts, timetable changes, and study resources with your fellow representative.'
                    : 'Ask about upcoming lecture notes, assignment deadlines, or syllabus updates.'}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 w-full min-w-0">
              <Button
                size="sm"
                variant="primary"
                className="flex-1 min-w-0 text-xs font-bold"
                onClick={() => handleOpenCompose(crProfile)}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Send Message
              </Button>
              <Link
                to="/chat?role=cr"
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-navy-950 dark:hover:bg-slate-800 transition-colors shrink-0"
                title="Open Conversation"
              >
                Chat
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. GIRLS REPRESENTATIVE (GR) OPTION                                       */}
        {/* Shown to: Girls, CR (Peer rep), and Admin. (STRICTLY HIDDEN FROM BOYS)    */}
        {/* ========================================================================= */}
        {(isGirl || isCR || isAdmin) && (
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle hover:border-pink-400/60 dark:hover:border-pink-500/40 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950/80 dark:text-pink-300 border border-pink-200 dark:border-pink-800/60">
                  {isCR ? 'Peer Representative' : 'Girls Representative'}
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Message GR ({grProfile.display_name.replace(' (GR)', '')})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {isCR
                    ? 'Coordinate with the Girls Representative to share study materials, past papers, and class notices.'
                    : 'Private, dedicated communication channel with your Girls Representative for female student academic coordination.'}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 w-full min-w-0">
              <Button
                size="sm"
                variant="primary"
                className="flex-1 min-w-0 text-xs font-bold !bg-pink-600 hover:!bg-pink-700 !border-pink-600"
                onClick={() => handleOpenCompose(grProfile)}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Send Message
              </Button>
              <Link
                to="/chat?role=gr"
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-navy-950 dark:hover:bg-slate-800 transition-colors shrink-0"
                title="Open Conversation"
              >
                Chat
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. MASTER ADMINISTRATOR OPTION                                            */}
        {/* Shown to: Boys, Girls, CR, and GR                                         */}
        {/* ========================================================================= */}
        {!isAdmin && (
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle hover:border-emerald-400/60 dark:hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  Master Admin
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Message Admin (Muhammad Hammad)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Official direct channel for platform support, requesting specific course modules, or reporting issues.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 w-full min-w-0">
              <Button
                size="sm"
                variant="primary"
                className="flex-1 min-w-0 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
                onClick={() => handleOpenCompose(ADMIN_PROFILE)}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Send Message
              </Button>
              <Link
                to="/chat?role=admin"
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-navy-950 dark:hover:bg-slate-800 transition-colors shrink-0"
                title="Open Conversation"
              >
                Chat
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. CLASS / STUDENT INBOX (For CR, GR, and Admin)                          */}
        {/* ========================================================================= */}
        {(isCR || isGR || isAdmin) && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-navy-900 to-indigo-950 text-white shadow-subtle flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  <Users className="w-5 h-5 text-brand-300" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/20">
                  Representative Portal
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isCR ? 'Class Student Inbox' : isGR ? 'Female Student Inbox' : 'All Student Chats'}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {isCR
                    ? 'Review and respond to messages from male and female students in your section.'
                    : isGR
                    ? 'Review and respond to academic questions from female students.'
                    : 'Oversee representative communication and message any student directly.'}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10">
              <Link
                to="/chat"
                className="w-full py-2 px-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors"
              >
                <span>Open Student Inbox</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* QUICK SEND MESSAGE MODAL                                                  */}
      {/* ========================================================================= */}
      {modalOpen && targetContact && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Send Message to ${targetContact.display_name}`}
          maxWidth="md"
        >
          <form onSubmit={handleSendMessage} className="space-y-4 pt-1">
            {/* Recipient Badge */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                  {targetContact.role === 'admin'
                    ? 'AD'
                    : targetContact.role === 'cr'
                    ? 'CR'
                    : 'GR'}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {targetContact.display_name}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {targetContact.role === 'admin'
                      ? 'Platform Administrator'
                      : targetContact.role === 'cr'
                      ? 'Class Representative'
                      : 'Girls Representative'}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {targetContact.role}
              </span>
            </div>

            {/* Success Banner */}
            {successNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p>{successNotice}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold !border-emerald-300 dark:!border-emerald-800"
                    onClick={() => {
                      setModalOpen(false);
                      navigate(`/chat?to=${targetContact.id}`);
                    }}
                  >
                    View in Chat Thread &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorNotice && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            {/* Message Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="quick-message-text"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Your Message
              </label>
              <textarea
                id="quick-message-text"
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Type your message to ${targetContact.display_name}...`}
                className="w-full p-3 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                disabled={isSending}
                autoFocus
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400 px-1">
                <span>Sent directly from your StudyHub Dashboard</span>
                <span>{messageText.length} characters</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSending}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Send Message Now
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
};

