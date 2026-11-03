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
  Eye,
  Archive,
  Presentation,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  BookOpen,
  Monitor,
} from 'lucide-react';
import { Resource } from '../../types';
import { formatLessonDate, formatRelativeTime, getResourceTypeMeta } from '../../lib/utils';
import { isBookmarked, addBookmark, removeBookmark, isChecklistCompleted, toggleChecklistItem } from '../../lib/storage';
import { getResourceFileData, saveResourceFileData, isCorruptedHtmlData } from '../../lib/fileStorage';
import {
  openResourceOnline,
  downloadResourceFile,
  getResourceFileUrl,
  isOfficeDocument,
} from '../../lib/resourceActions';
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
  const hasDirectCloudUrl = Boolean(
    resource.external_url &&
    resource.external_url.startsWith('http') &&
    !resource.external_url.includes('/api/files') &&
    resource.external_url !== '#' &&
    resource.external_url !== 'about:blank'
  );
  const initialCleanData = resource.file_data && !isCorruptedHtmlData(resource.file_data) ? resource.file_data : null;
  const [activeFileData, setActiveFileData] = useState<string | null>(initialCleanData);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(
    !initialCleanData && !hasDirectCloudUrl && Boolean(resource.file_name || resource.id)
  );
  const [viewerMode, setViewerMode] = useState<'reader' | 'stream'>('reader');
  const [isFullscreen, setIsFullscreen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    if (resource.file_data && !isCorruptedHtmlData(resource.file_data)) {
      setActiveFileData(resource.file_data);
      setIsLoadingFile(false);
      return;
    }

    // If we already have a direct public cloud URL, don't block the screen
    if (hasDirectCloudUrl) {
      setIsLoadingFile(false);
    }

    // Safety timeout: Never let the document preview stay stuck loading longer than 3.5s
    const safetyTimeout = setTimeout(() => {
      if (isMounted) setIsLoadingFile(false);
    }, 3500);

    // Attempt to load cached offline copy from IndexedDB
    getResourceFileData(resource.id).then((cached) => {
      if (!isMounted) return;
      if (cached && !isCorruptedHtmlData(cached)) {
        setActiveFileData(cached);
        setIsLoadingFile(false);
        clearTimeout(safetyTimeout);
        return;
      }

      // If not in IndexedDB and no direct cloud URL, fetch from /api/files with abort signal
      if (resource.id && !hasDirectCloudUrl) {
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 3000);

        fetch(`/api/files?id=${encodeURIComponent(resource.id)}`, { signal: controller.signal })
          .then((res) => {
            clearTimeout(fetchTimeout);
            clearTimeout(safetyTimeout);
            if (!isMounted) return;
            if (res.ok) {
              const contentType = res.headers.get('content-type') || '';
              if (contentType.includes('application/json') || contentType.includes('text/html')) {
                setIsLoadingFile(false);
                return;
              }
              return res.blob().then((blob) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (isMounted && typeof reader.result === 'string') {
                    if (!isCorruptedHtmlData(reader.result)) {
                      setActiveFileData(reader.result);
                      saveResourceFileData(resource.id, reader.result, {
                        file_name: resource.file_name,
                        mime_type: resource.mime_type,
                        file_size: resource.file_size,
                      }).catch(() => {});
                    }
                  }
                  if (isMounted) setIsLoadingFile(false);
                };
                reader.readAsDataURL(blob);
              });
            } else {
              setIsLoadingFile(false);
            }
          })
          .catch(() => {
            if (isMounted) setIsLoadingFile(false);
          });
      } else {
        setIsLoadingFile(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, [resource.id, resource.file_data, hasDirectCloudUrl]);

  const meta = getResourceTypeMeta(resource.resource_type);

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

  const directTargetUrl = getResourceFileUrl(resource);

  const handleOpenOnlineClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onlineReaderUrl) {
      window.open(onlineReaderUrl, '_blank');
    } else {
      openResourceOnline(resource);
    }
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    downloadResourceFile(resource);
  };

  const isImageFile =
    resource.resource_type === 'whiteboard' ||
    resource.mime_type?.startsWith('image/') ||
    Boolean(resource.file_name?.match(/\.(jpg|jpeg|png|webp|svg)$/i));

  const isOfficeFile = isOfficeDocument(resource.file_name, resource.mime_type);
  const isZipFile = resource.mime_type?.includes('zip') || Boolean(resource.file_name?.match(/\.(zip|rar|7z|tar|gz)$/i));
  const isPdf = resource.resource_type === 'pdf' || Boolean(resource.file_name?.match(/\.pdf$/i));
  const isPresentation = resource.resource_type === 'presentation' || Boolean(resource.file_name?.match(/\.(ppt|pptx)$/i));
  const isDocument = isPdf || isOfficeFile || isPresentation;

  const isCdnUrl = Boolean(
    directTargetUrl &&
    directTargetUrl.startsWith('http') &&
    !directTargetUrl.includes('/api/files')
  );

  // Online reader URL: renders page-by-page directly on screen on all devices (mobile + desktop) without downloading
  const onlineReaderUrl = isCdnUrl && isDocument
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(directTargetUrl)}&embedded=true`
    : null;

  const activeViewerSrc = viewerMode === 'reader' && onlineReaderUrl
    ? onlineReaderUrl
    : (activeFileData || directTargetUrl || '');

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
      <div
        className={
          isFullscreen
            ? 'fixed inset-0 z-50 bg-slate-950 p-2 sm:p-4 flex flex-col'
            : 'bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-card'
        }
      >
        {/* Viewer Top Action Bar */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            {meta.label} Preview
            {onlineReaderUrl ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <BookOpen className="w-3 h-3" /> Direct In-App Reader
              </span>
            ) : (
              <span className="text-slate-400 font-normal">
                ({resource.file_data ? 'System Cloud Storage' : resource.source_provider === 'youtube' ? 'YouTube Player' : 'Direct Host'})
              </span>
            )}
          </div>

          {/* Student Controls: Reader Switcher, Fullscreen, Open in Tab, Download */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Mode Switcher (if online reader URL available) */}
            {onlineReaderUrl && (
              <div className="inline-flex items-center rounded-lg bg-slate-200/80 dark:bg-slate-800 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setViewerMode('reader')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    viewerMode === 'reader'
                      ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Interactive Page Reader (view online directly without download)"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Reader</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewerMode('stream')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    viewerMode === 'stream'
                      ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Direct native file stream"
                >
                  <Monitor className="w-3 h-3" />
                  <span>Stream</span>
                </button>
              </div>
            )}

            {/* Fullscreen Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              )}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
            </button>

            {/* OPTION 1: View Online (Dedicated Tab) */}
            <button
              type="button"
              onClick={handleOpenOnlineClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Open reader in a full new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-brand-500" />
              <span>New Tab</span>
            </button>

            {/* OPTION 2: Download File */}
            <button
              type="button"
              onClick={handleDownloadClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-xs cursor-pointer"
              title="Download file directly to your computer or phone"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Embed Frame or Media Player */}
        <div
          className={`relative bg-slate-900 flex items-center justify-center p-2 sm:p-3 ${
            isFullscreen ? 'flex-1 h-full' : 'min-h-[440px] sm:min-h-[640px]'
          }`}
        >
          {/* Image files */}
          {isImageFile && (activeFileData || (directTargetUrl && !directTargetUrl.includes('/api/files') && directTargetUrl !== '#')) ? (
            <div className="flex flex-col items-center justify-center max-w-full">
              <img
                src={activeFileData || directTargetUrl}
                alt={resource.title}
                className="max-w-full max-h-[85vh] rounded-lg shadow-md object-contain bg-slate-950"
              />
            </div>
          ) : isZipFile ? (
            /* Compressed ZIP packages */
            <div className="p-8 text-center text-white space-y-5 max-w-lg">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-lg">
                <Archive className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-100">
                  {resource.file_name || resource.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Compressed Archive Package {resource.file_size && `• ${resource.file_size}`}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Archive</span>
                </button>
              </div>
            </div>
          ) : isLoadingFile ? (
            /* Document Loading Indicator */
            <div className="p-12 text-center text-white space-y-4">
              <div className="w-10 h-10 mx-auto rounded-full border-3 border-brand-500 border-t-transparent animate-spin" />
              <p className="text-sm font-medium text-slate-300">Loading learning document...</p>
              <p className="text-xs text-slate-500">Preparing preview for your device</p>
            </div>
          ) : activeViewerSrc && activeViewerSrc !== '#' && !activeViewerSrc.startsWith('about:') && !activeViewerSrc.includes('/api/files') ? (
            /* PDF & Office documents in interactive reader or stream */
            <iframe
              src={activeViewerSrc}
              title={resource.title}
              className={`w-full border-0 bg-white rounded-lg shadow-sm ${
                isFullscreen ? 'h-full flex-1' : 'h-[540px] sm:h-[720px]'
              }`}
            />
          ) : resource.embed_url && !iframeError ? (
            /* YouTube or Remote Video/Doc */
            <iframe
              src={resource.embed_url}
              title={resource.title}
              className={`w-full border-0 rounded-lg ${
                isFullscreen ? 'h-full flex-1' : 'h-[540px] sm:h-[700px]'
              }`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onError={() => setIframeError(true)}
            />
          ) : (
            /* Fallback Launch block */
            <div className="p-8 text-center text-white space-y-4 max-w-md">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-brand-400">
                <FileText className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold">Study Material Syncing</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                This learning material is being processed from cloud storage. You can retry downloading, or message Muhammad Hammad directly on WhatsApp to get this PDF immediately.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer shadow-md transition-colors"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Request on WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold bg-brand-600 hover:bg-brand-700 text-white text-xs shadow-md cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Retry Download</span>
                </button>
              </div>
            </div>
          )}
        </div>
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
