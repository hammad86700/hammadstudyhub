// ==============================================================================
// HAMMAD STUDYHUB — RESOURCE FORM MODAL (CREATE / EDIT)
// Includes live Google Drive validation, embed generation, and permission checking
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, AlertCircle, ExternalLink, Calendar, Link as LinkIcon } from 'lucide-react';
import { Resource, ResourceType, Subject } from '../../types';
import { parseGoogleDriveUrl, parseYouTubeUrl, detectSourceProvider } from '../../lib/googleDrive';
import { getTodayDateString, slugify } from '../../lib/utils';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, Textarea, Select } from '../common/Input';

const resourceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  subject_id: z.string().min(1, 'Please select a subject.'),
  resource_type: z.enum(['pdf', 'video', 'whiteboard', 'assignment', 'presentation', 'past_paper', 'other']),
  external_url: z.string().url('Please enter a valid HTTP/HTTPS URL.'),
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

  const {
    register,
    handleSubmit,
    watch,
    reset,
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

  const watchedUrl = watch('external_url');

  // Sync initialData when editing
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        subject_id: initialData.subject_id,
        resource_type: initialData.resource_type,
        external_url: initialData.external_url,
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
  }, [initialData, subjects, reset]);

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
        permissionNotice: 'Ensure direct URL is accessible via HTTPS.',
      });
    }
  }, [watchedUrl]);

  const onFormSubmit = async (data: ResourceFormData) => {
    const tags = (data.tags_string || '')
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    await onSubmit({
      ...data,
      tags,
      slug: slugify(data.title),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Learning Resource' : 'Publish New Resource'}
      description="Add notes, whiteboard snapshots, video explanations, or past papers organized by lesson date."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Subject Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Subject <span className="text-red-500">*</span>
            </label>
            <select
              {...register('subject_id')}
              className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
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

          {/* Resource Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Content Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register('resource_type')}
              className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
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

        {/* Title */}
        <Input
          label="Resource Title"
          required
          placeholder="e.g. Lesson 04: Two's Complement Arithmetic & Sign Extension"
          error={errors.title?.message}
          {...register('title')}
        />

        {/* External URL with live Drive validation */}
        <div>
          <Input
            label="Google Drive or Media URL"
            required
            placeholder="https://drive.google.com/file/d/1BxiMVs0XRA5.../view?usp=sharing"
            leftIcon={<LinkIcon className="w-4 h-4" />}
            error={errors.external_url?.message}
            {...register('external_url')}
          />

          {/* Live Link Validation Alert */}
          {driveValidation && (
            <div
              className={`mt-2 p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
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

        {/* Lesson Date & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Lesson Date (Academic Date)"
            type="date"
            required
            leftIcon={<Calendar className="w-4 h-4" />}
            helperText="Date this class took place (independent of publication timestamp)"
            error={errors.lesson_date?.message}
            {...register('lesson_date')}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Publication Status
            </label>
            <select
              {...register('status')}
              className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
            >
              <option value="published">Published (Visible to students)</option>
              <option value="draft">Draft (Private to administrators)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Topic & Chapter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Chapter / Module (Optional)"
            placeholder="e.g. Chapter 3, Unit 1, Module A"
            {...register('chapter')}
          />
          <Input
            label="Topic (Optional)"
            placeholder="e.g. Boolean Axioms & Logic Minimization"
            {...register('topic')}
          />
        </div>

        {/* Tags */}
        <Input
          label="Search Tags (comma separated)"
          placeholder="e.g. binary, boolean, exam-review, formulas"
          helperText="Helps students quickly discover this resource in global search"
          {...register('tags_string')}
        />

        {/* Description */}
        <Textarea
          label="Description / Teacher Notes (Optional)"
          rows={3}
          placeholder="Key concepts discussed, homework instructions, or reading reminders..."
          {...register('description')}
        />

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isLoading}>
            {initialData ? 'Update Resource' : 'Save & Publish'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
