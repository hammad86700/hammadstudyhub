// ==============================================================================
// HAMMAD STUDYHUB — UNIVERSAL CLOUD REAL-TIME SYNCHRONIZATION ENGINE
// Architect: Muhammad Hammad
//
// Key Responsibilities:
// 1. Two-Way Cross-Device Synchronization: Guarantees Mobile, Laptop, Tablet, CR,
//    GR, and Admin all see identical data in real time.
// 2. High-Speed WebSockets: Sub-second update propagation via wss://ntfy.sh.
// 3. Central Cloud Snapshot Reconciliation via /api/sync Vercel Serverless Function.
// 4. Focus & Visibility Change Hydration: Automatically refreshes when opening the
//    app, unlocking phones, or switching tabs on laptops.
// 5. Offline Resiliency: Caches locally, never blocks the user, and auto-syncs when online.
// ==============================================================================

import { QueryClient } from '@tanstack/react-query';
import {
  getDemoSubjects,
  getDemoResources,
  getDemoAnnouncements,
  getRegisteredStudents,
  getAllChatMessages,
  mergeSubjectsLocally,
  mergeResourcesLocally,
  mergeAnnouncementsLocally,
  mergeRegisteredStudentsLocally,
  mergeChatsLocally,
  getTombstones,
  recordTombstone,
  deleteDemoResource,
  deleteDemoSubject,
  deleteStudent,
  deleteDemoAnnouncement,
} from './demoStore';
import { deleteResourceFileData } from './fileStorage';
import { DEVICE_ID } from './realtimeSync';

const NTFY_TOPIC = 'hammadstudyhub_global_sync_v2';
const WS_URL = `wss://ntfy.sh/${NTFY_TOPIC}/ws`;
const PUB_URL = `https://ntfy.sh/${NTFY_TOPIC}`;
const API_SYNC_URL = '/api/sync';

let activeWs: WebSocket | null = null;
let reconnectTimer: any = null;
let intervalTimer: any = null;
let isSyncInProgress = false;
let syncInitialized = false;
let lastSyncTimestamp = 0;

/**
 * Triggers React Query invalidation and local window events across all entities
 */
export function invalidateLocalEntities(queryClient?: QueryClient | null): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('studyhub_resources_updated'));
      window.dispatchEvent(new Event('studyhub_subjects_updated'));
      window.dispatchEvent(new Event('studyhub_students_updated'));
      window.dispatchEvent(new Event('studyhub_announcements_updated'));
      window.dispatchEvent(new Event('studyhub_notifications_updated'));
      window.dispatchEvent(new Event('studyhub_chat_updated'));
    }
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  } catch {
    // Ignore in non-browser envs
  }
}

/**
 * Ingests incoming snapshot from cloud server or pubsub WebSocket
 */
export function ingestCloudSnapshot(
  snapshot: {
    subjects?: any[];
    resources?: any[];
    students?: any[];
    announcements?: any[];
    chats?: any[];
    deleted_ids?: Record<string, { entity: string; deleted_at: string }>;
  },
  queryClient?: QueryClient | null
): void {
  if (!snapshot) return;

  // 1. Process permanent deletions first across all devices
  if (snapshot.deleted_ids && typeof snapshot.deleted_ids === 'object') {
    for (const [delId, delMeta] of Object.entries(snapshot.deleted_ids)) {
      const entity = (delMeta as any)?.entity;
      recordTombstone(delId, entity || 'resources');
      if (entity === 'resources') {
        deleteDemoResource(delId);
        deleteResourceFileData(delId).catch(() => {});
      } else if (entity === 'subjects') {
        deleteDemoSubject(delId);
      } else if (entity === 'students') {
        deleteStudent(delId);
      } else if (entity === 'announcements') {
        deleteDemoAnnouncement(delId);
      }
    }
  }

  // 2. Ingest active items
  if (Array.isArray(snapshot.subjects) && snapshot.subjects.length > 0) {
    mergeSubjectsLocally(snapshot.subjects);
  }

  if (Array.isArray(snapshot.resources) && snapshot.resources.length > 0) {
    mergeResourcesLocally(snapshot.resources);
  }

  if (Array.isArray(snapshot.students) && snapshot.students.length > 0) {
    mergeRegisteredStudentsLocally(snapshot.students);
  }

  if (Array.isArray(snapshot.announcements) && snapshot.announcements.length > 0) {
    mergeAnnouncementsLocally(snapshot.announcements);
  }

  if (Array.isArray(snapshot.chats) && snapshot.chats.length > 0) {
    mergeChatsLocally(snapshot.chats);
  }

  invalidateLocalEntities(queryClient);
}

