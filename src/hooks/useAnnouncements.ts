// ==============================================================================
// HAMMAD STUDYHUB — ANNOUNCEMENTS DATA HOOKS
// ==============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Announcement } from '../types';
import {
  getDemoAnnouncements,
  saveDemoAnnouncement,
  deleteDemoAnnouncement,
} from '../lib/demoStore';

export function useAnnouncements(options: { includeDrafts?: boolean } = {}) {
  return useQuery({
    queryKey: ['announcements', options],
    queryFn: async (): Promise<Announcement[]> => {
      if (isSupabaseConfigured) {
        let query = supabase
          .from('announcements')
          .select(`
            *,
            subject:subjects(id, name, slug)
          `)
          .order('is_pinned', { ascending: false })
          .order('published_at', { ascending: false });

        if (!options.includeDrafts) {
          query = query.eq('status', 'published');
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return ((data as Announcement[]) || []).filter(
          (a) =>
            !a.id.startsWith('66666666-') &&
            a.title !== 'Welcome to Hammad StudyHub Fall 2026!' &&
            a.title !== 'Mid-Term Examination Schedule Announced' &&
            a.title !== 'CS-101 Programming Lab 02 Submission Deadline'
        );
      } else {
        let list = getDemoAnnouncements();
        if (!options.includeDrafts) {
          list = list.filter((a) => a.status === 'published');
        }
        return list;
      }
    },
  });
}

export function useAnnouncementMutations() {
  const queryClient = useQueryClient();

  const createAnnouncement = useMutation({
    mutationFn: async (input: Omit<Announcement, 'id' | 'created_at' | 'updated_at' | 'published_at'>) => {
      const publishedAt = new Date().toISOString();
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('announcements')
          .insert({
            ...input,
            published_at: publishedAt,
          })
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as Announcement;
      } else {
        const newAnn: Announcement = {
          ...input,
          id: `ann-${Date.now()}`,
          published_at: publishedAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return saveDemoAnnouncement(newAnn);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) throw new Error(error.message);
      } else {
        deleteDemoAnnouncement(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  return { createAnnouncement, deleteAnnouncement };
}
