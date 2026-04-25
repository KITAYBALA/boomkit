import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

const SELF_ALLOWED_FIELDS = new Set([
  'username',
  'email',
  'age',
  'reason',
  'profile_picture',
  'name_color',
  'banner_color',
  'last_seen',
  'last_daily_spin',
])

const STAFF_ALLOWED_FIELDS = new Set([
  ...SELF_ALLOWED_FIELDS,
  'tokens',
  'daily_tokens',
  'packs',
  'booms',
  'status',
  'role',
  'is_owner',
  'is_banned',
  'is_muted',
  'is_plus_user',
  'badges',
  'mute_expiry',
  'ban_expiry',
  'ban_reason',
  'packs_opened',
  'boom_score',
  'total_value',
  'xp',
  'level',
])

const NEVER_CLIENT_WRITABLE_FIELDS = new Set([
  'id',
  'password_hash',
  'password_reset_required',
  'last_ip',
])

const STAFF_ROLES = new Set(['owner', 'admin', 'senior_moderator', 'moderator', 'tester'])

/**
 * Secure user update API.
 * Uses the service role only after checking the actor's current database role.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { targetUserId, updates } = body

    if (!targetUserId || !updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return NextResponse.json({ success: false, message: 'Missing targetUserId or updates object' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { data: actor, error: actorError } = await supabase
      .from('users')
      .select('id, username, role, is_owner')
      .eq('id', session.userId)
      .single()

    if (actorError || !actor) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const isSelf = actor.id === targetUserId
    const actorIsOwner = actor.is_owner || actor.role === 'owner'
    const actorIsAdmin = actor.role === 'admin'
    const actorIsStaff = STAFF_ROLES.has(actor.role) || actorIsOwner

    if (!isSelf && !actorIsStaff) {
      return NextResponse.json({ success: false, message: 'Access denied: staff only' }, { status: 403 })
    }

    const incomingKeys = Object.keys(updates)
    const forbiddenKey = incomingKeys.find((key) => NEVER_CLIENT_WRITABLE_FIELDS.has(key))
    if (forbiddenKey) {
      return NextResponse.json({ success: false, message: `Field cannot be updated: ${forbiddenKey}` }, { status: 403 })
    }

    const allowedFields = actorIsStaff ? STAFF_ALLOWED_FIELDS : SELF_ALLOWED_FIELDS
    const filteredUpdates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.has(key)) {
        filteredUpdates[key] = value
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ success: true, message: 'No allowed updates were provided' })
    }

    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('id, role, is_owner')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ success: false, message: 'Target user not found' }, { status: 404 })
    }

    const targetIsOwner = targetUser.is_owner || targetUser.role === 'owner'
    if (targetIsOwner && !actorIsOwner && !isSelf) {
      return NextResponse.json({ success: false, message: 'Only owners can modify owner accounts' }, { status: 403 })
    }

    if ('is_owner' in filteredUpdates && !actorIsOwner) {
      return NextResponse.json({ success: false, message: 'Only owners can modify owner status' }, { status: 403 })
    }

    if ('role' in filteredUpdates) {
      const nextRole = String(filteredUpdates.role)
      if (!actorIsOwner && !actorIsAdmin) {
        return NextResponse.json({ success: false, message: 'Only owners or admins can modify roles' }, { status: 403 })
      }
      if ((nextRole === 'owner' || targetIsOwner) && !actorIsOwner) {
        return NextResponse.json({ success: false, message: 'Only owners can modify owner roles' }, { status: 403 })
      }
    }

    const validationError = await normalizeAndValidateUpdates(supabase, targetUserId, filteredUpdates)
    if (validationError) {
      return NextResponse.json({ success: false, message: validationError }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .update(filteredUpdates)
      .eq('id', targetUserId)
      .select('id, username, role, is_banned')
      .single()

    if (error) {
      console.error('[API/users/update] DB Error:', error)
      return NextResponse.json({ success: false, message: 'Failed to update user' }, { status: 500 })
    }

    console.log(`[API/users/update] User ${targetUserId} updated by ${actor.id}`)

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: data,
    })
  } catch (err) {
    console.error('[API/users/update] Unexpected Error:', err)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

async function normalizeAndValidateUpdates(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  targetUserId: string,
  updates: Record<string, unknown>
) {
  if (typeof updates.username === 'string') {
    const username = updates.username.trim()
    updates.username = username
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
      return 'Username must be 3-32 characters and only contain letters, numbers, or underscores'
    }

    const { data: collision } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', targetUserId)
      .maybeSingle()

    if (collision) return 'Username is already in use by another account'
  }

  if (typeof updates.email === 'string') {
    const email = updates.email.trim()
    updates.email = email
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Email is invalid'
    }

    if (email) {
      const { data: collision } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', targetUserId)
        .maybeSingle()

      if (collision) return 'Email is already in use by another account'
    }
  }

  return null
}
