import { supabaseServerClient } from './supabase-server-client'

export async function checkRateLimiter(ip: string): Promise<{ allowed: boolean; retryAfter?: number; message?: string }> {
  try {
    const { data, error } = await supabaseServerClient().rpc('consume_auth_attempt', { p_key: ip })
    if (error || !data || typeof data.allowed !== 'boolean') throw error ?? new Error('Invalid rate limit response')
    if (data.allowed) return { allowed: true }
    const retryAfter = Math.max(1, Number(data.retry_after) || 60)
    return { allowed: false, retryAfter, message: `Too many attempts. Please try again in ${retryAfter} seconds.` }
  } catch (error) {
    console.error('[RateLimiter] Verification unavailable:', error)
    return { allowed: false, retryAfter: 60, message: 'Sign-in is temporarily unavailable. Please try again shortly.' }
  }
}
