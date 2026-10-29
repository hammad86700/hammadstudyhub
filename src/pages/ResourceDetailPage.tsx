// ==============================================================================
// HAMMAD STUDYHUB — RESOURCE DETAIL & VIEWER PAGE
// ==============================================================================

import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useResource, useResources } from '../hooks/useResources';
import { ResourceViewer } from '../components/resource/ResourceViewer';
import { ResourceCard } from '../components/resource/ResourceCard';
import { SEOHead } from '../components/common/SEOHead';
import { EmptyState } from '../components/common/EmptyState';
import { addRecentlyViewed } from '../lib/storage';

export const ResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: resource, isLoading } = useResource(id || '');

  // Fetch related resources in same subject
  const { data: subjectResources } = useResources(resource?.subject_id, undefined, {
    includeDrafts: false,
  });

  const related = (subjectResources || [])
    .filter((r) => r.id !== resource?.id)
    .slice(0, 3);

  // Record visit in local browser history
  useEffect(() => {
    if (resource) {
      addRecentlyViewed({
        resourceId: resource.id,
        title: resource.title,
        resourceType: resource.resource_type,
        subjectName: resource.subject?.name || 'Subject',
        subjectSlug: resource.subject?.slug || 'general',
        lessonDate: resource.lesson_date,
      });
    }
  }, [resource]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        <div className="h-[480px] bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EmptyState
          title="Resource Not Found"
          description="The study resource you requested does not exist or may have been unlisted."
          actionLabel="Return to Subjects"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <SEOHead
        title={resource.title}
        description={resource.description || `Study material for ${resource.subject?.name || 'Class'}.`}
      />

      {/* Main Resource Viewer */}
      <ResourceViewer resource={resource} relatedResources={related} />

      {/* Related Subject Resources */}
      {related.length > 0 && (
        <section className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                More Resources from {resource.subject?.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Other lesson notes, whiteboard diagrams, and past papers in this course.
              </p>
            </div>
            {resource.subject && (
              <Link
                to={`/subjects/${resource.subject.slug}`}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                View full course timeline
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
