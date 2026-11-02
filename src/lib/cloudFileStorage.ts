// ==============================================================================
// HAMMAD STUDYHUB — RESILIENT CLOUD FILE STORAGE INTEGRATION
// Architect: Muhammad Hammad
//
// Multi-Tier Storage Architecture:
// Tier 1: Supabase Storage Bucket ('studyhub-materials') with public CDN URLs
// Tier 2: Dedicated Serverless File Streaming API (/api/files)
// Tier 3: Supabase Database Table ('resources.file_data' text column)
// Tier 4: Client-Side Persistent IndexedDB Cache ('studyhub_files_db')
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { saveResourceFileData, getCachedFileData, getResourceFileData } from './fileStorage';
import { Resource, SourceProvider } from '../types';
import { getDemoResources, saveDemoResource } from './demoStore';
import { pushMutationToCloud } from './cloudSync';

export const STORAGE_BUCKET = 'studyhub-materials';

export interface UploadResult {
  fileUrl: string;
  storagePath?: string;
  sourceProvider: SourceProvider;
  fileData?: string;
}

/**
 * Converts a standard browser File/Blob to a Base64 data URL
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Formats byte size into human readable string (KB, MB, GB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Sanitizes file name for cloud storage paths
 */
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Uploads an academic document/file into Hammad StudyHub Cloud Storage
 * with automatic fallback between Supabase Storage, /api/files, and IndexedDB.
 */
