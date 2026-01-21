import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const session = await verifySession()

        if (!session || !['owner', 'admin', 'senior_moderator'].includes(session.role)) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { ip, reason, banned_by } = await request.json()

        if (!ip) {
            return NextResponse.json({ success: false, message: 'IP is required' }, { status: 400 })
        }

        const supabase = getSupabaseServerClient()

        const { error } = await supabase
            .from('blacklisted_ips')
            .upsert({
                ip,
                reason: reason || 'Banned by staff',
                banned_by: banned_by || session.userId,
                banned_at: new Date().toISOString()
            })

        if (error) {
            console.error('Error blacklisting IP:', error)
            return NextResponse.json({ success: false, message: 'Failed to blacklist IP' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: `IP ${ip} blacklisted successfully` })
    } catch (error) {
        console.error('Blacklist IP error:', error)
        return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
    }
}
