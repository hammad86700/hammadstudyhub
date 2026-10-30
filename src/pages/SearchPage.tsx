// ==============================================================================
// HAMMAD STUDYHUB — GLOBAL SEARCH PAGE
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Calendar, X, BookOpen, Layers } from 'lucide-react';
import { ResourceType } from '../types';
import { useResources } from '../hooks/useResources';
import { useSubjects } from '../hooks/useSubjects';
import { useAuth } from '../context/AuthContext';
import { ResourceCard } from '../components/resource/ResourceCard';
import { SubjectCard } from '../components/subject/SubjectCard';
import { SEOHead } from '../components/common/SEOHead';
import { EmptyState } from '../components/common/EmptyState';
import { ResourceListSkeleton } from '../components/common/LoadingSkeleton';
import { StudyMaterialAuthGate } from '../components/common/StudyMaterialAuthGate';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn } = useAuth();
  const initialQuery = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') || 'all') as ResourceType | 'all';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>(initialType);
  const [activeTab, setActiveTab] = useState<'all' | 'resources' | 'subjects'>('all');

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (selectedType !== 'all') params.set('type', selectedType);
      setSearchParams(params, { replace: true });
    }, 250);
    return () => clearTimeout(timer);
  }, [query, selectedType, setSearchParams]);

  const { data: resources, isLoading: resourcesLoading } = useResources(undefined, {
    searchQuery: debouncedQuery,
    resourceType: selectedType,
  });

  const { data: subjects, isLoading: subjectsLoading } = useSubjects({
    searchQuery: debouncedQuery,
  });

  const isLoading = resourcesLoading || subjectsLoading;

  const contentTypes: { label: string; value: ResourceType | 'all' }[] = [
    { label: 'All Types', value: 'all' },
    { label: 'PDF Notes', value: 'pdf' },
    { label: 'Lecture Videos', value: 'video' },
    { label: 'Whiteboards', value: 'whiteboard' },
    { label: 'Assignments', value: 'assignment' },
    { label: 'Past Papers', value: 'past_paper' },
    { label: 'Slides', value: 'presentation' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <SEOHead
        title="Search Learning Resources"
        description="Search through lecture notes, whiteboard photos, video lessons, and past papers on Hammad StudyHub."
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Global Resource Search
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Find any lesson note, exam review, or whiteboard diagram instantly across all subjects.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="relative shadow-sm rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 p-2 flex items-center">
        <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search (e.g. algorithms, binary arithmetic, k-map, pointers, midterms)..."
          className="w-full px-3 py-2 text-sm sm:text-base bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-2"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs & Content Type Pills */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {contentTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors border ${
                selectedType === t.value
                  ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                  : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {isLoading ? (
        <ResourceListSkeleton count={4} />
      ) : (
        <div className="space-y-8">
          {/* Matched Subjects (if any) */}
          {subjects && subjects.length > 0 && selectedType === 'all' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-brand-600" />
                <span>Matched Subjects ({subjects.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((sub) => (
                  <SubjectCard key={sub.id} subject={sub} />
                ))}
              </div>
            </div>
          )}

          {/* Matched Resources (Protected for Registered Students) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-600" />
              <span>Matched Study Materials ({resources?.length || 0})</span>
            </h3>

            {!isLoggedIn ? (
              <StudyMaterialAuthGate
                title="Student Sign-In Required to View Matching Materials"
                description="Matched lecture notes, YouTube recordings, and model solutions are protected. Please sign in or create an account to view and download these files."
              />
            ) : resources && resources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map((res) => (
                  <ResourceCard key={res.id} resource={res} showSubjectBadge />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No resources found"
                description={`No resources match "${debouncedQuery}". Try another keyword or remove filters.`}
                actionLabel="Clear Search"
                onAction={() => {
                  setQuery('');
                  setSelectedType('all');
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
