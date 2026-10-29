// ==============================================================================
// HAMMAD STUDYHUB — FEEDBACK & REPORTING HOOK
// ==============================================================================

import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FeedbackSubmission } from '../types';
import { submitDemoFeedback, getDemoFeedback } from '../lib/demoStore';

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: async (submission: FeedbackSubmission) => {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('feedback').insert({
          category: submission.category,
          message: submission.message,
          contact_email: submission.contact_email || null,
          resource_id: submission.resource_id || null,
          status: 'pending',
        });
        if (error) throw new Error(error.message);
      } else {
        submitDemoFeedback(submission);
      }
    },
  });
}

export function useAdminFeedback() {
  return useQuery({
    queryKey: ['admin_feedback'],
    queryFn: async (): Promise<FeedbackSubmission[]> => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('feedback')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data as FeedbackSubmission[]) || [];
      } else {
        return getDemoFeedback();
      }
    },
  });
}
