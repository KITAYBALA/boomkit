import { supabaseServerClient } from './supabase-server-client'

const MAX_REQUESTS = 5; // 5 login attempts
const WINDOW_MS = 60 * 1000; // per minute
const BLOCK_MS = 5 * 60 * 1000; // 5 minute block after MAX_REQUESTS

export async function checkRateLimiter(ip: string): Promise<{ allowed: boolean; retryAfter?: number; message?: string }> {
    const supabase = supabaseServerClient()
    const now = new Date()

    try {
        // 1. Delete expired rate limits
        await supabase
            .from('rate_limits')
            .delete()
            .lt('reset_time', now.toISOString())

        // 2. Fetch current entry for this IP
        const { data: entry, error } = await supabase
            .from('rate_limits')
            .select('count, reset_time')
            .eq('ip', ip)
            .maybeSingle()

        if (error) {
            console.error('[RateLimiter] Database fetch error:', error)
            return { allowed: true }
        }

        if (!entry) {
            // Create new entry
            const resetTime = new Date(Date.now() + WINDOW_MS)
            await supabase
                .from('rate_limits')
                .insert({
                    ip,
                    count: 1,
                    reset_time: resetTime.toISOString()
                })
            return { allowed: true }
        }

        const resetTimeVal = new Date(entry.reset_time).getTime()
        const diffMs = resetTimeVal - Date.now()

        if (entry.count >= MAX_REQUESTS) {
            let waitSeconds = Math.ceil(diffMs / 1000)
            if (waitSeconds <= 0) {
                await supabase.from('rate_limits').delete().eq('ip', ip)
                return { allowed: true }
            }

            // Check if we need to apply the block penalty
            if (diffMs < BLOCK_MS - WINDOW_MS) {
                const newResetTime = new Date(Date.now() + BLOCK_MS)
                await supabase
                    .from('rate_limits')
                    .update({ reset_time: newResetTime.toISOString() })
                    .eq('ip', ip)
                waitSeconds = Math.ceil(BLOCK_MS / 1000)
            }

            return {
                allowed: false,
                retryAfter: waitSeconds,
                message: `Too many attempts. Please try again in ${waitSeconds} seconds.`
            }
        }

        // Increment count
        await supabase
            .from('rate_limits')
            .update({ count: entry.count + 1 })
            .eq('ip', ip)

        return { allowed: true }
    } catch (dbErr) {
        console.error('[RateLimiter] Unexpected database error:', dbErr)
        return { allowed: true }
    }
}
