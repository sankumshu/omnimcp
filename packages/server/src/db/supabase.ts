/**
 * Supabase Client
 * Singleton instance for database and auth operations
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types.js';

export type SupabaseClient = ReturnType<typeof createClient<Database>>;

// Supabase client singleton
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get Supabase client instance
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env'
      );
    }

    supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Server-side, no session persistence
      },
    });
  }

  return supabaseInstance;
}

// Lazy-loaded default instance (only initialized when accessed)
let defaultSupabase: SupabaseClient | null = null;
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!defaultSupabase) {
      defaultSupabase = getSupabase();
    }
    return (defaultSupabase as any)[prop];
  }
});
