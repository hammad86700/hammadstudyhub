// ==============================================================================
// HAMMAD STUDYHUB — SUBJECT FORM MODAL (CREATE / EDIT)
// ==============================================================================

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Subject } from '../../types';
import { slugify } from '../../lib/utils';
import { parseGoogleDriveUrl } from '../../lib/googleDrive';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, Textarea } from '../common/Input';
import { FolderCheck, Sparkles, AlertCircle } from 'lucide-react';

const subjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  slug: z.string().optional(),
  code: z.string().min(2, 'Course code is required (e.g. CS-101).'),
  description: z.string().optional(),
  instructor: z.string().optional(),
  google_drive_folder_url: z.string().optional(),
  icon: z.string().default('book-open'),
  color: z.string().default('blue'),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().default(0),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

interface SubjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Subject | null;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export const SubjectFormModal: React.FC<SubjectFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: '',
      slug: '',
      code: '',
      description: '',
      instructor: '',
      google_drive_folder_url: '',
      icon: 'book-open',
      color: 'blue',
      is_featured: false,
      is_active: true,
      sort_order: 1,
    },
  });

  useEffect(() => {
    setFormError(null);
    if (initialData) {
      reset({
        name: initialData.name,
        slug: initialData.slug,
        code: initialData.code,
        description: initialData.description || '',
        instructor: initialData.instructor || '',
        google_drive_folder_url: initialData.google_drive_folder_url || '',
        icon: initialData.icon || 'book-open',
        color: initialData.color || 'blue',
        is_featured: initialData.is_featured,
        is_active: initialData.is_active,
        sort_order: initialData.sort_order || 1,
      });
    } else {
      reset({
        name: '',
        slug: '',
        code: '',
        description: '',
        instructor: '',
        google_drive_folder_url: '',
        icon: 'book-open',
        color: 'blue',
        is_featured: false,
        is_active: true,
        sort_order: 1,
      });
    }
  }, [initialData, reset, isOpen]);

  const onFormSubmit = async (data: SubjectFormData) => {
    setFormError(null);
    setIsSubmitting(true);

    try {
      const slug = data.slug?.trim() ? slugify(data.slug) : slugify(data.name);
      let driveUrl = data.google_drive_folder_url?.trim() || '';
      if (driveUrl && !driveUrl.startsWith('http://') && !driveUrl.startsWith('https://')) {
        driveUrl = 'https://' + driveUrl;
      }

      let folderId: string | undefined = undefined;
      if (driveUrl) {
        const parsed = parseGoogleDriveUrl(driveUrl);
        if (parsed.folderId) {
          folderId = parsed.folderId;
        }
      }

      await onSubmit({
        ...data,
        slug,
        google_drive_folder_url: driveUrl || undefined,
        google_drive_folder_id: folderId,
      });
      onClose();
    } catch (err: any) {
      console.error('Subject submission error:', err);
      setFormError(err?.message || 'Failed to save subject. Please check inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Academic Subject' : 'Add New Subject'}
      description="Configure subject titles, course codes, branding colors, and teacher attribution."
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p>{formError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Subject Name"
            required
            placeholder="e.g. Computer Programming"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Course Code"
            required
            placeholder="e.g. CS-101"
            error={errors.code?.message}
            {...register('code')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="URL Slug (Optional)"
            placeholder="computer-programming"
            helperText="Leave blank to auto-generate from name"
            {...register('slug')}
          />
          <Input
            label="Instructor / Lecturer (Optional)"
            placeholder="e.g. Engr. Muhammad Hammad"
            {...register('instructor')}
          />
        </div>

        <Textarea
          label="Course Description / Overview"
          rows={3}
          placeholder="Brief syllabus outline and learning goals..."
          {...register('description')}
        />

        {/* Google Drive Subject Folder (Configure Once) */}
        <div className="p-3.5 rounded-2xl bg-brand-50/60 dark:bg-navy-950/60 border border-brand-200 dark:border-brand-900/60 space-y-1.5">
          <div className="flex items-center gap-2">
            <FolderCheck className="w-4 h-4 text-brand-600" />
            <label className="text-xs font-bold text-brand-900 dark:text-brand-200">
              Subject Google Drive Folder Link (Configure Once)
            </label>
          </div>
          <Input
            type="text"
            placeholder="https://drive.google.com/drive/folders/1ABC... (Paste your subject folder link)"
            helperText="Once added, whenever anyone uploads notes or PDFs for this subject, it automatically links to this folder. No need to paste a link every time!"
            {...register('google_drive_folder_url')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Icon Symbol
            </label>
            <select
              {...register('icon')}
              className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
            >
              <option value="book-open">Book Open</option>
              <option value="code">Code / Programming</option>
              <option value="cpu">CPU / Hardware</option>
              <option value="atom">Atom / Science</option>
              <option value="users">Users / Social</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Accent Color
            </label>
            <select
              {...register('color')}
              className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
            >
              <option value="blue">Sapphire Blue</option>
              <option value="indigo">Indigo Midnight</option>
              <option value="emerald">Emerald Green</option>
              <option value="teal">Teal Cyan</option>
              <option value="rose">Rose Red</option>
            </select>
          </div>

          <Input
            label="Sort Order"
            type="number"
            {...register('sort_order')}
          />
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
              {...register('is_featured')}
            />
            <span>Featured on Homepage</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
              {...register('is_active')}
            />
            <span>Active & Visible</span>
          </label>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isLoading}>
            {initialData ? 'Update Subject' : 'Create Subject'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