/**
 * Executes a full two-way cloud synchronization:
 * 1. Gathers local subjects, resources, students, announcements, and tombstones.
 * 2. Uploads them to /api/sync to merge with central cloud store.
 * 3. Ingests merged snapshot back into local IndexedDB and localStorage.
 */
export async function syncWithCloud(queryClient?: QueryClient | null): Promise<void> {
  if (isSyncInProgress) return;
  const now = Date.now();
  if (now - lastSyncTimestamp < 1500) return; // Debounce rapid back-to-back triggers

  isSyncInProgress = true;
  lastSyncTimestamp = now;

  try {
    const localSubjects = getDemoSubjects();
    // Exclude gigantic base64 file payloads from routine sync to stay under HTTP payload thresholds
    const localResources = getDemoResources().map((r) => {
      // If file_data is larger than 1.5MB, strip it from lightweight sync payload
      if (r.file_data && r.file_data.length > 1.5 * 1024 * 1024) {
        const { file_data, ...rest } = r;
        return rest;
      }
      return r;
    });
    const localStudents = getRegisteredStudents();
    const localAnnouncements = getDemoAnnouncements();
    const localChats = getAllChatMessages().slice(-30);

    // Collect local tombstones to ensure deleted records are never resurrected
    const tombstones = getTombstones();
    const deleted_ids_map: Record<string, { entity: string; deleted_at: string }> = {};
    tombstones.forEach((t) => {
      deleted_ids_map[t.id] = { entity: t.entity, deleted_at: t.deleted_at };
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(API_SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync',
        senderDeviceId: DEVICE_ID,
        subjects: localSubjects,
        resources: localResources,
        students: localStudents,
        announcements: localAnnouncements,
        chats: localChats,
        deleted_ids: deleted_ids_map,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.snapshot) {
        ingestCloudSnapshot(data.snapshot, queryClient);
      }
    } else {
      // In local development or if /api/sync is unreachable, fallback to ntfy.sh poll
      await fallbackPollFromPubSub(queryClient);
    }
  } catch {
    // Network offline or endpoint unreachable: try pubsub poll fallback
    await fallbackPollFromPubSub(queryClient);
  } finally {
    isSyncInProgress = false;
  }
}

/**
 * Fallback polling from ntfy.sh message history
 */
async function fallbackPollFromPubSub(queryClient?: QueryClient | null): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${PUB_URL}/json?poll=1`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      const lines = text.trim().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const msg = typeof entry.message === 'string' ? JSON.parse(entry.message) : entry.message;
          if (msg?.payload) {
            ingestCloudSnapshot(msg.payload, queryClient);
          }
        } catch {
          // ignore single line parse error
        }
      }
    }
  } catch {
    // Graceful silent fallback
  }
}

/**
 * Pushes a direct mutation to the cloud sync API and broadcasts over WebSockets
 */
export async function pushMutationToCloud(
  entity: string,
  mutationAction: string,
  data: any,
  id?: string
): Promise<void> {
  const targetId = id || data?.id;

  // If deletion, record tombstone locally immediately
  if (mutationAction === 'delete' && targetId) {
    recordTombstone(targetId, entity as any);
    if (entity === 'resources') {
      deleteDemoResource(targetId);
      deleteResourceFileData(targetId).catch(() => {});
    } else if (entity === 'subjects') {
      deleteDemoSubject(targetId);
    } else if (entity === 'students') {
      deleteStudent(targetId);
    } else if (entity === 'announcements') {
      deleteDemoAnnouncement(targetId);
    }
  }

  // 1. Post to /api/sync
  try {
    fetch(API_SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'mutate',
        entity,
        mutationAction,
        data,
        id: targetId,
        senderDeviceId: DEVICE_ID,
      }),
    }).catch(() => {});
  } catch {
    // Non-blocking
  }

  // 2. Broadcast via ntfy.sh WebSocket pipe
  try {
    const isDelete = mutationAction === 'delete';
    const safeData = data?.file_data && data.file_data.length > 500000
      ? { ...data, file_data: undefined }
      : data;

    fetch(PUB_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Title: isDelete ? 'Permanent StudyHub Deletion' : 'StudyHub Sync Mutation',
        Priority: 'high',
      },
      body: JSON.stringify({
        event: isDelete ? 'PERMANENT_DELETE' : 'MUTATION',
        senderDeviceId: DEVICE_ID,
        entity,
        action: mutationAction,
        data: safeData,
        id: targetId,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  } catch {
    // Non-blocking
  }
}

/**
 * Initializes the persistent WebSocket connection and sync cycle
 */
export function initCloudSync(queryClient: QueryClient): () => void {
  if (syncInitialized) {
    return () => {};
  }
  syncInitialized = true;

  function connectWebSocket() {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return;

    try {
      if (activeWs) {
        try {
          activeWs.close();
        } catch {
          // Ignore
        }
      }

      activeWs = new WebSocket(WS_URL);

      activeWs.onopen = () => {
        // Run immediate cloud sync upon successful WebSocket connection
        syncWithCloud(queryClient);
      };

      activeWs.onmessage = (event) => {
        try {
          const entry = JSON.parse(event.data);
          let parsed = entry.message;
          if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
          }

          if (!parsed) return;

          // Prevent handling echoes from our own device
          if (parsed.senderDeviceId === DEVICE_ID) return;

          if (parsed.event === 'SYNC_SNAPSHOT' && parsed.payload) {
            ingestCloudSnapshot(parsed.payload, queryClient);
          } else if (parsed.event === 'PERMANENT_DELETE' || (parsed.event === 'MUTATION' && parsed.action === 'delete')) {
            const { entity, id, deleted_ids } = parsed;
            if (id) {
              recordTombstone(id, entity || 'resources');
              if (entity === 'resources') {
                deleteDemoResource(id);
                deleteResourceFileData(id).catch(() => {});
              } else if (entity === 'subjects') {
                deleteDemoSubject(id);
              } else if (entity === 'students') {
                deleteStudent(id);
              } else if (entity === 'announcements') {
                deleteDemoAnnouncement(id);
              }
            }
            if (deleted_ids && typeof deleted_ids === 'object') {
              for (const [delId, delMeta] of Object.entries(deleted_ids)) {
                const ent = (delMeta as any)?.entity;
                recordTombstone(delId, ent || 'resources');
                if (ent === 'resources') {
                  deleteDemoResource(delId);
                  deleteResourceFileData(delId).catch(() => {});
                } else if (ent === 'subjects') {
                  deleteDemoSubject(delId);
                } else if (ent === 'students') {
                  deleteStudent(delId);
                } else if (ent === 'announcements') {
                  deleteDemoAnnouncement(delId);
                }
              }
            }
            invalidateLocalEntities(queryClient);
          } else if (parsed.event === 'MUTATION' || parsed.entity) {
            const { entity, action, data, id } = parsed;
            if (entity === 'resources') {
              if (data) {
                mergeResourcesLocally([data]);
              }
            } else if (entity === 'subjects') {
              if (data) {
                mergeSubjectsLocally([data]);
              }
            } else if (entity === 'students') {
              if (data) {
                mergeRegisteredStudentsLocally([data]);
              }
            } else if (entity === 'announcements') {
              if (data) {
                mergeAnnouncementsLocally([data]);
              }
            } else if (entity === 'chat' && data) {
              mergeChatsLocally([data]);
            }
            invalidateLocalEntities(queryClient);
          }
        } catch {
          // Ignore non-JSON or heartbeat frames
        }
      };

      activeWs.onclose = () => {
        activeWs = null;
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectWebSocket, 5000);
      };

      activeWs.onerror = () => {
        try {
          activeWs?.close();
        } catch {
          // Ignore
        }
      };
    } catch {
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connectWebSocket, 8000);
    }
  }

  // 1. Connect WebSocket
  connectWebSocket();

  // 2. Perform initial background sync
  syncWithCloud(queryClient);

  // 3. Periodic Background Sync Heartbeat (every 8 seconds)
  intervalTimer = setInterval(() => {
    syncWithCloud(queryClient);
  }, 8000);

  // 4. Focus & Visibility Sync (triggers whenever laptop tab is activated or phone unlocked)
  const handleFocus = () => {
    syncWithCloud(queryClient);
  };

  const handleVisibility = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      syncWithCloud(queryClient);
    }
  };

  const handleOnline = () => {
    syncWithCloud(queryClient);
    connectWebSocket();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);
  }

  return () => {
    clearTimeout(reconnectTimer);
    clearInterval(intervalTimer);
    if (activeWs) {
      try {
        activeWs.close();
      } catch {
        // Ignore
      }
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    }
  };
}

