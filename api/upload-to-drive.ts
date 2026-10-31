// ==============================================================================
// HAMMAD STUDYHUB — SECURE GOOGLE DRIVE SERVERLESS UPLOAD ENDPOINT
// Runtime: Vercel Node.js Serverless Function
// Architect: Muhammad Hammad
//
// Security Requirements:
// 1. Google OAuth / Service Account credentials are kept strictly on the server.
// 2. Never exposed to browser or client code.
// 3. Uploads directly into the subject's Google Drive folder using folderId as parents.
// 4. Sets public read permissions so students can view PDFs and materials directly.
// 5. Returns diagnostic status on GET for frontend status detection.
// ==============================================================================

import crypto from 'crypto';

interface VercelRequestLike {
  method?: string;
  url?: string;
  body?: any;
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
}

interface VercelResponseLike {
  status: (code: number) => VercelResponseLike;
  json: (data: any) => void;
  send: (data: any) => void;
  end: () => void;
  setHeader: (name: string, value: string) => void;
}

export interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  project_id?: string;
}

/**
 * Robustly parses Google Service Account JSON from raw string, wrapped string,
 * or base64-encoded string, and normalizes RSA private key line breaks.
 */
export function parseServiceAccountKey(raw: string): ServiceAccountKey {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Service account key environment variable is empty or undefined.');
  }

  let cleaned = raw.trim();

  // Strip wrapping single or double quotes
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Handle double-escaped JSON quotes
  if (cleaned.startsWith('{\\"') || cleaned.includes('\\"type\\"')) {
    cleaned = cleaned.replace(/\\"/g, '"');
  }

  let parsed: any;
  if (cleaned.startsWith('{')) {
    try {
      parsed = JSON.parse(cleaned);
    } catch (jsonErr: any) {
      throw new Error(`Invalid Service Account JSON syntax: ${jsonErr.message}`);
    }
  } else {
    // Attempt base64 decoding
    try {
      const decoded = Buffer.from(cleaned, 'base64').toString('utf8');
      parsed = JSON.parse(decoded);
    } catch {
      try {
        parsed = JSON.parse(cleaned);
      } catch (finalErr: any) {
        throw new Error(`Unable to parse Service Account JSON key: ${finalErr.message}`);
      }
    }
  }

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('Service Account JSON is missing "client_email" or "private_key" fields.');
  }

  // Format RSA private key: replace escaped \n with actual newlines
  let privateKey = String(parsed.private_key)
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .trim();

  // Ensure PEM begins with BEGIN and ends with END
  if (!privateKey.includes('-----BEGIN') || !privateKey.includes('-----END')) {
    throw new Error('Service Account private key is not in valid PEM format.');
  }

  return {
    client_email: String(parsed.client_email).trim(),
    private_key: privateKey,
    project_id: parsed.project_id,
  };
}

/**
 * Generates an OAuth2 access token from a Google Service Account JSON key
 */
