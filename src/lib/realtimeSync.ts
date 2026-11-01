// ==============================================================================
// HAMMAD STUDYHUB — MULTI-DEVICE REAL-TIME SYNCHRONIZATION ENGINE
// Architect: Muhammad Hammad
//
// Features:
// 1. Supabase WebSockets (PostgreSQL Changes):
//    Real-time DB-level sync for resources, subjects, announcements, students, and chat.
// 2. Supabase Realtime Broadcast Channel:
//    Sub-second client-to-client broadcast across phones, laptops, and tablets.
// 3. Cross-Tab & Cross-Window Local Bus:
//    Zero-lag sync between multiple tabs/windows on the same device.
// 4. Remote-to-Local Hydration:
//    Ensures remote additions on mobile immediately hydrate laptop's local caches.
// 5. React Query Global Cache Invalidation:
//    Automatically triggers refetch on active queries when updates occur.
// ==============================================================================

import { QueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  saveDemoResource,
  deleteDemoResource,
  saveDemoSubject,
  deleteDemoSubject,
  saveDemoAnnouncement,
  deleteDemoAnnouncement,
  upsertRegisteredStudentLocally,
  deleteStudent,
  RegisteredStudentEntry,
  upsertChatMessageLocally,
} from './demoStore';
import { deleteResourceFileData } from './fileStorage';

export const SYNC_CHANNEL_NAME = 'studyhub_realtime_global';
export const BROADCAST_EVENT = 'studyhub_sync_event';
export const TAB_BUS_NAME = 'studyhub_internal_bus';

export type RealtimeEntity = 'resources' | 'subjects' | 'announcements' | 'students' | 'chat';
export type RealtimeAction = 'create' | 'update' | 'delete';

export interface RealtimeSyncPayload {
  entity: RealtimeEntity;
  action: RealtimeAction;
  data?: any;
  id?: string;
  senderDeviceId: string;
  timestamp: string;
}

// Generate unique identifier for this browser session/device to prevent self-loop echoes
export const DEVICE_ID = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

let globalQueryClient: QueryClient | null = null;
let activeChannel: any = null;
let tabBus: BroadcastChannel | null = null;
let isInitialized = false;

/**
 * Dispatches entity-specific window events for instant UI reactivity
 */
export function dispatchLocalEntityUpdate(entity: RealtimeEntity): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(`studyhub_${entity}_updated`));
      if (entity === 'resources' || entity === 'announcements') {
        window.dispatchEvent(new Event('studyhub_notifications_updated'));
      }
    }
  } catch {
    // Ignore in non-browser environments
  }
}

/**
 * Ingests an incoming sync event (from Supabase WebSocket, Broadcast, or local Tab Bus)
 * and updates local stores and React Query caches.
 */
export function handleIncomingSyncEvent(
  payload: RealtimeSyncPayload,
  queryClient?: QueryClient | null
): void {
  if (!payload || !payload.entity) return;

  const targetClient = queryClient || globalQueryClient;

  switch (payload.entity) {
    case 'resources': {
      if (payload.action === 'delete') {
        const targetId = payload.id || payload.data?.id;
        if (targetId) {
          deleteDemoResource(targetId);
          deleteResourceFileData(targetId).catch(() => {});
        }
      } else if (payload.data) {
        saveDemoResource(payload.data);
      }
      dispatchLocalEntityUpdate('resources');
      if (targetClient) {
        targetClient.invalidateQueries({ queryKey: ['resources'] });
        targetClient.invalidateQueries({ queryKey: ['subjects'] });
      }
      break;
    }

    case 'subjects': {
      if (payload.action === 'delete') {
        const targetId = payload.id || payload.data?.id;
        if (targetId) {
          deleteDemoSubject(targetId);
        }
      } else if (payload.data) {
        saveDemoSubject(payload.data);
      }
      dispatchLocalEntityUpdate('subjects');
      if (targetClient) {
        targetClient.invalidateQueries({ queryKey: ['subjects'] });
      }
      break;
    }

    case 'announcements': {
      if (payload.action === 'delete') {
        const targetId = payload.id || payload.data?.id;
        if (targetId) {
          deleteDemoAnnouncement(targetId);
        }
      } else if (payload.data) {
        saveDemoAnnouncement(payload.data);
      }
      dispatchLocalEntityUpdate('announcements');
      if (targetClient) {
        targetClient.invalidateQueries({ queryKey: ['announcements'] });
      }
      break;
    }

    case 'students': {
      if (payload.action === 'delete') {
        const targetId = payload.id || payload.data?.id;
        if (targetId) {
          deleteStudent(targetId);
        }
      } else if (payload.data) {
        upsertRegisteredStudentLocally(payload.data as RegisteredStudentEntry);
      }
      dispatchLocalEntityUpdate('students');
      if (targetClient) {
        targetClient.invalidateQueries({ queryKey: ['students'] });
      }
      break;
    }

    case 'chat': {
      if (payload.data) {
        upsertChatMessageLocally(payload.data);
      }
      dispatchLocalEntityUpdate('chat');
      break;
    }
  }
}

