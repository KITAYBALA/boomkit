import { NextResponse } from 'next/server'
import { randomInt } from 'node:crypto'
import { verifySession } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { sessionInput } from '@/lib/session-policy'

export async function POST(request: Request) {
  try {
    const session = await verifySession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = sessionInput.safeParse(await request.json().catch(() => null))
    if (!body.success) return NextResponse.json({ error: 'Invalid room action' }, { status: 400 })
    const input = body.data
    const db = getSupabaseServerClient()
    const {error:rateError}=await db.rpc('enforce_action_limit',{p_key:`room-api:${input.action}:${session.userId}`,p_limit:input.action==='read'?120:input.action==='create'?3:20,p_seconds:60})
    if (rateError) return NextResponse.json({error:'Too many room requests. Please wait.'},{status:429})
    for (let attempt = 0; attempt < 3; attempt++) {
      const pin = input.action === 'create' ? String(randomInt(100000,1000000)) : input.pin
      const { data, error } = await db.rpc('secure_game_session', { p_user_id: session.userId, p_pin: pin, p_action: input.action, p_details: input })
      if (error?.code === '23505' && input.action === 'create') continue
      if (error) return NextResponse.json({ error: error.code === 'P0001' ? error.message : 'Room action failed' }, { status: 400 })
      return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } })
    }
    return NextResponse.json({ error: 'Could not allocate a room. Please try again.' }, { status: 503 })
  } catch { return NextResponse.json({ error: 'Room service unavailable' }, { status: 503 }) }
}
