// ==============================================================================
// HAMMAD STUDYHUB — GENDER-AWARE IN-PLATFORM MESSAGING & CHAT SYSTEM
// Communication Rules:
// - CR and GR can chat with each other and share study materials/notes/PDFs
// - Boys only chat with CR (and Admin)
// - Girls can chat with CR and GR (and Admin)
// - CR chats with Boys, Girls, GR, and Admin
// - GR chats with Girls, CR, and Admin
// - Admin chats with all students and representatives
// ==============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Paperclip,
  FolderOpen,
  Share2,
  ExternalLink,
  FileText,
  Video,
  FileSpreadsheet,
  Layers,
  Link as LinkIcon,
  Check,
  Copy,
  PlusCircle,
  ArrowLeft,
} from 'lucide-react';
import { useAuth, ADMIN_PROFILE, DEFAULT_CR_PROFILE, DEFAULT_GR_PROFILE } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  getRegisteredStudents,
  mergeRegisteredStudentsLocally,
  RegisteredStudentEntry,
  getConversationMessages,
  sendChatMessage,
  publishSharedMaterialToHub,
} from '../lib/demoStore';
import { UserProfile, ChatMessage, SharedMaterialAttachment, ResourceType } from '../types';
import { SEOHead } from '../components/common/SEOHead';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { formatRelativeTime } from '../lib/utils';
import { ShareMaterialModal } from '../components/chat/ShareMaterialModal';
import { SharedMaterialsDrawer } from '../components/chat/SharedMaterialsDrawer';
import { broadcastDataChange } from '../lib/realtimeSync';

