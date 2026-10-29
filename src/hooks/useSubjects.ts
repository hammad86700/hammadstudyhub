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

export function useSubjects(filters?: SubjectFilters) {
  return useQuery({
    queryKey: ['subjects', filters],
    queryFn: async (): Promise<Subject[]> => {
      if (isSupabaseConfigured) {
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
        if (error) throw new Error(error.message);

        // Fetch resource counts
        const { data: countData } = await supabase
          .from('resources')
          .select('subject_id, lesson_date')
          .eq('status', 'published');

        const counts: Record<string, { count: number; latestDate?: string }> = {};
        if (countData) {
          countData.forEach((r) => {
            if (!counts[r.subject_id]) {
              counts[r.subject_id] = { count: 0, latestDate: r.lesson_date };
            }
            counts[r.subject_id].count++;
            if (!counts[r.subject_id].latestDate || r.lesson_date > counts[r.subject_id].latestDate!) {
              counts[r.subject_id].latestDate = r.lesson_date;
            }
          });
        }

        let subjects = (data as Subject[]) || [];
        subjects = subjects.map((s) => ({
          ...s,
          resource_count: counts[s.id]?.count || 0,
          latest_lesson_date: counts[s.id]?.latestDate,
        }));

        if (filters?.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          subjects = subjects.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.code.toLowerCase().includes(q) ||
              (s.description && s.description.toLowerCase().includes(q))
          );
        }

        return subjects;
      } else {
        // Demo Mode
        let subjects = getDemoSubjects();
        const resources = getDemoResources().filter((r) => r.status === 'published');

        subjects = subjects.map((s) => {
          const subResources = resources.filter((r) => r.subject_id === s.id);
          const sorted = [...subResources].sort((a, b) => b.lesson_date.localeCompare(a.lesson_date));
          return {
            ...s,
            resource_count: subResources.length,
            latest_lesson_date: sorted[0]?.lesson_date,
          };
        });

        if (filters?.featuredOnly) {
          subjects = subjects.filter((s) => s.is_featured);
        }
        if (filters?.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          subjects = subjects.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.code.toLowerCase().includes(q) ||
              (s.description && s.description.toLowerCase().includes(q))
          );
        }

        return subjects;
      }
    },
  });
}

export function useSubject(slugOrId: string) {
  return useQuery({
    queryKey: ['subject', slugOrId],
    queryFn: async (): Promise<Subject | null> => {
      if (!slugOrId) return null;

      if (isSupabaseConfigured) {
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
        if (error) {
          console.error('Error fetching subject:', error.message);
          return null;
        }
        return data as Subject;
      } else {
        const subjects = getDemoSubjects();
        const found = subjects.find((s) => s.slug === slugOrId || s.id === slugOrId);
        return found || null;
      }
    },
    enabled: Boolean(slugOrId),
  });
}

export function useSubjectMutations() {
  const queryClient = useQueryClient();

  const createSubject = useMutation({
    mutationFn: async (input: Omit<Subject, 'id' | 'created_at' | 'updated_at'>) => {
      const slug = input.slug || slugify(input.name);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('subjects')
          .insert({
            ...input,
            slug,
          })
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as Subject;
      } else {
        const newSubject: Subject = {
          ...input,
          id: `subj-${Date.now()}`,
          slug,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return saveDemoSubject(newSubject);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  const updateSubject = useMutation({
    mutationFn: async (input: Partial<Subject> & { id: string }) => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('subjects')
          .update(input)
          .eq('id', input.id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as Subject;
      } else {
        const existing = getDemoSubjects().find((s) => s.id === input.id);
        if (!existing) throw new Error('Subject not found');
        const updated = { ...existing, ...input };
        return saveDemoSubject(updated);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subject', data.slug] });
      queryClient.invalidateQueries({ queryKey: ['subject', data.id] });
    },
  });

  const deleteSubject = useMutation({
    mutationFn: async (id: string) => {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('subjects').delete().eq('id', id);
        if (error) throw new Error(error.message);
      } else {
        deleteDemoSubject(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  return { createSubject, updateSubject, deleteSubject };
}
