import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'
import { hashPassword, validatePassword } from '@/lib/password'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Sets a user's password after a verified login/session.
 * Owners and admins can set another user's password; normal users can only set their own.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'You must be signed in before setting a password.' },
        { status: 401 }
      )
    }

    const { username, password } = await request.json()
    const passwordError = validatePassword(password)
    if (passwordError) {
      return NextResponse.json({ success: false, message: passwordError }, { status: 400 })
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

    const isPrivileged = actor.is_owner || actor.role === 'owner' || actor.role === 'admin'
    const targetUsername = typeof username === 'string' && username.trim() ? username.trim() : actor.username

    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', targetUsername)
      .maybeSingle()

    if (userError || !targetUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    if (targetUser.id !== actor.id && !isPrivileged) {
      return NextResponse.json({ success: false, message: 'Insufficient permission to set this password' }, { status: 403 })
    }

    const passwordHash = await hashPassword(password)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        password_reset_required: false,
      })
      .eq('id', targetUser.id)

    if (updateError) {
      console.error('[AUTH] Error setting password:', updateError)
      return NextResponse.json({ success: false, message: 'Failed to set password' }, { status: 500 })
    }

    console.log(`[AUTH] Password set for user: ${targetUser.username} by ${actor.username}`)

    return NextResponse.json({ success: true, message: 'Password set successfully' })
  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}
