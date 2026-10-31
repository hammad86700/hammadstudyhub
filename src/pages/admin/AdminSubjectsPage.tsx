// ==============================================================================
// HAMMAD STUDYHUB — ADMIN SUBJECT MANAGEMENT PAGE
// ==============================================================================

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, ExternalLink, Check, X, BookOpen } from 'lucide-react';
import { Subject } from '../../types';
import { useSubjects, useSubjectMutations } from '../../hooks/useSubjects';
import { SubjectFormModal } from '../../components/admin/SubjectFormModal';
import { SEOHead } from '../../components/common/SEOHead';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const AdminSubjectsPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [search, setSearch] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const { data: subjects = [], isLoading, refetch } = useSubjects();
  const { createSubject, updateSubject, deleteSubject } = useSubjectMutations();

  // Listen for real-time subject updates
  React.useEffect(() => {
    const handleUpdate = () => refetch();
    window.addEventListener('studyhub_subjects_updated', handleUpdate);
    return () => window.removeEventListener('studyhub_subjects_updated', handleUpdate);
  }, [refetch]);

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      await deleteSubject.mutateAsync(id);
      setSuccessBanner(`Subject "${name}" deleted.`);
      setTimeout(() => setSuccessBanner(null), 4000);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (editingSubject) {
      await updateSubject.mutateAsync({ ...data, id: editingSubject.id });
      setSuccessBanner(`Subject "${data.name}" updated successfully!`);
    } else {
      await createSubject.mutateAsync(data);
      setSuccessBanner(`Subject "${data.name}" added successfully!`);
    }
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Manage Subjects — Admin Hub" />

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-subtle animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Subjects Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create, configure course codes, assign instructors, and update visibility.
          </p>
        </div>

        <Button size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Add New Subject
        </Button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Filter subjects by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Subjects Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-50 dark:bg-navy-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Subject Name</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Drive Folder</th>
                <th className="py-3 px-4">Color</th>
                <th className="py-3 px-4">Featured</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {sub.code}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {sub.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      /subjects/{sub.slug}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {sub.instructor || '—'}
                  </td>
                  <td className="py-3 px-4">
                    {sub.google_drive_folder_url ? (
                      <a
                        href={sub.google_drive_folder_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 transition-colors border border-emerald-200 dark:border-emerald-800"
                        title="Open connected Google Drive folder"
                      >
                        <span>📁 Drive Linked</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <button
                        onClick={() => handleOpenEdit(sub)}
                        className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>+ Configure Drive</span>
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 capitalize">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full bg-${sub.color}-500`} />
                      <span>{sub.color}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {sub.is_featured ? (
                      <Badge variant="brand" size="sm">Featured</Badge>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {sub.is_active ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> Hidden
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit subject"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id, sub.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      title="Delete subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <SubjectFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editingSubject}
        onSubmit={handleFormSubmit}
        isLoading={createSubject.isPending || updateSubject.isPending}
      />
    </div>
  );
};
