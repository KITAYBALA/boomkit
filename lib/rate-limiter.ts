// Simple memory-based rate limiter for Serverless API routes.
// NOTE: Vercel serverless functions are stateless and reset per instance.
// This is a basic mitigation. For persistent rate limiting across instances,
// a Redis store (e.g., Upstash) or a Supabase table is recommended.

const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

const MAX_REQUESTS = 5; // 5 login attempts
const WINDOW_MS = 60 * 1000; // per minute
const BLOCK_MS = 5 * 60 * 1000; // 5 minute block after MAX_REQUESTS

export function checkRateLimiter(ip: string): { allowed: boolean; retryAfter?: number; message?: string } {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
        return { allowed: true };
    }

    if (now > entry.resetTime) {
        // Window expired or block expired, reset
        rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
        return { allowed: true };
    }

    if (entry.count >= MAX_REQUESTS) {
        // Enforce lock out
        if (entry.resetTime - now < BLOCK_MS - WINDOW_MS) {
            // We are already in block mode
        } else {
            // We just reached max requests, set the block penalty
            entry.resetTime = now + BLOCK_MS;
        }

        const waitSeconds = Math.ceil((entry.resetTime - now) / 1000);
        return {
            allowed: false,
            retryAfter: waitSeconds,
            message: `Too many attempts. Please try again in ${waitSeconds} seconds.`
        };
    }

    // Increment count
    entry.count += 1;
    return { allowed: true };
}

// Memory cleanup utility to prevent Map growing infinitely
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
        if (now > entry.resetTime) {
            rateLimitMap.delete(ip);
        }
    }
}, 5 * 60 * 1000); // Cleanup every 5 minutes
