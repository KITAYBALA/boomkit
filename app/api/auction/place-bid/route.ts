import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'

// Simple server route calling the RPC with optimistic check
export async function POST(req: Request) {
  try {
    const { auctionId, amount, username, userId } = await req.json()
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase.rpc('place_bid', {
      p_auction_id: auctionId,
      p_amount: amount,
      p_username: username,
      p_user_id: userId ?? null,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, auction: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