/**
 * Broadcasts an update across all active devices and browser tabs immediately.
 * Called whenever Admin or a student creates, updates, or deletes any study data.
 */
export async function broadcastDataChange(
  entity: RealtimeEntity,
  action: RealtimeAction,
  dataOrId: any
): Promise<void> {
  const isDelete = action === 'delete';
  const targetId = isDelete
    ? typeof dataOrId === 'string'
      ? dataOrId
      : dataOrId?.id
    : dataOrId?.id;

  const payload: RealtimeSyncPayload = {
    entity,
    action,
    id: targetId,
    data: isDelete ? undefined : dataOrId,
    senderDeviceId: DEVICE_ID,
    timestamp: new Date().toISOString(),
  };

  // 1. Immediate local window dispatch
  dispatchLocalEntityUpdate(entity);

  // 2. Invalidate local React Query cache
  if (globalQueryClient) {
    globalQueryClient.invalidateQueries({ queryKey: [entity] });
    if (entity === 'resources') {
      globalQueryClient.invalidateQueries({ queryKey: ['subjects'] });
    }
  }

  // 3. Dispatch to other browser tabs on this device (0ms latency)
  if (tabBus) {
    try {
      tabBus.postMessage(payload);
    } catch {
      // Ignore
    }
  }

  // Storage fallback for cross-tab communication
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        'studyhub_tab_sync_pulse',
        JSON.stringify({ ...payload, _pulse: Math.random() })
      );
    }
  } catch {
    // Ignore storage quota
  }

  // 4. Broadcast to other physical devices (Mobile, Laptop, Tablet) via Supabase Realtime
  if (isSupabaseConfigured && activeChannel) {
    try {
      await activeChannel.send({
        type: 'broadcast',
        event: BROADCAST_EVENT,
        payload,
      });
    } catch (broadcastErr) {
      console.warn('[Hammad StudyHub] Realtime broadcast notice:', broadcastErr);
    }
  }
}

/**
 * Initializes the full multi-device realtime synchronization listener
 */
