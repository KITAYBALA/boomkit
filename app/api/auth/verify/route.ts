import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'

export async function GET() {
    try {
        const session = await verifySession()

        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 })
        }

        const supabase = getSupabaseServerClient()
        const { data: userData, error } = await supabase
            .from('users')
            .select(`
                id, username, email, role, tokens, daily_tokens, booms, packs, xp, level,
                is_banned, is_muted, is_owner, status, reason, join_date, boom_score,
                total_value, profile_picture, name_color, banner_color, last_daily_spin,
                badges, mute_expiry, ban_expiry, ban_reason, last_seen, packs_opened,
                fusion_cooldown_ends_at, consecutive_fusions, last_fusion_claim_time,
                active_fusion_boom1, active_fusion_boom2, active_fusion_ends_at, active_fusion_started_at
            `)
            .eq('id', session.userId)
            .single()

        if (error || !userData) {
            return NextResponse.json({ authenticated: false, error: 'User not found in database' }, { status: 404 })
        }

        return NextResponse.json({
            authenticated: true,
            user: userData
        })
    } catch (error) {
        console.error('[Verify GET API] Error:', error)
        return NextResponse.json({ authenticated: false, error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await verifySession()

        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 })
        }

        const body = await request.json().catch(() => ({}))
        const mac_address = body.mac_address

        const supabase = getSupabaseServerClient()
        
        if (mac_address) {
            await supabase
                .from('users')
                .update({ mac_address })
                .eq('id', session.userId)
        }

        const { data: userData, error } = await supabase
            .from('users')
            .select(`
                id, username, email, role, tokens, daily_tokens, booms, packs, xp, level,
                is_banned, is_muted, is_owner, status, reason, join_date, boom_score,
                total_value, profile_picture, name_color, banner_color, last_daily_spin,
                badges, mute_expiry, ban_expiry, ban_reason, last_seen, packs_opened,
                fusion_cooldown_ends_at, consecutive_fusions, last_fusion_claim_time,
                active_fusion_boom1, active_fusion_boom2, active_fusion_ends_at, active_fusion_started_at
            `)
            .eq('id', session.userId)
            .single()

        if (error || !userData) {
            return NextResponse.json({ authenticated: false, error: 'User not found in database' }, { status: 404 })
        }

        return NextResponse.json({
            authenticated: true,
            user: userData
        })
    } catch (error) {
        console.error('[Verify POST API] Error:', error)
        return NextResponse.json({ authenticated: false, error: 'Internal server error' }, { status: 500 })
    }
}
