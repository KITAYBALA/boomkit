import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase-server-client';

export async function GET() {
  try {
    const { data, error } = await supabaseServerClient
      .from('auction_items')
      .select('*');

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
    const { boom_name, seller, current_bid, time_left, bidders } = await request.json();

    const { data, error } = await supabaseServerClient
      .from('auction_items')
      .insert([{ boom_name, seller, current_bid, time_left, bidders }])
      .select()

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