export function initRealtimeSync(queryClient: QueryClient): () => void {
  globalQueryClient = queryClient;

  if (isInitialized && activeChannel) {
    return () => {};
  }
  isInitialized = true;

  // 1. Setup Cross-Tab Local Broadcast Channel
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    try {
      tabBus = new BroadcastChannel(TAB_BUS_NAME);
      tabBus.onmessage = (event) => {
        if (event.data && event.data.senderDeviceId !== DEVICE_ID) {
          handleIncomingSyncEvent(event.data, queryClient);
        }
      };
    } catch (e) {
      console.warn('Cross-tab BroadcastChannel unavailable:', e);
    }
  }

  // Cross-tab storage event fallback
  const handleStoragePulse = (e: StorageEvent) => {
    if (e.key === 'studyhub_tab_sync_pulse' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed.senderDeviceId !== DEVICE_ID) {
          handleIncomingSyncEvent(parsed, queryClient);
        }
      } catch {
        // Ignore JSON error
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStoragePulse);
  }

  // 2. Setup Supabase Realtime WebSocket Connection
  if (isSupabaseConfigured) {
    try {
      activeChannel = supabase
        .channel(SYNC_CHANNEL_NAME, {
          config: {
            broadcast: { self: false },
          },
        })
        // A. Listen for sub-second client-to-client broadcasts (from phone to laptop)
        .on('broadcast', { event: BROADCAST_EVENT }, ({ payload }: any) => {
          if (payload && payload.senderDeviceId !== DEVICE_ID) {
            handleIncomingSyncEvent(payload, queryClient);
          }
        })
        // B. Listen for PostgreSQL DB level changes on resources
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'resources' },
          (changePayload: any) => {
            const { eventType, new: newRec, old: oldRec } = changePayload;
            if (eventType === 'DELETE') {
              handleIncomingSyncEvent(
                {
                  entity: 'resources',
                  action: 'delete',
                  id: oldRec?.id,
                  senderDeviceId: 'postgres',
                  timestamp: new Date().toISOString(),
                },
                queryClient
              );
            } else if (newRec) {
              handleIncomingSyncEvent(
                {
                  entity: 'resources',
                  action: eventType === 'INSERT' ? 'create' : 'update',
                  data: newRec,
                  senderDeviceId: 'postgres',
                  timestamp: new Date().toISOString(),
                },
                queryClient
              );
            }
          }
        )
        // C. Listen for PostgreSQL DB level changes on subjects
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'subjects' },
          (changePayload: any) => {
            const { eventType, new: newRec, old: oldRec } = changePayload;
            if (eventType === 'DELETE') {
              handleIncomingSyncEvent(
                {
                  entity: 'subjects',
                  action: 'delete',
                  id: oldRec?.id,
                  senderDeviceId: 'postgres',
                  timestamp: new Date().toISOString(),
                },
                queryClient
              );
            } else if (newRec) {
              handleIncomingSyncEvent(
                {
                  entity: 'subjects',
                  action: eventType === 'INSERT' ? 'create' : 'update',
                  data: newRec,
                  senderDeviceId: 'postgres',
                  timestamp: new Date().toISOString(),
                },
                queryClient
              );
            }
          }
        )
        // D. Listen for PostgreSQL DB level changes on announcements
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'announcements' },
          (changePayload: any) => {
            const { eventType, new: newRec, old: oldRec } = changePayload;
            if (eventType === 'DELETE') {
              handleIncomingSyncEvent(
                {
                  entity: 'announcements',
                  action: 'delete',
                  id: oldRec?.id,
                  senderDeviceId: 'postgres',
                  timestamp: new Date().toISOString(),
                },
                queryClient
              );
            } else if (newRec) {
              handleIncomingSyncEvent(
                {
                  entity: 'announcements',
                  action: eventType === 'INSERT' ? 'create' : 'update',
                  data: newRec,
                  senderDeviceId: 'postgres',
                  timestamp: new Date().toISOString(),
                },
                queryClient
              );
            }
          }
        )
        // E. Listen for PostgreSQL DB level changes on registered students
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'registered_students' },
          (changePayload: any) => {
            const { eventType, new: newRec, old: oldRec } = changePayload;
            if (eventType === 'DELETE') {
              handleIncomingSyncEvent(
                {
                  entity: 'students',
                  action: 'delete',
                  id: oldRec?.id,
                  senderDeviceId: 'postgres',
                  timestamp: new Date().toISOString(),
                },
                queryClient
              );
            } else if (newRec) {
              handleIncomingSyncEvent(
                {
                  entity: 'students',
                  action: eventType === 'INSERT' ? 'create' : 'update',
                  data: newRec,
                  senderDeviceId: 'postgres',
                  timestamp: new Date().toISOString(),
                },
                queryClient
              );
            }
          }
        )
        .subscribe((status: string, err?: any) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Hammad StudyHub] Multi-device Realtime Sync channel connected.');
          } else if (err) {
            console.warn('[Hammad StudyHub] Realtime channel status notice:', status, err);
          }
        });
    } catch (err) {
      console.warn('[Hammad StudyHub] Supabase realtime initialization notice:', err);
    }
  }

  // Cleanup handler
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStoragePulse);
    }
    if (tabBus) {
      tabBus.close();
      tabBus = null;
    }
    if (activeChannel) {
      supabase.removeChannel(activeChannel);
      activeChannel = null;
    }
    isInitialized = false;
  };
}

