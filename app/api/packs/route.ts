import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase-server-client';

export async function GET() {
  try {
    const { data, error } = await supabaseServerClient
      .from('packs')
      .select('*');

    if (error) {
      console.error("Error fetching packs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Unexpected error fetching packs:", error);
    return NextResponse.json({ error: "Failed to fetch packs" }, { status: 500 });
  }
}
