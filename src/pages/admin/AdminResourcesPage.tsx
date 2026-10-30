// ==============================================================================
// HAMMAD STUDYHUB — ADMIN RESOURCE MANAGEMENT PAGE
// Full CRUD, Publication Controls, CSV Import/Export, and Lesson Date Editing
// ==============================================================================

import React, { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Upload,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  Calendar,
  Filter,
  Video,
} from 'lucide-react';
import { Resource, ResourceType } from '../../types';
import { useSubjects } from '../../hooks/useSubjects';
import { useResources, useResourceMutations } from '../../hooks/useResources';
import { formatLessonDate, exportResourcesToCSV, getResourceTypeMeta } from '../../lib/utils';
import { ResourceFormModal } from '../../components/admin/ResourceFormModal';
import { AddYouTubeLectureModal } from '../../components/admin/AddYouTubeLectureModal';
import { CsvBulkImportModal } from '../../components/admin/CsvBulkImportModal';
import { SEOHead } from '../../components/common/SEOHead';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

export const AdminResourcesPage: React.FC = () => {
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: subjects = [] } = useSubjects();
  const { data: resources = [], isLoading } = useResources(undefined, undefined, {
    includeDrafts: true,
  });

  const { createResource, updateResource, deleteResource, bulkImportResources } =
    useResourceMutations();

  const filtered = resources.filter((r) => {
    if (selectedSubjectId !== 'all' && r.subject_id !== selectedSubjectId) return false;
    if (selectedType !== 'all' && r.resource_type !== selectedType) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingResource(null);
    setResourceModalOpen(true);
  };

  const handleOpenEdit = (res: Resource) => {
    setEditingResource(res);
    setResourceModalOpen(true);
  };

  const handleTogglePublish = async (res: Resource) => {
    const nextStatus = res.status === 'published' ? 'draft' : 'published';
    await updateResource.mutateAsync({
      id: res.id,
      status: nextStatus,
    });
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Permanently remove resource: "${title}"?`)) {
      await deleteResource.mutateAsync(id);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (editingResource) {
      await updateResource.mutateAsync({ ...data, id: editingResource.id });
    } else {
      await createResource.mutateAsync(data);
    }
  };

  const handleExportCSV = () => {
    const csv = exportResourcesToCSV(resources);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyhub_resources_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Manage Resources — Admin Hub" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Resource Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Publish notes, whiteboard photos, manage Google Drive sharing, and edit lesson dates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCsvModalOpen(true)}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Bulk Import CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setYoutubeModalOpen(true)}
            leftIcon={<Video className="w-3.5 h-3.5 text-white" />}
            className="bg-red-600 hover:bg-red-700 text-white shadow-xs"
          >
            Add YouTube Lecture
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Resource
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="text-xs sm:text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-slate-100"
        >
          <option value="all">All Subjects</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name} ({sub.code})
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="text-xs sm:text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-slate-100"
        >
          <option value="all">All Content Types</option>
          <option value="pdf">PDF Notes</option>
          <option value="video">Lecture Video</option>
          <option value="whiteboard">Whiteboard & Diagrams</option>
          <option value="assignment">Assignment / Worksheet</option>
          <option value="presentation">Presentation Slides</option>
          <option value="past_paper">Past Papers</option>
        </select>
      </div>

      {/* Resources Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-50 dark:bg-navy-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Lesson Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((res) => {
                const meta = getResourceTypeMeta(res.resource_type);
                return (
                  <tr
                    key={res.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${meta.badgeClass}`}
                      >
                        {meta.shortLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <span className="font-bold text-slate-900 dark:text-white block truncate">
                        {res.title}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate block">
                        {res.topic ? `${res.topic} &bull; ` : ''}
                        {res.chapter || ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {res.subject?.name || 'Assigned'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {formatLessonDate(res.lesson_date, { format: 'short' })}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleTogglePublish(res)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${
                          res.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100'
                        }`}
                        title="Click to toggle published / draft status"
                      >
                        {res.status === 'published' ? (
                          <>
                            <Eye className="w-3 h-3" /> Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" /> Draft
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <a
                        href={res.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 inline-block"
                        title="Open external link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleOpenEdit(res)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit resource"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(res.id, res.title)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Delete resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <AddYouTubeLectureModal
        isOpen={youtubeModalOpen}
        onClose={() => setYoutubeModalOpen(false)}
        subjects={subjects}
        onAddLecture={async (data) => {
          await createResource.mutateAsync(data as any);
        }}
        isLoading={createResource.isPending}
      />

      <ResourceFormModal
        isOpen={resourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
        subjects={subjects}
        initialData={editingResource}
        onSubmit={handleFormSubmit}
        isLoading={createResource.isPending || updateResource.isPending}
      />

      <CsvBulkImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        subjects={subjects}
        onImport={async (items) => {
          await bulkImportResources.mutateAsync(items);
        }}
        isLoading={bulkImportResources.isPending}
      />
    </div>
  );
};
