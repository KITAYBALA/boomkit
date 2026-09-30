import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { randomBytes } from 'node:crypto'
import { getSupabaseServerClient } from './supabase-server-client'

const SESSION_COOKIE = 'session_token'
const localRuntime = globalThis as typeof globalThis & { boomkitDevelopmentJwtSecret?: Uint8Array }

export class AuthConfigurationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'AuthConfigurationError'
    }
}

function getJwtSecret() {
    const secret = process.env.JWT_SECRET

    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new AuthConfigurationError('JWT_SECRET environment variable is required in production.')
        }
        return localRuntime.boomkitDevelopmentJwtSecret ??= randomBytes(32)
    }

    if (process.env.NODE_ENV === 'production' && Buffer.byteLength(secret, 'utf8') < 32) {
        throw new AuthConfigurationError('JWT_SECRET must contain at least 32 random bytes in production.')
    }
    return new TextEncoder().encode(secret)
}

// Check before accepting credentials or consuming a registration access key.
// Keep the same signing requirements as createSession; never fall back in production.
export function assertSessionConfigured(): void {
    getJwtSecret()
}

export async function createSession(userId: string, role: string, isOwner: boolean, resetOnly = false) {
    const token = await new SignJWT({ userId, role, isOwner, resetOnly, issuedAtMs: Date.now() })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(getJwtSecret())

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
    })
}

export async function verifySession(options: { allowPasswordReset?: boolean; allowPending?: boolean } = {}) {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value

    if (!token) return null

    try {
        const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ['HS256'] })
        if (typeof payload.userId !== 'string' || !payload.userId || typeof payload.iat !== 'number') return null
        if (payload.resetOnly && !options.allowPasswordReset) return null

        const db = getSupabaseServerClient()
        const { data: user, error } = await db.from('users')
            .select('id, role, is_owner, is_banned, ban_expiry, status').eq('id', payload.userId).maybeSingle()
        const { data: secrets, error: secretError } = await db.from('user_secrets')
            .select('password_reset_required, sessions_revoked_at').eq('user_id', payload.userId).maybeSingle()
        if (error || secretError || !user || !secrets) return null
        if (user.status === 'rejected') return null
        if (!options.allowPending && user.status !== 'approved') return null
        if (user.is_banned && (!user.ban_expiry || !(new Date(user.ban_expiry).getTime() <= Date.now()))) return null
        const issuedAt = typeof payload.issuedAtMs === 'number' ? payload.issuedAtMs : payload.iat * 1000
        if (secrets.sessions_revoked_at && issuedAt <= new Date(secrets.sessions_revoked_at).getTime()) return null
        if (secrets.password_reset_required && !options.allowPasswordReset) return null
        if (user.is_banned) {
            const { data: cleared, error: clearError } = await db.from('users').update({ is_banned: false, ban_expiry: null })
                .eq('id', user.id).eq('is_banned', true).eq('ban_expiry', user.ban_expiry).select('id').maybeSingle()
            if (clearError || !cleared) return null
        }
        return { userId: user.id as string, role: user.role as string, isOwner: Boolean(user.is_owner),
            resetOnly: Boolean(payload.resetOnly || secrets.password_reset_required), status: user.status as string }
    } catch (error) {
        return null
    }
}

export async function clearSession() {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    })
}
