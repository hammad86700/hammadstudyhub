// ==============================================================================
// HAMMAD STUDYHUB — RESOURCE DETAIL VIEWER
// Handles Google Drive embeds, YouTube videos, permissions notices, and download actions
// ==============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Video,
  Download,
  ExternalLink,
  Share2,
  Bookmark,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle,
  Copy,
  Info,
  Flag,
  MessageCircle,
  FolderOpen,
} from 'lucide-react';
import { Resource } from '../../types';
import { formatLessonDate, formatRelativeTime, getResourceTypeMeta } from '../../lib/utils';
import { parseGoogleDriveUrl } from '../../lib/googleDrive';
import { isBookmarked, addBookmark, removeBookmark, isChecklistCompleted, toggleChecklistItem } from '../../lib/storage';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Breadcrumb } from '../common/Breadcrumb';
import { ReportModal } from './ReportModal';
import { ContactAdminModal } from '../common/ContactAdminModal';

interface ResourceViewerProps {
  resource: Resource;
  relatedResources?: Resource[];
}

export const ResourceViewer: React.FC<ResourceViewerProps> = ({
  resource,
  relatedResources = [],
}) => {
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(resource.id));
  const [completed, setCompleted] = useState(() => isChecklistCompleted(resource.id));
  const [copied, setCopied] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const meta = getResourceTypeMeta(resource.resource_type);
  const driveInfo =
    resource.source_provider === 'google_drive'
      ? parseGoogleDriveUrl(resource.external_url)
      : null;

  const handleBookmarkToggle = () => {
    if (bookmarked) {
      removeBookmark(resource.id);
      setBookmarked(false);
    } else {
      addBookmark({
        resourceId: resource.id,
        title: resource.title,
        resourceType: resource.resource_type,
        subjectName: resource.subject?.name || 'Subject',
        subjectSlug: resource.subject?.slug || 'general',
        lessonDate: resource.lesson_date,
      });
      setBookmarked(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleChecklistToggle = () => {
    const isNow = toggleChecklistItem(
      resource.id,
      resource.subject?.slug || 'general',
      resource.title
    );
    setCompleted(isNow);
  };

  const directTargetUrl =
    resource.file_data || resource.google_drive_file_url || resource.external_url || '';

  const handleDirectClick = (e: React.MouseEvent) => {
    if (directTargetUrl.startsWith('data:')) {
      e.preventDefault();
      try {
        const arr = directTargetUrl.split(',');
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
        window.open(directTargetUrl, '_blank');
      }
    }
  };

  const breadcrumbs = [
    { label: 'Subjects', href: '/subjects' },
    ...(resource.subject
      ? [{ label: resource.subject.name, href: `/subjects/${resource.subject.slug}` }]
      : []),
    { label: resource.title },
  ];

  return (
    <article className="space-y-6">
      <Breadcrumb items={breadcrumbs} />

      {/* Title & Action Bar */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${meta.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
              <span>{meta.label}</span>
            </span>

            {resource.chapter && (
              <Badge variant="neutral" size="sm">
                {resource.chapter}
              </Badge>
            )}

            {resource.topic && (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                &bull; {resource.topic}
              </span>
            )}

            {resource.file_name && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                📄 {resource.file_name} {resource.file_size && <span className="text-slate-400 font-normal">({resource.file_size})</span>}
              </span>
            )}
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-2">
            <Button
              variant={completed ? 'secondary' : 'outline'}
              size="sm"
              onClick={handleChecklistToggle}
              leftIcon={<CheckCircle className={`w-4 h-4 ${completed ? 'text-emerald-500' : ''}`} />}
            >
              {completed ? 'Revised' : 'Mark as Revised'}
            </Button>

            <Button
              variant={bookmarked ? 'secondary' : 'outline'}
              size="sm"
              onClick={handleBookmarkToggle}
              leftIcon={<Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current text-brand-600' : ''}`} />}
            >
              {bookmarked ? 'Saved' : 'Save'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              leftIcon={copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied Link!' : 'Share'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setContactModalOpen(true)}
              className="text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30"
              leftIcon={<MessageCircle className="w-4 h-4 fill-current text-emerald-600" />}
            >
              Contact Admin
            </Button>

            <button
              onClick={() => setReportModalOpen(true)}
              title="Report broken link or issue"
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {resource.title}
          </h1>
          {resource.description && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
              {resource.description}
            </p>
          )}
        </div>

        {/* Metadata Badges (Lesson Date, Publication Date, Subject) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
            <Calendar className="w-4 h-4 text-brand-500" />
            <span>Lesson Date: {formatLessonDate(resource.lesson_date, { includeDayOfWeek: true })}</span>
          </div>

          {resource.published_at && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Published {formatRelativeTime(resource.published_at)}</span>
            </div>
          )}

          {resource.subject && (
            <div>
              <span>Subject: </span>
              <Link
                to={`/subjects/${resource.subject.slug}`}
                className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                {resource.subject.name} ({resource.subject.code})
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Document / Video Viewer Container */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-card">
        {/* Viewer Top Action Bar */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            {meta.label} Preview
            <span className="text-slate-400 font-normal">
              ({resource.source_provider === 'google_drive' ? 'Google Drive' : resource.source_provider === 'youtube' ? 'YouTube Player' : 'External Host'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {(resource.google_drive_folder_url || resource.subject?.google_drive_folder_url) && (
              <a
                href={resource.google_drive_folder_url || resource.subject?.google_drive_folder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors"
                title="Open Course Google Drive Folder"
              >
                <FolderOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Drive Folder</span>
              </a>
            )}

            {driveInfo?.directDownloadUrl && (
              <a
                href={driveInfo.directDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Direct Download</span>
              </a>
            )}

            <a
              href={directTargetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDirectClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-xs cursor-pointer"
            >
              <span>{resource.resource_type === 'pdf' ? 'Open PDF File' : 'Open in New Tab'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Embed Frame or Media Player */}
        <div className="relative bg-slate-900 min-h-[420px] sm:min-h-[560px] flex items-center justify-center">
          {resource.file_data ? (
            <iframe
              src={resource.file_data}
              title={resource.title}
              className="w-full h-[520px] sm:h-[680px] border-0 bg-white"
            />
          ) : resource.embed_url && !iframeError ? (
            <iframe
              src={resource.embed_url}
              title={resource.title}
              className="w-full h-[520px] sm:h-[680px] border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onError={() => setIframeError(true)}
            />
          ) : (
            <div className="p-8 text-center text-white space-y-4 max-w-md">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-brand-400">
                <FileText className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold">Open Resource Directly</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click below to launch this learning resource in your browser or Google Drive.
              </p>
              <a
                href={directTargetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDirectClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold bg-brand-600 hover:bg-brand-700 text-white text-sm shadow-md cursor-pointer"
              >
                <span>Launch Document / PDF</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Google Drive Permission Advisory Notice */}
        {resource.source_provider === 'google_drive' && (
          <div className="p-4 bg-slate-50 dark:bg-navy-950/80 border-t border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
            <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Google Drive Access Notice:
              </p>
              <p className="mt-0.5">
                Students can view this resource directly in browser. If you encounter an &quot;Access Denied&quot; message from Google, the file owner has not yet enabled public link sharing. Please click <button onClick={() => setReportModalOpen(true)} className="text-brand-600 dark:text-brand-400 font-semibold underline">Report Issue</button> to alert Muhammad Hammad.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tags Section */}
      {resource.tags && resource.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tags:</span>
          {resource.tags.map((t, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        resourceId={resource.id}
        resourceTitle={resource.title}
      />

      {/* Direct Contact Admin Modal */}
      <ContactAdminModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        initialTopic={resource.title}
      />
    </article>
  );
};
