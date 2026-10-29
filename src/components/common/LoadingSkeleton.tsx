// ==============================================================================
// HAMMAD STUDYHUB — LOADING SKELETONS
// ==============================================================================

import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/80',
      className
    )}
  />
);

export const SubjectCardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-navy-900/60 shadow-sm space-y-4">
    <div className="flex items-start justify-between">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <Skeleton className="w-16 h-5 rounded-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="w-3/4 h-5" />
      <Skeleton className="w-full h-3.5" />
      <Skeleton className="w-2/3 h-3.5" />
    </div>
    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
      <Skeleton className="w-20 h-4" />
      <Skeleton className="w-24 h-4" />
    </div>
  </div>
);

export const ResourceRowSkeleton: React.FC = () => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-navy-900/60 shadow-sm flex items-center justify-between gap-4">
    <div className="flex items-center gap-3 w-3/4">
      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
      <div className="space-y-1.5 w-full">
        <Skeleton className="w-2/3 h-4" />
        <Skeleton className="w-1/3 h-3" />
      </div>
    </div>
    <Skeleton className="w-20 h-8 rounded-lg shrink-0" />
  </div>
);

export const ResourceListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <ResourceRowSkeleton key={i} />
    ))}
  </div>
);
