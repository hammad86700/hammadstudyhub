// ==============================================================================
// HAMMAD STUDYHUB — ADMIN DASHBOARD OVERVIEW PAGE
// ==============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, FileText, Bell, ExternalLink, Calendar, Clock } from 'lucide-react';
import { useSubjects, useSubjectMutations } from '../../hooks/useSubjects';
import { useResources, useResourceMutations } from '../../hooks/useResources';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { formatLessonDate, formatRelativeTime, getResourceTypeMeta } from '../../lib/utils';
import { StatsOverview } from '../../components/admin/StatsOverview';
import { ResourceFormModal } from '../../components/admin/ResourceFormModal';
import { SubjectFormModal } from '../../components/admin/SubjectFormModal';
import { CsvBulkImportModal } from '../../components/admin/CsvBulkImportModal';
import { SEOHead } from '../../components/common/SEOHead';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const AdminDashboardPage: React.FC = () => {
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  const { data: subjects = [] } = useSubjects();
  const { data: resources = [] } = useResources(undefined, undefined, { includeDrafts: true });
  const { data: announcements = [] } = useAnnouncements({ includeDrafts: true });

  const { createResource, bulkImportResources } = useResourceMutations();
  const { createSubject } = useSubjectMutations();

  const handleCreateResource = async (data: any) => {
    await createResource.mutateAsync(data);
  };

  const handleCreateSubject = async (data: any) => {
    await createSubject.mutateAsync(data);
  };

  const handleBulkImport = async (items: any[]) => {
    await bulkImportResources.mutateAsync(items);
  };

  const recentResources = [...resources]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <SEOHead title="Admin Dashboard Overview" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time database statistics and platform management for Hammad StudyHub.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setResourceModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Resource
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSubjectModalOpen(true)}
            leftIcon={<BookOpen className="w-4 h-4" />}
          >
            Add Subject
          </Button>
        </div>
      </div>

      {/* Derived Database Statistics */}
      <StatsOverview
        subjects={subjects}
        resources={resources}
        announcements={announcements}
        onNewResource={() => setResourceModalOpen(true)}
        onNewSubject={() => setSubjectModalOpen(true)}
        onBulkImport={() => setCsvModalOpen(true)}
      />

      {/* Recent Publishing Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Added Resources */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Recent Publishing Activity</span>
            </h3>
            <Link
              to="/admin/resources"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              View all ({resources.length})
            </Link>
          </div>

          {recentResources.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentResources.map((res) => {
                const meta = getResourceTypeMeta(res.resource_type);
                return (
                  <div key={res.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.badgeClass}`}>
                          {meta.shortLabel}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {res.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Lesson: {formatLessonDate(res.lesson_date, { format: 'short' })} &bull; Added {formatRelativeTime(res.created_at)}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        res.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">No recent uploads yet.</p>
          )}
        </Card>

        {/* Subjects Quick Directory */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-600" />
              <span>Configured Subjects</span>
            </h3>
            <Link
              to="/admin/subjects"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Manage all ({subjects.length})
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {subjects.slice(0, 5).map((sub) => (
              <div key={sub.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {sub.name}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {sub.code} &bull; {sub.instructor || 'No instructor assigned'}
                  </p>
                </div>

                <Link
                  to={`/subjects/${sub.slug}`}
                  target="_blank"
                  className="text-brand-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>View</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Modals */}
      <ResourceFormModal
        isOpen={resourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
        subjects={subjects}
        onSubmit={handleCreateResource}
        isLoading={createResource.isPending}
      />

      <SubjectFormModal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        onSubmit={handleCreateSubject}
        isLoading={createSubject.isPending}
      />

      <CsvBulkImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        subjects={subjects}
        onImport={handleBulkImport}
        isLoading={bulkImportResources.isPending}
      />
    </div>
  );
};
