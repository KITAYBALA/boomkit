import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * Server-side registration with password hashing
 * SECURITY: Passwords are hashed server-side using SHA-256 (matching login)
 */
export async function POST(request: NextRequest) {
  try {
    const { username, email, password, age, reason } = await request.json()

    if (!username || !email || !password || !age) {
      return NextResponse.json({ success: false, message: 'Username, email, password, and age are required' }, { status: 400 })
    }

    if (Number.parseInt(age) < 10) {
      return NextResponse.json({ success: false, message: 'You must be at least 10 years old to register' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Check if user already exists (case-insensitive like login route)
    const { data: existingByUsername } = await supabase
      .from('users')
      .select('id')
      .ilike('username', username)
      .maybeSingle()

    if (existingByUsername) {
      return NextResponse.json({ success: false, message: 'Username already exists' }, { status: 400 })
    }

    const { data: existingByEmail } = await supabase
      .from('users')
      .select('id')
      .ilike('email', email)
      .maybeSingle()

    if (existingByEmail) {
      return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 })
    }

    // Hash password using SHA-256 (same algorithm as login)
    const passwordHash = createHash('sha256').update(password).digest('hex')
    const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true' || process.env.NODE_ENV !== 'production'

    if (DEBUG_AUTH) {
      console.log('[AUTH DEBUG] ===== REGISTRATION START =====')
      console.log('[AUTH DEBUG] Username:', username)
      console.log('[AUTH DEBUG] Password length:', password.length)
      console.log('[AUTH DEBUG] Hashing algorithm: sha256')
      console.log('[AUTH DEBUG] Computed hash length:', passwordHash.length)
      console.log('[AUTH DEBUG] Computed hash first 16 chars:', passwordHash.substring(0, 16))
      console.log('[AUTH DEBUG] Storing in table: users')
      console.log('[AUTH DEBUG] Storing in column: password_hash')
    }

    // Create user
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      age: Number.parseInt(age),
      password_hash: passwordHash, // Store hashed password
      password_reset_required: false, // New users don't need reset
      status: 'approved',
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
      packs: [],
      booms: {},
      is_owner: false,
      is_banned: false,
      is_muted: false,
      reason: reason || '',
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
      return NextResponse.json({ success: false, message: 'Registration failed' }, { status: 500 })
    }

    if (DEBUG_AUTH) {
      console.log('[AUTH DEBUG] User inserted successfully')
      console.log('[AUTH DEBUG] Inserted user ID:', insertedUser?.id)
      console.log('[AUTH DEBUG] Inserted password_hash exists:', !!insertedUser?.password_hash)
      console.log('[AUTH DEBUG] Inserted password_hash length:', insertedUser?.password_hash?.length ?? 0)
      console.log('[AUTH DEBUG] ===== REGISTRATION SUCCESS =====')
    }

    console.log(`[AUTH] User registered: ${username}`)

    // Return user data (excluding password_hash)
    const { password_hash: _, ...userWithoutPassword } = insertedUser

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}