export const ChatPage: React.FC = () => {
  const { profile, isLoggedIn } = useAuth();
  const [searchParams] = useSearchParams();
  const targetRole = searchParams.get('role');
  const targetId = searchParams.get('to') || searchParams.get('contactId');

  const [selectedContact, setSelectedContact] = useState<UserProfile | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allStudents, setAllStudents] = useState<UserProfile[]>(() => getRegisteredStudents());
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedAttachmentId, setCopiedAttachmentId] = useState<string | null>(null);
  const [publishedMap, setPublishedMap] = useState<Record<string, boolean>>({});
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync students and messages on updates
  useEffect(() => {
    if (isSupabaseConfigured) {
      (async () => {
        try {
          const { data, error } = await supabase
            .from('registered_students')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data) {
            const merged = mergeRegisteredStudentsLocally(data as RegisteredStudentEntry[]);
            setAllStudents(merged);
          }
        } catch {
          // ignore
        }
      })();
    }

    const handleUpdate = () => {
      setAllStudents(getRegisteredStudents());
      if (profile && selectedContact) {
        setMessages(getConversationMessages(profile.id, selectedContact.id));
      }
    };

    window.addEventListener('studyhub_students_updated', handleUpdate);
    window.addEventListener('studyhub_chat_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    const interval = setInterval(handleUpdate, 4000);

    return () => {
      window.removeEventListener('studyhub_students_updated', handleUpdate);
      window.removeEventListener('studyhub_chat_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      clearInterval(interval);
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

    const crs = allStudents.filter((s) => s.role === 'cr' && s.id !== profile.id);
    const grs = allStudents.filter((s) => s.role === 'gr' && s.id !== profile.id);
    const contacts: UserProfile[] = [];

    const crFallback: UserProfile = crs[0] || DEFAULT_CR_PROFILE;
    const grFallback: UserProfile = grs[0] || DEFAULT_GR_PROFILE;

    // 1. Male Student Rule: Only CR and Admin
    if (profile.role === 'student' && profile.gender === 'male') {
      if (crs.length > 0) crs.forEach((c) => contacts.push(c));
      else contacts.push(crFallback);
      contacts.push(ADMIN_PROFILE);
      return contacts;
    }

    // 2. Female Student Rule: Both CR, GR, and Admin
    if (profile.role === 'student' && profile.gender === 'female') {
      if (crs.length > 0) crs.forEach((c) => contacts.push(c));
      else contacts.push(crFallback);
      if (grs.length > 0) grs.forEach((g) => contacts.push(g));
      else contacts.push(grFallback);
      contacts.push(ADMIN_PROFILE);
      return contacts;
    }

    // 3. CR Rule: Chats with GR (and other CRs), Admin, and all students (boys & girls)
    if (profile.role === 'cr') {
      // Connect directly with GR
      if (grs.length > 0) grs.forEach((g) => contacts.push(g));
      else contacts.push(grFallback);

      contacts.push(ADMIN_PROFILE);
      crs.forEach((c) => contacts.push(c));
      allStudents
        .filter((s) => s.id !== profile.id && s.role === 'student')
        .forEach((s) => contacts.push(s));
      return contacts;
    }

    // 4. GR Rule: Chats with CR (and other GRs), Admin, and female students
    if (profile.role === 'gr') {
      // Connect directly with CR
      if (crs.length > 0) crs.forEach((c) => contacts.push(c));
      else contacts.push(crFallback);

      contacts.push(ADMIN_PROFILE);
      grs.forEach((g) => contacts.push(g));
      allStudents
        .filter((s) => s.id !== profile.id && s.gender === 'female' && s.role === 'student')
        .forEach((s) => contacts.push(s));
      return contacts;
    }

    // 5. Admin Rule: Oversees and can chat with CR, GR, and all students
    if (profile.role === 'admin') {
      if (crs.length > 0) crs.forEach((c) => contacts.push(c));
      else contacts.push(crFallback);
      if (grs.length > 0) grs.forEach((g) => contacts.push(g));
      else contacts.push(grFallback);
      allStudents
        .filter((s) => s.id !== profile.id && s.role !== 'cr' && s.role !== 'gr')
        .forEach((s) => contacts.push(s));
      return contacts;
    }

    return contacts;
  }, [profile, allStudents]);

  // Set selected contact based on searchParams or default
  useEffect(() => {
    if (allowedContacts.length > 0) {
      if (targetRole) {
        const found = allowedContacts.find((c) => c.role === targetRole.toLowerCase());
        if (found) {
          setSelectedContact(found);
          return;
        }
      }
      if (targetId) {
        const found = allowedContacts.find((c) => c.id === targetId);
        if (found) {
          setSelectedContact(found);
          return;
        }
      }
      if (!selectedContact) {
        setSelectedContact(allowedContacts[0]);
      }
    }
  }, [allowedContacts, targetRole, targetId]);

  // Collect all shared material attachments in the current conversation
  const sharedMaterialsInConversation = useMemo<SharedMaterialAttachment[]>(() => {
    const list: SharedMaterialAttachment[] = [];
    messages.forEach((m) => {
      if (m.attachment) {
        list.push(m.attachment);
      }
    });
    return list;
  }, [messages]);

  const canManageStudyMaterial = profile?.role === 'cr' || profile?.role === 'gr' || profile?.role === 'admin';
  const isCrGrCollaboration =
    (profile?.role === 'cr' && selectedContact?.role === 'gr') ||
    (profile?.role === 'gr' && selectedContact?.role === 'cr');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !profile || !selectedContact) return;

    const newMsg = sendChatMessage({
      sender_id: profile.id,
      sender_name: profile.display_name,
      sender_role: profile.role,
      sender_gender: profile.gender,
      receiver_id: selectedContact.id,
      receiver_name: selectedContact.display_name,
      receiver_role: selectedContact.role,
      message: messageText.trim(),
    });

    broadcastDataChange('chat', 'create', newMsg);
    setMessageText('');
  };

  const handleShareMaterial = (
    attachment: SharedMaterialAttachment,
    optionalMessage?: string,
    publishToHub?: boolean
  ) => {
    if (!profile || !selectedContact) return;

    const message = optionalMessage || `📎 Shared study material: ${attachment.title}`;

    const newMsg = sendChatMessage({
      sender_id: profile.id,
      sender_name: profile.display_name,
      sender_role: profile.role,
      sender_gender: profile.gender,
      receiver_id: selectedContact.id,
      receiver_name: selectedContact.display_name,
      receiver_role: selectedContact.role,
      message,
      attachment,
    });

    broadcastDataChange('chat', 'create', newMsg);

    if (publishToHub && canManageStudyMaterial) {
      publishSharedMaterialToHub(attachment, profile.display_name);
      setPublishedMap((prev) => ({ ...prev, [attachment.id]: true }));
      setBannerNotice(`"${attachment.title}" has been published to Hammad StudyHub subjects!`);
      setTimeout(() => setBannerNotice(null), 4000);
    }
  };

  const handlePublishAttachmentToHub = (attachment: SharedMaterialAttachment) => {
    if (!profile) return;
    publishSharedMaterialToHub(attachment, profile.display_name);
    setPublishedMap((prev) => ({ ...prev, [attachment.id]: true }));
    setBannerNotice(`"${attachment.title}" successfully added to Hammad StudyHub library.`);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  const handleCopyLink = (attachment: SharedMaterialAttachment) => {
    navigator.clipboard.writeText(attachment.file_url);
    setCopiedAttachmentId(attachment.id);
    setTimeout(() => setCopiedAttachmentId(null), 2000);
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
            In-Platform Student & Representative Messaging
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Sign in to chat with Class Representatives (CR), Girls Representatives (GR), exchange study notes and materials, or contact the Administrator.
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

  const getFormatIcon = (type: ResourceType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-blue-500" />;
      case 'past_paper':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'assignment':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
      case 'presentation':
        return <Layers className="w-4 h-4 text-indigo-500" />;
      default:
        return <LinkIcon className="w-4 h-4 text-cyan-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <SEOHead title="Representative Messaging & Study Material Collaboration" />

      {/* Top Banner Notice */}
      <aside className="p-3.5 rounded-2xl bg-brand-50/60 dark:bg-navy-900 border border-brand-200 dark:border-brand-900/60 flex items-start gap-2.5 text-xs text-brand-900 dark:text-brand-300">
        <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
        <p>
          <strong>Class Communication & Material Exchange:</strong> Class Representative (CR) and Girls Representative (GR) can chat directly and share lecture notes, PDFs, and study materials with each other. Boys can message CR & Admin; Girls can message both CR & GR as well as Admin.
        </p>
      </aside>

      {/* Dynamic Toast / Notice */}
      {bannerNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{bannerNotice}</span>
          </div>
          <button onClick={() => setBannerNotice(null)} className="text-emerald-700 hover:text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {/* Main Chat Layout */}
      <Card className="h-[640px] sm:h-[700px] flex overflow-hidden border border-slate-200 dark:border-slate-800 shadow-card">
        {/* Left Contacts Sidebar */}
        <div className={`${selectedContact ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 sm:shrink-0 border-r border-slate-200 dark:border-slate-800 flex-col bg-slate-50/50 dark:bg-navy-950/40`}>
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
              const isRepCollaboration =
                (profile.role === 'cr' && contact.role === 'gr') ||
                (profile.role === 'gr' && contact.role === 'cr');

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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs relative">
                    {contact.display_name.substring(0, 2).toUpperCase()}
                    {isRepCollaboration && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 border-2 border-white dark:border-navy-900 rounded-full" title="Representative Collaboration" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {contact.display_name}
                      </span>
                      {getRoleBadge(contact.role)}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {isRepCollaboration ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          ★ CR & GR Data Collaboration
                        </span>
                      ) : contact.role === 'admin' ? (
                        'Master Platform Admin'
                      ) : contact.role === 'cr' ? (
                        'Class Representative (CR)'
                      ) : contact.role === 'gr' ? (
                        'Girls Representative (GR)'
                      ) : (
                        `${contact.roll_no || contact.email}`
                      )}
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
        <div className={`${selectedContact ? 'flex' : 'hidden sm:flex'} flex-1 flex-col bg-white dark:bg-navy-900 min-w-0`}>
          {selectedContact ? (
            <>
              {/* Conversation Top Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-navy-950/30">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedContact(null)}
                    className="sm:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                    title="Back to conversations"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center shadow-xs shrink-0 text-xs sm:text-sm">
                    {selectedContact.display_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {selectedContact.display_name}
                      </h3>
                      {getRoleBadge(selectedContact.role)}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {isCrGrCollaboration
                        ? 'CR & GR Study Collaboration • Material Exchange Channel'
                        : selectedContact.role === 'cr'
                        ? 'Class Representative for Course Coordination'
                        : selectedContact.role === 'gr'
                        ? 'Girls Representative for Female Student Support'
                        : selectedContact.role === 'admin'
                        ? 'Master Platform Administrator & Creator'
                        : `${selectedContact.program_name || 'Student'}`}
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons (Share Material & Shared Locker) */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                    title="View all shared notes and materials in this chat"
                  >
                    <FolderOpen className="w-4 h-4 text-brand-600" />
                    <span className="hidden sm:inline">Shared Materials</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold">
                      {sharedMaterialsInConversation.length}
                    </span>
                  </button>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsShareModalOpen(true)}
                    leftIcon={<Share2 className="w-3.5 h-3.5" />}
                  >
                    <span className="hidden sm:inline">Share Material</span>
                    <span className="sm:hidden">Share</span>
                  </Button>
                </div>
              </div>

              {/* CR & GR Material Collaboration Banner when chatting together */}
              {isCrGrCollaboration && (
                <div className="px-4 py-2 bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-950/20 dark:to-purple-950/20 border-b border-amber-200/50 dark:border-amber-900/30 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      <strong>CR & GR Study Hub:</strong> Share lecture notes, PDFs, and syllabus materials here. You can also publish them directly to Hammad StudyHub subjects!
                    </span>
                  </div>
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="text-[11px] font-bold text-amber-800 dark:text-amber-300 underline shrink-0 ml-2"
                  >
                    + Share File Now
                  </button>
                </div>
              )}

              {/* Message Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/20 dark:bg-navy-950/20">
                {messages.length > 0 ? (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === profile.id;
                    const attachment = msg.attachment;
                    const isAttachmentPublished = attachment
                      ? publishedMap[attachment.id] || attachment.is_hub_resource
                      : false;
                    const isAttachmentCopied = attachment && copiedAttachmentId === attachment.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[90%] sm:max-w-[75%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isMine
                              ? 'bg-brand-600 text-white rounded-br-none'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/80 rounded-bl-none'
                          }`}
                        >
                          {/* Message Text */}
                          {msg.message && (
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                          )}

                          {/* Embedded Shared Study Material Card */}
                          {attachment && (
                            <div
                              className={`mt-2.5 p-3 rounded-xl border text-left transition-all ${
                                isMine
                                  ? 'bg-white/10 border-white/20 text-white'
                                  : 'bg-slate-50 dark:bg-navy-950/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-xs shrink-0">
                                  {getFormatIcon(attachment.resource_type)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                                      {attachment.subject_name || 'Subject'}
                                    </span>
                                    <span
                                      className={`text-[10px] uppercase font-semibold ${
                                        isMine ? 'text-brand-100' : 'text-slate-400'
                                      }`}
                                    >
                                      {attachment.resource_type.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-bold leading-tight">
                                    {attachment.title}
                                  </h4>
                                  {attachment.description && (
                                    <p
                                      className={`text-[11px] mt-1 line-clamp-2 ${
                                        isMine ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                                      }`}
                                    >
                                      {attachment.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Card Action Row */}
                              <div className="mt-2.5 pt-2 border-t border-white/15 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <a
                                    href={attachment.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-colors ${
                                      isMine
                                        ? 'bg-white text-brand-700 hover:bg-slate-100'
                                        : 'bg-brand-600 text-white hover:bg-brand-700'
                                    }`}
                                  >
                                    Open Document <ExternalLink className="w-3 h-3" />
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => handleCopyLink(attachment)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isMine
                                        ? 'hover:bg-white/20 text-white'
                                        : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                    title="Copy document link"
                                  >
                                    {isAttachmentCopied ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>

                                {/* CR / GR / Admin 1-Click "Save to Hub" Action */}
                                {canManageStudyMaterial && (
                                  <button
                                    type="button"
                                    onClick={() => handlePublishAttachmentToHub(attachment)}
                                    disabled={isAttachmentPublished}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                                      isAttachmentPublished
                                        ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                                        : isMine
                                        ? 'bg-white/20 hover:bg-white/30 text-white'
                                        : 'bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                                    }`}
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    {isAttachmentPublished ? 'Published to Hub' : 'Add to StudyHub'}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatRelativeTime(msg.created_at)}</span>
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {isCrGrCollaboration
                          ? `Start Class Coordination with ${selectedContact.display_name}`
                          : `No messages yet with ${selectedContact.display_name}`}
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm">
                        {isCrGrCollaboration
                          ? 'Class Representative (CR) and Girls Representative (GR) can exchange lecture slides, PDFs, formulas, and publish materials directly to Hammad StudyHub.'
                          : 'Send a message or share study files to coordinate academic preparation and coursework.'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsShareModalOpen(true)}
                      leftIcon={<Share2 className="w-3.5 h-3.5 text-brand-600" />}
                    >
                      Share Study Material
                    </Button>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar with Attach Material Button */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-navy-900"
              >
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  title="Share Study Material / PDF / Drive Link"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center shrink-0"
                >
                  <Paperclip className="w-4 h-4 text-brand-600" />
                </button>

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

      {/* Share Material Modal */}
      {selectedContact && (
        <ShareMaterialModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onShare={handleShareMaterial}
          recipientName={selectedContact.display_name}
          senderRole={profile.role}
        />
      )}

      {/* Shared Materials Drawer / Locker */}
      {selectedContact && (
        <SharedMaterialsDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          materials={sharedMaterialsInConversation}
          contactName={selectedContact.display_name}
          canPublishToHub={canManageStudyMaterial}
          currentUserName={profile.display_name}
          onOpenShareModal={() => {
            setIsDrawerOpen(false);
            setIsShareModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
