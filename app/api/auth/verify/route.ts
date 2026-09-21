import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { serializeUser } from '@/lib/user-profile'

export async function GET() {
    try {
        const session = await verifySession({ allowPending: true })

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
                is_plus_user, has_plus_pass, plus_reward_expires_at, inventory, season_xp, pinned_boom,
                discover_tokens_earned, correct_answers_count, questions_answered_count, clan_id, clan_role, clan_tag, clan_tag_color,
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
            user: serializeUser(userData, true)
        })
    } catch (error) {
        console.error('[Verify GET API] Error:', error)
        return NextResponse.json({ authenticated: false, error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await verifySession({ allowPending: true })

        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 })
        }

        const body = await request.json().catch(() => ({}))
        const mac_address = body?.mac_address

        const supabase = getSupabaseServerClient()
        
        if (typeof mac_address === 'string' && mac_address.length <= 128) {
            await supabase
                .from('user_secrets')
                .update({ mac_address })
                .eq('user_id', session.userId)
        }

        const { data: userData, error } = await supabase
            .from('users')
            .select(`
                id, username, email, role, tokens, daily_tokens, booms, packs, xp, level,
                is_banned, is_muted, is_owner, status, reason, join_date, boom_score,
                total_value, profile_picture, name_color, banner_color, last_daily_spin,
                badges, mute_expiry, ban_expiry, ban_reason, last_seen, packs_opened,
                is_plus_user, has_plus_pass, plus_reward_expires_at, inventory, season_xp, pinned_boom,
                discover_tokens_earned, correct_answers_count, questions_answered_count, clan_id, clan_role, clan_tag, clan_tag_color,
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
            user: serializeUser(userData, true)
        })
    } catch (error) {
        console.error('[Verify POST API] Error:', error)
        return NextResponse.json({ authenticated: false, error: 'Internal server error' }, { status: 500 })
    }
}
