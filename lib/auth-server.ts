import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'session_token'

function getJwtSecret() {
    const secret = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!secret) {
        throw new Error('JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set for session signing')
    }

    return new TextEncoder().encode(secret)
}

export async function createSession(userId: string, role: string, isOwner: boolean) {
    const token = await new SignJWT({ userId, role, isOwner })
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

export async function verifySession() {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value

    if (!token) return null

    try {
        const { payload } = await jwtVerify(token, getJwtSecret())
        return payload as { userId: string; role: string; isOwner: boolean }
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
