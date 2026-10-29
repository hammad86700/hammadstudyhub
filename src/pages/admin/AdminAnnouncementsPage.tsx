// ==============================================================================
// HAMMAD STUDYHUB — ADMIN ANNOUNCEMENTS MANAGEMENT
// ==============================================================================

import React, { useState } from 'react';
import { Plus, Trash2, Pin, Bell, Calendar } from 'lucide-react';
import { useAnnouncements, useAnnouncementMutations } from '../../hooks/useAnnouncements';
import { formatRelativeTime } from '../../lib/utils';
import { AnnouncementFormModal } from '../../components/admin/AnnouncementFormModal';
import { SEOHead } from '../../components/common/SEOHead';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

export const AdminAnnouncementsPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: announcements = [], isLoading } = useAnnouncements({ includeDrafts: true });
  const { createAnnouncement, deleteAnnouncement } = useAnnouncementMutations();

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Delete notice "${title}"?`)) {
      await deleteAnnouncement.mutateAsync(id);
    }
  };

  const handleFormSubmit = async (data: any) => {
    await createAnnouncement.mutateAsync(data);
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Manage Announcements — Admin Hub" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Announcements & Study Notices
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Publish exam schedules, submission reminders, and class timetable updates.
          </p>
        </div>

        <Button size="sm" onClick={() => setModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Create Notice
        </Button>
      </div>

      <div className="space-y-4">
        {announcements.map((item) => (
          <Card key={item.id} className="p-5 flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-slate-800">
                  {item.category}
                </span>
                {item.is_pinned && (
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                    <Pin className="w-3 h-3 fill-current" /> Pinned
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  Published {formatRelativeTime(item.published_at)}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {item.body}
              </p>
            </div>

            <button
              onClick={() => handleDelete(item.id, item.title)}
              className="text-slate-400 hover:text-red-500 p-1.5 rounded transition-colors shrink-0"
              title="Delete announcement"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Card>
        ))}
      </div>

      <AnnouncementFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFormSubmit}
        isLoading={createAnnouncement.isPending}
      />
    </div>
  );
};
