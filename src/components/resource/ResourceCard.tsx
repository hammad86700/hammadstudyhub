// ==============================================================================
// HAMMAD STUDYHUB — RESOURCE CARD COMPONENT
// ==============================================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Lock,
  Eye,
  Download,
} from 'lucide-react';
import { Resource } from '../../types';
import { formatLessonDate, getResourceTypeMeta } from '../../lib/utils';
import { isBookmarked, addBookmark, removeBookmark, isChecklistCompleted, toggleChecklistItem } from '../../lib/storage';
import { openResourceOnline, downloadResourceFile, getResourceFileUrl } from '../../lib/resourceActions';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../common/Card';

interface ResourceCardProps {
  resource: Resource;
  showSubjectBadge?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  showSubjectBadge = false,
}) => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
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
    if (!isLoggedIn) {
      navigate('/signup');
      return;
    }
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
    if (!isLoggedIn) {
      navigate('/signup');
      return;
    }
    const isNow = toggleChecklistItem(
      resource.id,
      resource.subject?.slug || 'general',
      resource.title
    );
    setCompleted(isNow);
  };

  const directUrl = getResourceFileUrl(resource);

  const handleOpenOnlineClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate('/signup');
      return;
    }
    openResourceOnline(resource);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate('/signup');
      return;
    }
    downloadResourceFile(resource);
  };

  const getActionLabel = () => {
    switch (resource.resource_type) {
      case 'pdf':
        return 'View PDF';
      case 'presentation':
        return 'View Slides';
      case 'video':
        return 'Watch Video';
      case 'past_paper':
        return 'View Paper';
      case 'assignment':
        return 'View Assignment';
      default:
        return 'View Online';
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
                href={isLoggedIn ? directUrl : '/signup'}
                target={isLoggedIn ? '_blank' : '_self'}
                rel="noopener noreferrer"
                onClick={handleOpenOnlineClick}
                className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors focus:outline-none inline-flex items-center gap-1.5 group cursor-pointer"
                title={isLoggedIn ? 'Read or open study material directly without downloading' : 'Sign up to access this study material'}
              >
                <span>{resource.title}</span>
                {isLoggedIn ? (
                  <Eye className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                )}
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

          {/* Attached File Badge (if uploaded from system) */}
          {resource.file_name && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 min-w-0">
              <span className="truncate max-w-[170px] sm:max-w-[220px]">📄 {resource.file_name}</span>
              {resource.file_size && <span className="opacity-75 shrink-0">({resource.file_size})</span>}
            </div>
          )}

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

      {/* Footer Actions: Lesson Date & 2 Student Options (View Online vs Download) */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50/70 dark:bg-navy-950/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs gap-1.5 sm:gap-2 flex-wrap min-w-0">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium shrink-0">
          <Calendar className="w-3.5 h-3.5 text-brand-500" />
          <span>{formatLessonDate(resource.lesson_date, { format: 'short' })}</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* OPTION 1: Open / View Directly (without download) */}
          <button
            type="button"
            onClick={handleOpenOnlineClick}
            className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              isLoggedIn
                ? 'text-brand-700 dark:text-brand-300 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800'
                : 'text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
            title={isLoggedIn ? 'Read & preview this material directly without downloading' : 'Sign up to read online'}
          >
            {isLoggedIn ? <Eye className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3 text-brand-500" />}
            <span>{isLoggedIn ? getActionLabel() : 'View'}</span>
          </button>

          {/* OPTION 2: Download File directly to device */}
          <button
            type="button"
            onClick={handleDownloadClick}
            className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-colors shadow-2xs cursor-pointer shrink-0 ${
              isLoggedIn
                ? 'text-white bg-brand-600 hover:bg-brand-700'
                : 'text-brand-700 dark:text-brand-300 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800'
            }`}
            title={isLoggedIn ? 'Download file directly to your device' : 'Sign up to download file'}
          >
            {isLoggedIn ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3 text-brand-500" />}
            <span>Download</span>
          </button>

          {/* Full Viewer Link */}
          <Link
            to={`/resources/${resource.slug || resource.id}`}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-xs shrink-0"
            title="Open in Full Study Viewer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
};
