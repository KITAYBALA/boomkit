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
  'tokens',
  'daily_tokens',
  'packs',
  'booms',
  'packs_opened',
  'boom_score',
  'total_value',
  'pinned_boom',
  'inventory',
  'xp',
  'level',
  'discover_tokens_earned',
  'correct_answers_count',
  'questions_answered_count',
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
      .select('id, role, is_owner, last_ip')
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

    if (filteredUpdates.is_banned === false && targetUser && targetUser.last_ip) {
      const { error: blacklistDeleteErr } = await supabase
        .from('blacklisted_ips')
        .delete()
        .eq('ip', targetUser.last_ip)
      if (blacklistDeleteErr) {
        console.error('[API/users/update] Blacklist delete error:', blacklistDeleteErr)
      } else {
        console.log(`[API/users/update] Automatically unblacklisted IP ${targetUser.last_ip} for user ${targetUser.id}`)
      }
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
  // Fetch current user details to see if fields actually changed and to validate economy fields
  const { data: currentUser } = await supabase
    .from('users')
    .select('username, email, role, is_owner, tokens, daily_tokens, booms, packs, xp, level, boom_score, total_value, inventory')
    .eq('id', targetUserId)
    .single()

  if (!currentUser) {
    return 'User not found'
  }

  // C-01: Standard User Economy Rate Limiting / Validation
  const isStaff = STAFF_ROLES.has(currentUser.role) || currentUser.is_owner
  if (!isStaff) {
    if ('tokens' in updates) {
      const newTokens = Number(updates.tokens)
      const currentTokens = Number(currentUser.tokens || 0)
      if (isNaN(newTokens) || newTokens < 0) return 'Invalid tokens value'
      if (newTokens > currentTokens + 5000) return 'Token increase exceeds maximum limit per update'
    }

    if ('daily_tokens' in updates) {
      const newDaily = Number(updates.daily_tokens)
      const currentDaily = Number(currentUser.daily_tokens || 0)
      if (isNaN(newDaily) || newDaily < 0) return 'Invalid daily_tokens value'
      if (newDaily > currentDaily + 5000) return 'Daily token increase exceeds limit'
    }

    if ('xp' in updates) {
      const newXp = Number(updates.xp)
      const currentXp = Number(currentUser.xp || 0)
      if (isNaN(newXp) || newXp < 0) return 'Invalid xp value'
      if (newXp > currentXp + 2000) return 'XP increase exceeds limit'
    }

    if ('level' in updates) {
      const newLvl = Number(updates.level)
      const currentLvl = Number(currentUser.level || 1)
      if (isNaN(newLvl) || newLvl < 0) return 'Invalid level value'
      if (newLvl > currentLvl + 2) return 'Level increase exceeds limit'
    }

    if ('boom_score' in updates) {
      const newScore = Number(updates.boom_score)
      const currentScore = Number(currentUser.boom_score || 0)
      if (isNaN(newScore) || newScore < 0) return 'Invalid boom_score value'
      if (newScore > currentScore + 1000) return 'Boom score increase exceeds limit'
    }

    if ('total_value' in updates) {
      const newValue = Number(updates.total_value)
      const currentValue = Number(currentUser.total_value || 0)
      if (isNaN(newValue) || newValue < 0) return 'Invalid total_value value'
      if (newValue > currentValue + 20000) return 'Total value increase exceeds limit'
    }

    if ('packs' in updates) {
      if (!Array.isArray(updates.packs)) return 'Invalid packs value'
      const currentPacksCount = Array.isArray(currentUser.packs) ? currentUser.packs.length : 0
      if (updates.packs.length > currentPacksCount + 5) return 'Pack count increase exceeds limit'
    }

    if ('booms' in updates) {
      if (typeof updates.booms !== 'object' || updates.booms === null) return 'Invalid booms value'
      const newBoomsCount = Object.values(updates.booms).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0)
      const currentBoomsCount = typeof currentUser.booms === 'object' && currentUser.booms !== null
        ? Object.values(currentUser.booms).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0)
        : 0
      if (newBoomsCount > currentBoomsCount + 5) return 'Boom count increase exceeds limit'
    }

    if ('inventory' in updates) {
      if (!Array.isArray(updates.inventory)) return 'Invalid inventory value'
      const newInvCount = updates.inventory.reduce((sum: number, item: any) => sum + (Number(item?.quantity) || 0), 0)
      const currentInvCount = Array.isArray(currentUser.inventory)
        ? currentUser.inventory.reduce((sum: number, item: any) => sum + (Number(item?.quantity) || 0), 0)
        : 0
      if (newInvCount > currentInvCount + 5) return 'Inventory item increase exceeds limit'
    }
  }

  if (typeof updates.username === 'string') {
    const username = updates.username.trim()
    updates.username = username
    
    // Only validate if the username has actually changed
    if (username !== currentUser.username) {
      if (!/^[a-zA-Z0-9_ ]{3,32}$/.test(username)) {
        return 'Username must be 3-32 characters and only contain letters, numbers, spaces, or underscores'
      }

      const { data: collision } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', targetUserId)
        .maybeSingle()

      if (collision) return 'Username is already in use by another account'
    }
  }

  if (typeof updates.email === 'string') {
    const email = updates.email.trim()
    updates.email = email
    
    // Only validate if the email has actually changed
    if (email !== currentUser.email) {
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
  }

  return null
}
