// ==============================================================================
// HAMMAD STUDYHUB — RESOURCES DATA HOOKS
// Supports date filtering, type categorization, and Google Drive URL resolution
// ==============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Resource, ResourceFilters, PublicationStatus } from '../types';
import {
  getDemoResources,
  saveDemoResource,
  deleteDemoResource,
  getDemoSubjects,
} from '../lib/demoStore';
import { resolveEmbedUrl, detectSourceProvider } from '../lib/googleDrive';
import { slugify } from '../lib/utils';
import { broadcastDataChange } from '../lib/realtimeSync';

export function useResources(
  subjectIdOrSlug?: string,
  filters?: ResourceFilters,
  options: { includeDrafts?: boolean } = {}
) {
  return useQuery({
    queryKey: ['resources', subjectIdOrSlug, filters, options],
    refetchInterval: 8000,
    refetchOnWindowFocus: true,
    staleTime: 0,
    queryFn: async (): Promise<Resource[]> => {
      let resources: Resource[] = [];
      const localResources = getDemoResources();
      const localSubjects = getDemoSubjects();

      if (isSupabaseConfigured) {
        try {
          let query = supabase
            .from('resources')
            .select(`
              *,
              subject:subjects(*)
            `)
            .order('lesson_date', { ascending: filters?.sortOrder === 'date-asc' })
            .order('published_at', { ascending: false });

          if (!options.includeDrafts) {
            query = query.eq('status', 'published');
          }

          if (subjectIdOrSlug) {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              subjectIdOrSlug
            );
            if (isUUID) {
              query = query.eq('subject_id', subjectIdOrSlug);
            } else {
              // Find subject ID by slug first
              const { data: sub } = await supabase
                .from('subjects')
                .select('id')
                .eq('slug', subjectIdOrSlug)
                .single();
              if (sub) {
                query = query.eq('subject_id', sub.id);
              }
            }
          }

          if (filters?.resourceType && filters.resourceType !== 'all') {
            query = query.eq('resource_type', filters.resourceType);
          }

          if (filters?.dateFrom) {
            query = query.gte('lesson_date', filters.dateFrom);
          }

          if (filters?.dateTo) {
            query = query.lte('lesson_date', filters.dateTo);
          }

          if (filters?.chapter) {
            query = query.eq('chapter', filters.chapter);
          }

          const { data, error } = await query;
          if (!error && data) {
            resources = ((data as Resource[]) || []).filter(
              (r) => !r.id.startsWith('55555555-') && !r.subject_id.startsWith('44444444-')
            );
            // Hydrate local cache and IndexedDB with data from Supabase for zero-latency cross-device access
            resources.forEach((r) => {
              saveDemoResource(r);
            });
          } else if (error) {
            console.warn('Supabase resources fetch notice (using local store):', error.message);
          }
        } catch (e: any) {
          console.warn('Supabase resources exception (using local store):', e?.message);
        }
      }

      // Merge Supabase resources with local resources
      const mergedMap = new Map<string, Resource>();
      // 1. Add local resources with subject enrichment
      localResources.forEach((r) => {
        const enriched = {
          ...r,
          subject: r.subject || localSubjects.find((s) => s.id === r.subject_id),
        };
        mergedMap.set(r.id, enriched);
      });
      // 2. Add Supabase resources (matching id or new)
      resources.forEach((r) => mergedMap.set(r.id, r));

      let allResources = Array.from(mergedMap.values());

      if (!options.includeDrafts) {
        allResources = allResources.filter((r) => r.status === 'published');
      }

      if (subjectIdOrSlug) {
        const matchedSubject = localSubjects.find(
          (s) => s.slug === subjectIdOrSlug || s.id === subjectIdOrSlug
        );
        allResources = allResources.filter(
          (r) =>
            r.subject_id === subjectIdOrSlug ||
            r.subject?.slug === subjectIdOrSlug ||
            (matchedSubject && r.subject_id === matchedSubject.id)
        );
      }

      if (filters?.resourceType && filters.resourceType !== 'all') {
        allResources = allResources.filter((r) => r.resource_type === filters.resourceType);
      }

      if (filters?.dateFrom) {
        allResources = allResources.filter((r) => r.lesson_date >= filters.dateFrom!);
      }

      if (filters?.dateTo) {
        allResources = allResources.filter((r) => r.lesson_date <= filters.dateTo!);
      }

      if (filters?.chapter) {
        allResources = allResources.filter((r) => r.chapter === filters.chapter);
      }

      if (filters?.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        allResources = allResources.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            (r.description && r.description.toLowerCase().includes(q)) ||
            (r.topic && r.topic.toLowerCase().includes(q)) ||
            (r.tags && r.tags.some((t) => t.toLowerCase().includes(q)))
        );
      }

      // Sort
      allResources.sort((a, b) => {
        if (filters?.sortOrder === 'date-asc') {
          return a.lesson_date.localeCompare(b.lesson_date);
        }
        if (filters?.sortOrder === 'title-asc') {
          return a.title.localeCompare(b.title);
        }
        return b.lesson_date.localeCompare(a.lesson_date);
      });

      return allResources;
    },
  });
}