async function getServiceAccountAccessToken(saKey: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: saKey.client_email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const base64UrlEncode = (str: string) => Buffer.from(str).toString('base64url');
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(saKey.private_key, 'base64url');
  const jwt = `${signatureInput}.${signature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(
      tokenData.error_description || tokenData.error || 'Failed to exchange Google service account JWT for access token.'
    );
  }

  return tokenData.access_token;
}

/**
 * Exchanges a Google OAuth refresh token for a fresh access token
 */
async function getOAuthAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(
      tokenData.error_description || tokenData.error || 'Failed to refresh Google OAuth access token.'
    );
  }

  return tokenData.access_token;
}

export default async function handler(req: VercelRequestLike, res: VercelResponseLike) {
  // CORS Headers for API calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET Request: Status & Diagnostic Check
  if (req.method === 'GET') {
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        const saKey = parseServiceAccountKey(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        return res.status(200).json({
          status: 'ok',
          configured: true,
          method: 'service_account',
          serviceAccountEmail: saKey.client_email,
          projectId: saKey.project_id,
        });
      } catch (e: any) {
        return res.status(200).json({
          status: 'error',
          configured: false,
          method: 'service_account',
          error: `Service Account JSON configuration issue: ${e.message}`,
        });
      }
    }

    if (
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
    ) {
      return res.status(200).json({
        status: 'ok',
        configured: true,
        method: 'oauth',
      });
    }

    return res.status(200).json({
      status: 'idle',
      configured: false,
      method: 'none',
      message: 'No Google Drive server credentials configured. Please set GOOGLE_SERVICE_ACCOUNT_KEY.',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { folderId, fileName, fileData, mimeType, clientAccessToken } = req.body || {};

    if (!folderId || typeof folderId !== 'string' || folderId.trim() === '') {
      return res.status(400).json({
        error: 'INVALID_FOLDER_ID',
        message: 'Google Drive folder ID is required. Please select a subject with a valid folder.',
      });
    }

    if (!fileName || !fileData) {
      return res.status(400).json({
        error: 'MISSING_FILE_DATA',
        message: 'File name and file content are required for upload.',
      });
    }

    // Determine access token using Server Credentials or Client OAuth token
    let accessToken: string | null = null;
    let serviceAccountEmail: string | null = null;

    if (clientAccessToken && typeof clientAccessToken === 'string' && clientAccessToken.startsWith('ya29.')) {
      // User authenticated via client-side Google OAuth popup
      accessToken = clientAccessToken;
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      // Server-side Service Account Key JSON
      try {
        const saKey = parseServiceAccountKey(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        serviceAccountEmail = saKey.client_email;
        accessToken = await getServiceAccountAccessToken(saKey);
      } catch (saErr: any) {
        console.error('Service Account token error:', saErr);
        return res.status(500).json({
          error: 'SERVICE_ACCOUNT_AUTH_FAILED',
          message: `Google Service Account authentication failed: ${saErr?.message || saErr}`,
        });
      }
    } else if (
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
    ) {
      // Server-side OAuth 2.0 Refresh Token
      try {
        accessToken = await getOAuthAccessToken(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REFRESH_TOKEN
        );
      } catch (oauthErr: any) {
        console.error('OAuth refresh error:', oauthErr);
        return res.status(500).json({
          error: 'OAUTH_REFRESH_FAILED',
          message: `Google OAuth token refresh failed: ${oauthErr?.message || oauthErr}`,
        });
      }
    }

    // If neither server-side credentials nor valid client token is available:
    if (!accessToken) {
      return res.status(503).json({
        error: 'GOOGLE_DRIVE_NOT_CONFIGURED',
        message:
          'Google Drive API credentials are not configured on the server. Please configure GOOGLE_SERVICE_ACCOUNT_KEY in Vercel environment variables.',
      });
    }

    // Extract raw base64 data and decode to binary buffer
    const base64Content = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const binaryBuffer = Buffer.from(base64Content, 'base64');
    const resolvedMime = mimeType || 'application/octet-stream';

    // Construct Multipart Request Body for Google Drive REST API v3
    // Part 1: JSON metadata
    // Part 2: Raw binary file bytes (NOT base64 encoded text!)
    const boundary = '-------StudyHubGoogleDriveBoundary' + Date.now();
    const metadata = {
      name: fileName,
      parents: [folderId.trim()], // Ensures upload strictly to subject folder
    };

    const part1 = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n--${boundary}\r\n` +
      `Content-Type: ${resolvedMime}\r\n\r\n`
    );
    const part2 = binaryBuffer;
    const part3 = Buffer.from(`\r\n--${boundary}--`);
    const multipartRequestBody = Buffer.concat([part1, part2, part3]);

    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&supportsTeamDrives=true&fields=id,name,mimeType,size,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': String(multipartRequestBody.length),
        },
        body: multipartRequestBody,
      }
    );

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadResult.id) {
      console.error('Google Drive upload error response:', uploadResult);

      const errReason = uploadResult.error?.errors?.[0]?.reason || '';
      const errMsg = uploadResult.error?.message || '';

      // Check specifically for Service Account 0-quota limit on personal Google Drive
      if (errReason === 'storageQuotaExceeded' || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('storage')) {
        return res.status(403).json({
          error: 'STORAGE_QUOTA_EXCEEDED',
          message:
            'Google Service Account Quota Limit: Google assigns 0 bytes of Drive storage to Service Accounts on personal @gmail.com accounts. Please click "Publish Directly to StudyHub" to publish your study material instantly without Drive limits.',
          rawError: errMsg,
          details: uploadResult,
        });
      }

      // Helpful actionable message if folder was not found or not shared with the service account
      if (
        uploadResponse.status === 404 ||
        errReason === 'notFound' ||
        errMsg.toLowerCase().includes('file not found')
      ) {
        let helpfulNotice = `Google Drive Folder Not Shared: Folder ID "${folderId.trim()}" is not accessible by the Service Account.`;
        if (serviceAccountEmail) {
          helpfulNotice += ` Please open this folder in Google Drive, click "Share", and add "${serviceAccountEmail}" as "Editor". Or click "Publish Directly to StudyHub".`;
        }
        return res.status(404).json({
          error: 'DRIVE_FOLDER_NOT_SHARED',
          message: helpfulNotice,
          rawError: errMsg,
          details: uploadResult,
        });
      }

      if (
        uploadResponse.status === 403 ||
        errReason === 'insufficientFilePermissions' ||
        errMsg.toLowerCase().includes('permission')
      ) {
        let helpfulNotice = `Google Drive Permission / Quota Notice for Folder ID "${folderId.trim()}": ${errMsg || 'The user does not have sufficient permissions for this file.'}`;
        if (serviceAccountEmail) {
          helpfulNotice += ` Ensure "${serviceAccountEmail}" has Editor permission, or click "Publish Directly to StudyHub" below to bypass Google personal account limitations.`;
        }
        return res.status(403).json({
          error: 'DRIVE_FOLDER_PERMISSION_DENIED',
          message: helpfulNotice,
          rawError: errMsg,
          details: uploadResult,
        });
      }

      return res.status(uploadResponse.status || 500).json({
        error: 'DRIVE_API_UPLOAD_FAILED',
        message: errMsg || 'Failed to upload file to Google Drive folder.',
        rawError: errMsg,
        details: uploadResult,
      });
    }

    const fileId = uploadResult.id;

    // Set permission: "Anyone with link can view" (reader)
    try {
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone',
          }),
        }
      );
    } catch (permErr) {
      console.warn('Notice: Setting public reader permission encountered:', permErr);
    }

    const webViewLink =
      uploadResult.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    const webContentLink =
      uploadResult.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`;

    const sizeInMB = (binaryBuffer.length / (1024 * 1024)).toFixed(2);
    const formattedSize = `${sizeInMB} MB`;

    return res.status(200).json({
      success: true,
      fileId,
      webViewLink,
      webContentLink,
      fileName,
      mimeType: resolvedMime,
      fileSize: formattedSize,
      folderId,
    });
  } catch (error: any) {
    console.error('Serverless Google Drive Upload Exception:', error);
    return res.status(500).json({
      error: 'SERVER_EXCEPTION',
      message: error?.message || 'An unexpected server error occurred during Google Drive upload.',
    });
  }
}
