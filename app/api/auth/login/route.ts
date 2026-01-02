import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * Server-side login with password validation
 * SECURITY: This route validates passwords server-side to prevent client-side bypass
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username and password are required' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    
    // Find user by username or email - try username first, then email
    let userData: any = null
    let userError: any = null

    // Try username first
    const { data: userByUsername, error: errorByUsername } = await supabase
      .from('users')
      .select('id, username, email, password_hash, is_banned, is_owner, role, is_muted, status, badges, name_color, banner_color, profile_picture, tokens, boom_score, total_value, packs, booms, daily_tokens, join_date, is_plus_user, last_daily_spin, mute_expiry, ban_expiry, ban_reason, last_seen, packs_opened, age, reason')
      .eq('username', username)
      .maybeSingle()

    if (userByUsername) {
      userData = userByUsername
    } else {
      // Try email if username didn't match
      const { data: userByEmail, error: errorByEmail } = await supabase
        .from('users')
        .select('id, username, email, password_hash, is_banned, is_owner, role, is_muted, status, badges, name_color, banner_color, profile_picture, tokens, boom_score, total_value, packs, booms, daily_tokens, join_date, is_plus_user, last_daily_spin, mute_expiry, ban_expiry, ban_reason, last_seen, packs_opened, age, reason')
        .eq('email', username)
        .maybeSingle()
      
      userData = userByEmail
      userError = errorByEmail
    }

    if (userError || !userData) {
      // Don't reveal whether user exists - same error message for security
      return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 })
    }

    // Check if user is banned
    if (userData.is_banned) {
      return NextResponse.json({ success: false, message: 'Account is banned' }, { status: 403 })
    }

    // Validate password - if no password_hash exists, reject (accounts need passwords set)
    if (!userData.password_hash) {
      console.log(`[AUTH] User ${username} found but no password_hash set`)
      return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 })
    }

    // Hash the provided password using SHA-256
    const providedPasswordHash = createHash('sha256').update(password).digest('hex')
    const storedPasswordHash = userData.password_hash.trim() // Remove any whitespace
    
    // Compare hashes (both should be hex strings)
    if (providedPasswordHash !== storedPasswordHash) {
      console.log(`[AUTH] Password mismatch for user ${username}. Stored hash: ${storedPasswordHash.substring(0, 16)}..., Provided hash: ${providedPasswordHash.substring(0, 16)}...`)
      return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 })
    }

    console.log(`[AUTH] Successful login for user ${username}`)

    // Password is valid - return user data (excluding password_hash)
    const { password_hash: _, ...userWithoutPassword } = userData
    
    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}
