// ==============================================================================
// HAMMAD STUDYHUB — PERSISTENT FILE STORAGE ENGINE (INDEXEDDB + IN-MEMORY)
// Provides unlimited, high-capacity client-side file storage for study materials
// (PDF, DOCX, PPTX, XLSX, Images, ZIP) bypassing 5MB localStorage limits.
// ==============================================================================

const DB_NAME = 'studyhub_files_db';
const DB_VERSION = 1;
const STORE_NAME = 'files';

// Synchronous memory cache for zero-latency retrieval
const memoryCache = new Map<string, string>();

interface StoredFileRecord {
  id: string; // resource ID
  data: string; // Base64 data URL
  mime_type?: string;
  file_name?: string;
  file_size?: string;
  updated_at: string;
}

/**
 * Opens or initializes the IndexedDB database safely
 */
function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (e) => {
        console.warn('IndexedDB open error, falling back to memory cache:', e);
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB exception, falling back to memory cache:', err);
      resolve(null);
    }
  });
}

/**
 * Stores file data (Base64 data URL) into IndexedDB and memory cache
 */
export async function saveResourceFileData(
  resourceId: string,
  dataUrl: string,
  meta?: { mime_type?: string; file_name?: string; file_size?: string }
): Promise<void> {
  if (!resourceId || !dataUrl) return;

  // 1. Immediately store in fast synchronous memory cache
  memoryCache.set(resourceId, dataUrl);

  // 2. Persist in IndexedDB
  try {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const record: StoredFileRecord = {
          id: resourceId,
          data: dataUrl,
          mime_type: meta?.mime_type,
          file_name: meta?.file_name,
          file_size: meta?.file_size,
          updated_at: new Date().toISOString(),
        };

        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => {
          console.warn(`IndexedDB put error for ${resourceId}:`, req.error);
          resolve(); // gracefully resolve
        };
      } catch (err) {
        console.warn('IndexedDB tx exception:', err);
        resolve();
      }
    });
  } catch (err) {
    console.warn('saveResourceFileData failed:', err);
  }
}

/**
 * Retrieves file data synchronously from memory cache or falls back to empty
 */
export function getCachedFileData(resourceId: string): string | null {
  return memoryCache.get(resourceId) || null;
}

/**
 * Retrieves file data asynchronously from IndexedDB, caching into memory
 */
export async function getResourceFileData(resourceId: string): Promise<string | null> {
  if (!resourceId) return null;

  if (memoryCache.has(resourceId)) {
    return memoryCache.get(resourceId)!;
  }

  try {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(resourceId);

        req.onsuccess = () => {
          const result = req.result as StoredFileRecord | undefined;
          if (result && result.data) {
            memoryCache.set(resourceId, result.data);
            resolve(result.data);
          } else {
            resolve(null);
          }
        };

        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

/**
 * Deletes a file from both memory cache and IndexedDB
 */
export async function deleteResourceFileData(resourceId: string): Promise<void> {
  memoryCache.delete(resourceId);

  try {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(resourceId);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch {
    // Ignore
  }
}

/**
 * Hydrates all stored file data into memory cache on application start
 */
export async function initializeFileStorage(): Promise<void> {
  try {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const records = (req.result as StoredFileRecord[]) || [];
          records.forEach((rec) => {
            if (rec.id && rec.data) {
              memoryCache.set(rec.id, rec.data);
            }
          });
          resolve();
        };

        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch {
    // Ignore
  }
}

// Auto-initialize when running in browser
if (typeof window !== 'undefined') {
  initializeFileStorage().catch(() => {});
}

