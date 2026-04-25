import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

/**
 * Owner-only route to force all users to choose a new password.
 * Existing hashes are kept so each user must still prove knowledge of their current password.
 */
export async function POST() {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseServerClient()
    const { data: actor, error: actorError } = await supabase
      .from('users')
      .select('id, username, role, is_owner')
      .eq('id', session.userId)
      .single()

    if (actorError || !actor || (!actor.is_owner && actor.role !== 'owner')) {
      return NextResponse.json({ success: false, message: 'Only owners can reset passwords' }, { status: 403 })
    }

    const { data: updatedUsers, error: updateError } = await supabase
      .from('users')
      .update({ password_reset_required: true })
      .not('password_hash', 'is', null)
      .select('id')

    if (updateError) {
      console.error('[AUTH] Error marking passwords for reset:', updateError)
      return NextResponse.json({ success: false, message: 'Failed to mark passwords for reset' }, { status: 500 })
    }

    const count = updatedUsers?.length || 0
    console.log(`[AUTH] Password reset required for ${count} users by ${actor.username}`)

    return NextResponse.json({
      success: true,
      message: `Password reset required for ${count} users`,
      count,
    })
  } catch (error) {
    console.error('Reset passwords error:', error)
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}
