// ==============================================================================
// HAMMAD STUDYHUB — SUPABASE CLIENT CONFIGURATION
// Architect: Muhammad Hammad
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const forceDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

/**
 * Checks whether legitimate, non-placeholder Supabase credentials are configured
 */
export function checkSupabaseConfiguration(): boolean {
  if (forceDemoMode) return false;
  if (!supabaseUrl || !supabaseAnonKey) return false;
  
  // Guard against unedited template placeholder strings
  if (
    supabaseUrl.includes('your-project-id') ||
    supabaseAnonKey.includes('your-anon-key-here') ||
    supabaseUrl.trim() === '' ||
    supabaseAnonKey.trim() === ''
  ) {
    return false;
  }

  try {
    const url = new URL(supabaseUrl);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = checkSupabaseConfiguration();

// Initialize Supabase client if configured, otherwise create a mock-safe instance
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder-project.supabase.co', 'placeholder-anon-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
