// ==============================================================================
// HAMMAD STUDYHUB — UNIVERSAL SERVERLESS FILE STORAGE & STREAMING ENDPOINT
// Runtime: Vercel Serverless Function (Node.js)
// Architect: Muhammad Hammad
//
// Responsibilities:
// 1. Serves uploaded learning materials (PDF, DOCX, PPTX, Images, ZIP) directly to
//    students with native HTTP binary streaming, inline viewer, and attachment headers.
// 2. High-speed in-memory & Supabase Storage persistence.
// 3. Dual-mode support: Seamlessly streams files whether stored in Supabase Storage,
//    serverless buffer, or database records.
// ==============================================================================

import type { IncomingMessage, ServerResponse } from 'http';

interface VercelRequestLike extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>;
  body?: any;
}

interface VercelResponseLike extends ServerResponse {
  status: (code: number) => VercelResponseLike;
  json: (data: any) => void;
  send: (data: any) => void;
}

export interface StoredCloudFile {
  id: string;
  file_name: string;
  mime_type: string;
  file_size?: string;
  file_data: string; // Base64 data URL
  subject_id?: string;
  updated_at: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __studyhub_file_store__: Record<string, StoredCloudFile> | undefined;
}

function getFileStore(): Record<string, StoredCloudFile> {
  if (!globalThis.__studyhub_file_store__) {
    globalThis.__studyhub_file_store__ = {};
  }
  return globalThis.__studyhub_file_store__;
}

