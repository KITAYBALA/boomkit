import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'

// Simple server route calling the RPC with optimistic check
export async function POST(req: Request) {
  try {
    const session = await verifySession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { auctionId, amount } = await req.json()
    const supabase = getSupabaseServerClient()

    // Get the requester's username
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("username")
      .eq("id", session.userId)
      .single()

    if (userError || !userData) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { data, error } = await supabase.rpc('place_bid', {
      p_auction_id: auctionId,
      p_amount: amount,
      p_username: userData.username,
      p_user_id: session.userId,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, auction: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}
