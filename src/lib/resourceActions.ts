// ==============================================================================
// HAMMAD STUDYHUB — RESOURCE ACCESS & DOWNLOAD ACTIONS
// Empowers students with two distinct, independent options for every study material:
// 1. "Open / View Online": Read & preview directly in the platform/browser without downloading.
// 2. "Download File": Save directly to the student's device with proper filename.
// ==============================================================================

import { Resource } from '../types';
import { getCachedFileData } from './fileStorage';

/**
 * Normalizes or extracts the raw data/file URL for a resource
 */
export function getResourceFileUrl(resource: Resource): string {
  // Check memory / IndexedDB cache first
  const cachedData = getCachedFileData(resource.id);
  if (cachedData) return cachedData;

  return (
    resource.file_data ||
    resource.google_drive_file_url ||
    resource.external_url ||
    ''
  );
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

  // Handle Base64 Data URL
  if (fileUrl.startsWith('data:')) {
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

  // If YouTube or Google Drive embed URL
  if (resource.embed_url) {
    window.open(resource.embed_url, '_blank');
    return;
  }

  // Direct web URL
  window.open(fileUrl, '_blank');
}

/**
 * OPTION 2: Download Resource Directly to user's device
 */
export function downloadResourceFile(resource: Resource): void {
  const fileUrl = getResourceFileUrl(resource);
  if (!fileUrl) {
    alert('File download is currently unavailable. Please contact the administrator.');
    return;
  }

  const fileName = getDownloadFileName(resource);

  // 1. Base64 Data URL -> Blob -> Direct Download
  if (fileUrl.startsWith('data:')) {
    try {
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        const arr = fileUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || resource.mime_type || 'application/octet-stream';
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

        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
        return;
      }

      // Fallback if URL.createObjectURL is unavailable
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    } catch (err) {
      console.error('Data URL download error:', err);
    }
  }

  // 2. Google Drive Link: Use direct download endpoint if possible
  if (fileUrl.includes('drive.google.com')) {
    const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || fileUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      const directDl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
      const link = document.createElement('a');
      link.href = directDl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
  }

  // 3. Regular external URL: trigger download link
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
