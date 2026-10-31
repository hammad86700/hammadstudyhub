// ==============================================================================
// HAMMAD STUDYHUB — OFFICIAL GOOGLE DRIVE API CLIENT SERVICE
// Architect: Muhammad Hammad
//
// Features:
// 1. Direct upload into the subject's designated Google Drive folder.
// 2. Dual-mode authorization:
//    - Preferred: Server-side secure endpoint (/api/upload-to-drive) using Service Account
//    - Alternative: Google Identity Services (GIS) / OAuth 2.0 Token Client (drive.file scope)
// 3. Strict validation: Never uploads to root My Drive when a subject folder is configured.
// 4. Zero fake uploads: Returns real file IDs and webViewLinks or reports clear config needs.
// ==============================================================================

export interface DriveUploadResult {
  success: boolean;
  fileId: string;
  fileUrl: string;
  webViewLink: string;
  webContentLink?: string;
  fileName: string;
  mimeType: string;
  fileSize: string;
  folderId: string;
}

export interface DriveServerStatus {
  status: 'ok' | 'error' | 'idle';
  configured: boolean;
  method: 'service_account' | 'oauth' | 'none';
  serviceAccountEmail?: string;
  projectId?: string;
  error?: string;
  message?: string;
}

const GDRIVE_TOKEN_KEY = 'studyhub_gdrive_access_token';
const GDRIVE_TOKEN_EXP_KEY = 'studyhub_gdrive_access_token_exp';

/**
 * Checks server-side Google Drive configuration status (Service Account or OAuth)
 */
export async function getDriveServerStatus(): Promise<DriveServerStatus> {
  try {
    const res = await fetch('/api/upload-to-drive', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      return (await res.json()) as DriveServerStatus;
    }
    const errData = await res.json().catch(() => null);
    if (errData) return errData;
  } catch {
    // Network or offline
  }
  return {
    status: 'idle',
    configured: false,
    method: 'none',
  };
}

/**
 * Retrieves valid client-side Google OAuth access token if not expired
 */
