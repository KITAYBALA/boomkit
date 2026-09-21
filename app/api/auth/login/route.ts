import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { createSession } from '@/lib/auth-server'
import { checkRateLimiter } from '@/lib/rate-limiter'
import { hashPassword, verifyPassword, MAX_PASSWORD_LENGTH } from '@/lib/password'
import { getClientIp, escapeLikeLiteral } from '@/lib/auth-input'
import { createHash } from 'node:crypto'

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
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, message: 'Invalid login request' }, { status: 400 })
    const identifier = typeof body.username === 'string' ? body.username.trim() : ''
    const password = body.password
    const mac_address = body.mac_address

    if (!identifier || identifier.length > 254 || typeof password !== 'string' || !password.length || password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json({ success: false, message: 'Username and password are required' }, { status: 400 })
    }

    const accountLimit = await checkRateLimiter('account:' + createHash('sha256').update(identifier.toLowerCase()).digest('hex'))
    if (!accountLimit.allowed) return NextResponse.json({success:false,message:accountLimit.message},{status:429,headers:{'Retry-After':String(accountLimit.retryAfter)}})

    if (DEBUG_AUTH) {
      console.log('[AUTH DEBUG] ===== LOGIN START =====')
      console.log('[AUTH DEBUG] Input username/email:', identifier)
      console.log('[AUTH DEBUG] Input password length:', password.length)
    }

    const supabase = getSupabaseServerClient()

    const { data: blacklisted, error: blacklistError } = await supabase
      .from('blacklisted_ips')
      .select('ip')
      .eq('ip', ip)
      .maybeSingle()

    if (blacklistError) throw blacklistError

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

    if (userData.is_banned && (!userData.ban_expiry || !(new Date(userData.ban_expiry).getTime() <= Date.now()))) {
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

    await createSession(userData.id, userData.role || 'player', userData.is_owner || false, Boolean(userData.password_reset_required))

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
    if (typeof mac_address === 'string' && mac_address.length <= 128) {
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
    if (error instanceof SyntaxError) return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
    console.error('[AUTH] Login error:', error)
    
    // If it's a configuration error (missing env vars), expose it to help the user debug
    if (error instanceof Error && (error.message.includes('env vars') || error.message.includes('FATAL SECURITY ERROR'))) {
      return NextResponse.json({ success: false, message: `Configuration Error: ${error.message}` }, { status: 500 })
    }
    
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}

async function findUserByUsernameOrEmail(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  identifier: string
): Promise<any | null> {
  if (DEBUG_AUTH) console.log('[AUTH DEBUG] Querying username:', identifier)
  const { data: userByUsername, error: usernameError } = await supabase
    .from('users')
    .select('*')
    .ilike('username', escapeLikeLiteral(identifier))
    .maybeSingle()

  if (usernameError) {
    console.error('[AUTH] Username lookup failed:', usernameError)
    return null
  }

  if (userByUsername) {
    if (DEBUG_AUTH) console.log('[AUTH DEBUG] User found by username lookup')
    const user = userByUsername as any
    const { data: secrets } = await supabase.from('user_secrets').select('*').eq('user_id', user.id).maybeSingle()
    if (secrets) {
      user.password_hash = secrets.password_hash
      user.password_reset_required = secrets.password_reset_required
    }
    return user
  }

  if (DEBUG_AUTH) console.log('[AUTH DEBUG] Username not found, querying email:', identifier)
  const { data: userByEmail, error: emailError } = await supabase
    .from('users')
    .select('*')
    .ilike('email', escapeLikeLiteral(identifier))
    .maybeSingle()

  if (emailError) {
    console.error('[AUTH] Email lookup failed:', emailError)
    return null
  }

  if (userByEmail) {
    if (DEBUG_AUTH) console.log('[AUTH DEBUG] User found by email lookup')
    const user = userByEmail as any
    const { data: secrets } = await supabase.from('user_secrets').select('*').eq('user_id', user.id).maybeSingle()
    if (secrets) {
      user.password_hash = secrets.password_hash
      user.password_reset_required = secrets.password_reset_required
    }
    return user
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
    is_banned: userData.is_banned && !(userData.ban_expiry && new Date(userData.ban_expiry).getTime() <= Date.now()),
    is_muted: userData.is_muted && !(userData.mute_expiry && new Date(userData.mute_expiry).getTime() <= Date.now()),
    status: userData.status,
    badges: userData.badges,
    name_color: userData.name_color,
    banner_color: userData.banner_color,
    profile_picture: userData.profile_picture,
    join_date: userData.join_date,
    boom_score: userData.boom_score,
    total_value: userData.total_value,
    is_plus_user: userData.is_plus_user || new Date(userData.plus_reward_expires_at || 0).getTime() > Date.now(),
    has_plus_pass: userData.has_plus_pass || new Date(userData.plus_reward_expires_at || 0).getTime() > Date.now(),
    inventory: userData.inventory || [],
    season_xp: userData.season_xp || 0,
    pinned_boom: userData.pinned_boom,
    discover_tokens_earned: userData.discover_tokens_earned || 0,
    correct_answers_count: userData.correct_answers_count || 0,
    questions_answered_count: userData.questions_answered_count || 0,
    clan_id: userData.clan_id,
    clan_role: userData.clan_role,
    clan_tag: userData.clan_tag,
    clan_tag_color: userData.clan_tag_color,
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
