// ==============================================================================
// HAMMAD STUDYHUB — RESOURCE FORM MODAL (CREATE / EDIT)
// Directly connects to the Subject's Google Drive Folder configured by the Admin.
// No need to enter a Google Drive link every time!
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Calendar,
  Link as LinkIcon,
  FolderCheck,
  Upload,
  FileText,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { Resource, ResourceType, Subject } from '../../types';
import { parseGoogleDriveUrl, parseYouTubeUrl, detectSourceProvider } from '../../lib/googleDrive';
import { getTodayDateString, slugify } from '../../lib/utils';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, Textarea } from '../common/Input';

const resourceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  subject_id: z.string().min(1, 'Please select a subject.'),
  resource_type: z.enum(['pdf', 'video', 'whiteboard', 'assignment', 'presentation', 'past_paper', 'other']),
  external_url: z.string().optional(),
  lesson_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD.'),
  description: z.string().optional(),
  topic: z.string().optional(),
  chapter: z.string().optional(),
  tags_string: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
});

type ResourceFormData = z.infer<typeof resourceSchema>;

interface ResourceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  initialData?: Resource | null;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  isOpen,
  onClose,
  subjects,
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const [driveValidation, setDriveValidation] = useState<any>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<string | null>(null);
  const [selectedFileData, setSelectedFileData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: '',
      subject_id: subjects[0]?.id || '',
      resource_type: 'pdf',
      external_url: '',
      lesson_date: getTodayDateString(),
      description: '',
      topic: '',
      chapter: '',
      tags_string: '',
      status: 'published',
    },
  });

  const watchedSubjectId = watch('subject_id');
  const watchedUrl = watch('external_url');

  const currentSubject = subjects.find((s) => s.id === watchedSubjectId) || subjects[0];

  // Sync initialData when editing
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        subject_id: initialData.subject_id,
        resource_type: initialData.resource_type,
        external_url: initialData.external_url || '',
        lesson_date: initialData.lesson_date,
        description: initialData.description || '',
        topic: initialData.topic || '',
        chapter: initialData.chapter || '',
        tags_string: (initialData.tags || []).join(', '),
        status: initialData.status,
      });
      setSelectedFileName(initialData.file_name || null);
      setSelectedFileData(initialData.file_data || null);
    } else {
      reset({
        title: '',
        subject_id: subjects[0]?.id || '',
        resource_type: 'pdf',
        external_url: '',
        lesson_date: getTodayDateString(),
        description: '',
        topic: '',
        chapter: '',
        tags_string: '',
        status: 'published',
      });
      setSelectedFileName(null);
      setSelectedFileSize(null);
      setSelectedFileData(null);
    }
  }, [initialData, subjects, reset, isOpen]);

  // Live URL validation preview
  useEffect(() => {
    if (!watchedUrl) {
      setDriveValidation(null);
      return;
    }

    const provider = detectSourceProvider(watchedUrl);
    if (provider === 'google_drive') {
      const parsed = parseGoogleDriveUrl(watchedUrl);
      setDriveValidation(parsed);
    } else if (provider === 'youtube') {
      const parsed = parseYouTubeUrl(watchedUrl);
      setDriveValidation({
        isValid: parsed.isValid,
        resourceKind: 'youtube_video',
        permissionNotice: 'Ensure YouTube video is set to Public or Unlisted (not Private).',
        embedUrl: parsed.embedUrl,
        error: parsed.error,
      });
    } else {
      setDriveValidation({
        isValid: true,
        resourceKind: 'direct_url',
        permissionNotice: 'Direct URL is accessible.',
      });
    }
  }, [watchedUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setSelectedFileSize(`${sizeMB} MB`);
      // Auto-suggest title if title is empty
      if (!watch('title')) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setValue('title', cleanName);
      }

      // Read file contents as Base64 DataURL (for files up to 20MB)
      if (file.size < 20 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
          setSelectedFileData(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const onFormSubmit = async (data: ResourceFormData) => {
    const tags = (data.tags_string || '')
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    // Automatically route to subject's Google Drive folder if external_url is omitted
    let finalUrl = data.external_url?.trim();
    let finalProvider = 'google_drive';
    let embedUrl: string | undefined = undefined;

    if (!finalUrl) {
      if (selectedFileData) {
        finalUrl = selectedFileData;
        embedUrl = selectedFileData;
        finalProvider = 'direct_url';
      } else if (currentSubject?.google_drive_folder_url) {
        finalUrl = currentSubject.google_drive_folder_url;
        if (currentSubject.google_drive_folder_id) {
          embedUrl = `https://drive.google.com/embeddedfolderview?id=${currentSubject.google_drive_folder_id}#list`;
        }
      } else {
        finalUrl = 'https://drive.google.com';
      }
    } else {
      finalProvider = detectSourceProvider(finalUrl);
      if (finalProvider === 'google_drive') {
        const parsed = parseGoogleDriveUrl(finalUrl);
        embedUrl = parsed.embedUrl;
      } else if (finalProvider === 'youtube') {
        const parsed = parseYouTubeUrl(finalUrl);
        embedUrl = parsed.embedUrl;
      }
    }

    await onSubmit({
      ...data,
      external_url: finalUrl,
      source_provider: finalProvider,
      embed_url: embedUrl,
      file_name: selectedFileName || undefined,
      file_size: selectedFileSize || undefined,
      file_data: selectedFileData || initialData?.file_data || undefined,
      google_drive_folder_url: currentSubject?.google_drive_folder_url,
      tags,
      slug: slugify(data.title),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Learning Resource' : 'Publish Learning Material'}
      description="Materials automatically route to the selected subject's Google Drive folder. No need to paste a link every time!"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Subject & Resource Type Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Subject <span className="text-red-500">*</span>
            </label>
            <select
              {...register('subject_id')}
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 font-medium"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
            {errors.subject_id && (
              <p className="mt-1 text-xs text-red-500">{errors.subject_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Material Format / Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register('resource_type')}
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
            >
              <option value="pdf">PDF Notes & Textbooks</option>
              <option value="video">Lecture Video (YouTube)</option>
              <option value="whiteboard">Whiteboard & Diagram Snapshot</option>
              <option value="assignment">Assignment & Worksheet</option>
              <option value="presentation">Presentation Slides</option>
              <option value="past_paper">Past Papers & Solutions</option>
              <option value="other">Other Academic Material</option>
            </select>
          </div>
        </div>

        {/* Automatic Google Drive Connection Status Card */}
        {currentSubject && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FolderCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                  {currentSubject.google_drive_folder_url
                    ? `Linked to "${currentSubject.name}" Google Drive Folder`
                    : `No Drive Folder Linked Yet for "${currentSubject.name}"`}
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                  {currentSubject.google_drive_folder_url
                    ? 'Material will automatically link to this subject folder upon publishing.'
                    : 'Configure Google Drive folder once in Subject Settings, or paste a link below.'}
                </div>
              </div>
            </div>

            {currentSubject.google_drive_folder_url && (
              <a
                href={currentSubject.google_drive_folder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-white/80 dark:bg-navy-900 border border-emerald-300 dark:border-emerald-700 hover:bg-white flex items-center gap-1 shadow-2xs"
                title="Open this subject folder in Google Drive"
              >
                <span>Open Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Title */}
        <Input
          label="Learning Material Title"
          required
          placeholder="e.g. Lesson 04: Two's Complement Arithmetic & Sign Extension Notes"
          error={errors.title?.message}
          {...register('title')}
        />

        {/* Lesson Date & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Lesson Date (Calendar Date)"
            type="date"
            required
            leftIcon={<Calendar className="w-4 h-4" />}
            error={errors.lesson_date?.message}
            {...register('lesson_date')}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Publication Status
            </label>
            <select
              {...register('status')}
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
            >
              <option value="published">Published (Visible to students)</option>
              <option value="draft">Draft (Private to administrators)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Choose Local File (Optional Drag & Drop / File Picker) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Study File from Device (PDF, Image, Notes, Slide)
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.ppt,.pptx,.txt"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 rounded-2xl bg-slate-50/50 dark:bg-navy-950/40 cursor-pointer transition-colors flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                {selectedFileName ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {selectedFileName}
                    </span>
                    {selectedFileSize && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                        {selectedFileSize}
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Click to select file from phone / computer
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Supports PDF, PPT, Word, handwritten images, diagrams
                    </div>
                  </>
                )}
              </div>
            </div>

            <Button type="button" size="sm" variant="outline">
              {selectedFileName ? 'Change File' : 'Browse File'}
            </Button>
          </div>
        </div>

        {/* Specific Document Link (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Specific Document URL (Optional)
            </label>
            <span className="text-[10px] text-slate-400">
              Leave blank to automatically link to subject's Google Drive folder
            </span>
          </div>
          <Input
            placeholder={
              currentSubject?.google_drive_folder_url
                ? `Auto-assigned to ${currentSubject.name} Drive Folder`
                : 'https://drive.google.com/file/d/... (or leave blank)'
            }
            leftIcon={<LinkIcon className="w-4 h-4" />}
            error={errors.external_url?.message}
            {...register('external_url')}
          />

          {driveValidation && (
            <div
              className={`mt-2 p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                driveValidation.isValid
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              }`}
            >
              {driveValidation.isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-semibold">
                  {driveValidation.isValid
                    ? `Validated ${driveValidation.resourceKind?.replace('_', ' ').toUpperCase()}`
                    : 'Format Notice'}
                </p>
                <p className="text-[11px] opacity-90">{driveValidation.permissionNotice || driveValidation.error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Topic & Chapter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Chapter / Module (Optional)"
            placeholder="e.g. Chapter 3, Unit 1"
            {...register('chapter')}
          />
          <Input
            label="Topic (Optional)"
            placeholder="e.g. Boolean Axioms & Logic"
            {...register('topic')}
          />
        </div>

        {/* Description */}
        <Textarea
          label="Description / Teacher Notes (Optional)"
          rows={2}
          placeholder="Key concepts discussed, reading notes, or homework reminders..."
          {...register('description')}
        />

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            ✅ Automatically published to <strong>{currentSubject?.name || 'Subject'}</strong>
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isLoading}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              {initialData ? 'Update Material' : 'Publish Learning Material'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
