// ==============================================================================
// HAMMAD STUDYHUB — SHARE STUDY MATERIAL MODAL (CR & GR COLLABORATION)
// Allows Class Representatives, Girls Representatives, and Admins to share
// lecture notes, PDFs, drive links, assignments, and past papers directly in chat.
// ==============================================================================

import React, { useState } from 'react';
import {
  X,
  FileText,
  Video,
  FileSpreadsheet,
  Layers,
  Award,
  Link as LinkIcon,
  Upload,
  BookOpen,
  Share2,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '../common/Button';
import { ResourceType, SharedMaterialAttachment, Subject, Resource } from '../../types';
import { getDemoSubjects, getDemoResources } from '../../lib/demoStore';

interface ShareMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (attachment: SharedMaterialAttachment, optionalMessage?: string, publishToHub?: boolean) => void;
  recipientName: string;
  senderRole: string;
}

const RESOURCE_TYPES: { type: ResourceType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'pdf', label: 'PDF Document / Notes', icon: <FileText className="w-4 h-4 text-rose-500" />, color: 'border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20' },
  { type: 'video', label: 'Lecture Video / Recording', icon: <Video className="w-4 h-4 text-blue-500" />, color: 'border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20' },
  { type: 'past_paper', label: 'Past Paper / Solved Exam', icon: <Award className="w-4 h-4 text-amber-500" />, color: 'border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20' },
  { type: 'assignment', label: 'Assignment / Worksheet', icon: <FileSpreadsheet className="w-4 h-4 text-emerald-500" />, color: 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20' },
  { type: 'presentation', label: 'Slide Deck / PPT', icon: <Layers className="w-4 h-4 text-indigo-500" />, color: 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20' },
  { type: 'other', label: 'Reference Link / Other', icon: <LinkIcon className="w-4 h-4 text-cyan-500" />, color: 'border-cyan-200 dark:border-cyan-900/60 bg-cyan-50/50 dark:bg-cyan-950/20' },
];

export const ShareMaterialModal: React.FC<ShareMaterialModalProps> = ({
  isOpen,
  onClose,
  onShare,
  recipientName,
  senderRole,
}) => {
  const subjects = getDemoSubjects();
  const existingResources = getDemoResources();

  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [title, setTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('pdf');
  const [fileUrl, setFileUrl] = useState('');
  const [description, setDescription] = useState('');
  const [chatComment, setChatComment] = useState('');
  const [publishToHub, setPublishToHub] = useState(senderRole === 'cr' || senderRole === 'gr' || senderRole === 'admin');
  const [selectedExistingId, setSelectedExistingId] = useState<string>('');

  if (!isOpen) return null;

  const handleSelectExisting = (resource: Resource) => {
    setSelectedExistingId(resource.id);
    setTitle(resource.title);
    setResourceType(resource.resource_type);
    setFileUrl(resource.external_url);
    setSelectedSubjectId(resource.subject_id);
    setDescription(resource.description || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim()) return;

    const matchedSubject = subjects.find((s) => s.id === selectedSubjectId);
    const subjectName = matchedSubject ? matchedSubject.name : customSubjectName.trim() || 'General Coursework';

    const attachment: SharedMaterialAttachment = {
      id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      subject_id: matchedSubject?.id,
      subject_name: subjectName,
      resource_type: resourceType,
      file_url: fileUrl.trim(),
      description: description.trim() || undefined,
      is_hub_resource: mode === 'existing',
      hub_resource_id: mode === 'existing' ? selectedExistingId : undefined,
      created_at: new Date().toISOString(),
    };

    onShare(attachment, chatComment.trim() || undefined, publishToHub);
    onClose();
  };

  const isRepresentative = senderRole === 'cr' || senderRole === 'gr' || senderRole === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-navy-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Share Study Material
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sending to <span className="font-semibold text-brand-600 dark:text-brand-400">{recipientName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-6 pt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-2 ${
              mode === 'new'
                ? 'bg-brand-50 dark:bg-navy-800 border-brand-500 text-brand-700 dark:text-brand-300 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Share New Document / Link
          </button>
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-2 ${
              mode === 'existing'
                ? 'bg-brand-50 dark:bg-navy-800 border-brand-500 text-brand-700 dark:text-brand-300 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Pick from StudyHub Library
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 overflow-y-auto space-y-4 flex-1">
          {mode === 'existing' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select from Hammad StudyHub Library:
              </label>
              {existingResources.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-navy-950/30">
                  {existingResources.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => handleSelectExisting(res)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                        selectedExistingId === res.id
                          ? 'bg-brand-100/70 dark:bg-brand-950 text-brand-900 dark:text-brand-200 font-bold border border-brand-300 dark:border-brand-800'
                          : 'hover:bg-slate-100 dark:hover:bg-navy-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate">{res.title}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {res.resource_type.toUpperCase()} • {res.subject?.name || 'Course'}
                        </div>
                      </div>
                      {selectedExistingId === res.id && (
                        <CheckCircle className="w-4 h-4 text-brand-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 p-3 text-center border border-dashed rounded-xl">
                  No published resources in library yet. Switch to "Share New Document" to share links directly.
                </p>
              )}
            </div>
          )}

          {/* Material Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Material Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Calculus Chapter 3 Notes & Formula Sheet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Resource Type Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Material Format / Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {RESOURCE_TYPES.map((rt) => {
                const isSelected = resourceType === rt.type;
                return (
                  <button
                    key={rt.type}
                    type="button"
                    onClick={() => setResourceType(rt.type)}
                    className={`p-2.5 rounded-xl text-left border text-xs font-medium flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/60 text-brand-900 dark:text-brand-200 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-navy-950/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {rt.icon}
                    <span className="truncate">{rt.label.split('/')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject
              </label>
              {subjects.length > 0 ? (
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                  <option value="custom">+ Other / Custom Subject</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Subject Name (e.g. Mathematics)"
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
                />
              )}
            </div>

            {selectedSubjectId === 'custom' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custom Subject Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Discrete Mathematics"
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}
          </div>

          {/* File Link / URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                File Link / Google Drive / URL <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setFileUrl('https://drive.google.com/file/d/sample-notes-pdf')}
                className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline"
              >
                Insert sample Drive link
              </button>
            </div>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="url"
                required
                placeholder="https://drive.google.com/file/d/... or document URL"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Description & Chat Message */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Material Description / Summary
              </label>
              <textarea
                rows={2}
                placeholder="Brief summary of notes or topics covered..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chat Message to {recipientName}
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Here is the file we discussed, please review..."
                value={chatComment}
                onChange={(e) => setChatComment(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
          </div>

          {/* Publish to Hub Toggle (for CR / GR / Admin) */}
          {isRepresentative && (
            <label className="p-3 rounded-2xl bg-brand-50/60 dark:bg-navy-950/60 border border-brand-200 dark:border-brand-900/60 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={publishToHub}
                onChange={(e) => setPublishToHub(e.target.checked)}
                className="mt-0.5 rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-bold text-brand-900 dark:text-brand-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  Also publish directly to Hammad StudyHub Library
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Instantly makes this study material available on the public subject page for all class students.
                </p>
              </div>
            </label>
          )}

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!title.trim() || !fileUrl.trim()}
              leftIcon={<Share2 className="w-4 h-4" />}
            >
              Share Material in Chat
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

