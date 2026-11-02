// ==============================================================================
// HAMMAD STUDYHUB — MODERN IN-PLATFORM MESSAGING & COLLABORATION SYSTEM
// Architect: Muhammad Hammad
//
// Communication & Privacy Rules:
// - Boys: Direct messaging with Class Representative (CR) and Admin separately
// - Girls: Direct messaging with Class Representative (CR), Girls Representative (GR), and Admin
// - CR: Direct collaboration with GR, direct support for all students (Boys & Girls), and Admin
// - GR: Direct collaboration with CR, academic support for female students, and Admin
// - Admin: Master administrative chat access to CR, GR, and all registered students
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
  CheckCheck,
  Copy,
  ArrowLeft,
  Search,
  Filter,
  Smile,
  X,
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
  markConversationAsRead,
  getLastMessageForConversation,
  getUnreadCountForConversation,
  getAllChatMessages,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const targetRole = searchParams.get('role');
  const targetId = searchParams.get('to') || searchParams.get('contactId');

  const [selectedContact, setSelectedContact] = useState<UserProfile | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allStudents, setAllStudents] = useState<UserProfile[]>(() => getRegisteredStudents());
  const [allChats, setAllChats] = useState<ChatMessage[]>(() => getAllChatMessages());
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'reps' | 'students'>('all');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedAttachmentId, setCopiedAttachmentId] = useState<string | null>(null);
  const [publishedMap, setPublishedMap] = useState<Record<string, boolean>>({});
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync registered students & chat messages on realtime updates
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
      setAllChats(getAllChatMessages());
      if (profile && selectedContact) {
        setMessages(getConversationMessages(profile.id, selectedContact.id));
        markConversationAsRead(profile.id, selectedContact.id);
      }
    };

    window.addEventListener('studyhub_students_updated', handleUpdate);
    window.addEventListener('studyhub_chat_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    const interval = setInterval(handleUpdate, 3000);

    return () => {
      window.removeEventListener('studyhub_students_updated', handleUpdate);
      window.removeEventListener('studyhub_chat_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      clearInterval(interval);
    };
  }, [profile, selectedContact]);

  // Load conversation and clear unread count when selectedContact changes
  useEffect(() => {
    if (profile && selectedContact) {
      setMessages(getConversationMessages(profile.id, selectedContact.id));
      markConversationAsRead(profile.id, selectedContact.id);
    } else {
      setMessages([]);
    }
  }, [profile, selectedContact]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ---------------------------------------------------------------------------
  // GENDER & ROLE-BASED ALLOWED CONTACTS FILTER
  // Strictly deduplicated by user ID
  // ---------------------------------------------------------------------------
  const allowedContacts = useMemo<UserProfile[]>(() => {
    if (!profile) return [];

    const contactsMap = new Map<string, UserProfile>();
    const crs = allStudents.filter((s) => s.role === 'cr' && s.id !== profile.id);
    const grs = allStudents.filter((s) => s.role === 'gr' && s.id !== profile.id);

    const crFallback: UserProfile = crs[0] || DEFAULT_CR_PROFILE;
    const grFallback: UserProfile = grs[0] || DEFAULT_GR_PROFILE;

    const addContact = (contact: UserProfile) => {
      if (contact && contact.id !== profile.id && !contactsMap.has(contact.id)) {
        contactsMap.set(contact.id, contact);
      }
    };

    // 1. Male Student Rule: Can chat with CR and Admin separately
    if (profile.role === 'student' && profile.gender === 'male') {
      if (crs.length > 0) crs.forEach(addContact);
      else addContact(crFallback);
      addContact(ADMIN_PROFILE);
    }
    // 2. Female Student Rule: Can chat with CR, GR, and Admin
    else if (profile.role === 'student' && profile.gender === 'female') {
      if (crs.length > 0) crs.forEach(addContact);
      else addContact(crFallback);
      if (grs.length > 0) grs.forEach(addContact);
      else addContact(grFallback);
      addContact(ADMIN_PROFILE);
    }
    // 3. Class Representative (CR) Rule: Chats with GR, Admin, and all students (boys & girls)
    else if (profile.role === 'cr') {
      if (grs.length > 0) grs.forEach(addContact);
      else addContact(grFallback);
      addContact(ADMIN_PROFILE);
      crs.forEach(addContact);
      allStudents
        .filter((s) => s.id !== profile.id && s.role === 'student')
        .forEach(addContact);
    }
    // 4. Girls Representative (GR) Rule: Chats with CR, Admin, and female students
    else if (profile.role === 'gr') {
      if (crs.length > 0) crs.forEach(addContact);
      else addContact(crFallback);
      addContact(ADMIN_PROFILE);
      grs.forEach(addContact);
      allStudents
        .filter((s) => s.id !== profile.id && s.gender === 'female' && s.role === 'student')
        .forEach(addContact);
    }
    // 5. Admin Rule: Oversees and can chat with CR, GR, and all registered students
    else if (profile.role === 'admin') {
      if (crs.length > 0) crs.forEach(addContact);
      else addContact(crFallback);
      if (grs.length > 0) grs.forEach(addContact);
      else addContact(grFallback);
      allStudents
        .filter((s) => s.id !== profile.id && s.role !== 'admin')
        .forEach(addContact);
    }

    return Array.from(contactsMap.values());
  }, [profile, allStudents]);

  // ---------------------------------------------------------------------------
  // ENRICH CONTACTS WITH LATEST MESSAGE & UNREAD BADGES & SORT RECENT FIRST
  // ---------------------------------------------------------------------------
  const contactsWithMeta = useMemo(() => {
    if (!profile) return [];

    return allowedContacts.map((contact) => {
      const lastMsg = getLastMessageForConversation(profile.id, contact.id);
      const unreadCount = getUnreadCountForConversation(profile.id, contact.id);
      return {
        ...contact,
        lastMessage: lastMsg,
        unreadCount,
        lastTimestamp: lastMsg ? new Date(lastMsg.created_at).getTime() : 0,
      };
    });
  }, [allowedContacts, profile, allChats]);

  // Filtered & Sorted Contacts List
  const filteredContacts = useMemo(() => {
    let list = [...contactsWithMeta];

    // Filter by tab (reps vs students)
    if (activeTabFilter === 'reps') {
      list = list.filter((c) => c.role === 'cr' || c.role === 'gr' || c.role === 'admin');
    } else if (activeTabFilter === 'students') {
      list = list.filter((c) => c.role === 'student');
    }

    // Filter by search query
    if (contactSearchQuery.trim()) {
      const q = contactSearchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.display_name.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.roll_no && c.roll_no.toLowerCase().includes(q)) ||
          c.role.toLowerCase().includes(q)
      );
    }

    // Sort: Contacts with recent messages first; then CR/GR/Admin, then alphabetical
    list.sort((a, b) => {
      if (a.lastTimestamp > 0 || b.lastTimestamp > 0) {
        return b.lastTimestamp - a.lastTimestamp;
      }
      // Pinned order if no messages
      const roleWeight = (role: string) => {
        if (role === 'admin') return 4;
        if (role === 'cr') return 3;
        if (role === 'gr') return 2;
        return 1;
      };
      const diff = roleWeight(b.role) - roleWeight(a.role);
      if (diff !== 0) return diff;
      return a.display_name.localeCompare(b.display_name);
    });

    return list;
  }, [contactsWithMeta, activeTabFilter, contactSearchQuery]);

  // Initial contact selection:
  // On desktop, auto-select the first contact if none selected.
  // On mobile (< 640px), do NOT auto-select unless explicitly targeted by URL param!
  useEffect(() => {
    if (allowedContacts.length === 0) return;

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

    // Auto-select on wide screens on initial load
    if (!selectedContact && typeof window !== 'undefined' && window.innerWidth >= 640) {
      setSelectedContact(allowedContacts[0]);
    }
  }, [allowedContacts, targetRole, targetId]);

  // All shared study materials in current conversation
  const sharedMaterialsInConversation = useMemo<SharedMaterialAttachment[]>(() => {
    const list: SharedMaterialAttachment[] = [];
    messages.forEach((m) => {
      if (m.attachment) {
        list.push(m.attachment);
      }
    });
    return list;
  }, [messages]);

  const canManageStudyMaterial =
    profile?.role === 'cr' || profile?.role === 'gr' || profile?.role === 'admin';

  const isCrGrCollaboration =
    (profile?.role === 'cr' && selectedContact?.role === 'gr') ||
    (profile?.role === 'gr' && selectedContact?.role === 'cr');

  const handleSendMessage = (textToSend?: string) => {
    const body = (typeof textToSend === 'string' ? textToSend : messageText).trim();
    if (!body || !profile || !selectedContact) return;

    const newMsg = sendChatMessage({
      sender_id: profile.id,
      sender_name: profile.display_name,
      sender_role: profile.role,
      sender_gender: profile.gender,
      receiver_id: selectedContact.id,
      receiver_name: selectedContact.display_name,
      receiver_role: selectedContact.role,
      message: body,
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
      setBannerNotice(`"${attachment.title}" has been published to Hammad StudyHub library!`);
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 shrink-0">
          <ShieldCheck className="w-3 h-3 text-brand-600" /> Admin
        </span>
      );
    }
    if (role === 'cr') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">
          <Crown className="w-3 h-3 text-amber-600" /> CR
        </span>
      );
    }
    if (role === 'gr') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 shrink-0">
          <Award className="w-3 h-3 text-purple-600" /> GR
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0">
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4">
      <SEOHead title="Representative Messaging & Study Material Collaboration — Hammad StudyHub" />

      {/* Top Banner Notice */}
      <aside className="p-3.5 rounded-2xl bg-brand-50/70 dark:bg-navy-900 border border-brand-200 dark:border-brand-900/60 flex items-start justify-between gap-3 text-xs text-brand-900 dark:text-brand-300">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Class Messages & Academic Support:</strong> Boys can chat directly with CR and Admin; Girls can chat with both CR, GR, and Admin. CR and GR have a dedicated channel to exchange study notes and collaborate on course materials.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline shrink-0"
        >
          <span>Dashboard</span>
        </Link>
      </aside>

      {/* Dynamic Toast / Notice */}
      {bannerNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{bannerNotice}</span>
          </div>
          <button onClick={() => setBannerNotice(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Chat Layout Card */}
      <Card className="h-[640px] sm:h-[720px] flex overflow-hidden border border-slate-200 dark:border-slate-800 shadow-card">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: CONVERSATION LIST (Responsive: Full-width on mobile if no active) */}
        {/* ========================================================================= */}
        <div
          className={`${
            selectedContact ? 'hidden sm:flex' : 'flex'
          } w-full sm:w-80 md:w-96 sm:shrink-0 border-r border-slate-200 dark:border-slate-800 flex-col bg-slate-50/50 dark:bg-navy-950/40`}
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-navy-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Messages</h3>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {allowedContacts.length} Contacts
              </span>
            </div>

            {/* Quick Stakeholder Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {allowedContacts.map((contact) => {
                if (contact.role !== 'admin' && contact.role !== 'cr' && contact.role !== 'gr') return null;
                const isSelected = selectedContact?.id === contact.id;
                return (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setSelectedContact(contact);
                      setSearchParams({ to: contact.id });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {contact.role === 'admin' ? (
                      <ShieldCheck className="w-3 h-3 text-brand-400" />
                    ) : contact.role === 'cr' ? (
                      <Crown className="w-3 h-3 text-amber-500" />
                    ) : (
                      <Award className="w-3 h-3 text-purple-500" />
                    )}
                    <span>{contact.role.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={contactSearchQuery}
                onChange={(e) => setContactSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              {contactSearchQuery && (
                <button
                  onClick={() => setContactSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Role Filter Tabs (For Admins and CR/GR) */}
            {(profile.role === 'admin' || profile.role === 'cr' || profile.role === 'gr') && (
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setActiveTabFilter('all')}
                  className={`flex-1 py-1 rounded-md font-semibold text-center transition-colors ${
                    activeTabFilter === 'all'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTabFilter('reps')}
                  className={`flex-1 py-1 rounded-md font-semibold text-center transition-colors ${
                    activeTabFilter === 'reps'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  CR & GR
                </button>
                <button
                  onClick={() => setActiveTabFilter('students')}
                  className={`flex-1 py-1 rounded-md font-semibold text-center transition-colors ${
                    activeTabFilter === 'students'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Students
                </button>
              </div>
            )}
          </div>

          {/* Contact Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => {
                const isSelected = selectedContact?.id === contact.id;
                const isRepCollab =
                  (profile.role === 'cr' && contact.role === 'gr') ||
                  (profile.role === 'gr' && contact.role === 'cr');

                return (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setSelectedContact(contact);
                      setSearchParams({ to: contact.id });
                    }}
                    className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-brand-50/80 dark:bg-navy-900 border-l-4 border-brand-600 shadow-xs'
                        : 'hover:bg-slate-100/70 dark:hover:bg-navy-900/50'
                    }`}
                  >
                    {/* Contact Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center shadow-xs text-xs sm:text-sm text-white ${
                          contact.role === 'admin'
                            ? 'bg-gradient-to-tr from-brand-600 to-indigo-700'
                            : contact.role === 'cr'
                            ? 'bg-gradient-to-tr from-amber-600 to-orange-500'
                            : contact.role === 'gr'
                            ? 'bg-gradient-to-tr from-purple-600 to-pink-500'
                            : 'bg-gradient-to-tr from-slate-600 to-slate-800'
                        }`}
                      >
                        {contact.display_name.substring(0, 2).toUpperCase()}
                      </div>
                      {/* Active Status Dot */}
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-navy-950 rounded-full"
                        title="Active channel"
                      />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {contact.display_name}
                        </span>
                        {contact.lastMessage ? (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatRelativeTime(contact.lastMessage.created_at)}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        {getRoleBadge(contact.role)}
                        {isRepCollab && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            ★ Peer Rep
                          </span>
                        )}
                      </div>

                      {/* Last Message Snippet */}
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex-1">
                          {contact.lastMessage ? (
                            <span>
                              {contact.lastMessage.sender_id === profile.id ? 'You: ' : ''}
                              {contact.lastMessage.message || 'Shared material attachment'}
                            </span>
                          ) : (
                            <span className="italic text-slate-400">
                              {contact.role === 'admin'
                                ? 'Master Admin support'
                                : contact.role === 'cr'
                                ? 'Class coordination & updates'
                                : contact.role === 'gr'
                                ? 'Academic assistance for girls'
                                : contact.roll_no || 'Ready to chat'}
                            </span>
                          )}
                        </p>

                        {/* Unread Message Badge */}
                        {contact.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-600 text-white shrink-0 shadow-xs animate-pulse">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-600 dark:text-slate-300">No contacts found</p>
                <p>Try clearing your search query.</p>
              </div>
            )}
          </div>

          {/* Current User Card */}
          <div className="p-3 bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-xs shrink-0">
                {profile.display_name.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {profile.display_name}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {profile.role} ({profile.gender})
                </div>
              </div>
            </div>
            {getRoleBadge(profile.role)}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: ACTIVE CHAT WINDOW (Responsive: Full-width on mobile if active) */}
        {/* ========================================================================= */}
        <div
          className={`${
            selectedContact ? 'flex' : 'hidden sm:flex'
          } flex-1 flex-col bg-white dark:bg-navy-900 min-w-0`}
        >
          {selectedContact ? (
            <>
              {/* Header */}
              <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-navy-950/40 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedContact(null);
                      setSearchParams({});
                    }}
                    className="sm:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                    title="Back to conversations"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="relative shrink-0">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-bold flex items-center justify-center text-xs sm:text-sm text-white shadow-xs ${
                        selectedContact.role === 'admin'
                          ? 'bg-gradient-to-tr from-brand-600 to-indigo-700'
                          : selectedContact.role === 'cr'
                          ? 'bg-gradient-to-tr from-amber-600 to-orange-500'
                          : selectedContact.role === 'gr'
                          ? 'bg-gradient-to-tr from-purple-600 to-pink-500'
                          : 'bg-gradient-to-tr from-slate-600 to-slate-800'
                      }`}
                    >
                      {selectedContact.display_name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-navy-950 rounded-full" />
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
                        : selectedContact.program_name || `${selectedContact.email || 'Registered Student'}`}
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                    title="View all shared notes and materials in this chat"
                  >
                    <FolderOpen className="w-4 h-4 text-brand-600" />
                    <span className="hidden md:inline">Materials</span>
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

              {/* CR & GR Collaboration Workspace Banner */}
              {isCrGrCollaboration && (
                <div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-brand-500/10 border-b border-amber-200/50 dark:border-amber-900/30 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">
                      <strong>CR & GR Study Hub:</strong> Exchange lecture notes, PDFs, worksheets, and publish directly to Hammad StudyHub!
                    </span>
                  </div>
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="text-[11px] font-bold text-amber-800 dark:text-amber-300 underline shrink-0 ml-2"
                  >
                    + Share File
                  </button>
                </div>
              )}

              {/* Messages Thread */}
              <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-3 bg-slate-50/20 dark:bg-navy-950/20">
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
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-in fade-in`}
                      >
                        <div
                          className={`max-w-[90%] sm:max-w-[75%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isMine
                              ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-br-none'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/80 rounded-bl-none'
                          }`}
                        >
                          {/* Sender name for received messages */}
                          {!isMine && (
                            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                              <span>{msg.sender_name}</span>
                              {getRoleBadge(msg.sender_role)}
                            </div>
                          )}

                          {/* Message Text */}
                          {msg.message && (
                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
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

                        {/* Timestamp & Delivery Indicator */}
                        <div className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1.5">
                          <span>{formatRelativeTime(msg.created_at)}</span>
                          {isMine && (
                            <CheckCheck className="w-3 h-3 text-brand-500 inline-block" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-slate-400">
                    <div className="w-14 h-14 rounded-3xl bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-subtle">
                      <MessageSquare className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {isCrGrCollaboration
                          ? `Start Academic Coordination with ${selectedContact.display_name}`
                          : `Conversation with ${selectedContact.display_name}`}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {isCrGrCollaboration
                          ? 'Class Representative (CR) and Girls Representative (GR) can exchange lecture slides, PDFs, formulas, and publish materials directly to Hammad StudyHub.'
                          : 'Send a message or share course files to coordinate academic preparation and coursework.'}
                      </p>
                    </div>

                    {/* Quick Starter Prompts */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                      <button
                        onClick={() => handleSendMessage('Assalam-o-Alaikum! Hope you are doing well.')}
                        className="px-3 py-1.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        👋 Assalam-o-Alaikum!
                      </button>
                      <button
                        onClick={() => handleSendMessage('Can you please share today\'s lecture notes?')}
                        className="px-3 py-1.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        📚 Request Lecture Notes
                      </button>
                      <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="px-3 py-1.5 rounded-full text-xs bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-semibold transition-colors"
                      >
                        📎 Share Material
                      </button>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-navy-900"
              >
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  title="Share Study Material / PDF Link"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center shrink-0"
                >
                  <Paperclip className="w-4 h-4 text-brand-600" />
                </button>

                <input
                  type="text"
                  placeholder={`Message ${selectedContact.display_name}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button
                  type="submit"
                  size="md"
                  disabled={!messageText.trim()}
                  rightIcon={<Send className="w-3.5 h-3.5" />}
                  className="shrink-0 font-bold"
                >
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Select a conversation to start messaging
              </p>
              <p className="text-xs text-slate-400 max-w-xs">
                Class representatives, students, and admin can exchange updates, notes, and study resources.
              </p>
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
