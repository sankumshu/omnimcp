/**
 * Supabase Client
 * Singleton instance for database and auth operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types.js';

// Supabase client singleton
let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Get Supabase client instance
 */
export function getSupabase(): SupabaseClient<Database> {
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

// Export default instance
export const supabase = getSupabase();
