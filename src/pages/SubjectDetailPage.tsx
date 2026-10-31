// ==============================================================================
// HAMMAD STUDYHUB — SUBJECT DETAIL & RESOURCE TIMELINE PAGE
// Daily-wise timeline organization, content-type filtering, and date sorting
// ==============================================================================

import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Filter,
  Search,
  FileText,
  Video,
  Image as ImageIcon,
  ClipboardCheck,
  GraduationCap,
  Presentation,
  GraduationCap as TeacherIcon,
  X,
  Layers,
  ArrowUpDown,
  MessageCircle,
  Plus,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ResourceType, ResourceFilters, Resource } from '../types';
import { useSubject, useSubjects } from '../hooks/useSubjects';
import { useResources, useResourceMutations } from '../hooks/useResources';
import { useAuth } from '../context/AuthContext';
import { ResourceTimeline } from '../components/resource/ResourceTimeline';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { SEOHead } from '../components/common/SEOHead';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ResourceListSkeleton } from '../components/common/LoadingSkeleton';
import { ContactAdminModal } from '../components/common/ContactAdminModal';
import { StudyMaterialAuthGate } from '../components/common/StudyMaterialAuthGate';
import { AddYouTubeLectureModal } from '../components/admin/AddYouTubeLectureModal';
import { ResourceFormModal } from '../components/admin/ResourceFormModal';

