// ==============================================================================
// HAMMAD STUDYHUB — EXTERNAL DOCUMENT & DRIVE INTEGRATION
// ==============================================================================

export interface ParsedGoogleDriveResult {
  isValid: boolean;
  fileId?: string;
  folderId?: string;
  isFolder: boolean;
  resourceKind: 'file' | 'folder' | 'document' | 'presentation' | 'spreadsheet' | 'unknown';
  embedUrl?: string;
  directDownloadUrl?: string;
  viewUrl?: string;
  permissionNotice?: string;
  error?: string;
}

export interface ParsedYouTubeResult {
  isValid: boolean;
  videoId?: string;
  embedUrl?: string;
  error?: string;
}

/**
 * Extracts Google Drive ID and constructs preview & download URLs
 */
export function parseGoogleDriveUrl(url: string): ParsedGoogleDriveResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      isFolder: false,
      resourceKind: 'unknown',
      error: 'Please provide a valid URL.',
    };
  }

  const trimmed = url.trim();

  // 1. Google Drive Folder
  const folderMatch = trimmed.match(/\/drive\/folders\/([a-zA-Z0-9_-]+)/i);
  if (folderMatch && folderMatch[1]) {
    const folderId = folderMatch[1];
    return {
      isValid: true,
      folderId,
      isFolder: true,
      resourceKind: 'folder',
      embedUrl: `https://drive.google.com/embeddedfolderview?id=${folderId}#list`,
      viewUrl: `https://drive.google.com/drive/folders/${folderId}`,
      permissionNotice: 'Folder must have "Anyone with the link can view" sharing permission in Google Drive.',
    };
  }

  // 2. Google Docs
  const docMatch = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/i);
  if (docMatch && docMatch[1]) {
    const fileId = docMatch[1];
    return {
      isValid: true,
      fileId,
      isFolder: false,
      resourceKind: 'document',
      embedUrl: `https://docs.google.com/document/d/${fileId}/preview`,
      directDownloadUrl: `https://docs.google.com/document/d/${fileId}/export?format=pdf`,
      viewUrl: `https://docs.google.com/document/d/${fileId}/edit?usp=sharing`,
      permissionNotice: 'Ensure file is set to "Anyone with the link can view".',
    };
  }

  // 3. Google Slides
  const presentationMatch = trimmed.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/i);
  if (presentationMatch && presentationMatch[1]) {
    const fileId = presentationMatch[1];
    return {
      isValid: true,
      fileId,
      isFolder: false,
      resourceKind: 'presentation',
      embedUrl: `https://docs.google.com/presentation/d/${fileId}/embed?start=false&loop=false&delayms=3000`,
      directDownloadUrl: `https://docs.google.com/presentation/d/${fileId}/export/pdf`,
      viewUrl: `https://docs.google.com/presentation/d/${fileId}/edit?usp=sharing`,
      permissionNotice: 'Ensure presentation is set to "Anyone with the link can view".',
    };
  }

  // 4. Google Sheets
  const sheetMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i);
  if (sheetMatch && sheetMatch[1]) {
    const fileId = sheetMatch[1];
    return {
      isValid: true,
      fileId,
      isFolder: false,
      resourceKind: 'spreadsheet',
      embedUrl: `https://docs.google.com/spreadsheets/d/${fileId}/preview`,
      directDownloadUrl: `https://docs.google.com/spreadsheets/d/${fileId}/export?format=pdf`,
      viewUrl: `https://docs.google.com/spreadsheets/d/${fileId}/edit?usp=sharing`,
      permissionNotice: 'Ensure spreadsheet is set to "Anyone with the link can view".',
    };
  }

  // 5. Standard Google Drive File: /file/d/{id} or ?id={id}
  const fileMatch =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/i);

  if (fileMatch && fileMatch[1]) {
    const fileId = fileMatch[1];
    return {
      isValid: true,
      fileId,
      isFolder: false,
      resourceKind: 'file',
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      directDownloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      viewUrl: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
      permissionNotice: 'Make sure the file sharing setting is set to "Anyone with the link can view" in Google Drive.',
    };
  }

  return {
    isValid: false,
    isFolder: false,
    resourceKind: 'unknown',
    error: 'Unrecognized Google Drive link format. Expected drive.google.com/file/d/... or drive.google.com/drive/folders/...',
  };
}

/**
 * Extracts YouTube video ID and constructs clean responsive embed URL
 */
export function parseYouTubeUrl(url: string): ParsedYouTubeResult {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'Please provide a valid YouTube URL.' };
  }

  const trimmed = url.trim();

  // Matches: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = trimmed.match(regExp);

  if (match && match[2] && match[2].length === 11) {
    const videoId = match[2];
    return {
      isValid: true,
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
    };
  }

  return {
    isValid: false,
    error: 'Invalid YouTube link. Expected format https://youtube.com/watch?v=... or https://youtu.be/...',
  };
}

/**
 * Automatically detects provider based on URL format
 */
export function detectSourceProvider(url: string): 'google_drive' | 'youtube' | 'direct_url' {
  if (!url) return 'direct_url';
  const lower = url.toLowerCase();
  if (lower.includes('drive.google.com') || lower.includes('docs.google.com')) {
    return 'google_drive';
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return 'youtube';
  }
  return 'direct_url';
}

/**
 * Resolves safe embed URL given an external resource URL and provider
 */
export function resolveEmbedUrl(url: string, provider?: 'google_drive' | 'youtube' | 'direct_url' | 'supabase_storage'): string | null {
  if (!url) return null;
  const resolvedProvider = provider || detectSourceProvider(url);

  if (resolvedProvider === 'google_drive') {
    const parsed = parseGoogleDriveUrl(url);
    return parsed.isValid && parsed.embedUrl ? parsed.embedUrl : null;
  }

  if (resolvedProvider === 'youtube') {
    const parsed = parseYouTubeUrl(url);
    return parsed.isValid && parsed.embedUrl ? parsed.embedUrl : null;
  }

  // If already an embeddable direct PDF or image or HTTPS URL
  return url;
}
