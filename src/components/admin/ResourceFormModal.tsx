// ==============================================================================
// HAMMAD STUDYHUB — RESOURCE FORM MODAL (MULTI-FILE & GOOGLE DRIVE AUTOMATION)
// Architect: Muhammad Hammad
//
// Key Features:
// 1. Automatic Subject Folder Routing: Selecting a subject instantly links to its
//    registered Google Drive folder. No repeated pasting of folder links!
// 2. Multi-File Selection & Drag-and-Drop for academic materials:
//    PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, JPEG, PNG, ZIP.
// 3. Direct Google Drive API Integration: Uploads files directly into the subject's
//    Google Drive folder ID via secure serverless endpoint or client OAuth.
// 4. Individual File Progress, Status Reporting, and Retry Options.
// 5. Zero Fake Uploads: Full metadata synchronization into Supabase.
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
  FileSpreadsheet,
  Presentation,
  Video,
  Archive,
  Image as ImageIcon,
  Sparkles,
  X,
  RefreshCw,
  Key,
  ShieldAlert,
  Check,
  FileCheck,
  Copy,
} from 'lucide-react';
import { Resource, ResourceType, Subject } from '../../types';
import { parseGoogleDriveUrl, parseYouTubeUrl, detectSourceProvider } from '../../lib/googleDrive';
import {
  uploadFileToDriveFolder,
  requestGoogleDriveAuthorization,
  isGoogleDriveClientConnected,
  formatFileSize,
  fileToBase64,
  getGoogleDriveClientToken,
  getDriveServerStatus,
  DriveServerStatus,
  DriveUploadResult,
} from '../../lib/googleDriveApi';
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
  driveResult?: DriveUploadResult;
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
  const [isAuthorizingDrive, setIsAuthorizingDrive] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(() => isGoogleDriveClientConnected());
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isProcessingUploads, setIsProcessingUploads] = useState(false);
  const [driveValidation, setDriveValidation] = useState<any>(null);
  const [driveServerStatus, setDriveServerStatus] = useState<DriveServerStatus | null>(null);
  const [copiedSaEmail, setCopiedSaEmail] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll server Google Drive status when modal opens
  useEffect(() => {
    if (isOpen) {
      getDriveServerStatus().then((status) => {
        setDriveServerStatus(status);
      });
    }
  }, [isOpen]);

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

  // Keep Google Drive auth connection state synced
  useEffect(() => {
    const handleAuthChange = () => setIsGoogleConnected(isGoogleDriveClientConnected());
    window.addEventListener('studyhub_gdrive_auth_changed', handleAuthChange);
    return () => window.removeEventListener('studyhub_gdrive_auth_changed', handleAuthChange);
  }, []);

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
        permissionNotice: 'Ensure YouTube video is set to Public or Unlisted.',
        embedUrl: parsed.embedUrl,
        error: parsed.error,
      });
    } else {
      setDriveValidation({
        isValid: true,
        resourceKind: 'direct_url',
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
      // Reset input value so same files can be re-selected if removed
      e.target.value = '';
    }
  };

  // Google OAuth Authorization Trigger
  const handleAuthorizeGoogleDrive = async () => {
    setIsAuthorizingDrive(true);
    setGlobalError(null);
    try {
      await requestGoogleDriveAuthorization();
      setIsGoogleConnected(true);
    } catch (authErr: any) {
      setGlobalError(authErr?.message || 'Google Drive authorization was denied or cancelled.');
    } finally {
      setIsAuthorizingDrive(false);
    }
  };

  const handlePromptClientId = () => {
    const existing = localStorage.getItem('studyhub_custom_google_client_id') || '';
    const input = window.prompt(
      'Paste your Google OAuth Client ID from Google Cloud Console (e.g. xxxxx.apps.googleusercontent.com):',
      existing
    );
    if (input && input.trim()) {
      localStorage.setItem('studyhub_custom_google_client_id', input.trim());
      setGlobalError(null);
      handleAuthorizeGoogleDrive();
    }
  };

  // Single Item Retry
  const handleRetryItem = async (itemId: string, formData: ResourceFormData) => {
    const item = fileQueue.find((i) => i.id === itemId);
    if (!item) return;

    if (!currentSubject?.google_drive_folder_id) {
      setGlobalError('Selected subject does not have a Google Drive folder configured.');
      return;
    }

    // Set item to uploading
    setFileQueue((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: 'uploading', progress: 10, error: undefined } : i))
    );

    try {
      const driveResult = await uploadFileToDriveFolder({
        file: item.file,
        folderId: currentSubject.google_drive_folder_id,
        onProgress: (pct) => {
          setFileQueue((prev) =>
            prev.map((i) => (i.id === itemId ? { ...i, progress: pct } : i))
          );
        },
      });

      // Save to Supabase
      const tags = (formData.tags_string || '')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      await onSubmit({
        ...formData,
        title: item.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        subject_id: currentSubject.id,
        resource_type: item.inferredType || formData.resource_type,
        external_url: driveResult.webViewLink,
        embed_url: `https://drive.google.com/file/d/${driveResult.fileId}/preview`,
        google_drive_file_id: driveResult.fileId,
        google_drive_file_url: driveResult.webViewLink,
        google_drive_folder_url: currentSubject.google_drive_folder_url,
        file_name: item.name,
        original_filename: item.name,
        mime_type: driveResult.mimeType,
        file_size: driveResult.fileSize,
        source_provider: 'google_drive',
        tags,
        slug: slugify(item.name.replace(/\.[^/.]+$/, '')),
      });

      setFileQueue((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: 'success', progress: 100, driveResult } : i))
      );
    } catch (err: any) {
      setFileQueue((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: 'error', error: err?.message || 'Upload failed.' } : i))
      );
    }
  };

  // Instant Direct Publish Fallback (Bypasses Google Personal Account 0-Quota Restrictions)
  const handlePublishDirectlyItem = async (itemId: string, formData: ResourceFormData) => {
    const item = fileQueue.find((i) => i.id === itemId);
    if (!item) return;

    setFileQueue((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: 'uploading', progress: 50, error: undefined } : i))
    );

    try {
      const base64Data = await fileToBase64(item.file);
      const tags = (formData.tags_string || '')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const resourceTitle =
        fileQueue.length === 1 && formData.title
          ? formData.title
          : item.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      await onSubmit({
        ...formData,
        title: resourceTitle,
        subject_id: currentSubject.id,
        resource_type: item.inferredType || formData.resource_type,
        external_url: currentSubject?.google_drive_folder_url || '',
        embed_url: currentSubject?.google_drive_folder_url || '',
        google_drive_folder_url: currentSubject?.google_drive_folder_url,
        file_name: item.name,
        original_filename: item.name,
        mime_type: item.file.type || 'application/pdf',
        file_size: item.size,
        file_data: base64Data,
        source_provider: 'google_drive',
        tags,
        slug: slugify(resourceTitle),
      });

      setFileQueue((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: 'success', progress: 100 } : i))
      );
      setGlobalError(null);
    } catch (err: any) {
      setFileQueue((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: 'error', error: err?.message || 'Direct publish failed.' } : i))
      );
    }
  };

  // Publish all queued files directly to StudyHub (Bypasses Google personal Drive 0-quota limit)
  const handlePublishAllDirectly = async (data: ResourceFormData) => {
    setIsProcessingUploads(true);
    setGlobalError(null);

    const tags = (data.tags_string || '')
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    let anyErrors = false;

    for (const item of fileQueue) {
      if (item.status === 'success') continue;

      setFileQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading', progress: 50, error: undefined } : i))
      );

      try {
        const base64Data = await fileToBase64(item.file);
        const resourceTitle =
          fileQueue.length === 1 && data.title
            ? data.title
            : `${data.title || 'Study Material'} - ${item.name.replace(/\.[^/.]+$/, '')}`;

        await onSubmit({
          ...data,
          title: resourceTitle,
          subject_id: currentSubject.id,
          resource_type: item.inferredType || data.resource_type,
          external_url: currentSubject?.google_drive_folder_url || '',
          embed_url: currentSubject?.google_drive_folder_url || '',
          google_drive_folder_url: currentSubject?.google_drive_folder_url,
          file_name: item.name,
          original_filename: item.name,
          mime_type: item.file.type || 'application/pdf',
          file_size: item.size,
          file_data: base64Data,
          source_provider: 'google_drive',
          tags,
          slug: slugify(resourceTitle),
        });

        setFileQueue((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'success', progress: 100 } : i))
        );
      } catch (err: any) {
        anyErrors = true;
        setFileQueue((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'error', error: err?.message || 'Direct publish failed.' } : i))
        );
      }
    }

    setIsProcessingUploads(false);

    if (!anyErrors) {
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  // Main Form Submission
  const onFormSubmit = async (data: ResourceFormData) => {
    setGlobalError(null);

    // 1. If files are queued, upload them directly to the subject's Google Drive folder
    if (fileQueue.length > 0) {
      if (!currentSubject?.google_drive_folder_id) {
        setGlobalError(
          `Subject "${currentSubject?.name || 'Selected Subject'}" does not have a valid Google Drive folder configured. Please configure the subject folder in Subjects Management first.`
        );
        return;
      }

      setIsProcessingUploads(true);
      let anyErrors = false;

      const tags = (data.tags_string || '')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      for (const item of fileQueue) {
        if (item.status === 'success') continue;

        // Update item state to uploading
        setFileQueue((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading', progress: 10, error: undefined } : i))
        );

        try {
          const driveResult = await uploadFileToDriveFolder({
            file: item.file,
            folderId: currentSubject.google_drive_folder_id,
            onProgress: (pct) => {
              setFileQueue((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, progress: pct } : i))
              );
            },
          });

          // Title: If single file, use user title; if multiple files, use individual file name or prefixed title
          const resourceTitle =
            fileQueue.length === 1
              ? data.title
              : `${data.title} - ${item.name.replace(/\.[^/.]+$/, '')}`;

          // Save file metadata to Supabase
          try {
            await onSubmit({
              ...data,
              title: resourceTitle,
              subject_id: currentSubject.id,
              resource_type: item.inferredType || data.resource_type,
              external_url: driveResult.webViewLink,
              embed_url: `https://drive.google.com/file/d/${driveResult.fileId}/preview`,
              google_drive_file_id: driveResult.fileId,
              google_drive_file_url: driveResult.webViewLink,
              google_drive_folder_url: currentSubject.google_drive_folder_url,
              file_name: item.name,
              original_filename: item.name,
              mime_type: driveResult.mimeType,
              file_size: driveResult.fileSize,
              source_provider: 'google_drive',
              tags,
              slug: slugify(resourceTitle),
            });

            setFileQueue((prev) =>
              prev.map((i) =>
                i.id === item.id ? { ...i, status: 'success', progress: 100, driveResult } : i
              )
            );
          } catch (dbErr: any) {
            console.error('Database metadata save error after Drive upload:', dbErr);
            anyErrors = true;
            setFileQueue((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      status: 'error',
                      error: `File uploaded to Drive (ID: ${driveResult.fileId}), but saving to database failed: ${dbErr?.message || dbErr}. Click Retry to re-save.`,
                    }
                  : i
              )
            );
          }
        } catch (uploadErr: any) {
          console.error(`Google Drive upload failed for "${item.name}":`, uploadErr);
          anyErrors = true;
          const errorMsg = uploadErr?.message || 'Google Drive upload failed.';
          setGlobalError(errorMsg);
          setFileQueue((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: 'error', error: errorMsg } : i
            )
          );
        }
      }

      setIsProcessingUploads(false);

      if (!anyErrors) {
        // All files published successfully
        setTimeout(() => {
          onClose();
        }, 1000);
      }
      return;
    }

    // 2. Direct URL / YouTube / Existing resource edit (No files queued)
    try {
      setIsProcessingUploads(true);
      const tags = (data.tags_string || '')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      let finalUrl = data.external_url?.trim() || '';
      let finalProvider = 'google_drive';
      let embedUrl: string | undefined = undefined;

      if (!finalUrl) {
        if (currentSubject?.google_drive_folder_url) {
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
        google_drive_folder_url: currentSubject?.google_drive_folder_url,
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

  const hasConfiguredFolder = Boolean(currentSubject?.google_drive_folder_id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Learning Resource' : 'Upload Study Material'}
      description="Select your subject. Files automatically upload directly into that subject's dedicated Google Drive folder."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {globalError && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Notice</p>
                <p>{globalError}</p>
              </div>
            </div>
            {globalError.includes('Google OAuth Client ID') && (
              <button
                type="button"
                onClick={handlePromptClientId}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs ml-auto shrink-0"
              >
                Enter Client ID Directly
              </button>
            )}
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

        {/* STEP 2: Automatic Subject Destination Folder Badge */}
        {currentSubject && (
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              hasConfiguredFolder
                ? 'bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-emerald-50/40 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/20 border-emerald-200 dark:border-emerald-800/80'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
            }`}
          >
            <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    hasConfiguredFolder
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  <FolderCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Destination Folder:
                    </span>
                    <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 truncate">
                      {currentSubject.name}
                    </span>
                    {hasConfiguredFolder ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                        <span>Folder ID: {currentSubject.google_drive_folder_id}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                        <ShieldAlert className="w-3 h-3" />
                        <span>No Folder Configured</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {hasConfiguredFolder
                      ? 'Files selected below will automatically upload directly into this exact Google Drive folder.'
                      : 'This subject does not have a valid Google Drive folder configured. Please contact the administrator.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                {currentSubject.google_drive_folder_url && (
                  <a
                    href={currentSubject.google_drive_folder_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-white/90 dark:bg-navy-900 border border-emerald-300 dark:border-emerald-700 hover:bg-white flex items-center gap-1 shadow-2xs transition-colors"
                    title="Open this folder directly in Google Drive"
                  >
                    <span>View in Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {/* Drive Integration State: Service Account or OAuth */}
                {driveServerStatus?.configured && driveServerStatus.method === 'service_account' ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Auto-Upload Ready</span>
                  </span>
                ) : isGoogleConnected ? (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>OAuth Active</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleAuthorizeGoogleDrive}
                    disabled={isAuthorizingDrive}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center gap-1 transition-colors disabled:opacity-50"
                    title="Authorize direct Google Drive uploads with your Google Account"
                  >
                    <Key className="w-3 h-3 text-brand-600" />
                    <span>{isAuthorizingDrive ? 'Connecting...' : 'Authorize Drive'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Service Account Sharing Instruction Pill */}
            {driveServerStatus?.configured && driveServerStatus.serviceAccountEmail && (
              <div className="mt-3 pt-2.5 border-t border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between gap-2 flex-wrap text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">Drive Editor Email:</span>
                  <span className="font-mono font-bold text-emerald-950 dark:text-emerald-200 select-all truncate">
                    {driveServerStatus.serviceAccountEmail}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (driveServerStatus.serviceAccountEmail) {
                      navigator.clipboard.writeText(driveServerStatus.serviceAccountEmail);
                      setCopiedSaEmail(true);
                      setTimeout(() => setCopiedSaEmail(false), 2500);
                    }
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors shrink-0"
                >
                  {copiedSaEmail ? 'Copied to Clipboard!' : 'Copy Email to Share'}
                </button>
              </div>
            )}

            {driveServerStatus?.error && (
              <div className="mt-2 text-[11px] text-red-600 dark:text-red-400 font-medium">
                {driveServerStatus.error}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Drag & Drop Multi-File Upload Zone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select or Drag Files (Direct Upload to Subject Folder)
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
                        <div className="mt-1.5 p-2 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-[11px] text-red-700 dark:text-red-300 space-y-1.5">
                          <p className="font-semibold leading-snug">
                            {item.error || 'Upload failed.'}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap pt-0.5">
                            {currentSubject.google_drive_folder_url && (
                              <a
                                href={currentSubject.google_drive_folder_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-2xs"
                              >
                                <span>Open Folder in Drive</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {driveServerStatus?.serviceAccountEmail && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (driveServerStatus.serviceAccountEmail) {
                                    navigator.clipboard.writeText(driveServerStatus.serviceAccountEmail);
                                    setCopiedSaEmail(true);
                                    setTimeout(() => setCopiedSaEmail(false), 2000);
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-white dark:bg-navy-900 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{copiedSaEmail ? 'Copied Email!' : 'Copy Service Account Email'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Success confirmation */}
                      {item.status === 'success' && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate mt-0.5 flex items-center gap-1 font-semibold">
                          <Check className="w-3 h-3" />
                          <span>Uploaded directly to Google Drive folder</span>
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
                        <span>Complete</span>
                      </span>
                    )}

                    {item.status === 'error' && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handlePublishDirectlyItem(item.id, watch())}
                          className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-md shadow-2xs flex items-center gap-1 transition-colors"
                          title="Publish directly to Hammad StudyHub (bypasses Google Drive 0-quota limit)"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Publish Directly</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRetryItem(item.id, watch())}
                          className="text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-navy-950 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 flex items-center gap-1"
                          title="Retry uploading to Google Drive"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry Drive</span>
                        </button>
                      </div>
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
              <option value="published">Published (Visible to students)</option>
              <option value="draft">Draft (Private to administrators)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Optional External URL / YouTube video */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              YouTube Video or External Link (Optional)
            </label>
            <span className="text-[10px] text-slate-400">
              Only needed if not uploading files from device
            </span>
          </div>
          <Input
            placeholder="https://www.youtube.com/watch?v=... (Optional lecture link)"
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
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {hasConfiguredFolder ? (
              <span>
                📁 Destination: <strong>{currentSubject?.name}</strong> Google Drive Folder
              </span>
            ) : (
              <span className="text-amber-600 font-semibold">
                ⚠️ Connect a Google Drive folder to this subject to enable uploads
              </span>
            )}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isProcessingUploads}>
              Cancel
            </Button>

            {fileQueue.some((i) => i.status === 'error') && (
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit(handlePublishAllDirectly)}
                isLoading={isProcessingUploads}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Publish Directly to StudyHub
              </Button>
            )}

            <Button
              type="submit"
              size="sm"
              disabled={fileQueue.length > 0 && !hasConfiguredFolder}
              isLoading={isLoading || isProcessingUploads}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              {isProcessingUploads
                ? 'Uploading to Drive...'
                : initialData
                ? 'Update Material'
                : fileQueue.length > 1
                ? `Upload & Publish ${fileQueue.length} Files`
                : 'Upload & Publish Material'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
