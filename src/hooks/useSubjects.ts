// ==============================================================================
// HAMMAD STUDYHUB — SUBJECTS DATA HOOKS
// ==============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Subject, SubjectFilters } from '../types';
import {
  getDemoSubjects,
  saveDemoSubject,
  deleteDemoSubject,
  getDemoResources,
} from '../lib/demoStore';
import { slugify } from '../lib/utils';
import { broadcastDataChange } from '../lib/realtimeSync';

export function useSubjects(filters?: SubjectFilters) {
  return useQuery({
    queryKey: ['subjects', filters],
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 0,
    queryFn: async (): Promise<Subject[]> => {
      let subjects: Subject[] = [];
      const localSubjects = getDemoSubjects();

      if (isSupabaseConfigured) {
        try {
          let query = supabase
            .from('subjects')
            .select(`
              *,
              institution:institutions(*),
              program:academic_programs(*),
              semester:semesters(*)
            `)
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true });

          if (filters?.featuredOnly) {
            query = query.eq('is_featured', true);
          }
          if (filters?.programId) {
            query = query.eq('program_id', filters.programId);
          }

          const { data, error } = await query;
          if (!error && data) {
            subjects = ((data as Subject[]) || []).filter((s) => !s.id.startsWith('44444444-'));
            // Hydrate local store with remote subjects
            subjects.forEach((s) => {
              saveDemoSubject(s);
            });
          } else if (error) {
            console.warn('Supabase subjects fetch notice (using local store):', error.message);
          }
        } catch (e: any) {
          console.warn('Supabase fetch exception (using local store):', e?.message);
        }
      }

      // Merge Supabase subjects with local subjects (ensures newly added subjects are never lost)
      const mergedMap = new Map<string, Subject>();
      // 1. Add local subjects first
      localSubjects.forEach((s) => mergedMap.set(s.id, s));
      // 2. Add Supabase subjects (overwrites matching ID or adds new)
      subjects.forEach((s) => mergedMap.set(s.id, s));

      let allSubjects = Array.from(mergedMap.values());

      // Fetch / Calculate resource counts
      const resources = getDemoResources().filter((r) => r.status === 'published');
      allSubjects = allSubjects.map((s) => {
        const subResources = resources.filter((r) => r.subject_id === s.id);
        const sorted = [...subResources].sort((a, b) => b.lesson_date.localeCompare(a.lesson_date));
        return {
          ...s,
          resource_count: s.resource_count || subResources.length,
          latest_lesson_date: s.latest_lesson_date || sorted[0]?.lesson_date,
        };
      });

      if (filters?.featuredOnly) {
        allSubjects = allSubjects.filter((s) => s.is_featured);
      }
      if (filters?.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        allSubjects = allSubjects.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            (s.description && s.description.toLowerCase().includes(q))
        );
      }

      return allSubjects;
    },
  });
}

export function useSubject(slugOrId: string) {
  return useQuery({
    queryKey: ['subject', slugOrId],
    queryFn: async (): Promise<Subject | null> => {
      if (!slugOrId) return null;

      // 1. Check local store
      const localSubjects = getDemoSubjects();
      const localFound = localSubjects.find((s) => s.slug === slugOrId || s.id === slugOrId);

      if (isSupabaseConfigured) {
        try {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
          let query = supabase
            .from('subjects')
            .select(`
              *,
              institution:institutions(*),
              program:academic_programs(*),
              semester:semesters(*)
            `);

          if (isUUID) {
            query = query.eq('id', slugOrId);
          } else {
            query = query.eq('slug', slugOrId);
          }

          const { data, error } = await query.single();
          if (!error && data) {
            return data as Subject;
          }
        } catch (e: any) {
          console.warn('Supabase fetch error for subject:', e?.message);
        }
      }

      return localFound || null;
    },
    enabled: Boolean(slugOrId),
  });
}

export function useSubjectMutations() {
  const queryClient = useQueryClient();

  const createSubject = useMutation({
    mutationFn: async (input: Omit<Subject, 'id' | 'created_at' | 'updated_at'>) => {
      const slug = input.slug || slugify(input.name);
      const tempId = `subj-${Date.now()}`;
      const now = new Date().toISOString();

      const newSubject: Subject = {
        ...input,
        id: tempId,
        slug,
        created_at: now,
        updated_at: now,
      };

      // 1. ALWAYS save to persistent local store first so user never loses their data
      saveDemoSubject(newSubject);

      // 2. If Supabase is configured, attempt to sync remotely
      if (isSupabaseConfigured) {
        try {
          const payload: any = {
            name: input.name.trim(),
            slug,
            code: input.code.trim().toUpperCase(),
            description: input.description || null,
            instructor: input.instructor || null,
            icon: input.icon || 'book-open',
            color: input.color || 'blue',
            is_featured: Boolean(input.is_featured),
            is_active: input.is_active !== false,
            sort_order: Number(input.sort_order) || 0,
          };
          if (input.google_drive_folder_url) {
            payload.google_drive_folder_url = input.google_drive_folder_url;
          }
          if (input.google_drive_folder_id) {
            payload.google_drive_folder_id = input.google_drive_folder_id;
          }

          const { data, error } = await supabase
            .from('subjects')
            .insert(payload)
            .select()
            .single();

          if (!error && data) {
            // Replace temporary local ID with Supabase UUID
            deleteDemoSubject(tempId);
            saveDemoSubject(data as Subject);
            return data as Subject;
          } else if (error) {
            console.warn('Supabase subject insert notice (persisted locally):', error.message);
          }
        } catch (e: any) {
          console.warn('Supabase subject sync exception (persisted locally):', e?.message);
        }
      }

      return newSubject;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      broadcastDataChange('subjects', 'create', data);
    },
  });

  const updateSubject = useMutation({
    mutationFn: async (input: Partial<Subject> & { id: string }) => {
      // 1. Update in local store
      const localList = getDemoSubjects();
      const existing = localList.find((s) => s.id === input.id);
      let updated = existing ? { ...existing, ...input, updated_at: new Date().toISOString() } : (input as Subject);
      saveDemoSubject(updated);

      // 2. If Supabase configured, attempt remote update
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('subjects')
            .update(input)
            .eq('id', input.id)
            .select()
            .single();

          if (!error && data) {
            saveDemoSubject(data as Subject);
            return data as Subject;
          } else if (error) {
            console.warn('Supabase update notice (persisted locally):', error.message);
          }
        } catch (e: any) {
          console.warn('Supabase update exception (persisted locally):', e?.message);
        }
      }

      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subject', data.slug] });
      queryClient.invalidateQueries({ queryKey: ['subject', data.id] });
      broadcastDataChange('subjects', 'update', data);
    },
  });

  const deleteSubject = useMutation({
    mutationFn: async (id: string) => {
      // 1. Delete from local store
      deleteDemoSubject(id);

      // 2. Delete from Supabase if configured
      if (isSupabaseConfigured) {
        try {
          await supabase.from('subjects').delete().eq('id', id);
        } catch (e: any) {
          console.warn('Supabase delete exception:', e?.message);
        }
      }
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      broadcastDataChange('subjects', 'delete', deletedId);
    },
  });

  return { createSubject, updateSubject, deleteSubject };
}
