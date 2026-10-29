// ==============================================================================
// HAMMAD STUDYHUB — SUBJECT FILTERS
// ==============================================================================

import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { SubjectFilters } from '../../types';

interface SubjectFiltersProps {
  filters: SubjectFilters;
  onChange: (filters: SubjectFilters) => void;
}

export const SubjectFilterBar: React.FC<SubjectFiltersProps> = ({ filters, onChange }) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, searchQuery: e.target.value });
  };

  const handleFeaturedToggle = () => {
    onChange({ ...filters, featuredOnly: !filters.featuredOnly });
  };

  const clearFilters = () => {
    onChange({ searchQuery: '', featuredOnly: false });
  };

  const hasActiveFilters = Boolean(filters.searchQuery || filters.featuredOnly);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-navy-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={filters.searchQuery || ''}
          onChange={handleSearchChange}
          placeholder="Search subjects by name, course code, or description..."
          className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleFeaturedToggle}
          className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${
            filters.featuredOnly
              ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-950/60 dark:border-brand-700 dark:text-brand-300'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          Featured Only
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-2.5 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
