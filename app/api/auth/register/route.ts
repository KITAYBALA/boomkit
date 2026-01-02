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

    // Check if user already exists (check username and email separately for safety)
    const { data: existingByUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()
    
    if (existingByUsername) {
      return NextResponse.json({ success: false, message: 'Username already exists' }, { status: 400 })
    }
    
    const { data: existingByEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    
    if (existingByEmail) {
      return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 })
    }

    // Hash password using SHA-256 (same algorithm as login)
    const passwordHash = createHash('sha256').update(password).digest('hex')
    const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true' || process.env.NODE_ENV !== 'production'
    if (DEBUG_AUTH) console.log(`[AUTH DEBUG] Registration - hashing algorithm: sha256, hash length: ${passwordHash.length}, storing in column: password_hash`)

    // Create user
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      age: Number.parseInt(age),
      password_hash: passwordHash, // Store hashed password
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
      return NextResponse.json({ success: false, message: 'Registration failed' }, { status: 500 })
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
