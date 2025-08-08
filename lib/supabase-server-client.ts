import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns a singleton Supabase client for server-side code (route handlers, server actions).
 * - Uses SUPABASE_SERVICE_ROLE_KEY if present (server-only, NEVER expose to the client).
 * - Falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY if service role is not configured.
 *
 * Required envs:
 * - NEXT_PUBLIC_SUPABASE_URL (browser-safe; also fine on server)
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY (browser-safe; fallback for server)
 * - SUPABASE_SERVICE_ROLE_KEY (optional; server-only for admin tasks)
 *
 * Tip: Set these in your Vercel Project Settings > Environment Variables and redeploy.
 * Only variables prefixed with NEXT_PUBLIC_ can be used in the browser; others are server-only [^4].
 */

let cachedClient: SupabaseClient | null = null

function initServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      'Supabase: NEXT_PUBLIC_SUPABASE_URL is not set. Add it to your environment and redeploy.'
    )
  }
  if (!anon && !service) {
    throw new Error(
      'Supabase: Provide SUPABASE_SERVICE_ROLE_KEY (server-only) or NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  return createClient(url, service ?? (anon as string), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/**
 * Named export expected by your app.
 * Usage:
 *   const supabase = supabaseServerClient()
 *   const { data, error } = await supabase.from('chat_messages').select('*')
 */
export function supabaseServerClient(): SupabaseClient {
  if (cachedClient) return cachedClient
  cachedClient = initServerClient()
  return cachedClient
}

/**
 * Alias with a more descriptive name if you prefer.
 */
export const getSupabaseServerClient = supabaseServerClient
