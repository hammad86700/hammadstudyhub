// ==============================================================================
// HAMMAD STUDYHUB — DAILY-WISE RESOURCE TIMELINE
// Core Architectural Pillar: Groups learning materials by lesson date
// ==============================================================================

import React from 'react';
import { Calendar, Clock, Layers } from 'lucide-react';
import { Resource } from '../../types';
import { groupResourcesByDate, formatLessonDate } from '../../lib/utils';
import { ResourceCard } from './ResourceCard';

interface ResourceTimelineProps {
  resources: Resource[];
  showSubjectBadge?: boolean;
}

export const ResourceTimeline: React.FC<ResourceTimelineProps> = ({
  resources,
  showSubjectBadge = false,
}) => {
  const grouped = groupResourcesByDate(resources);

  if (resources.length === 0) {
    return null;
  }

  return (
    <div className="relative space-y-8 pl-4 sm:pl-6 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {grouped.map(({ date, resources: dateResources }) => (
        <section key={date} aria-labelledby={`date-heading-${date}`} className="relative space-y-3">
          {/* Timeline Node & Date Header */}
          <div className="flex items-center gap-3">
            {/* Timeline Dot Indicator */}
            <div className="absolute -left-4 sm:-left-6 w-5 h-5 rounded-full border-4 border-slate-50 dark:border-navy-950 bg-brand-600 dark:bg-brand-500 shadow-xs flex items-center justify-center" />

            <div className="flex items-center gap-2 flex-wrap">
              <h3 id={`date-heading-${date}`} className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>{formatLessonDate(date, { includeDayOfWeek: true })}</span>
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-navy-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                {dateResources.length} {dateResources.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>

          {/* Resource Cards for this lesson date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {dateResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                showSubjectBadge={showSubjectBadge}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