export function useResource(idOrSlug: string) {
  return useQuery({
    queryKey: ['resource', idOrSlug],
    queryFn: async (): Promise<Resource | null> => {
      if (!idOrSlug) return null;

      if (isSupabaseConfigured) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          idOrSlug
        );
        let query = supabase
          .from('resources')
          .select(`
            *,
            subject:subjects(*)
          `);

        if (isUUID) {
          query = query.eq('id', idOrSlug);
        } else {
          query = query.eq('slug', idOrSlug);
        }

        const { data, error } = await query.single();
        if (error) {
          console.error('Error fetching resource:', error.message);
          return null;
        }
        return data as Resource;
      } else {
        const resources = getDemoResources();
        const subjects = getDemoSubjects();
        const found = resources.find((r) => r.id === idOrSlug || r.slug === idOrSlug);
        if (!found) return null;
        return {
          ...found,
          subject: subjects.find((s) => s.id === found.subject_id),
        };
      }
    },
    enabled: Boolean(idOrSlug),
  });
}

export function useLatestResources(limit = 6) {
  return useQuery({
    queryKey: ['resources', 'latest', limit],
    queryFn: async (): Promise<Resource[]> => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('resources')
          .select(`
            *,
            subject:subjects(*)
          `)
          .eq('status', 'published')
          .order('lesson_date', { ascending: false })
          .limit(limit);

        if (error) throw new Error(error.message);
        return (data as Resource[]) || [];
      } else {
        const resources = getDemoResources().filter((r) => r.status === 'published');
        const subjects = getDemoSubjects();
        const enriched = resources.map((r) => ({
          ...r,
          subject: subjects.find((s) => s.id === r.subject_id),
        }));
        enriched.sort((a, b) => b.lesson_date.localeCompare(a.lesson_date));
        return enriched.slice(0, limit);
      }
    },
  });
}

function isUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function useResourceMutations() {
  const queryClient = useQueryClient();

  const createResource = useMutation({
    mutationFn: async (
      input: Omit<Resource, 'id' | 'created_at' | 'updated_at' | 'embed_url' | 'source_provider'> & {
        source_provider?: Resource['source_provider'];
      }
    ) => {
      const provider = input.source_provider || detectSourceProvider(input.external_url);
      const embedUrl = resolveEmbedUrl(input.external_url, provider) || undefined;
      const slug = input.slug || slugify(input.title);
      const publishedAt =
        input.status === 'published' ? new Date().toISOString() : undefined;
      const now = new Date().toISOString();

      const inputId = (input as any).id;
      const validUUID = isUUID(inputId)
        ? inputId
        : typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : undefined;

      const tempId = validUUID || (inputId && !inputId.startsWith('res-') ? inputId : `res-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

      const newRes: Resource = {
        ...input,
        id: tempId,
        slug,
        source_provider: provider,
        embed_url: embedUrl,
        published_at: publishedAt,
        created_at: now,
        updated_at: now,
      };

      // 1. ALWAYS save to local store & IndexedDB first
      saveDemoResource(newRes);

      // 2. If Supabase configured, attempt remote sync
      if (isSupabaseConfigured) {
        try {
          // Resolve subject_id to UUID if needed
          let resolvedSubjectId = input.subject_id;
          if (!isUUID(resolvedSubjectId)) {
            try {
              const { data: subData } = await supabase
                .from('subjects')
                .select('id')
                .or(`slug.eq.${resolvedSubjectId},id.eq.${resolvedSubjectId}`)
                .maybeSingle();
              if (subData?.id) {
                resolvedSubjectId = subData.id;
              }
            } catch {
              // ignore
            }
          }

          const supabasePayload: Record<string, any> = {
            title: input.title.trim(),
            slug,
            subject_id: resolvedSubjectId,
            resource_type: input.resource_type || 'pdf',
            lesson_date: input.lesson_date || now.substring(0, 10),
            source_provider: provider,
            external_url: input.external_url?.trim() || '#',
            embed_url: embedUrl || null,
            description: input.description?.trim() || null,
            topic: input.topic?.trim() || null,
            chapter: input.chapter?.trim() || null,
            tags: Array.isArray(input.tags) ? input.tags : [],
            status: input.status || 'published',
            published_at: publishedAt || now,
          };

          if (validUUID) {
            supabasePayload.id = validUUID;
          }

          if (input.file_name) supabasePayload.file_name = input.file_name;
          if (input.file_size) supabasePayload.file_size = input.file_size;
          if (input.mime_type) supabasePayload.mime_type = input.mime_type;
          if (input.original_filename) supabasePayload.original_filename = input.original_filename;
          if (input.google_drive_folder_url) supabasePayload.google_drive_folder_url = input.google_drive_folder_url;
          if (input.google_drive_file_id) supabasePayload.google_drive_file_id = input.google_drive_file_id;

          const fileData = (input as any).file_data;
          if (fileData) {
            supabasePayload.file_data = fileData;
          }

          let { data, error } = await supabase
            .from('resources')
            .insert(supabasePayload)
            .select(`*, subject:subjects(*)`)
            .single();

          // If insert failed and file_data was included, retry without file_data
          // in case Supabase schema cache or payload size limit was hit
          if (error && fileData) {
            console.warn('Retrying Supabase resource insert without file_data payload:', error.message);
            const { file_data: _, ...payloadWithoutData } = supabasePayload;
            const retryRes = await supabase
              .from('resources')
              .insert(payloadWithoutData)
              .select(`*, subject:subjects(*)`)
              .single();

            if (!retryRes.error && retryRes.data) {
              data = { ...retryRes.data, file_data: fileData } as any;
              error = null;
            }
          }

          if (!error && data) {
            deleteDemoResource(tempId);
            saveDemoResource(data as Resource);
            return data as Resource;
          } else if (error) {
            console.warn('Supabase resource insert notice (persisted locally):', error.message);
          }
        } catch (e: any) {
          console.warn('Supabase resource sync exception (persisted locally):', e?.message);
        }
      }

      return newRes;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      broadcastDataChange('resources', 'create', data);
    },
  });

  const updateResource = useMutation({
    mutationFn: async (input: Partial<Resource> & { id: string }) => {
      let embedUrl = input.embed_url;
      let provider = input.source_provider;

      if (input.external_url) {
        provider = provider || detectSourceProvider(input.external_url);
        embedUrl = resolveEmbedUrl(input.external_url, provider) || undefined;
      }

      // 1. Update locally
      const localList = getDemoResources();
      const existing = localList.find((r) => r.id === input.id);
      const updated: Resource = existing
        ? {
            ...existing,
            ...input,
            source_provider: provider || existing.source_provider,
            embed_url: embedUrl !== undefined ? embedUrl : existing.embed_url,
            published_at:
              input.status === 'published' && !existing.published_at
                ? new Date().toISOString()
                : input.published_at || existing.published_at,
            updated_at: new Date().toISOString(),
          }
        : ({ ...input } as Resource);
      saveDemoResource(updated);

      // 2. Update Supabase
      if (isSupabaseConfigured) {
        try {
          const updatePayload: Record<string, any> = {};
          if (input.title !== undefined) updatePayload.title = input.title.trim();
          if (input.slug !== undefined) updatePayload.slug = input.slug;
          if (input.subject_id !== undefined) updatePayload.subject_id = input.subject_id;
          if (input.resource_type !== undefined) updatePayload.resource_type = input.resource_type;
          if (input.lesson_date !== undefined) updatePayload.lesson_date = input.lesson_date;
          if (input.external_url !== undefined) updatePayload.external_url = input.external_url.trim() || '#';
          if (provider !== undefined) updatePayload.source_provider = provider;
          if (embedUrl !== undefined) updatePayload.embed_url = embedUrl;
          if (input.description !== undefined) updatePayload.description = input.description?.trim() || null;
          if (input.topic !== undefined) updatePayload.topic = input.topic?.trim() || null;
          if (input.chapter !== undefined) updatePayload.chapter = input.chapter?.trim() || null;
          if (input.tags !== undefined) updatePayload.tags = Array.isArray(input.tags) ? input.tags : [];
          if (input.status !== undefined) updatePayload.status = input.status;
          if (input.published_at !== undefined) updatePayload.published_at = input.published_at;
          if (input.file_name !== undefined) updatePayload.file_name = input.file_name;
          if (input.file_size !== undefined) updatePayload.file_size = input.file_size;
          if (input.mime_type !== undefined) updatePayload.mime_type = input.mime_type;
          if (input.original_filename !== undefined) updatePayload.original_filename = input.original_filename;
          if ((input as any).file_data !== undefined) updatePayload.file_data = (input as any).file_data;

          const { data, error } = await supabase
            .from('resources')
            .update(updatePayload)
            .eq('id', input.id)
            .select(`*, subject:subjects(*)`)
            .single();

          if (!error && data) {
            saveDemoResource(data as Resource);
            return data as Resource;
          } else if (error) {
            console.warn('Supabase resource update notice (persisted locally):', error.message);
          }
        } catch (e: any) {
          console.warn('Supabase resource update exception (persisted locally):', e?.message);
        }
      }

      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resource', data.id] });
      queryClient.invalidateQueries({ queryKey: ['resource', data.slug] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      broadcastDataChange('resources', 'update', data);
    },
  });

  const deleteResource = useMutation({
    mutationFn: async (id: string) => {
      // 1. Delete locally
      deleteDemoResource(id);

      // 2. Delete from Supabase
      if (isSupabaseConfigured) {
        try {
          await supabase.from('resources').delete().eq('id', id);
        } catch (e: any) {
          console.warn('Supabase resource delete exception:', e?.message);
        }
      }
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      broadcastDataChange('resources', 'delete', deletedId);
    },
  });

  const bulkImportResources = useMutation({
    mutationFn: async (resources: Array<Omit<Resource, 'id' | 'created_at' | 'updated_at'>>) => {
      const prepared = resources.map((r, index) => {
        const provider = r.source_provider || detectSourceProvider(r.external_url);
        return {
          ...r,
          id: `res-bulk-${Date.now()}-${index}`,
          source_provider: provider,
          embed_url: resolveEmbedUrl(r.external_url, provider) || undefined,
          slug: r.slug || slugify(r.title),
          published_at: r.status === 'published' ? new Date().toISOString() : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      // Always save locally
      prepared.forEach((item) => saveDemoResource(item));

      // Attempt Supabase
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.from('resources').insert(prepared).select();
          if (!error && data) {
            return data as Resource[];
          }
        } catch (e: any) {
          console.warn('Supabase bulk import notice:', e?.message);
        }
      }

      return prepared;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      if (Array.isArray(data)) {
        data.forEach((item) => broadcastDataChange('resources', 'create', item));
      }
    },
  });

  return { createResource, updateResource, deleteResource, bulkImportResources };
}
