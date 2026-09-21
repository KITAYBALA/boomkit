import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { authorizedRpc } from '@/lib/rpc-policy'

export async function POST(request: Request) {
  const fail = (message: string, status: number) => NextResponse.json({ data: null, error: { message } }, { status })
  try {
    const session = await verifySession()
    if (!session) return fail('Unauthorized', 401)
    const { method, params } = await request.json()
    if (typeof method !== 'string') return fail('Invalid operation', 400)
    const db = getSupabaseServerClient()
    const { data: actor, error: actorError } = await db.from('users').select('id, username, role, is_owner, status, booms, games_played').eq('id', session.userId).single()
    if (actorError || !actor) return fail('Unauthorized', 401)
    if (actor.status !== 'approved') return fail('Account approval required', 403)
    let args: Record<string, unknown>
    try { args = authorizedRpc(method, params, actor) } catch { return fail('Invalid operation or insufficient permission', 400) }
    if (method === 'accept_trade') {
      const { data: trade } = await db.from('trades').select('receiver_id').eq('id', args.trade_uuid).maybeSingle()
      if (!trade || trade.receiver_id !== actor.id) return fail('Only the recipient can accept this trade', 403)
    }
    if (method === 'reclaim_auction_item') {
      const { data: auction } = await db.from('auction_items').select('seller').eq('id', args.p_auction_id).maybeSingle()
      if (!auction || auction.seller !== actor.username) return fail('Only the seller can reclaim an auction', 403)
    }
    if (method === 'check_achievements') {
      if (args.p_type === 'games_played') args.p_value = actor.games_played || 0
      if (args.p_type === 'booms_collected') args.p_value = Object.values(actor.booms || {}).filter(value => Number(value) > 0).length
      if (args.p_type === 'evolved_count') {
        const { count, error } = await db.from('user_boom_evolution').select('id', { count: 'exact', head: true }).eq('username', actor.username).gt('level', 1)
        if (error) throw error
        args.p_value = count || 0
      }
    }
    const { data, error } = await db.rpc(method, args)
    if (error) {
      console.error('[RPC]', method, error.code)
      return fail(error.code === 'P0001' ? error.message : 'Operation failed. Please refresh and try again.', 400)
    }
    return NextResponse.json({ data, error: null })
  } catch (error) {
    return fail(error instanceof SyntaxError ? 'Invalid JSON' : 'Operation unavailable', error instanceof SyntaxError ? 400 : 500)
  }
}
