import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'
import { z } from 'zod'

// Simple server route calling the RPC with optimistic check
export async function POST(req: Request) {
  try {
    const session = await verifySession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const parsed = z.object({ auctionId: z.string().uuid(), amount: z.number().int().min(1).max(1000000000) })
      .safeParse(await req.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: 'Invalid bid' }, { status: 400 })
    const { auctionId, amount } = parsed.data
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

    if (error) return NextResponse.json({ error: error.code === 'P0001' ? error.message : 'Unable to place bid' }, { status: 400 })
    return NextResponse.json({ ok: true, auction: data })
  } catch (e: any) {
    return NextResponse.json({ error: 'Unable to place bid' }, { status: 500 })
  }
}
