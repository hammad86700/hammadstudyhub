// ==============================================================================
// HAMMAD STUDYHUB — RESOURCE ACCESS & DOWNLOAD ACTIONS
// Empowers students with two distinct, independent options for every study material:
// 1. "Open / View Online": Read & preview directly in the platform/browser without downloading.
// 2. "Download File": Save directly to the student's device with proper filename.
// ==============================================================================

import { Resource } from '../types';
import { getCachedFileData, getResourceFileData, isCorruptedHtmlData } from './fileStorage';

/**
 * Normalizes or extracts the raw data/file URL for a resource
 */
export function getResourceFileUrl(resource: Resource): string {
  if (!resource) return '';

  // 1. Check if external_url is already a valid HTTP link to cloud storage or API
  if (
    resource.external_url &&
    resource.external_url.startsWith('http') &&
    resource.external_url !== '#' &&
    resource.external_url !== 'about:blank'
  ) {
    return resource.external_url;
  }

  // 2. Check if file_data is already a Base64 data URL
  if (resource.file_data && resource.file_data.startsWith('data:')) {
    return resource.file_data;
  }

  // 3. Check memory / IndexedDB local cache
  const cachedData = getCachedFileData(resource.id);
  if (cachedData && cachedData.startsWith('data:')) {
    return cachedData;
  }

  // 4. If resource has an ID or file_name, fallback to the universal serverless streaming API
  if (resource.id && (resource.file_name || resource.source_provider === 'supabase_storage')) {
    return `/api/files?id=${encodeURIComponent(resource.id)}`;
  }

  // 5. Direct relative or absolute URL fallback
  if (
    resource.external_url &&
    resource.external_url !== '#' &&
    resource.external_url !== 'about:blank'
  ) {
    return resource.external_url;
  }

  return '';
}

/**
 * Detects if a filename represents an Office document
 */
export function isOfficeDocument(fileName?: string, mimeType?: string): boolean {
  if (mimeType?.includes('wordprocessingml') || mimeType?.includes('spreadsheetml') || mimeType?.includes('presentationml')) {
    return true;
  }
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext || '');
}

/**
 * Checks if a resource can be viewed directly online in the browser
 */
export function canPreviewDirectly(resource: Resource): boolean {
  if (resource.source_provider === 'youtube' || resource.embed_url) return true;
  const url = getResourceFileUrl(resource);
  if (!url) return false;

  const ext = (resource.file_name || '').split('.').pop()?.toLowerCase();
  if (['pdf', 'png', 'jpg', 'jpeg', 'webp', 'mp4', 'webm', 'svg'].includes(ext || '')) {
    return true;
  }

  if (resource.resource_type === 'pdf' || resource.resource_type === 'whiteboard' || resource.resource_type === 'video') {
    return true;
  }

  return false;
}

/**
 * Generates an appropriate download filename with the correct extension
 */
export function getDownloadFileName(resource: Resource): string {
  if (resource.file_name) return resource.file_name;
  if (resource.original_filename) return resource.original_filename;

  const cleanBase = resource.title
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'study-material';

  let ext = 'pdf';
  if (resource.resource_type === 'presentation') ext = 'pptx';
  else if (resource.resource_type === 'whiteboard') ext = 'png';
  else if (resource.resource_type === 'video') ext = 'mp4';
  else if (resource.mime_type?.includes('word')) ext = 'docx';
  else if (resource.mime_type?.includes('sheet')) ext = 'xlsx';
  else if (resource.mime_type?.includes('zip')) ext = 'zip';

  return `${cleanBase}.${ext}`;
}

/**
 * OPTION 1: Open Resource Online (without downloading to user's disk)
 */
