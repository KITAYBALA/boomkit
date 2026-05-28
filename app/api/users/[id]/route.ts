import { NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'

interface Params {
  id: string
}

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
].join(', ')

export async function GET(_request: Request, { params }: { params: Promise<Params> }) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseServerClient()
      .from('users')
      .select(SAFE_USER_COLUMNS)
      .eq('id', id)
      .single()

    if (error) {
      console.error(`Error fetching user with ID ${id}:`, error)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error(`Unexpected error fetching user with ID ${id}:`, error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
