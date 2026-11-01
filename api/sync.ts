// ==============================================================================
// HAMMAD STUDYHUB — CENTRAL MULTI-DEVICE CLOUD SYNCHRONIZATION ENDPOINT
// Runtime: Vercel Serverless Function (Node.js)
// Architect: Muhammad Hammad
//
// Key Responsibilities:
// 1. Central Single-Source-of-Truth across Mobile, Laptop, Tablet, CR, GR, and Admin.
// 2. Conflict-Free Merging (CRDT-inspired): Merges records by unique ID and latest timestamp.
// 3. Real-time PubSub Event Notification via ntfy.sh WebSocket / SSE bus.
// 4. In-Memory Persistence with Cold-Start Recovery.
// 5. Zero-Configuration: Works automatically out-of-the-box without requiring external database keys.
// ==============================================================================

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

export interface SyncStoreState {
  subjects: any[];
  resources: any[];
  students: any[];
  announcements: any[];
  chats: any[];
  updated_at: string;
}

const NTFY_SYNC_TOPIC = 'hammadstudyhub_global_sync_v2';
const NTFY_API_URL = `https://ntfy.sh/${NTFY_SYNC_TOPIC}`;

// Global in-memory server state across warm serverless function invocations
declare global {
  // eslint-disable-next-line no-var
  var __studyhub_cloud_sync_store__: SyncStoreState | undefined;
}

function getInitialStore(): SyncStoreState {
  if (!globalThis.__studyhub_cloud_sync_store__) {
    globalThis.__studyhub_cloud_sync_store__ = {
      subjects: [],
      resources: [],
      students: [],
      announcements: [],
      chats: [],
      updated_at: new Date().toISOString(),
    };
  }
  return globalThis.__studyhub_cloud_sync_store__;
}

/**
 * Universal Conflict-Free Record Merger
 * Preserves all unique records, merges matches, and picks the most recent record by timestamp.
 */
function mergeRecords<T extends { id: string; updated_at?: string; created_at?: string }>(
  existing: T[],
  incoming: T[],
  secondaryKey?: (item: T) => string | undefined
): T[] {
  const map = new Map<string, T>();
  const secondaryMap = new Map<string, string>(); // secondary key -> id

  // 1. Add existing records
  for (const item of existing) {
    if (!item || !item.id) continue;
    map.set(item.id, item);
    if (secondaryKey) {
      const sk = secondaryKey(item);
      if (sk) secondaryMap.set(sk.toLowerCase(), item.id);
    }
  }

  // 2. Merge incoming records
  for (const item of incoming) {
    if (!item || !item.id) continue;

    let targetId = item.id;
    let found = map.get(targetId);

    // If not matched by ID, try secondary key (e.g. email for students, slug for subjects)
    if (!found && secondaryKey) {
      const sk = secondaryKey(item);
      if (sk && secondaryMap.has(sk.toLowerCase())) {
        targetId = secondaryMap.get(sk.toLowerCase())!;
        found = map.get(targetId);
      }
    }

    if (!found) {
      map.set(item.id, item);
      if (secondaryKey) {
        const sk = secondaryKey(item);
        if (sk) secondaryMap.set(sk.toLowerCase(), item.id);
      }
    } else {
      const existingTime = new Date(found.updated_at || found.created_at || 0).getTime();
      const incomingTime = new Date(item.updated_at || item.created_at || 0).getTime();

      if (incomingTime >= existingTime) {
        map.set(targetId, { ...found, ...item, id: targetId });
      } else {
        map.set(targetId, { ...item, ...found, id: targetId });
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Asynchronously broadcasts a sync snapshot or mutation event to ntfy.sh
 * to notify all listening devices (mobile, laptop, tablet) over WebSockets.
 */
async function notifyClientsViaPubSub(event: string, payload: any): Promise<void> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    // Filter large file binary payloads from real-time pubsub message to stay well within limits
    const safePayload = {
      event,
      timestamp: new Date().toISOString(),
      payload: payload?.resources
        ? {
            ...payload,
            resources: payload.resources.map((r: any) => {
              const { file_data, ...meta } = r;
              return meta;
            }),
          }
        : payload,
    };

    await fetch(NTFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Title: 'Hammad StudyHub Sync Event',
        Priority: 'high',
        Tags: 'studyhub,sync',
      },
      body: JSON.stringify(safePayload),
      signal: controller.signal,
    });

    clearTimeout(timer);
  } catch {
    // Non-blocking: failure to broadcast should never break HTTP request
  }
}

/**
 * Recovers the latest state from ntfy.sh cache during cold starts if in-memory store is empty
 */
