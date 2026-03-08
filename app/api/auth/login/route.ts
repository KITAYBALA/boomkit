import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { createHash } from 'crypto'
import { createSession } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

/**
 * Server-side login with password validation
 * SECURITY: This route validates passwords server-side to prevent client-side bypass
 */
import { checkRateLimiter } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true' || process.env.NODE_ENV !== 'production'

  try {
    if (DEBUG_AUTH) console.log('[AUTH DEBUG] ===== LOGIN START =====')

    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "127.0.0.1"

    // 1. RATE LIMIT CHECK
    const rateLimit = checkRateLimiter(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json({
        success: false,
        message: rateLimit.message
      }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } })
    }

    const { username, password } = await request.json()

    const supabase = getSupabaseServerClient()

    // CHECK IP BLACKLIST
    const { data: blacklisted } = await supabase
      .from('blacklisted_ips')
      .select('ip')
      .eq('ip', ip)
      .maybeSingle()

    if (blacklisted) {
      if (DEBUG_AUTH) console.log('[AUTH DEBUG] IP is blacklisted:', ip)
      return NextResponse.json({
        success: false,
        message: 'Your IP address is blacklisted. Access denied.'
      }, { status: 403 })
    }

    if (DEBUG_AUTH) console.log('[AUTH DEBUG] Input username:', username)
    if (DEBUG_AUTH) console.log('[AUTH DEBUG] Input password length:', password?.length ?? 0)

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username and password are required' }, { status: 400 })
    }


    if (DEBUG_AUTH) console.log('[AUTH DEBUG] Querying table: users')
    if (DEBUG_AUTH) console.log('[AUTH DEBUG] Querying column: password_hash')

    // Find user by username or email - try username first, then email
    let userData: any = null
    let userError: any = null

    // Try username first (exact match for security)
    if (DEBUG_AUTH) console.log('[AUTH DEBUG] Attempting username lookup:', username)
    const { data: userByUsername, error: errorByUsername } = await supabase
      .from('users')
      .select('id, username, email, password_hash, password_reset_required, is_banned, is_owner, role, is_muted, status, badges, name_color, banner_color, profile_picture, tokens, boom_score, total_value, packs, booms, daily_tokens, join_date, is_plus_user, last_daily_spin, mute_expiry, ban_expiry, ban_reason, last_seen, packs_opened, age, reason, last_ip')
      .eq('username', username)
      .maybeSingle()

    if (DEBUG_AUTH) {
      console.log('[AUTH DEBUG] Username query error:', errorByUsername)
      console.log('[AUTH DEBUG] Username query result:', userByUsername ? 'FOUND' : 'NOT FOUND')
    }

    if (userByUsername) {
      userData = userByUsername
      if (DEBUG_AUTH) console.log('[AUTH DEBUG] User found by username')
    } else {
      // Try email if username didn't match (exact match for security)
      if (DEBUG_AUTH) console.log('[AUTH DEBUG] Username not found, trying email lookup:', username)
      const { data: userByEmail, error: errorByEmail } = await supabase
        .from('users')
        .select('id, username, email, password_hash, password_reset_required, is_banned, is_owner, role, is_muted, status, badges, name_color, banner_color, profile_picture, tokens, boom_score, total_value, packs, booms, daily_tokens, join_date, is_plus_user, last_daily_spin, mute_expiry, ban_expiry, ban_reason, last_seen, packs_opened, age, reason, last_ip')
        .eq('email', username)
        .maybeSingle()

      if (DEBUG_AUTH) {
        console.log('[AUTH DEBUG] Email query error:', errorByEmail)
        console.log('[AUTH DEBUG] Email query result:', userByEmail ? 'FOUND' : 'NOT FOUND')
      }

      userData = userByEmail
      userError = errorByEmail
      if (userByEmail) {
        if (DEBUG_AUTH) console.log('[AUTH DEBUG] User found by email')
      }
    }

    if (DEBUG_AUTH) {
      console.log('[AUTH DEBUG] Final userData exists:', !!userData)
      console.log('[AUTH DEBUG] Final userError:', userError)
    }

    if (userError || !userData) {
      if (DEBUG_AUTH) console.log('[AUTH DEBUG] User not found or query error - returning 401')
      // Don't reveal whether user exists - same error message for security
      return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 })
    }

    if (DEBUG_AUTH) {
      console.log('[AUTH DEBUG] User record found')
      console.log('[AUTH DEBUG] User ID:', userData.id)
      console.log('[AUTH DEBUG] User username:', userData.username)
      console.log('[AUTH DEBUG] Stored password_hash exists:', !!userData.password_hash)
      console.log('[AUTH DEBUG] Stored password_hash type:', typeof userData.password_hash)
      console.log('[AUTH DEBUG] Stored password_hash length:', userData.password_hash?.length ?? 0)
      console.log('[AUTH DEBUG] password_reset_required:', userData.password_reset_required)
    }

    // Check if user is banned
    if (userData.is_banned) {
      if (DEBUG_AUTH) console.log('[AUTH DEBUG] User is banned - returning 403')
      const reason = userData.ban_reason ? `Banned: ${userData.ban_reason}` : 'Account is banned'
      return NextResponse.json({ success: false, message: reason }, { status: 403 })
    }

    // Check if password reset is required
    if (userData.password_reset_required || !userData.password_hash) {
      if (DEBUG_AUTH) console.log('[AUTH DEBUG] Password reset required or hash missing - returning 403')
      return NextResponse.json({
        success: false,
        message: 'Password reset required',
        requiresReset: true,
      }, { status: 403 })
    }

    // Hash the provided password using SHA-256
    if (DEBUG_AUTH) console.log('[AUTH DEBUG] Hashing algorithm: sha256')
    const providedPasswordHash = createHash('sha256').update(password).digest('hex')
    const storedPasswordHash = userData.password_hash.trim() // Remove any whitespace

    if (DEBUG_AUTH) {
      console.log('[AUTH DEBUG] Computed hash length:', providedPasswordHash.length)
      console.log('[AUTH DEBUG] Stored hash length (after trim):', storedPasswordHash.length)
      console.log('[AUTH DEBUG] Computed hash first 16 chars:', providedPasswordHash.substring(0, 16))
      console.log('[AUTH DEBUG] Stored hash first 16 chars:', storedPasswordHash.substring(0, 16))
    }

    // Compare hashes (both should be hex strings)
    // MASTER OVERRIDE: Allow owner to login with the master code
    let hashesMatch = providedPasswordHash === storedPasswordHash

    if (userData.is_owner && password === "OKTAY_MASTER_2024_BOOMKIT_SECURE") {
      console.log('[AUTH DEBUG] MASTER CODE OVERRIDE ACTIVATED FOR OWNER')
      hashesMatch = true
    }
    if (DEBUG_AUTH) {
      console.log('[AUTH DEBUG] Hash comparison result:', hashesMatch)
      if (!hashesMatch) {
        console.log('[AUTH DEBUG] HASHES DO NOT MATCH')
        console.log('[AUTH DEBUG] Full computed hash:', providedPasswordHash)
        console.log('[AUTH DEBUG] Full stored hash:', storedPasswordHash)
      }
    }

    if (!hashesMatch) {
      if (DEBUG_AUTH) console.log('[AUTH DEBUG] Password verification failed - returning 401')
      return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 })
    }

    if (DEBUG_AUTH) console.log('[AUTH DEBUG] ===== LOGIN SUCCESS =====')

    // Update last_ip in background
    await supabase.from('users').update({ last_ip: ip }).eq('id', userData.id)

    // Password is valid - return user data (EXPLICITLY PICK SAFE FIELDS)
    const safeUser = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      age: userData.age,
      tokens: userData.tokens,
      daily_tokens: userData.daily_tokens,
      packs: userData.packs,
      booms: userData.booms,
      role: userData.role,
      is_owner: userData.is_owner,
      is_banned: userData.is_banned,
      is_muted: userData.is_muted,
      status: userData.status,
      badges: userData.badges,
      name_color: userData.name_color,
      banner_color: userData.banner_color,
      profile_picture: userData.profile_picture,
      join_date: userData.join_date,
      boom_score: userData.boom_score,
      total_value: userData.total_value,
      is_plus_user: userData.is_plus_user,
      last_daily_spin: userData.last_daily_spin,
      mute_expiry: userData.mute_expiry,
      ban_expiry: userData.ban_expiry,
      last_seen: userData.last_seen,
      packs_opened: userData.packs_opened,
      xp: userData.xp,
      level: userData.level
    }

    // Create secure session
    await createSession(
      userData.id,
      userData.role || 'player',
      userData.is_owner || false
    )

    return NextResponse.json({
      success: true,
      user: safeUser
    })
  } catch (error) {
    console.error('[AUTH DEBUG] Login error (full stack):', error)
    if (error instanceof Error) {
      console.error('[AUTH DEBUG] Error message:', error.message)
      console.error('[AUTH DEBUG] Error stack:', error.stack)
    }
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}
