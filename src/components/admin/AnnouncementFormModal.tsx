// ==============================================================================
// HAMMAD STUDYHUB — ANNOUNCEMENT FORM MODAL
// ==============================================================================

import React, { useState } from 'react';
import { Announcement } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, Textarea, Select } from '../common/Input';

interface AnnouncementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export const AnnouncementFormModal: React.FC<AnnouncementFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<'general' | 'exam' | 'assignment' | 'schedule'>('general');
  const [isPinned, setIsPinned] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    await onSubmit({
      title: title.trim(),
      body: body.trim(),
      category,
      is_pinned: isPinned,
      status: 'published',
    });

    setTitle('');
    setBody('');
    setIsPinned(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Notice / Announcement"
      description="Broadcast exam schedules, homework deadlines, or general study notices."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Notice Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Mid-Term Examination Dates Announced"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            options={[
              { value: 'general', label: 'General Announcement' },
              { value: 'exam', label: 'Exam / Midterm Notice' },
              { value: 'assignment', label: 'Assignment / Homework Alert' },
              { value: 'schedule', label: 'Class / Timetable Schedule' },
            ]}
          />

          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
              <span>Pin to top of notice board</span>
            </label>
          </div>
        </div>

        <Textarea
          label="Announcement Body"
          required
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write the full message details for students..."
        />

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isLoading}>
            Publish Notice
          </Button>
        </div>
      </form>
    </Modal>
  );
};
