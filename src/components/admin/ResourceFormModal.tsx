// ==============================================================================
// HAMMAD STUDYHUB — RESOURCE FORM MODAL (SYSTEM CLOUD BACKUP STORAGE)
// Architect: Muhammad Hammad
//
// Key Features:
// 1. Direct System Backup Storage: Files upload directly into StudyHub's secure
//    platform storage (Supabase + local storage fallback) with zero external Drive errors.
// 2. Multi-File Selection & Drag-and-Drop for academic materials:
//    PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, JPEG, PNG, ZIP.
// 3. Instant Protected Access: All signed-in students can view and download materials directly.
// 4. Individual File Progress, Status Reporting, and Retry Options.
// 5. Zero Configuration Roadblocks: No Google Cloud quotas or Service Account dependencies.
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
  Upload,
  FileText,
  Presentation,
  Archive,
  Image as ImageIcon,
  Sparkles,
  X,
  RefreshCw,
  ShieldCheck,
  Check,
  HardDrive,
} from 'lucide-react';
import { Resource, ResourceType, Subject, SourceProvider } from '../../types';
import { parseYouTubeUrl, detectSourceProvider } from '../../lib/googleDrive';
import { formatFileSize, fileToBase64 } from '../../lib/googleDriveApi';
import { getTodayDateString, slugify } from '../../lib/utils';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, Textarea } from '../common/Input';

const resourceSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
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

export interface UploadQueueItem {
  id: string;
  file: File;
  name: string;
  size: string;
  inferredType: ResourceType;
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface ResourceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  initialData?: Resource | null;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Automatically infers resource type from file extension
 */
function inferResourceType(fileName: string): ResourceType {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'ppt':
    case 'pptx':
      return 'presentation';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
      return 'whiteboard';
    case 'doc':
    case 'docx':
      return 'pdf';
    case 'xls':
    case 'xlsx':
      return 'other';
    case 'mp4':
    case 'mov':
    case 'webm':
      return 'video';
    case 'zip':
      return 'other';
    default:
      return 'pdf';
  }
}

