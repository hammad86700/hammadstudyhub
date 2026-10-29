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
      if (isSupabaseConfigured) {
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
        if (error) throw new Error(error.message);

        let resources = (data as Resource[]) || [];

        if (filters?.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          resources = resources.filter(
            (r) =>
              r.title.toLowerCase().includes(q) ||
              (r.description && r.description.toLowerCase().includes(q)) ||
              (r.topic && r.topic.toLowerCase().includes(q)) ||
              (r.tags && r.tags.some((t) => t.toLowerCase().includes(q)))
          );
        }

        return resources;
      } else {
        // Demo Mode
        let resources = getDemoResources();
        const subjects = getDemoSubjects();

        // Join subjects
        resources = resources.map((r) => ({
          ...r,
          subject: subjects.find((s) => s.id === r.subject_id),
        }));

        if (!options.includeDrafts) {
          resources = resources.filter((r) => r.status === 'published');
        }

        if (subjectIdOrSlug) {
          const matchedSubject = subjects.find(
            (s) => s.slug === subjectIdOrSlug || s.id === subjectIdOrSlug
          );
          if (matchedSubject) {
            resources = resources.filter((r) => r.subject_id === matchedSubject.id);
          }
        }

        if (filters?.resourceType && filters.resourceType !== 'all') {
          resources = resources.filter((r) => r.resource_type === filters.resourceType);
        }

        if (filters?.dateFrom) {
          resources = resources.filter((r) => r.lesson_date >= filters.dateFrom!);
        }

        if (filters?.dateTo) {
          resources = resources.filter((r) => r.lesson_date <= filters.dateTo!);
        }

        if (filters?.chapter) {
          resources = resources.filter((r) => r.chapter === filters.chapter);
        }

        if (filters?.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          resources = resources.filter(
            (r) =>
              r.title.toLowerCase().includes(q) ||
              (r.description && r.description.toLowerCase().includes(q)) ||
              (r.topic && r.topic.toLowerCase().includes(q)) ||
              (r.tags && r.tags.some((t) => t.toLowerCase().includes(q)))
          );
        }

        // Sort
        resources.sort((a, b) => {
          if (filters?.sortOrder === 'date-asc') {
            return a.lesson_date.localeCompare(b.lesson_date);
          }
          if (filters?.sortOrder === 'title-asc') {
            return a.title.localeCompare(b.title);
          }
          return b.lesson_date.localeCompare(a.lesson_date);
        });

        return resources;
      }
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

      if (isSupabaseConfigured) {
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

        if (error) throw new Error(error.message);
        return data as Resource;
      } else {
        const newRes: Resource = {
          ...input,
          id: `res-${Date.now()}`,
          slug,
          source_provider: provider,
          embed_url: embedUrl,
          published_at: publishedAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return saveDemoResource(newRes);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
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

      if (isSupabaseConfigured) {
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

        if (error) throw new Error(error.message);
        return data as Resource;
      } else {
        const existing = getDemoResources().find((r) => r.id === input.id);
        if (!existing) throw new Error('Resource not found');
        const updated: Resource = {
          ...existing,
          ...input,
          source_provider: provider || existing.source_provider,
          embed_url: embedUrl !== undefined ? embedUrl : existing.embed_url,
          published_at:
            input.status === 'published' && !existing.published_at
              ? new Date().toISOString()
              : input.published_at || existing.published_at,
        };
        return saveDemoResource(updated);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resource', data.id] });
      queryClient.invalidateQueries({ queryKey: ['resource', data.slug] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  const deleteResource = useMutation({
    mutationFn: async (id: string) => {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('resources').delete().eq('id', id);
        if (error) throw new Error(error.message);
      } else {
        deleteDemoResource(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  const bulkImportResources = useMutation({
    mutationFn: async (resources: Array<Omit<Resource, 'id' | 'created_at' | 'updated_at'>>) => {
      const prepared = resources.map((r) => {
        const provider = r.source_provider || detectSourceProvider(r.external_url);
        return {
          ...r,
          source_provider: provider,
          embed_url: resolveEmbedUrl(r.external_url, provider) || undefined,
          slug: r.slug || slugify(r.title),
          published_at: r.status === 'published' ? new Date().toISOString() : undefined,
        };
      });

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('resources').insert(prepared).select();
        if (error) throw new Error(error.message);
        return data as Resource[];
      } else {
        const created: Resource[] = [];
        prepared.forEach((item, index) => {
          const res: Resource = {
            ...item,
            id: `res-bulk-${Date.now()}-${index}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          saveDemoResource(res);
          created.push(res);
        });
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  return { createResource, updateResource, deleteResource, bulkImportResources };
}
