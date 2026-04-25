import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import crypto from 'crypto'
import { createSession } from '@/lib/auth-server'
import { hashPassword, validatePassword } from '@/lib/password'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Server-side registration with password hashing
 * SECURITY: Passwords are hashed server-side using scrypt.
 */
import { checkRateLimiter } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  try {
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

    const { username, email, password, age, reason } = await request.json()
    const supabase = getSupabaseServerClient()

    // CHECK IP BLACKLIST
    const { data: blacklisted } = await supabase
      .from('blacklisted_ips')
      .select('ip')
      .eq('ip', ip)
      .maybeSingle()

    if (blacklisted) {
      return NextResponse.json({
        success: false,
        message: 'Your IP address is blacklisted. Registration is not allowed.'
      }, { status: 403 })
    }

    if (!username || !password || !age) {
      return NextResponse.json({ success: false, message: 'Username, password, and age are required' }, { status: 400 })
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      return NextResponse.json({ success: false, message: passwordError }, { status: 400 })
    }

    if (Number.parseInt(age) < 10) {
      return NextResponse.json({ success: false, message: 'You must be at least 10 years old to register' }, { status: 400 })
    }


    // Check if user already exists (exact match for security/consistency)
    const { data: existingByUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existingByUsername) {
      return NextResponse.json({ success: false, message: 'Username already exists' }, { status: 400 })
    }

    // Check if email already exists (only if email is provided)
    if (email) {
      const { data: existingByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingByEmail) {
        return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 })
      }
    }

    const passwordHash = await hashPassword(password)
    const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true' || process.env.NODE_ENV !== 'production'

    if (DEBUG_AUTH) {
      console.log('[AUTH DEBUG] ===== REGISTRATION START =====')
      console.log('[AUTH DEBUG] Username:', username)
      console.log('[AUTH DEBUG] Password length:', password.length)
      console.log('[AUTH DEBUG] Hashing algorithm: scrypt')
      console.log('[AUTH DEBUG] Storing in table: users')
      console.log('[AUTH DEBUG] Storing in column: password_hash')
    }

    // Create user - use only columns that exist in database (matching login route select)
    const newUser = {
      id: crypto.randomUUID(),
      username,
      email: email || `no_email_${username}_${Date.now()}@boomkit.local`,
      age: Number.parseInt(age),
      password_hash: passwordHash,
      password_reset_required: false,
      status: 'pending', // Default to pending for staff approval
      join_date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      profile_picture: '🎯',
      role: 'player',
      tokens: 0,
      boom_score: 0,
      total_value: 0,
      daily_tokens: 0,
      packs: [],
      booms: {},
      badges: [],
      is_owner: false,
      is_banned: false,
      is_muted: false,
      is_plus_user: false,
      name_color: '',
      banner_color: 'from-purple-600 to-pink-600',
      last_daily_spin: '',
      mute_expiry: 0,
      ban_expiry: 0,
      ban_reason: '',
      last_seen: Date.now(),
      packs_opened: 0,
      reason: reason || '',
      last_ip: ip,
    }

    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single()

    if (insertError) {
      console.error('[AUTH] Registration error:', insertError)
      if (DEBUG_AUTH) {
        console.error('[AUTH DEBUG] Insert error details:', JSON.stringify(insertError, null, 2))
      }

      // Handle unique constraint violations gracefully
      if (insertError.code === '23505') { // Postgres unique_violation code
        if (insertError.message?.includes('users_email_key') || insertError.message?.includes('email')) {
          return NextResponse.json({
            success: false,
            message: 'This email is already registered. Please login or use a different email.'
          }, { status: 400 })
        }
        if (insertError.message?.includes('users_username_key') || insertError.message?.includes('username')) {
          return NextResponse.json({
            success: false,
            message: 'This username is already taken. Please choose another one.'
          }, { status: 400 })
        }
      }

      // Return the actual error message for debugging
      return NextResponse.json({
        success: false,
        message: `Registration failed: ${insertError.message || insertError.code || 'Unknown database error'}`
      }, { status: 500 })
    }

    if (DEBUG_AUTH) {
      console.log('[AUTH DEBUG] User inserted successfully')
      console.log('[AUTH DEBUG] Inserted user ID:', insertedUser?.id)
      console.log('[AUTH DEBUG] Inserted password_hash exists:', !!insertedUser?.password_hash)
      console.log('[AUTH DEBUG] ===== REGISTRATION SUCCESS =====')
    }

    console.log(`[AUTH] User registered: ${username}`)

    // Create secure session (matching login behavior)
    await createSession(
      insertedUser.id,
      insertedUser.role || 'player',
      insertedUser.is_owner || false
    )

    // Return user data (EXPLICITLY PICK SAFE FIELDS)
    const safeUser = {
      id: insertedUser.id,
      username: insertedUser.username,
      email: insertedUser.email,
      age: insertedUser.age,
      tokens: insertedUser.tokens,
      daily_tokens: insertedUser.daily_tokens,
      packs: insertedUser.packs,
      booms: insertedUser.booms,
      role: insertedUser.role,
      is_owner: insertedUser.is_owner,
      is_banned: insertedUser.is_banned,
      is_muted: insertedUser.is_muted,
      status: insertedUser.status,
      badges: insertedUser.badges,
      name_color: insertedUser.name_color,
      banner_color: insertedUser.banner_color,
      profile_picture: insertedUser.profile_picture,
      join_date: insertedUser.join_date,
      boom_score: insertedUser.boom_score,
      total_value: insertedUser.total_value,
      is_plus_user: insertedUser.is_plus_user,
      last_daily_spin: insertedUser.last_daily_spin,
      mute_expiry: insertedUser.mute_expiry,
      ban_expiry: insertedUser.ban_expiry,
      last_seen: insertedUser.last_seen,
      packs_opened: insertedUser.packs_opened,
      xp: insertedUser.xp,
      level: insertedUser.level
    }

    return NextResponse.json({
      success: true,
      user: safeUser,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}
