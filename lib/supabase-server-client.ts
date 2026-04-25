import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Server-side Supabase client.
 * Uses SUPABASE_SERVICE_ROLE_KEY for trusted server routes.
 * Exported name must be "supabaseServerClient".
 */
export function supabaseServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Supabase server env vars missing. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.")
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export function getSupabaseServerClient(): SupabaseClient {
  return supabaseServerClient()
}
