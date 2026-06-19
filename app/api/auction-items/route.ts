import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase-server-client';
import { verifySession } from '@/lib/auth-server';

export async function GET() {
  try {
    const { data, error } = await supabaseServerClient()
      .from('auction_items')
      .select('id, boom_name, seller, current_bid, ends_at, bidders, status')
      .eq('status', 'active')
      .order('ends_at', { ascending: true });

    if (error) {
      console.error("Error fetching auction items:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Unexpected error fetching auction items:", error);
    return NextResponse.json({ error: "Failed to fetch auction items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => ({}));
    const { boom_name, current_bid, time_left } = body;

    // Strict input validation (L-07)
    if (typeof boom_name !== 'string' || !boom_name.trim()) {
      return NextResponse.json({ error: "boom_name must be a non-empty string" }, { status: 400 })
    }
    if (typeof current_bid !== 'number' || isNaN(current_bid) || current_bid <= 0) {
      return NextResponse.json({ error: "starting bid (current_bid) must be a positive number" }, { status: 400 })
    }
    const duration = Number(time_left);
    if (isNaN(duration) || duration < 1 || duration > 72) {
      return NextResponse.json({ error: "duration hours (time_left) must be between 1 and 72" }, { status: 400 })
    }

    const supabase = supabaseServerClient()

    // Call atomic create_auction RPC which handles verification and item deduction
    const { data, error } = await supabase
      .rpc('create_auction', {
        p_boom_name: boom_name.trim(),
        p_starting_bid: current_bid,
        p_duration_hours: duration,
        p_user_id: session.userId
      })

    if (error) {
      console.error("Error creating auction via RPC:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error posting auction item:", error);
    return NextResponse.json({ error: "Failed to post auction item" }, { status: 500 });
  }
}