export default async function handler(req: VercelRequestLike, res: VercelResponseLike) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const store = getFileStore();

  // ---------------------------------------------------------------------------
  // 1. GET /api/files?id=<resourceId>&download=true|false
  // ---------------------------------------------------------------------------
  if (req.method === 'GET') {
    const url = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
    const id = (url.searchParams.get('id') || (req.query?.id as string) || '').trim();
    const download = (url.searchParams.get('download') || req.query?.download) === 'true';

    if (!id) {
      return res.status(400).json({
        error: 'MISSING_FILE_ID',
        message: 'A valid resource or file ID is required.',
      });
    }

    // 1. Check in-memory store
    let fileRecord = store[id];

    // 2. Check global sync store in memory if available
    if (!fileRecord) {
      const syncStoreResources = (globalThis as any).__studyhub_cloud_sync_store__?.resources;
      if (Array.isArray(syncStoreResources)) {
        const matched = syncStoreResources.find((r: any) => r && r.id === id);
        if (matched) {
          if (matched.file_data && typeof matched.file_data === 'string' && matched.file_data.startsWith('data:')) {
            fileRecord = {
              id: matched.id,
              file_name: matched.file_name || 'study-material.pdf',
              mime_type: matched.mime_type || 'application/pdf',
              file_size: matched.file_size,
              file_data: matched.file_data,
              updated_at: matched.updated_at || new Date().toISOString(),
            };
            store[id] = fileRecord;
          } else if (
            matched.external_url &&
            matched.external_url.startsWith('http') &&
            !matched.external_url.includes('/api/files')
          ) {
            res.setHeader('Location', matched.external_url);
            return res.status(302).end();
          }
        }
      }
    }

    // 3. Fallback to /api/sync endpoint on the same deployment
    if (!fileRecord) {
      try {
        const host = req.headers?.host || 'hammadstudyhub.vercel.app';
        const proto = (req.headers?.['x-forwarded-proto'] as string) || (host.includes('localhost') ? 'http' : 'https');
        const syncRes = await fetch(`${proto}://${host}/api/sync`);
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          const matched = syncData?.snapshot?.resources?.find((r: any) => r && r.id === id);
          if (matched) {
            if (matched.file_data && typeof matched.file_data === 'string' && matched.file_data.startsWith('data:')) {
              fileRecord = {
                id: matched.id,
                file_name: matched.file_name || 'study-material.pdf',
                mime_type: matched.mime_type || 'application/pdf',
                file_size: matched.file_size,
                file_data: matched.file_data,
                updated_at: matched.updated_at || new Date().toISOString(),
              };
              store[id] = fileRecord;
            } else if (
              matched.external_url &&
              matched.external_url.startsWith('http') &&
              !matched.external_url.includes('/api/files')
            ) {
              res.setHeader('Location', matched.external_url);
              return res.status(302).end();
            }
          }
        }
      } catch (syncErr) {
        console.warn('Sync fallback notice in /api/files:', syncErr);
      }
    }

    // 4. Fallback to ntfy.sh cache history
    if (!fileRecord) {
      try {
        const ntfyRes = await fetch('https://ntfy.sh/hammadstudyhub_global_sync_v2/json?poll=1');
        if (ntfyRes.ok) {
          const text = await ntfyRes.text();
          const lines = text.trim().split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              const msg = typeof parsed.message === 'string' ? JSON.parse(parsed.message) : parsed.message;
              const resources = msg?.payload?.resources || (msg?.data ? [msg.data] : []);
              const matched = resources.find((r: any) => r && r.id === id);
              if (matched) {
                if (matched.file_data && typeof matched.file_data === 'string' && matched.file_data.startsWith('data:')) {
                  fileRecord = {
                    id: matched.id,
                    file_name: matched.file_name || 'study-material.pdf',
                    mime_type: matched.mime_type || 'application/pdf',
                    file_size: matched.file_size,
                    file_data: matched.file_data,
                    updated_at: matched.updated_at || new Date().toISOString(),
                  };
                  store[id] = fileRecord;
                  break;
                } else if (
                  matched.external_url &&
                  matched.external_url.startsWith('http') &&
                  !matched.external_url.includes('/api/files')
                ) {
                  res.setHeader('Location', matched.external_url);
                  return res.status(302).end();
                }
              }
            } catch {
              // ignore single bad line
            }
          }
        }
      } catch (ntfyErr) {
        console.warn('ntfy history fallback notice in /api/files:', ntfyErr);
      }
    }

    // 5. If not found in memory, check Supabase database if configured
    if (!fileRecord) {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
        try {
          const fetchUrl = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/resources?id=eq.${encodeURIComponent(
            id
          )}&select=id,file_name,mime_type,file_size,file_data,external_url`;

          const sRes = await fetch(fetchUrl, {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              Accept: 'application/json',
            },
          });

          if (sRes.ok) {
            const rows = await sRes.json();
            if (Array.isArray(rows) && rows.length > 0) {
              const row = rows[0];
              if (row.file_data && row.file_data.startsWith('data:')) {
                fileRecord = {
                  id: row.id,
                  file_name: row.file_name || 'study-material.pdf',
                  mime_type: row.mime_type || 'application/pdf',
                  file_size: row.file_size,
                  file_data: row.file_data,
                  updated_at: new Date().toISOString(),
                };
                store[id] = fileRecord;
              } else if (row.external_url && row.external_url.startsWith('http') && row.external_url !== '#') {
                // Redirect directly to the external/storage URL
                res.setHeader('Location', row.external_url);
                return res.status(302).end();
              }
            }
          }
        } catch (dbErr) {
          console.warn('Database file lookup notice in /api/files:', dbErr);
        }
      }
    }

    if (!fileRecord || !fileRecord.file_data) {
      const acceptHeader = (req.headers?.['accept'] as string) || '';
      if (!download && (acceptHeader.includes('text/html') || !acceptHeader.includes('application/json'))) {
        // Seamlessly redirect browser navigation directly to the student portal resource viewer
        res.setHeader('Location', `/resources/${encodeURIComponent(id)}`);
        return res.status(302).end();
      }

      return res.status(404).json({
        error: 'FILE_NOT_FOUND',
        message: 'The requested learning material is currently being processed or is unavailable.',
      });
    }

    try {
      // Parse Base64 Data URL to binary Buffer
      const rawDataUrl = fileRecord.file_data;
      const commaIdx = rawDataUrl.indexOf(',');
      const base64Content = commaIdx >= 0 ? rawDataUrl.substring(commaIdx + 1) : rawDataUrl;
      const buffer = Buffer.from(base64Content, 'base64');

      const mimeType = fileRecord.mime_type || 'application/pdf';
      const fileName = fileRecord.file_name || 'study-material.pdf';
      const disposition = download ? 'attachment' : 'inline';

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(fileName)}"`);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

      return res.status(200).send(buffer);
    } catch (parseErr) {
      console.error('Binary conversion error in /api/files:', parseErr);
      return res.status(500).json({
        error: 'FILE_PARSE_ERROR',
        message: 'Could not stream file binary.',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 2. POST /api/files
  // Ingests file payload from uploader (Admin, CR, or GR)
  // ---------------------------------------------------------------------------
  if (req.method === 'POST') {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        // ignore
      }
    }

    const { id, file_name, mime_type, file_size, file_data, subject_id } = payload || {};

    if (!id || !file_data) {
      return res.status(400).json({
        error: 'INVALID_PAYLOAD',
        message: 'id and file_data are required.',
      });
    }

    const newRecord: StoredCloudFile = {
      id,
      file_name: file_name || 'study-material.pdf',
      mime_type: mime_type || 'application/pdf',
      file_size,
      file_data,
      subject_id,
      updated_at: new Date().toISOString(),
    };

    store[id] = newRecord;

    // Dual-write to Supabase Storage if configured
    let publicUrl: string | undefined = undefined;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
      try {
        const cleanName = (file_name || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `materials/${subject_id || 'general'}/${id}-${cleanName}`;
        const uploadUrl = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/studyhub-materials/${storagePath}`;

        const commaIdx = file_data.indexOf(',');
        const base64Content = commaIdx >= 0 ? file_data.substring(commaIdx + 1) : file_data;
        const binaryBuffer = Buffer.from(base64Content, 'base64');

        const sRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': mime_type || 'application/pdf',
            'x-upsert': 'true',
          },
          body: binaryBuffer,
        });

        if (sRes.ok) {
          publicUrl = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/studyhub-materials/${storagePath}`;
        }
      } catch (uploadErr) {
        console.warn('Supabase storage upload background notice in /api/files:', uploadErr);
      }
    }

    return res.status(200).json({
      success: true,
      id,
      url: publicUrl || `/api/files?id=${encodeURIComponent(id)}`,
      publicUrl,
      updated_at: newRecord.updated_at,
    });
  }

  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
}

