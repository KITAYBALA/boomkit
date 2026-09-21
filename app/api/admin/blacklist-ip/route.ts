import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'
import { isIP } from 'node:net'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const session = await verifySession()

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const supabase = getSupabaseServerClient()
        const { data: actor, error: actorError } = await supabase
            .from('users')
            .select('id, role, is_owner')
            .eq('id', session.userId)
            .single()

        if (actorError || !actor || (!actor.is_owner && !['owner', 'admin', 'senior_moderator', 'moderator'].includes(actor.role))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { ip, reason } = await request.json()

        if (typeof ip !== 'string' || !isIP(ip.trim())) {
            return NextResponse.json({ success: false, message: 'A valid IP address is required' }, { status: 400 })
        }
        if (reason !== undefined && (typeof reason !== 'string' || reason.length > 1000)) {
            return NextResponse.json({ success: false, message: 'Invalid reason' }, { status: 400 })
        }

        const { error } = await supabase
            .from('blacklisted_ips')
            .upsert({
                ip: ip.trim(),
                reason: reason || 'Banned by staff',
                banned_by: actor.id,
                banned_at: new Date().toISOString()
            })

        if (error) {
            console.error('Error blacklisting IP:', error)
            return NextResponse.json({ success: false, message: 'Failed to blacklist IP' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: `IP ${ip.trim()} blacklisted successfully` })
    } catch (error) {
        console.error('Blacklist IP error:', error)
        return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
    }
}
