// ==============================================================================
// HAMMAD STUDYHUB — RESOURCE CARD COMPONENT
// ==============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Video,
  Image as ImageIcon,
  ClipboardCheck,
  Presentation,
  GraduationCap,
  Bookmark,
  Calendar,
  ExternalLink,
  CheckCircle,
  Tag,
} from 'lucide-react';
import { Resource } from '../../types';
import { formatLessonDate, getResourceTypeMeta } from '../../lib/utils';
import { isBookmarked, addBookmark, removeBookmark, isChecklistCompleted, toggleChecklistItem } from '../../lib/storage';
import { Card } from '../common/Card';

interface ResourceCardProps {
  resource: Resource;
  showSubjectBadge?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  showSubjectBadge = false,
}) => {
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(resource.id));
  const [completed, setCompleted] = useState(() => isChecklistCompleted(resource.id));

  const meta = getResourceTypeMeta(resource.resource_type);

  const getTypeIcon = () => {
    switch (resource.resource_type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'video':
        return <Video className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'whiteboard':
        return <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'assignment':
        return <ClipboardCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'presentation':
        return <Presentation className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'past_paper':
        return <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarked) {
      removeBookmark(resource.id);
      setBookmarked(false);
    } else {
      addBookmark({
        resourceId: resource.id,
        title: resource.title,
        resourceType: resource.resource_type,
        subjectName: resource.subject?.name || 'General Subject',
        subjectSlug: resource.subject?.slug || 'general',
        lessonDate: resource.lesson_date,
      });
      setBookmarked(true);
    }
  };

  const handleChecklistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isNow = toggleChecklistItem(
      resource.id,
      resource.subject?.slug || 'general',
      resource.title
    );
    setCompleted(isNow);
  };

  const directUrl =
    resource.google_drive_file_url || resource.external_url || resource.file_data || '';

  const handleDirectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (directUrl.startsWith('data:')) {
      e.preventDefault();
      try {
        const arr = directUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } catch {
        window.open(directUrl, '_blank');
      }
    }
  };

  const getActionLabel = () => {
    switch (resource.resource_type) {
      case 'pdf':
        return 'Open PDF File';
      case 'presentation':
        return 'Open Slides';
      case 'video':
        return 'Watch Video';
      case 'past_paper':
        return 'Open Past Paper';
      case 'assignment':
        return 'Open Assignment';
      default:
        return 'Open Material';
    }
  };

  return (
    <Card hover className="overflow-hidden flex flex-col justify-between">
      <div className="p-4 sm:p-5 space-y-3">
        {/* Top Meta Header: Type Badge, Subject Name, Bookmark Toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.badgeClass}`}
            >
              {getTypeIcon()}
              <span>{meta.shortLabel}</span>
            </span>

            {showSubjectBadge && resource.subject && (
              <Link
                to={`/subjects/${resource.subject.slug}`}
                className="text-[11px] font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors truncate max-w-[150px]"
              >
                {resource.subject.name}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Revision Checklist Tracker */}
            <button
              onClick={handleChecklistToggle}
              title={completed ? 'Marked as revised' : 'Mark as revised'}
              className={`p-1.5 rounded-md transition-colors ${
                completed
                  ? 'text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
            </button>

            {/* Bookmark Button */}
            <button
              onClick={handleBookmarkToggle}
              title={bookmarked ? 'Remove bookmark' : 'Bookmark this resource'}
              className={`p-1.5 rounded-md transition-colors ${
                bookmarked
                  ? 'text-brand-600 bg-brand-50 dark:bg-brand-950/50'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Resource Title & Direct Open Link */}
        <div>
          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
            {directUrl ? (
              <a
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDirectClick}
                className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors focus:outline-none inline-flex items-center gap-1.5 group cursor-pointer"
                title="Directly open study material in new tab"
              >
                <span>{resource.title}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
              </a>
            ) : (
              <Link
                to={`/resources/${resource.slug || resource.id}`}
                className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors focus:outline-none"
              >
                {resource.title}
              </Link>
            )}
          </h4>
          {resource.description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {resource.description}
            </p>
          )}
        </div>

        {/* Topic & Chapter Pills */}
        {(resource.topic || resource.chapter) && (
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
            {resource.chapter && (
              <span className="bg-slate-100 dark:bg-navy-950 px-2 py-0.5 rounded font-medium border border-slate-200 dark:border-slate-800">
                {resource.chapter}
              </span>
            )}
            {resource.topic && (
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {resource.topic}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-1">
            {resource.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0.5 rounded"
              >
                <Tag className="w-2.5 h-2.5" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info: Lesson Date & Direct Open Action */}
      <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-navy-950/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
          <Calendar className="w-3.5 h-3.5 text-brand-500" />
          <span>{formatLessonDate(resource.lesson_date, { format: 'short' })}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/resources/${resource.slug || resource.id}`}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-medium"
          >
            Viewer
          </Link>

          {directUrl && (
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDirectClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-xs cursor-pointer"
              title="Directly open PDF / Material in new tab"
            >
              <span>{getActionLabel()}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
};
