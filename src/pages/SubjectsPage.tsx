// ==============================================================================
// HAMMAD STUDYHUB — SUBJECTS DIRECTORY PAGE
// ==============================================================================

import React, { useState } from 'react';
import { SubjectFilters } from '../types';
import { useSubjects } from '../hooks/useSubjects';
import { SubjectCard } from '../components/subject/SubjectCard';
import { SubjectFilterBar } from '../components/subject/SubjectFilters';
import { SEOHead } from '../components/common/SEOHead';
import { EmptyState } from '../components/common/EmptyState';
import { SubjectCardSkeleton } from '../components/common/LoadingSkeleton';

export const SubjectsPage: React.FC = () => {
  const [filters, setFilters] = useState<SubjectFilters>({
    searchQuery: '',
    featuredOnly: false,
  });

  const { data: subjects, isLoading } = useSubjects(filters);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <SEOHead
        title="Subjects Directory"
        description="Browse all academic subjects, lecture notes, syllabus materials, and past papers organized by Muhammad Hammad."
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Subjects Directory
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Browse semester courses, syllabi, whiteboard diagrams, and lesson notes.
        </p>
      </div>

      <SubjectFilterBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SubjectCardSkeleton />
          <SubjectCardSkeleton />
          <SubjectCardSkeleton />
          <SubjectCardSkeleton />
        </div>
      ) : subjects && subjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => (
            <SubjectCard key={sub.id} subject={sub} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No matching subjects found"
          description="Try adjusting your search terms or clearing the active filters."
          actionLabel="Clear Filters"
          onAction={() => setFilters({ searchQuery: '', featuredOnly: false })}
        />
      )}
    </div>
  );
};
