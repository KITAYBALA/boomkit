import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'

export const dynamic = 'force-dynamic'

/**
 * Admin-only route to reset all user passwords
 * SECURITY: Requires ADMIN_RESET_SECRET env var + username parameter (user must be owner)
 * 
 * Behavior:
 * - Sets password_hash = NULL for all users
 * - Sets password_reset_required = TRUE for all users
 * - Returns count of affected users
 * 
 * Usage:
 * POST /api/admin/auth/reset-all-passwords
 * Body: { "username": "system", "secret": "your-admin-reset-secret" }
 * 
 * IMPORTANT: After use, set ADMIN_RESET_SECRET to empty string or remove it to disable this route
 */
export async function POST(request: NextRequest) {
  try {
    const { username, secret } = await request.json()

    // Check secret from env var
    const requiredSecret = process.env.ADMIN_RESET_SECRET
    if (!requiredSecret || requiredSecret === '') {
      return NextResponse.json({ success: false, message: 'Reset feature is disabled' }, { status: 403 })
    }

    if (!secret || secret !== requiredSecret) {
      return NextResponse.json({ success: false, message: 'Invalid secret' }, { status: 403 })
    }

    if (!username) {
      return NextResponse.json({ success: false, message: 'Username is required' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Verify user is owner
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, is_owner')
      .eq('username', username)
      .maybeSingle()

    if (userError || !user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    if (!user.is_owner) {
      return NextResponse.json({ success: false, message: 'Only owners can reset passwords' }, { status: 403 })
    }

    // Reset all user passwords
    const { data: updatedUsers, error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: null,
        password_reset_required: true,
      })
      .select('id')

    if (updateError) {
      console.error('[AUTH] Error resetting passwords:', updateError)
      return NextResponse.json({ success: false, message: 'Failed to reset passwords' }, { status: 500 })
    }

    const count = updatedUsers?.length || 0
    console.log(`[AUTH] Admin password reset: ${count} users affected by ${username}`)

    return NextResponse.json({
      success: true,
      message: `Password reset initiated for ${count} users`,
      count,
    })
  } catch (error) {
    console.error('Reset passwords error:', error)
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}

