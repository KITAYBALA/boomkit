'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null
let warned = false

/**
 * Safe browser client:
 * - Returns a Supabase client when env vars exist
 * - Returns null (and logs a warning) when they don't, so the app can fall back to localStorage
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    if (!warned) {
      console.warn(
        'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable Realtime.'
      )
      warned = true
    }
    return null
  }

  client = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
    realtime: { params: { eventsPerSecond: 10 } },
  })
  return client
}