export function getGoogleDriveClientToken(): string | null {
  try {
    const token = sessionStorage.getItem(GDRIVE_TOKEN_KEY);
    const expStr = sessionStorage.getItem(GDRIVE_TOKEN_EXP_KEY);
    if (!token || !expStr) return null;

    const exp = parseInt(expStr, 10);
    if (Date.now() >= exp) {
      clearGoogleDriveClientToken();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

/**
 * Stores Google OAuth access token with expiration in sessionStorage
 */
export function setGoogleDriveClientToken(token: string, expiresInSeconds = 3600): void {
  try {
    sessionStorage.setItem(GDRIVE_TOKEN_KEY, token);
    const expTime = Date.now() + (expiresInSeconds - 60) * 1000;
    sessionStorage.setItem(GDRIVE_TOKEN_EXP_KEY, String(expTime));
    window.dispatchEvent(new Event('studyhub_gdrive_auth_changed'));
  } catch (e) {
    console.warn('Could not store Google Drive token:', e);
  }
}

/**
 * Clears stored Google Drive OAuth access token
 */
export function clearGoogleDriveClientToken(): void {
  try {
    sessionStorage.removeItem(GDRIVE_TOKEN_KEY);
    sessionStorage.removeItem(GDRIVE_TOKEN_EXP_KEY);
    window.dispatchEvent(new Event('studyhub_gdrive_auth_changed'));
  } catch {
    // Ignore
  }
}

/**
 * Checks whether client has an active Google Drive authorization token
 */
export function isGoogleDriveClientConnected(): boolean {
  return Boolean(getGoogleDriveClientToken());
}

/**
 * Converts File to Base64 Data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Formats file size in readable units (KB or MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Launches official Google Identity Services (GIS) Token Client popup
 * Requests https://www.googleapis.com/auth/drive scope
 */
export async function requestGoogleDriveAuthorization(clientId?: string): Promise<string> {
  const resolvedClientId =
    clientId ||
    localStorage.getItem('studyhub_custom_google_client_id') ||
    (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
    '';

  if (!resolvedClientId) {
    const promptInput = window.prompt(
      'Google OAuth Client ID is not configured in Vercel environment variables yet.\n\nPaste your Google OAuth Client ID from Google Cloud Console (e.g. xxxxx.apps.googleusercontent.com):'
    );
    if (promptInput && promptInput.trim()) {
      const cleanId = promptInput.trim();
      localStorage.setItem('studyhub_custom_google_client_id', cleanId);
      return requestGoogleDriveAuthorization(cleanId);
    }
    throw new Error(
      'Google OAuth Client ID is not configured (VITE_GOOGLE_CLIENT_ID). Please provide a Client ID or configure server-side GOOGLE_SERVICE_ACCOUNT_KEY on Vercel.'
    );
  }

  // Load Google Identity Services script if not already loaded
  if (!(window as any).google?.accounts?.oauth2) {
    await new Promise<void>((resolve, reject) => {
      const existing = document.getElementById('google-gsi-client');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services library.')));
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services library.'));
      document.head.appendChild(script);
    });
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: resolvedClientId,
        scope: 'https://www.googleapis.com/auth/drive',
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error || 'Google Drive authorization denied.'));
            return;
          }
          if (response.access_token) {
            setGoogleDriveClientToken(response.access_token, response.expires_in || 3600);
            resolve(response.access_token);
          } else {
            reject(new Error('No access token returned from Google.'));
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Uploads a file directly into the designated Google Drive subject folder using the official Google Drive API v3
 */
export async function uploadFileToDriveFolder(params: {
  file: File;
  folderId: string;
  onProgress?: (percent: number) => void;
}): Promise<DriveUploadResult> {
  const { file, folderId, onProgress } = params;

  if (!folderId || typeof folderId !== 'string' || folderId.trim() === '') {
    throw new Error(
      'Target subject does not have a valid Google Drive folder ID configured. Please configure the subject folder in Subjects Management first.'
    );
  }

  const cleanFolderId = folderId.trim();
  const formattedSize = formatFileSize(file.size);
  const resolvedMime = file.type || 'application/octet-stream';

  onProgress?.(15);
  const base64Data = await fileToBase64(file);
  onProgress?.(35);

  const clientToken = getGoogleDriveClientToken();

  // 1. Try Serverless API Route (/api/upload-to-drive)
  try {
    const serverResponse = await fetch('/api/upload-to-drive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: cleanFolderId,
        fileName: file.name,
        fileData: base64Data,
        mimeType: resolvedMime,
        clientAccessToken: clientToken || undefined,
      }),
    });

    const result = await serverResponse.json().catch(() => null);

    if (serverResponse.ok && result?.success && result?.fileId) {
      onProgress?.(100);
      return {
        success: true,
        fileId: result.fileId,
        fileUrl: result.webViewLink,
        webViewLink: result.webViewLink,
        webContentLink: result.webContentLink,
        fileName: file.name,
        mimeType: resolvedMime,
        fileSize: formattedSize,
        folderId: cleanFolderId,
      };
    }

    // Extract exact diagnostic error message from server
    if (result?.message || result?.error) {
      const errText = result.message || result.error;
      // If we don't have a client OAuth fallback, immediately throw the server error
      if (!clientToken) {
        throw new Error(errText);
      }
    } else if (serverResponse.status === 413) {
      throw new Error(
        `File "${file.name}" exceeds the serverless upload limit. Please use files under 4.5MB or compress the file.`
      );
    } else if (serverResponse.status === 503 && !clientToken) {
      throw new Error(
        'Google Drive API credentials are not configured on the server. Please configure GOOGLE_SERVICE_ACCOUNT_KEY in Vercel environment variables.'
      );
    } else if (!clientToken) {
      throw new Error(`Google Drive upload failed (Server status ${serverResponse.status}).`);
    }
  } catch (serverErr: any) {
    if (!clientToken) {
      throw serverErr;
    }
    // If client token is available, proceed to fallback client upload
    console.warn('Server upload attempt notice, falling back to client OAuth:', serverErr);
  }

  // 2. Client-side Google Drive v3 REST API direct upload (fallback if client token exists)
  if (clientToken) {
    onProgress?.(55);

    const boundary = '-------StudyHubClientBoundary' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: file.name,
      parents: [cleanFolderId], // Uploads strictly to subject folder
    };

    const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    // Build multipart body
    const multipartBody =
      `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n--${boundary}\r\n` +
      `Content-Type: ${resolvedMime}\r\n` +
      `Content-Transfer-Encoding: base64\r\n\r\n` +
      rawBase64 +
      closeDelimiter;

    const directUploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,size,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    const directResult = await directUploadRes.json();
    if (!directUploadRes.ok || !directResult.id) {
      if (directUploadRes.status === 401) {
        clearGoogleDriveClientToken();
        throw new Error('Google Drive authorization has expired. Please re-authorize by clicking "Authorize Drive".');
      }
      throw new Error(directResult.error?.message || 'Google Drive API upload failed.');
    }

    const fileId = directResult.id;
    onProgress?.(85);

    // Set permission to reader (anyone with link)
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      });
    } catch {
      // Non-fatal if folder already has inheritance
    }

    onProgress?.(100);
    const webViewLink =
      directResult.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    const webContentLink =
      directResult.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`;

    return {
      success: true,
      fileId,
      fileUrl: webViewLink,
      webViewLink,
      webContentLink,
      fileName: file.name,
      mimeType: resolvedMime,
      fileSize: formattedSize,
      folderId: cleanFolderId,
    };
  }

  throw new Error(
    'Google Drive authorization required. Please configure GOOGLE_SERVICE_ACCOUNT_KEY on Vercel or authorize via Google Account.'
  );
}