export const SubjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isLoggedIn, isStudyManager } = useAuth();
  const { data: allSubjects = [] } = useSubjects();

  const [filters, setFilters] = useState<ResourceFilters>({
    resourceType: 'all',
    searchQuery: '',
    sortOrder: 'date-desc',
    chapter: '',
    dateFrom: '',
    dateTo: '',
  });

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const { data: subject, isLoading: subjectLoading } = useSubject(slug || '');
  const { data: resources, isLoading: resourcesLoading } = useResources(subject?.id || slug, filters);
  const { createResource } = useResourceMutations();

  const handleAddYouTubeLecture = async (lectureData: Partial<Resource>) => {
    await createResource.mutateAsync(lectureData as any);
    setSuccessBanner(`YouTube Lecture "${lectureData.title}" published successfully to ${subject?.name}!`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const handleAddGeneralResource = async (formData: any) => {
    await createResource.mutateAsync({
      ...formData,
      subject_id: subject?.id || formData.subject_id,
    });
    setSuccessBanner(`Resource "${formData.title}" published successfully!`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  // Extract unique chapters from resources for quick filter pills
  const availableChapters = useMemo(() => {
    if (!resources) return [];
    const set = new Set<string>();
    resources.forEach((r) => {
      if (r.chapter) set.add(r.chapter);
    });
    return Array.from(set);
  }, [resources]);

  if (subjectLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        <ResourceListSkeleton count={4} />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EmptyState
          title="Subject Not Found"
          description="The requested subject does not exist or may have been unlisted."
          actionLabel="Return to Subjects"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Subjects', href: '/subjects' },
    { label: subject.name },
  ];

  const contentTypes: { label: string; value: ResourceType | 'all' }[] = [
    { label: 'All Resources', value: 'all' },
    { label: 'PDF Notes', value: 'pdf' },
    { label: 'Lecture Videos', value: 'video' },
    { label: 'Whiteboards', value: 'whiteboard' },
    { label: 'Assignments', value: 'assignment' },
    { label: 'Past Papers', value: 'past_paper' },
    { label: 'Slides', value: 'presentation' },
  ];

  const clearFilters = () => {
    setFilters({
      resourceType: 'all',
      searchQuery: '',
      sortOrder: 'date-desc',
      chapter: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveFilters = Boolean(
    filters.resourceType !== 'all' ||
    filters.searchQuery ||
    filters.chapter ||
    filters.dateFrom ||
    filters.dateTo
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SEOHead
        title={`${subject.name} (${subject.code}) — Study Resources`}
        description={subject.description || `Browse daily lecture notes, whiteboard photos, and past papers for ${subject.name}.`}
      />

      <Breadcrumb items={breadcrumbs} />

      {/* Subject Header Banner */}
      <header className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              {subject.code}
            </span>
            {subject.program && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {subject.program.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {subject.google_drive_folder_url && (
              <a
                href={subject.google_drive_folder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold transition-colors"
                title="Open this subject folder in Google Drive"
              >
                <span>📁 Course Drive Folder</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={() => setContactModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition-colors"
              title="Request missing lecture notes or worksheets directly from Muhammad Hammad"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current text-emerald-600" />
              <span>Request Notes on WhatsApp</span>
            </button>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
              {resources?.length ?? 0} Published {resources?.length === 1 ? 'Resource' : 'Resources'}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">
            {subject.name}
          </h1>
          {subject.description && (
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-4xl leading-relaxed">
              {subject.description}
            </p>
          )}
        </div>

        {subject.instructor && (
          <div className="pt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <TeacherIcon className="w-4 h-4 text-brand-500" />
            <span>Instructor: </span>
            <strong className="text-slate-800 dark:text-slate-200">{subject.instructor}</strong>
          </div>
        )}

        {/* CR, GR, and Admin Quick Study Management Action Bar */}
        {isStudyManager && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Management Controls:
            </span>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setYoutubeModalOpen(true)}
              leftIcon={<Video className="w-3.5 h-3.5 text-white" />}
              className="bg-red-600 hover:bg-red-700 text-white shadow-xs"
            >
              Add YouTube Lecture
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setResourceModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Notes / PDF
            </Button>

            {subject.google_drive_folder_url && (
              <a
                href={subject.google_drive_folder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 transition-colors ml-auto"
                title="Open external backup folder"
              >
                <span>External Backup</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </header>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 font-bold ml-2 text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {/* Content Section: Protected for Registered Students */}
      {!isLoggedIn ? (
        <StudyMaterialAuthGate
          subjectName={subject.name}
          title={`Student Account Required for ${subject.name}`}
          description={`To access classroom lecture notes, YouTube video explanations, PDFs, whiteboard diagrams, and model solutions for ${subject.name}, please sign in or register with your student roll number.`}
        />
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white dark:bg-navy-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-3">
            {/* Search & Sort Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search lessons by topic, title, or tag..."
                  value={filters.searchQuery || ''}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <select
                    value={filters.sortOrder || 'date-desc'}
                    onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as any })}
                    className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="date-desc">Newest Lessons First</option>
                    <option value="date-asc">Oldest Lessons First</option>
                    <option value="title-asc">Title (A-Z)</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Content Type Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
              {contentTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilters({ ...filters, resourceType: type.value })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                    filters.resourceType === type.value
                      ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-navy-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Chapter Filter Pills (if any exist) */}
            {availableChapters.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400 shrink-0">Chapter:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setFilters({ ...filters, chapter: '' })}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      !filters.chapter
                        ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    All
                  </button>
                  {availableChapters.map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setFilters({ ...filters, chapter: ch })}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        filters.chapter === ch
                          ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Daily-Wise Timeline of Lessons */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-600" />
                <span>Daily Lesson Timeline</span>
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Organized by calendar class date
              </span>
            </div>

            {resourcesLoading ? (
              <ResourceListSkeleton count={4} />
            ) : resources && resources.length > 0 ? (
              <ResourceTimeline resources={resources} />
            ) : (
              <EmptyState
                title="No resources found"
                description="There are no learning resources matching your filter criteria."
                actionLabel={hasActiveFilters ? 'Clear Filters' : undefined}
                onAction={clearFilters}
              />
            )}
          </section>
        </>
      )}

      {/* Direct Contact Modal */}
      <ContactAdminModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        initialTopic={subject.name}
      />

      {/* Add YouTube Lecture Modal for CR, GR, and Admin */}
      <AddYouTubeLectureModal
        isOpen={youtubeModalOpen}
        onClose={() => setYoutubeModalOpen(false)}
        subjects={allSubjects.length > 0 ? allSubjects : [subject]}
        defaultSubjectId={subject.id}
        onAddLecture={handleAddYouTubeLecture}
      />

      {/* Resource Form Modal (Notes / PDFs / Worksheets) */}
      <ResourceFormModal
        isOpen={resourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
        subjects={allSubjects.length > 0 ? allSubjects : [subject]}
        onSubmit={handleAddGeneralResource}
      />
    </div>
  );
};
