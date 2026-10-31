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
// 5. Does not fake uploads if credentials are missing.
// ==============================================================================

// import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

interface VercelRequestLike {
  method?: string;
  body?: any;
  headers?: Record<string, string | string[] | undefined>;
}

interface VercelResponseLike {
  status: (code: number) => VercelResponseLike;
  json: (data: any) => void;
  send: (data: any) => void;
  end: () => void;
  setHeader: (name: string, value: string) => void;
}

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

/**
 * Generates an OAuth2 access token from a Google Service Account JSON key
 */
async function getServiceAccountAccessToken(saKey: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: saKey.client_email,
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const base64UrlEncode = (str: string) => Buffer.from(str).toString('base64url');
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

  // Clean private key formatting in case newlines were escaped
  const formattedKey = saKey.private_key.replace(/\\n/g, '\n');

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(formattedKey, 'base64url');
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    if (clientAccessToken && typeof clientAccessToken === 'string' && clientAccessToken.startsWith('ya29.')) {
      // User authenticated via client-side Google OAuth popup
      accessToken = clientAccessToken;
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      // Server-side Service Account Key JSON
      try {
        let keyString = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim();
        if (keyString.startsWith('{')) {
          const saKey = JSON.parse(keyString) as ServiceAccountKey;
          accessToken = await getServiceAccountAccessToken(saKey);
        } else {
          // May be base64 encoded
          const decoded = Buffer.from(keyString, 'base64').toString('utf8');
          const saKey = JSON.parse(decoded) as ServiceAccountKey;
          accessToken = await getServiceAccountAccessToken(saKey);
        }
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
          'Google Drive API credentials are not configured on the server. Please configure GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN in Vercel environment variables, or authorize via the "Connect Google Account" button.',
      });
    }

    // Extract raw base64 data (strip data URL prefix if present)
    const base64Content = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const binaryBuffer = Buffer.from(base64Content, 'base64');
    const resolvedMime = mimeType || 'application/octet-stream';

    // Construct Multipart Request Body for Google Drive REST API v3
    const boundary = '-------StudyHubGoogleDriveBoundary' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      parents: [folderId.trim()], // Ensures upload strictly to subject folder
    };

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n` +
          JSON.stringify(metadata) +
          `\r\n--${boundary}\r\n` +
          `Content-Type: ${resolvedMime}\r\n` +
          `Content-Transfer-Encoding: base64\r\n\r\n`
      ),
      Buffer.from(base64Content),
      Buffer.from(closeDelimiter),
    ]);

    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink',
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
      return res.status(uploadResponse.status || 500).json({
        error: 'DRIVE_API_UPLOAD_FAILED',
        message: uploadResult.error?.message || 'Failed to upload file to Google Drive folder.',
        details: uploadResult,
      });
    }

    const fileId = uploadResult.id;

    // Set permission: "Anyone with link can view" (reader)
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      });
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
