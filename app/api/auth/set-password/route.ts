import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * Helper route to set/reset password hash for existing users
 * Use this to fix users with NULL password_hash
 * SECURITY: Server-side only, requires username and new password
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username and password are required' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', username)
      .maybeSingle()

    if (userError || !user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    // Hash password using SHA-256 (same algorithm as registration/login)
    const passwordHash = createHash('sha256').update(password).digest('hex')

    // Update password_hash
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('username', username)

    if (updateError) {
      console.error('[AUTH] Error setting password:', updateError)
      return NextResponse.json({ success: false, message: 'Failed to set password' }, { status: 500 })
    }

    console.log(`[AUTH] Password set for user: ${username}`)

    return NextResponse.json({ success: true, message: 'Password set successfully' })
  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}
