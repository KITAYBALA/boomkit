import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-server'

export async function GET() {
    try {
        const session = await verifySession()

        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 })
        }

        return NextResponse.json({
            authenticated: true,
            user: {
                id: session.userId,
                role: session.role,
                isOwner: session.isOwner
            }
        })
    } catch (error) {
        console.error('[Verify API] Error:', error)
        return NextResponse.json({ authenticated: false, error: 'Internal server error' }, { status: 500 })
    }
}
