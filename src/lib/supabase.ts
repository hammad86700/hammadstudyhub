// ==============================================================================
// HAMMAD STUDYHUB — SUPABASE CLIENT CONFIGURATION
// Architect: Muhammad Hammad
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const forceDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

/**
 * Strips subpaths (like /rest/v1 or /auth/v1), trailing slashes, and quotes
 * from the Supabase project URL to prevent "Invalid path specified in request URL"
 */
export function sanitizeSupabaseUrl(raw?: string): string {
  if (!raw) return '';
  let cleaned = raw.trim().replace(/^["']|["']$/g, '');
  try {
    const parsed = new URL(cleaned);
    // Return pure origin (protocol + hostname + optional port), e.g. "https://xyz.supabase.co"
    return parsed.origin;
  } catch {
    return cleaned.replace(/\/+$/, '');
  }
}

/**
 * Cleans the Supabase anon key of whitespace and surrounding quotes
 */
export function sanitizeSupabaseKey(raw?: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^["']|["']$/g, '');
}

export const supabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl);
export const supabaseAnonKey = sanitizeSupabaseKey(rawSupabaseAnonKey);

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
  ? createClient(supabaseUrl, supabaseAnonKey, {
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
