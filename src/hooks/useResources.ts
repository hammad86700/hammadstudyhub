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

export function useResources(
  subjectIdOrSlug?: string,
  filters?: ResourceFilters,
  options: { includeDrafts?: boolean } = {}
) {
  return useQuery({
    queryKey: ['resources', subjectIdOrSlug, filters, options],
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
            resources = (data as Resource[]) || [];
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
      const tempId = `res-${Date.now()}`;
      const now = new Date().toISOString();

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

      // 1. ALWAYS save to local store first
      saveDemoResource(newRes);

      // 2. If Supabase configured, attempt remote sync
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('resources')
            .insert({
              ...input,
              slug,
              source_provider: provider,
              embed_url: embedUrl,
              published_at: publishedAt,
            })
            .select(`*, subject:subjects(*)`)
            .single();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      window.dispatchEvent(new Event('studyhub_resources_updated'));
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
          const updatePayload: any = {
            ...input,
            source_provider: provider,
            embed_url: embedUrl,
          };
          if (input.status === 'published' && !input.published_at) {
            updatePayload.published_at = new Date().toISOString();
          }

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
      window.dispatchEvent(new Event('studyhub_resources_updated'));
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      window.dispatchEvent(new Event('studyhub_resources_updated'));
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      window.dispatchEvent(new Event('studyhub_resources_updated'));
    },
  });

  return { createResource, updateResource, deleteResource, bulkImportResources };
}
