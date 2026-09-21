import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { economyInput, economyDetails } from '@/lib/economy-policy'

export async function POST(request: Request) {
  try {
    const session = await verifySession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const parsed = economyInput.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: 'Invalid economy action' }, { status: 400 })
    const db = getSupabaseServerClient()
    let boost = 1
    if (parsed.data.action === 'open_pack') {
      const { data, error } = await db.from('active_boosts').select('multiplier').gt('ends_at', new Date().toISOString()).limit(1).maybeSingle()
      if (error) throw error
      boost = Number(data?.multiplier) || 1
    }
    let details
    try { details = economyDetails(parsed.data, boost) }
    catch { return NextResponse.json({ error: 'Unknown item' }, { status: 400 }) }
    const { data, error } = await db.rpc('apply_boomkit_economy_action', {
      p_user_id: session.userId, p_request_id: parsed.data.requestId, p_action: parsed.data.action, p_details: details,
    })
    if (error) return NextResponse.json({ error: error.code === 'P0001' ? error.message : 'Unable to complete action' }, { status: 400 })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Economy action failed', error)
    return NextResponse.json({ error: 'Economy service unavailable' }, { status: 503 })
  }
}
