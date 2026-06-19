import { NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'

const SAFE_USER_COLUMNS = [
  'id',
  'username',
  'tokens',
  'daily_tokens',
  'packs',
  'booms',
  'is_owner',
  'is_banned',
  'is_muted',
  'status',
  'role',
  'join_date',
  'boom_score',
  'total_value',
  'profile_picture',
  'is_plus_user',
  'name_color',
  'banner_color',
  'last_daily_spin',
  'badges',
  'mute_expiry',
  'ban_expiry',
  'last_seen',
  'packs_opened',
  'xp',
  'level',
  'clan_id',
  'clan_role',
  'clan_tag',
  'clan_tag_color',
  'fusion_cooldown_ends_at',
  'consecutive_fusions',
  'last_fusion_claim_time',
  'active_fusion_boom1',
  'active_fusion_boom2',
  'active_fusion_ends_at',
  'active_fusion_started_at',
].join(', ')

const PUBLIC_USER_COLUMNS = [
  'id',
  'username',
  'is_owner',
  'role',
  'join_date',
  'boom_score',
  'total_value',
  'profile_picture',
  'is_plus_user',
  'name_color',
  'banner_color',
  'badges',
  'last_seen',
  'clan_id',
  'clan_role',
  'clan_tag',
  'clan_tag_color',
].join(', ')

const STAFF_ROLES = new Set(['owner', 'admin', 'senior_moderator', 'moderator', 'tester'])

export async function GET() {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isStaff = session.isOwner || STAFF_ROLES.has(session.role)
    const selectColumns = isStaff ? SAFE_USER_COLUMNS : PUBLIC_USER_COLUMNS

    const { data, error } = await supabaseServerClient()
      .from('users')
      .select(selectColumns)
      .limit(100)

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Unexpected error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
