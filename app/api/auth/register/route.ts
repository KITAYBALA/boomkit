import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { createSession } from '@/lib/auth-server'
import { hashPassword, validatePassword } from '@/lib/password'
import { checkRateLimiter } from '@/lib/rate-limiter'
import { getClientIp, validUsername } from '@/lib/auth-input'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limit = await checkRateLimiter(ip)
    if (!limit.allowed) return NextResponse.json({ success: false, message: limit.message },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } })

    const body = await request.json()
    const username = typeof body.username === 'string' ? body.username.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const age = typeof body.age === 'number' || typeof body.age === 'string' ? Number(body.age) : NaN
    if (!validUsername(username)) return NextResponse.json({ success: false, message: 'Username must be 3-20 letters, numbers or underscores.' }, { status: 400 })
    if (!Number.isInteger(age) || age < 10 || age > 120) return NextResponse.json({ success: false, message: 'Age must be between 10 and 120.' }, { status: 400 })
    if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return NextResponse.json({ success: false, message: 'Invalid email address.' }, { status: 400 })
    const passwordError = validatePassword(body.password)
    if (passwordError) return NextResponse.json({ success: false, message: passwordError }, { status: 400 })
    if (typeof body.accessKey !== 'string' || !body.accessKey.trim() || body.accessKey.length > 128) {
      return NextResponse.json({ success: false, message: 'A valid Discord access key is required.' }, { status: 400 })
    }
    const supabase = getSupabaseServerClient()
    const { data: blacklisted, error: blacklistError } = await supabase.from('blacklisted_ips').select('ip').eq('ip', ip).maybeSingle()
    if (blacklistError) throw blacklistError
    if (blacklisted) return NextResponse.json({ success: false, message: 'Registration is not allowed.' }, { status: 403 })
    const { data: user, error } = await supabase.rpc('register_boomkit_user', {
      p_username: username, p_email: email, p_age: age,
      p_reason: typeof body.reason === 'string' ? body.reason.slice(0, 1000) : '',
      p_access_key: body.accessKey.trim(), p_password_hash: await hashPassword(body.password), p_ip: ip,
      p_device: typeof body.mac_address === 'string' ? body.mac_address.slice(0, 128) : null,
    })
    if (error) {
      if (error.code === '23505') return NextResponse.json({ success: false, message: 'Username or email is already registered.' }, { status: 409 })
      if (error.code === 'P0001') return NextResponse.json({ success: false, message: error.message }, { status: 400 })
      throw error
    }
    await createSession(user.id, user.role, Boolean(user.is_owner))
    return NextResponse.json({ success: true, user })
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ success: false, message: 'Invalid JSON.' }, { status: 400 })
    console.error('[AUTH] Registration failed:', error)
    return NextResponse.json({ success: false, message: 'Registration is temporarily unavailable.' }, { status: 503 })
  }
}