export function openResourceOnline(resource: Resource): void {
  const fileUrl = getResourceFileUrl(resource);
  if (!fileUrl) {
    alert('File data is currently unavailable. Please contact the administrator.');
    return;
  }

  // Handle Base64 Data URL -> Blob URL for smooth native viewing in new tab
  if (fileUrl.startsWith('data:')) {
    if (isCorruptedHtmlData(fileUrl)) {
      if (typeof window !== 'undefined') {
        window.location.href = `/resources/${encodeURIComponent(resource.slug || resource.id)}`;
      }
      return;
    }
    try {
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        const arr = fileUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || resource.mime_type || 'application/pdf';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const newWin = window.open(blobUrl, '_blank');
        if (!newWin && typeof window !== 'undefined') {
          window.location.href = blobUrl;
        }
        return;
      }
      window.open(fileUrl, '_blank');
      return;
    } catch (err) {
      console.warn('Direct blob preview notice, opening data URL:', err);
      window.open(fileUrl, '_blank');
      return;
    }
  }

  // If YouTube embed URL
  if (resource.source_provider === 'youtube' && resource.embed_url) {
    window.open(resource.embed_url, '_blank');
    return;
  }

  // Direct external cloud URL (Supabase Storage CDN, etc.)
  if (fileUrl.startsWith('http') && !fileUrl.includes('/api/files')) {
    window.open(fileUrl, '_blank');
    return;
  }

  // Internal endpoint (/api/files) or app route: navigate within the platform viewer
  if (typeof window !== 'undefined') {
    window.location.href = `/resources/${encodeURIComponent(resource.slug || resource.id)}`;
  }
}

function triggerBlobDownload(dataUrl: string, fileName: string, fallbackMime?: string): boolean {
  if (isCorruptedHtmlData(dataUrl)) return false;
  try {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || fallbackMime || 'application/octet-stream';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
      return true;
    }
  } catch (err) {
    console.error('Blob conversion download error:', err);
  }
  return false;
}

/**
 * OPTION 2: Download Resource Directly to user's device
 */
export async function downloadResourceFile(resource: Resource): Promise<void> {
  const fileUrl = getResourceFileUrl(resource);
  const fileName = getDownloadFileName(resource);

  // 1. Base64 Data URL -> Blob -> Direct Download
  if (fileUrl && fileUrl.startsWith('data:')) {
    if (triggerBlobDownload(fileUrl, fileName, resource.mime_type)) return;
  }

  // 2. Check local persistent IndexedDB
  try {
    const cachedData = await getResourceFileData(resource.id);
    if (cachedData && cachedData.startsWith('data:')) {
      if (triggerBlobDownload(cachedData, fileName, resource.mime_type)) return;
    }
  } catch {}

  // 3. Remote /api/files or Cloud CDN URL: Fetch as binary Blob
  if (fileUrl) {
    try {
      const rawTarget = fileUrl.includes('/api/files')
        ? (fileUrl.includes('?') ? `${fileUrl}&download=true` : `${fileUrl}?download=true`)
        : fileUrl;

      const fetchTarget =
        rawTarget.startsWith('/') && typeof window !== 'undefined' && window.location?.origin
          ? `${window.location.origin}${rawTarget}`
          : rawTarget;

      const res = await fetch(fetchTarget, {
        headers: { Accept: 'application/octet-stream, application/pdf, */*' },
      });

      if (res && res.ok) {
        const contentType = res.headers?.get ? res.headers.get('content-type') || '' : '';
        // Only download if it is a real file payload (not HTML/JSON redirect or error page)
        if (!contentType.includes('text/html') && !contentType.includes('application/json')) {
          const blob = await res.blob();
          if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
            return;
          }
        }
      }
    } catch (fetchErr) {
      console.warn('Direct blob download notice:', fetchErr);
    }
  }

  // 4. Safe Fallback: Navigate to the student viewer where document is loaded & presented
  if (typeof window !== 'undefined' && window.location && window.location.pathname !== `/resources/${resource.id}`) {
    try {
      window.location.href = `/resources/${encodeURIComponent(resource.id)}`;
    } catch {
      // Non-blocking in test envs
    }
  }
}
