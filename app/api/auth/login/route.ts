import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { createSession } from '@/lib/auth-server'
import { checkRateLimiter } from '@/lib/rate-limiter'
import { hashPassword, verifyPassword } from '@/lib/password'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const AUTH_USER_COLUMNS = [
  'id',
  'username',
  'email',
  'is_banned',
  'is_owner',
  'role',
  'is_muted',
  'status',
  'badges',
  'name_color',
  'banner_color',
  'profile_picture',
  'tokens',
  'boom_score',
  'total_value',
  'packs',
  'booms',
  'daily_tokens',
  'join_date',
  'is_plus_user',
  'last_daily_spin',
  'mute_expiry',
  'ban_expiry',
  'ban_reason',
  'last_seen',
  'packs_opened',
  'age',
  'reason',
  'xp',
  'level',
  'clan_id',
  'clan_role',
  'clan_tag',
  'clan_tag_color',
  'fusion_cooldown_ends_at',
  'consecutive_fusions',
  'last_fusion_claim_time',
  'active_fusion_boom1',
  'active_fusion_boom2',
  'active_fusion_ends_at',
  'active_fusion_started_at',
].join(', ')

const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true' || process.env.NODE_ENV !== 'production'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rateLimit = await checkRateLimiter(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: rateLimit.message },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      )
    }

    const body = await request.json()
    const identifier = typeof body.username === 'string' ? body.username.trim() : ''
    const password = body.password
    const mac_address = body.mac_address

    if (!identifier || typeof password !== 'string') {
      return NextResponse.json({ success: false, message: 'Username and password are required' }, { status: 400 })
    }

    if (DEBUG_AUTH) {
      console.log('[AUTH DEBUG] ===== LOGIN START =====')
      console.log('[AUTH DEBUG] Input username/email:', identifier)
      console.log('[AUTH DEBUG] Input password length:', password.length)
    }

    const supabase = getSupabaseServerClient()

    const { data: blacklisted } = await supabase
      .from('blacklisted_ips')
      .select('ip')
      .eq('ip', ip)
      .maybeSingle()

    if (blacklisted) {
      if (DEBUG_AUTH) console.log('[AUTH DEBUG] IP is blacklisted:', ip)
      return NextResponse.json(
        { success: false, message: 'Your IP address is blacklisted. Access denied.' },
        { status: 403 }
      )
    }

    const userData = await findUserByUsernameOrEmail(supabase, identifier)
    if (!userData) {
      if (DEBUG_AUTH) console.log('[AUTH DEBUG] User not found by username or email')
      return invalidCredentials()
    }

    if (DEBUG_AUTH) {
      console.log('[AUTH DEBUG] User found:', userData.username)
      console.log('[AUTH DEBUG] User ID:', userData.id)
      console.log('[AUTH DEBUG] User is_banned:', userData.is_banned)
      console.log('[AUTH DEBUG] Stored password_hash exists:', !!userData.password_hash)
    }

    if (userData.is_banned) {
      const reason = userData.ban_reason ? `Banned: ${userData.ban_reason}` : 'Account is banned'
      return NextResponse.json({ success: false, message: reason }, { status: 403 })
    }

    if (!userData.password_hash) {
      return NextResponse.json(
        {
          success: false,
          message: 'This account password must be reset by an owner or admin.',
          requiresAdminReset: true,
        },
        { status: 403 }
      )
    }

    const passwordResult = await verifyPassword(password, userData.password_hash)
    if (DEBUG_AUTH) {
      console.log('[AUTH DEBUG] Password verification result:', passwordResult)
    }

    if (!passwordResult.valid) {
      return invalidCredentials()
    }

    await createSession(userData.id, userData.role || 'player', userData.is_owner || false)

    if (userData.password_reset_required) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password reset required',
          requiresReset: true,
        },
        { status: 403 }
      )
    }

    const updatePayload: Record<string, string> = { last_ip: ip }
    if (mac_address) {
      updatePayload.mac_address = mac_address
    }
    if (passwordResult.needsRehash) {
      try {
        updatePayload.password_hash = await hashPassword(password)
        if (DEBUG_AUTH) console.log('[AUTH DEBUG] Password successfully rehashed to scrypt')
      } catch (rehashError) {
        console.warn('[AUTH] Failed to rehash password during login:', rehashError)
      }
    }

    await supabase.from('user_secrets').update(updatePayload).eq('user_id', userData.id)

    if (DEBUG_AUTH) console.log('[AUTH DEBUG] ===== LOGIN SUCCESS =====')

    return NextResponse.json({
      success: true,
      user: toSafeUser(userData),
    })
  } catch (error: any) {
    console.error('[AUTH] Login error:', error)
    
    // If it's a configuration error (missing env vars), expose it to help the user debug
    if (error instanceof Error && (error.message.includes('env vars') || error.message.includes('FATAL SECURITY ERROR'))) {
      return NextResponse.json({ success: false, message: `Configuration Error: ${error.message}` }, { status: 500 })
    }
    
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}

function getClientIp(request: NextRequest) {
  const req = request as any
  if (req.ip) return req.ip
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
}

async function findUserByUsernameOrEmail(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  identifier: string
): Promise<any | null> {
  if (DEBUG_AUTH) console.log('[AUTH DEBUG] Querying username:', identifier)
  const { data: userByUsername, error: usernameError } = await supabase
    .from('users')
    .select(AUTH_USER_COLUMNS)
    .ilike('username', identifier)
    .maybeSingle()

  if (usernameError) {
    console.error('[AUTH] Username lookup failed:', usernameError)
    return null
  }

  if (userByUsername) {
    if (DEBUG_AUTH) console.log('[AUTH DEBUG] User found by username lookup')
    const { data: secrets } = await supabase.from('user_secrets').select('*').eq('user_id', userByUsername.id).maybeSingle()
    if (secrets) {
      userByUsername.password_hash = secrets.password_hash
      userByUsername.password_reset_required = secrets.password_reset_required
    }
    return userByUsername
  }

  if (DEBUG_AUTH) console.log('[AUTH DEBUG] Username not found, querying email:', identifier)
  const { data: userByEmail, error: emailError } = await supabase
    .from('users')
    .select(AUTH_USER_COLUMNS)
    .ilike('email', identifier)
    .maybeSingle()

  if (emailError) {
    console.error('[AUTH] Email lookup failed:', emailError)
    return null
  }

  if (userByEmail) {
    if (DEBUG_AUTH) console.log('[AUTH DEBUG] User found by email lookup')
    const { data: secrets } = await supabase.from('user_secrets').select('*').eq('user_id', userByEmail.id).maybeSingle()
    if (secrets) {
      userByEmail.password_hash = secrets.password_hash
      userByEmail.password_reset_required = secrets.password_reset_required
    }
  }

  return userByEmail
}

function invalidCredentials() {
  return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 })
}

function toSafeUser(userData: any) {
  return {
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
    level: userData.level,
    fusion_cooldown_ends_at: userData.fusion_cooldown_ends_at,
    consecutive_fusions: userData.consecutive_fusions,
    last_fusion_claim_time: userData.last_fusion_claim_time,
    active_fusion_boom1: userData.active_fusion_boom1,
    active_fusion_boom2: userData.active_fusion_boom2,
    active_fusion_ends_at: userData.active_fusion_ends_at,
    active_fusion_started_at: userData.active_fusion_started_at,
  }
}
