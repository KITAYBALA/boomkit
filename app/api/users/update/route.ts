import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'
import { canModerate, isModerator } from '@/lib/moderation-policy'
import { parseProfileUpdates } from '@/lib/profile-update-policy'

export async function POST(request: Request) {
  try {
    const session = await verifySession()
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const body = await request.json().catch(() => null)
    if (!body || typeof body.targetUserId !== 'string' || !body.updates || typeof body.updates !== 'object' || Array.isArray(body.updates)) {
      return NextResponse.json({ success: false, message: 'Invalid profile update' }, { status: 400 })
    }
    const db = getSupabaseServerClient()
    const { data: actor, error: actorError } = await db.from('users').select('id, role, is_owner').eq('id', session.userId).single()
    if (actorError || !actor) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const isSelf = actor.id === body.targetUserId
    if (!isSelf && !isModerator(actor)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    let updates: Record<string, any>
    try { updates = parseProfileUpdates(body.updates, actor, body.targetUserId) }
    catch { return NextResponse.json({ success: false, message: 'Invalid or protected fields. Use the appropriate game action.' }, { status: 400 }) }
    const { data: target, error: targetError } = await db.from('users').select('id, username, role, is_owner, booms').eq('id', body.targetUserId).single()
    if (targetError || !target) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    if (!isSelf && !canModerate(actor, target)) return NextResponse.json({ success: false, message: 'Cannot modify this account' }, { status: 403 })
    const owner = actor.is_owner || actor.role === 'owner'
    if (!owner && (updates.is_owner !== undefined && updates.is_owner !== target.is_owner || updates.role === 'owner' && updates.role !== target.role)) {
      return NextResponse.json({ success: false, message: 'Owner permission required' }, { status: 403 })
    }
    if (updates.username !== undefined && updates.username !== target.username) {
      return NextResponse.json({ success: false, message: 'Username changes require an account migration.' }, { status: 400 })
    }
    if (updates.pinned_boom && Number(target.booms?.[updates.pinned_boom] || 0) < 1) {
      const { data: rental, error } = await db.from('boom_rentals').select('id').eq('renter_username', target.username)
        .eq('boom_name', updates.pinned_boom).eq('status', 'rented').gt('sessions_remaining', 0).limit(1).maybeSingle()
      if (error || !rental) return NextResponse.json({ success: false, message: 'You do not own or rent this boom' }, { status: 400 })
    }
    if (!Object.keys(updates).length) return NextResponse.json({ success: true })
    const { error } = await db.from('users').update(updates).eq('id', target.id)
    if (error) return NextResponse.json({ success: false, message: error.code === '23505' ? 'Email already in use' : 'Profile update failed' }, { status: error.code === '23505' ? 409 : 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile update failed', error)
    return NextResponse.json({ success: false, message: 'Profile update failed' }, { status: 500 })
  }
}