async function attemptColdStartRecovery(store: SyncStoreState): Promise<void> {
  if (
    store.subjects.length > 0 ||
    store.resources.length > 0 ||
    store.students.length > 0
  ) {
    return; // Already populated
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${NTFY_API_URL}/json?poll=1`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const text = await res.text();
      const lines = text.trim().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const parsedMsg = typeof entry.message === 'string' ? JSON.parse(entry.message) : entry.message;
          if (parsedMsg?.payload?.subjects || parsedMsg?.payload?.resources) {
            const p = parsedMsg.payload;
            if (Array.isArray(p.subjects)) {
              store.subjects = mergeRecords(store.subjects, p.subjects);
            }
            if (Array.isArray(p.resources)) {
              store.resources = mergeRecords(store.resources, p.resources);
            }
            if (Array.isArray(p.students)) {
              store.students = mergeRecords(store.students, p.students);
            }
            if (Array.isArray(p.announcements)) {
              store.announcements = mergeRecords(store.announcements, p.announcements);
            }
          }
        } catch {
          // ignore single bad line
        }
      }
    }
  } catch {
    // ignore
  }
}

export default async function handler(req: VercelRequestLike, res: VercelResponseLike) {
  // CORS Configuration for seamless cross-domain and multi-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const store = getInitialStore();

  // Handle Cold Start Recovery
  await attemptColdStartRecovery(store);

  try {
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        timestamp: store.updated_at,
        snapshot: store,
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const action = body.action || 'sync';

      if (action === 'sync' || action === 'merge') {
        const { subjects, resources, students, announcements, chats } = body;

        let hasNewData = false;

        if (Array.isArray(subjects) && subjects.length > 0) {
          const before = store.subjects.length;
          store.subjects = mergeRecords(store.subjects, subjects, (s) => s.slug || s.code);
          if (store.subjects.length !== before) hasNewData = true;
        }

        if (Array.isArray(resources) && resources.length > 0) {
          const before = store.resources.length;
          store.resources = mergeRecords(store.resources, resources, (r) => `${r.title}__${r.subject_id}`);
          if (store.resources.length !== before) hasNewData = true;
        }

        if (Array.isArray(students) && students.length > 0) {
          const before = store.students.length;
          store.students = mergeRecords(store.students, students, (st) => st.email);
          if (store.students.length !== before) hasNewData = true;
        }

        if (Array.isArray(announcements) && announcements.length > 0) {
          const before = store.announcements.length;
          store.announcements = mergeRecords(store.announcements, announcements);
          if (store.announcements.length !== before) hasNewData = true;
        }

        if (Array.isArray(chats) && chats.length > 0) {
          store.chats = mergeRecords(store.chats, chats);
        }

        store.updated_at = new Date().toISOString();

        // Broadcast merged snapshot to any listening mobile/desktop devices
        if (hasNewData || body.broadcast !== false) {
          notifyClientsViaPubSub('SYNC_SNAPSHOT', store).catch(() => {});
        }

        return res.status(200).json({
          success: true,
          timestamp: store.updated_at,
          snapshot: store,
        });
      }

      if (action === 'mutate') {
        const { entity, mutationAction, data, id } = body;
        const targetId = id || data?.id;

        if (entity === 'resources') {
          if (mutationAction === 'delete' && targetId) {
            store.resources = store.resources.filter((r) => r.id !== targetId);
          } else if (data) {
            store.resources = mergeRecords(store.resources, [data]);
          }
        } else if (entity === 'subjects') {
          if (mutationAction === 'delete' && targetId) {
            store.subjects = store.subjects.filter((s) => s.id !== targetId);
          } else if (data) {
            store.subjects = mergeRecords(store.subjects, [data]);
          }
        } else if (entity === 'students') {
          if (mutationAction === 'delete' && targetId) {
            store.students = store.students.filter((st) => st.id !== targetId);
          } else if (data) {
            store.students = mergeRecords(store.students, [data], (st) => st.email);
          }
        } else if (entity === 'announcements') {
          if (mutationAction === 'delete' && targetId) {
            store.announcements = store.announcements.filter((a) => a.id !== targetId);
          } else if (data) {
            store.announcements = mergeRecords(store.announcements, [data]);
          }
        } else if (entity === 'chat') {
          if (data) {
            store.chats = mergeRecords(store.chats, [data]);
          }
        }

        store.updated_at = new Date().toISOString();
        notifyClientsViaPubSub('MUTATION', { entity, mutationAction, data, id: targetId }).catch(() => {});

        return res.status(200).json({
          success: true,
          timestamp: store.updated_at,
          snapshot: store,
        });
      }

      return res.status(400).json({
        success: false,
        error: `Unknown sync action: ${action}`,
      });
    }

    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
    });
  } catch (error: any) {
    console.error('Error handling /api/sync:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error in cloud sync endpoint',
    });
  }
}