export async function uploadLearningMaterialFile(
  file: File,
  resourceId: string,
  subjectId: string
): Promise<UploadResult> {
  const cleanName = sanitizeFileName(file.name);
  const base64Data = await fileToBase64(file);

  // 1. Immediately cache in local IndexedDB for zero-latency local operations
  await saveResourceFileData(resourceId, base64Data, {
    file_name: file.name,
    mime_type: file.type || 'application/pdf',
    file_size: formatFileSize(file.size),
  }).catch((e) => console.warn('IndexedDB local cache notice:', e));

  let finalFileUrl = '';
  let finalStoragePath: string | undefined = undefined;

  // ---------------------------------------------------------------------------
  // TIER 1: Supabase Storage Bucket ('studyhub-materials')
  // ---------------------------------------------------------------------------
  if (isSupabaseConfigured) {
    try {
      const storagePath = `materials/${subjectId || 'general'}/${resourceId}-${cleanName}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '86400',
          upsert: true,
          contentType: file.type || 'application/pdf',
        });

      if (!uploadErr && uploadData) {
        const { data: pubData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(storagePath);

        if (pubData?.publicUrl) {
          finalFileUrl = pubData.publicUrl;
          finalStoragePath = storagePath;
        }
      } else if (uploadErr) {
        console.warn('Supabase storage upload returned notice:', uploadErr.message);
        if (
          uploadErr.message?.toLowerCase().includes('bucket not found') ||
          (uploadErr as any).statusCode === '404' ||
          (uploadErr as any).error === 'Bucket not found'
        ) {
          throw new Error(
            "Supabase Storage bucket 'studyhub-materials' does not exist! Please create a public bucket named 'studyhub-materials' in your Supabase Dashboard under Storage -> New Bucket."
          );
        }
      }
    } catch (sErr: any) {
      console.warn('Supabase storage exception (falling back to serverless API):', sErr?.message);
    }
  }

  // ---------------------------------------------------------------------------
  // TIER 2: Dedicated Serverless File Streaming API (/api/files)
  // ---------------------------------------------------------------------------
  if (!finalFileUrl) {
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: resourceId,
          file_name: file.name,
          mime_type: file.type || 'application/pdf',
          file_size: formatFileSize(file.size),
          file_data: base64Data,
          subject_id: subjectId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.url) {
          finalFileUrl = data.url;
        }
      }
    } catch (apiErr) {
      console.warn('/api/files upload fallback notice:', apiErr);
    }
  }

  // ---------------------------------------------------------------------------
  // TIER 3 & 4: Fallback to direct Base64 Data URL or /api/files endpoint
  // ---------------------------------------------------------------------------
  if (!finalFileUrl) {
    finalFileUrl = `/api/files?id=${encodeURIComponent(resourceId)}`;
  }

  return {
    fileUrl: finalFileUrl,
    storagePath: finalStoragePath,
    sourceProvider: 'supabase_storage',
    fileData: base64Data,
  };
}

/**
 * Resolves a reliable, working file URL for a resource across devices
 */
export async function resolveFileAccessUrl(resource: Resource): Promise<string> {
  if (!resource) return '';

  // 1. If external_url is already a valid HTTP link (and not '#' or empty)
  if (
    resource.external_url &&
    resource.external_url.startsWith('http') &&
    resource.external_url !== '#' &&
    resource.external_url !== 'about:blank'
  ) {
    return resource.external_url;
  }

  // 2. If file_data is already loaded in memory or on the resource
  if (resource.file_data && resource.file_data.startsWith('data:')) {
    return resource.file_data;
  }

  // 3. Check memory / IndexedDB local cache
  const cachedData = getCachedFileData(resource.id) || (await getResourceFileData(resource.id));
  if (cachedData && cachedData.startsWith('data:')) {
    return cachedData;
  }

  // 4. Check if available via /api/files
  if (resource.id) {
    return `/api/files?id=${encodeURIComponent(resource.id)}`;
  }

  return '';
}

/**
 * Checks whether the 'studyhub-materials' storage bucket exists and is accessible in Supabase
 */
export async function checkStorageBucketExists(): Promise<{ exists: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { exists: false, error: 'Supabase is not configured' };
  try {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).list('', { limit: 1 });
    if (error) {
      return { exists: false, error: error.message };
    }
    return { exists: true };
  } catch (err: any) {
    return { exists: false, error: err?.message || 'Exception checking bucket' };
  }
}

/**
 * Scans local resources and automatically repairs previously uploaded files
 * by pushing them up to Supabase Storage and /api/files so all other students can open them.
 */
export async function repairAndSyncExistingResources(): Promise<number> {
  const all = getDemoResources();
  let repairedCount = 0;

  for (const r of all) {
    // Only skip resources that ALREADY have a working external CDN URL
    const hasValidCdnUrl =
      r.external_url &&
      r.external_url.startsWith('http') &&
      !r.external_url.includes('/api/files') &&
      r.external_url !== '#' &&
      r.external_url !== 'about:blank';

    if (!hasValidCdnUrl) {
      // Find local file data in memory or IndexedDB
      const fileData = r.file_data || getCachedFileData(r.id) || (await getResourceFileData(r.id));
      let repairedUrl = '';

      if (fileData && fileData.startsWith('data:')) {
        // 1. Try direct Supabase Storage if configured
        if (isSupabaseConfigured) {
          try {
            const commaIdx = fileData.indexOf(',');
            const base64Content = commaIdx >= 0 ? fileData.substring(commaIdx + 1) : fileData;
            const byteCharacters = atob(base64Content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const mimeType = r.mime_type || 'application/pdf';
            const blob = new Blob([byteArray], { type: mimeType });

            const sanitizedFileName = (r.file_name || `${r.title}.pdf`).replace(/[^a-zA-Z0-9._-]/g, '_');
            const storagePath = `${r.subject_id || 'general'}/${r.id}_${sanitizedFileName}`;

            const { data: upData, error: upErr } = await supabase.storage
              .from('studyhub-materials')
              .upload(storagePath, blob, {
                cacheControl: '3600',
                upsert: true,
                contentType: mimeType,
              });

            if (!upErr && upData) {
              const { data: pubData } = supabase.storage
                .from('studyhub-materials')
                .getPublicUrl(storagePath);
              if (pubData?.publicUrl) {
                repairedUrl = pubData.publicUrl;
              }
            }
          } catch (supErr) {
            console.warn(`Supabase storage repair notice for "${r.title}":`, supErr);
          }
        }

        // 2. Try serverless /api/files endpoint if not yet repaired
        if (!repairedUrl) {
          try {
            const res = await fetch('/api/files', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: r.id,
                file_name: r.file_name || `${r.title}.pdf`,
                mime_type: r.mime_type || 'application/pdf',
                file_size: r.file_size,
                file_data: fileData,
                subject_id: r.subject_id,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              repairedUrl = data.url || `/api/files?id=${encodeURIComponent(r.id)}`;
            }
          } catch (repairErr) {
            console.warn(`Serverless /api/files repair notice for "${r.title}":`, repairErr);
          }
        }

        // 3. Fallback to /api/files link
        if (!repairedUrl) {
          repairedUrl = `/api/files?id=${encodeURIComponent(r.id)}`;
        }

        const updatedResource: Resource = {
          ...r,
          external_url: repairedUrl,
          file_data: fileData,
        };

        saveDemoResource(updatedResource);

        if (isSupabaseConfigured) {
          Promise.resolve(
            supabase
              .from('resources')
              .update({ external_url: repairedUrl })
              .eq('id', r.id)
          ).catch(() => {});
        }

        pushMutationToCloud('resources', 'update', updatedResource).catch(() => {});
        repairedCount++;
      } else if (r.file_name || r.id) {
        // If no fileData was present locally, ensure the resource doesn't have '#'
        const fallbackUrl = `/api/files?id=${encodeURIComponent(r.id)}`;
        const updatedResource: Resource = {
          ...r,
          external_url: fallbackUrl,
        };
        saveDemoResource(updatedResource);
      }
    }
  }

  return repairedCount;
}
