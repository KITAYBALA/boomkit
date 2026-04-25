import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase-server-client';
import { verifySession } from '@/lib/auth-server';

export async function GET() {
  try {
    const { data, error } = await supabaseServerClient()
      .from('auction_items')
      .select('id, boom_name, seller, current_bid, time_left, bidders');

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

    const { boom_name, current_bid, time_left, bidders } = await request.json();

    const { data: userData, error: userError } = await supabaseServerClient()
      .from("users")
      .select("username")
      .eq("id", session.userId)
      .single()

    if (userError || !userData) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { data, error } = await supabaseServerClient()
      .from('auction_items')
      .insert([{ boom_name, seller: userData.username, current_bid, time_left, bidders }])
      .select('id, boom_name, seller, current_bid, time_left, bidders')

    if (error) {
      console.error("Error posting auction item:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Unexpected error posting auction item:", error);
    return NextResponse.json({ error: "Failed to post auction item" }, { status: 500 });
  }
}
