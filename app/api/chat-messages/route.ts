import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase-server-client';

export async function GET() {
  try {
    const { data, error } = await supabaseServerClient
      .from('chat_messages')
      .select('*')
      .order('timestamp', { ascending: true });

    if (error) {
      console.error("Error fetching chat messages:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Unexpected error fetching chat messages:", error);
    return NextResponse.json({ error: "Failed to fetch chat messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { username, message, role, timestamp } = await request.json();

    const { data, error } = await supabaseServerClient
      .from('chat_messages')
      .insert([{ username, message, role, timestamp }])
      .select()

    if (error) {
      console.error("Error posting chat message:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Unexpected error posting chat message:", error);
    return NextResponse.json({ error: "Failed to post chat message" }, { status: 500 });
  }
}