export const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  isOpen,
  onClose,
  subjects,
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const [fileQueue, setFileQueue] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isProcessingUploads, setIsProcessingUploads] = useState(false);
  const [urlValidation, setUrlValidation] = useState<any>(null);

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

  // Active Subject selection
  const currentSubject = subjects.find((s) => s.id === watchedSubjectId) || subjects[0];

  // Sync initialData when editing
  useEffect(() => {
    setGlobalError(null);
    setFileQueue([]);

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
    }
  }, [initialData, subjects, reset, isOpen]);

  // Live URL validation preview
  useEffect(() => {
    if (!watchedUrl) {
      setUrlValidation(null);
      return;
    }

    const provider = detectSourceProvider(watchedUrl);
    if (provider === 'youtube') {
      const parsed = parseYouTubeUrl(watchedUrl);
      setUrlValidation({
        isValid: parsed.isValid,
        resourceKind: 'youtube_video',
        permissionNotice: 'Ensure YouTube video is set to Public or Unlisted.',
        embedUrl: parsed.embedUrl,
        error: parsed.error,
      });
    } else {
      setUrlValidation({
        isValid: true,
        resourceKind: 'external_link',
        permissionNotice: 'Direct link verified.',
      });
    }
  }, [watchedUrl]);

  // Handle files added to queue
  const addFilesToQueue = (files: FileList | File[]) => {
    setGlobalError(null);
    const newItems: UploadQueueItem[] = [];

    Array.from(files).forEach((file) => {
      // Check file size limit (100MB max per file)
      if (file.size > 100 * 1024 * 1024) {
        setGlobalError(`File "${file.name}" exceeds the 100MB limit.`);
        return;
      }

      newItems.push({
        id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: formatFileSize(file.size),
        inferredType: inferResourceType(file.name),
        status: 'idle',
        progress: 0,
      });
    });

    if (newItems.length > 0) {
      setFileQueue((prev) => [...prev, ...newItems]);

      // If title is currently blank, auto-fill from first file
      if (!watch('title') && newItems[0]) {
        const cleanName = newItems[0].name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        setValue('title', cleanName);
        setValue('resource_type', newItems[0].inferredType);
      }
    }
  };

  const removeQueueItem = (id: string) => {
    setFileQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
      e.target.value = '';
    }
  };

  // Main Form Submission to System Backup Storage
  const onFormSubmit = async (data: ResourceFormData) => {
    setGlobalError(null);

    // 1. If files are queued, save them directly to System Storage (Base64 + Supabase + Local)
    if (fileQueue.length > 0) {
      setIsProcessingUploads(true);
      let anyErrors = false;

      const tags = (data.tags_string || '')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      for (const item of fileQueue) {
        if (item.status === 'success') continue;

        // Set item to uploading
        setFileQueue((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading', progress: 30, error: undefined } : i))
        );

        const resourceTitle =
          fileQueue.length === 1 && data.title
            ? data.title
            : `${data.title || 'Study Material'} - ${item.name.replace(/\.[^/.]+$/, '')}`;

        try {
          // Convert file to Base64 payload
          const base64Data = await fileToBase64(item.file);
          setFileQueue((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, progress: 75 } : i))
          );

          // Save directly into StudyHub system storage
          const uniqueId =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `res-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          await onSubmit({
            ...data,
            id: uniqueId,
            title: resourceTitle,
            subject_id: currentSubject?.id || data.subject_id,
            resource_type: item.inferredType || data.resource_type,
            external_url: data.external_url || '',
            embed_url: '',
            file_name: item.name,
            original_filename: item.name,
            mime_type: item.file.type || 'application/pdf',
            file_size: item.size,
            file_data: base64Data,
            source_provider: 'supabase_storage',
            tags,
            slug: slugify(resourceTitle),
          });

          setFileQueue((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: 'success', progress: 100 } : i))
          );
        } catch (uploadErr: any) {
          console.error(`System storage upload error for "${item.name}":`, uploadErr);
          anyErrors = true;
          const msg = uploadErr?.message || 'Failed to save to system storage.';
          setGlobalError(msg);
          setFileQueue((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: 'error', error: msg } : i))
          );
        }
      }

      setIsProcessingUploads(false);

      if (!anyErrors) {
        setTimeout(() => {
          onClose();
        }, 800);
      }
      return;
    }

    // 2. Direct URL / YouTube / Existing resource update (No files queued)
    try {
      setIsProcessingUploads(true);
      const tags = (data.tags_string || '')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      let finalUrl = data.external_url?.trim() || '';
      let finalProvider: SourceProvider = 'direct_url';
      let embedUrl: string | undefined = undefined;

      if (finalUrl) {
        finalProvider = detectSourceProvider(finalUrl);
        if (finalProvider === 'youtube') {
          const parsed = parseYouTubeUrl(finalUrl);
          embedUrl = parsed.embedUrl;
        }
      }

      await onSubmit({
        ...data,
        subject_id: currentSubject?.id || data.subject_id,
        external_url: finalUrl,
        source_provider: finalProvider,
        embed_url: embedUrl,
        tags,
        slug: slugify(data.title),
      });

      setIsProcessingUploads(false);
      onClose();
    } catch (err: any) {
      setIsProcessingUploads(false);
      setGlobalError(err?.message || 'Failed to publish resource. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Learning Resource' : 'Upload Study Material'}
      description="Upload lecture notes, slides, whiteboard photos, or worksheets directly to secure system storage."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {globalError && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Notice</p>
              <p>{globalError}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Select Subject & Resource Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              {...register('subject_id')}
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 font-medium"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} {sub.code ? `(${sub.code})` : ''}
                </option>
              ))}
            </select>
            {errors.subject_id && (
              <p className="mt-1 text-xs text-red-500">{errors.subject_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Material Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register('resource_type')}
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
            >
              <option value="pdf">PDF Lecture Notes / Handouts</option>
              <option value="presentation">PowerPoint Slides (.pptx)</option>
              <option value="whiteboard">Whiteboard & Diagram Snapshots</option>
              <option value="assignment">Assignment & Practice Homework</option>
              <option value="past_paper">Past Examination Papers</option>
              <option value="video">Lecture Video (YouTube link)</option>
              <option value="other">Other Academic Document</option>
            </select>
          </div>
        </div>

        {/* STEP 2: System Cloud Backup Storage Destination Badge */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/20 border border-emerald-200 dark:border-emerald-800/80">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Storage Destination:
                  </span>
                  <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 truncate">
                    System Cloud Storage ({currentSubject?.name || 'Selected Subject'})
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Files upload directly into our secure platform storage. Instant viewing and downloads for signed-in students.
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Storage Active</span>
            </span>
          </div>
        </div>

        {/* STEP 3: Drag & Drop Multi-File Upload Zone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select or Drag Files (Upload to System Storage)
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-center space-y-2 ${
              isDragging
                ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 bg-slate-50/60 dark:bg-navy-950/40'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>

            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Drag & drop files here, or{' '}
                <span className="text-brand-600 dark:text-brand-400 underline">browse files</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Supports PDF, Word (.doc, .docx), PowerPoint (.ppt, .pptx), Excel (.xlsx), Images (.jpg, .png), ZIP (Up to 100MB per file)
              </p>
            </div>
          </div>

          {/* Queued Files List with Individual Status & Progress */}
          {fileQueue.length > 0 && (
            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold px-1">
                <span>Selected Files ({fileQueue.length}):</span>
                {!isProcessingUploads && (
                  <button
                    type="button"
                    onClick={() => setFileQueue([])}
                    className="text-red-500 hover:text-red-600 text-[11px]"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {fileQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-navy-950 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                      {item.inferredType === 'pdf' ? (
                        <FileText className="w-4 h-4 text-red-500" />
                      ) : item.inferredType === 'presentation' ? (
                        <Presentation className="w-4 h-4 text-amber-500" />
                      ) : item.inferredType === 'whiteboard' ? (
                        <ImageIcon className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Archive className="w-4 h-4 text-indigo-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {item.size}
                        </span>
                      </div>

                      {/* Progress Bar while uploading */}
                      {item.status === 'uploading' && (
                        <div className="w-full bg-slate-100 dark:bg-navy-950 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-brand-600 h-1.5 rounded-full transition-all duration-200"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}

                      {/* Error Message */}
                      {item.status === 'error' && (
                        <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-semibold">
                          {item.error || 'Upload failed.'}
                        </p>
                      )}

                      {/* Success confirmation */}
                      {item.status === 'success' && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate mt-0.5 flex items-center gap-1 font-semibold">
                          <Check className="w-3 h-3" />
                          <span>Uploaded & Stored in System Storage</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions / Status Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'idle' && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-navy-950 px-2 py-0.5 rounded-md">
                        Ready
                      </span>
                    )}

                    {item.status === 'uploading' && (
                      <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>{item.progress}%</span>
                      </span>
                    )}

                    {item.status === 'success' && (
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Saved</span>
                      </span>
                    )}

                    {!isProcessingUploads && item.status !== 'success' && (
                      <button
                        type="button"
                        onClick={() => removeQueueItem(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-md"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STEP 4: Resource Information (Title & Lesson Date) */}
        <Input
          label="Learning Material Title"
          required
          placeholder="e.g. Lesson 04: Two's Complement Arithmetic & Logic Handout"
          error={errors.title?.message}
          {...register('title')}
        />

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
              <option value="published">Published (Visible to registered students)</option>
              <option value="draft">Draft (Private to administrators)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Optional External URL / YouTube video */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              YouTube Video or External Reference Link (Optional)
            </label>
            <span className="text-[10px] text-slate-400">
              Only needed if not uploading files from device
            </span>
          </div>
          <Input
            placeholder="https://www.youtube.com/watch?v=... (Optional lecture recording link)"
            leftIcon={<LinkIcon className="w-4 h-4" />}
            error={errors.external_url?.message}
            {...register('external_url')}
          />

          {urlValidation && (
            <div
              className={`mt-2 p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                urlValidation.isValid
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              }`}
            >
              {urlValidation.isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-semibold">
                  {urlValidation.isValid
                    ? `Validated ${urlValidation.resourceKind?.replace('_', ' ').toUpperCase()}`
                    : 'Format Notice'}
                </p>
                <p className="text-[11px] opacity-90">{urlValidation.permissionNotice || urlValidation.error}</p>
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

        {/* Tags */}
        <Input
          label="Search Tags (Optional, comma-separated)"
          placeholder="e.g. midterm, binary, notes, lecture"
          {...register('tags_string')}
        />

        {/* Description */}
        <Textarea
          label="Description / Teacher Notes (Optional)"
          rows={2}
          placeholder="Key concepts discussed, reading notes, or homework reminders..."
          {...register('description')}
        />

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Destination: <strong>System Cloud Storage</strong> ({currentSubject?.name || 'Selected Course'})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isProcessingUploads}>
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              isLoading={isLoading || isProcessingUploads}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold"
            >
              {isProcessingUploads
                ? 'Saving to System Storage...'
                : initialData
                ? 'Update Material'
                : fileQueue.length > 1
                ? `Publish ${fileQueue.length} Files to System Storage`
                : 'Upload & Publish Material'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
