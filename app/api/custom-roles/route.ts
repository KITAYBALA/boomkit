import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase-server-client';

export async function GET() {
  try {
    const { data, error } = await supabaseServerClient
      .from('custom_roles')
      .select('*');

    if (error) {
      console.error("Error fetching custom roles:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Unexpected error fetching custom roles:", error);
    return NextResponse.json({ error: "Failed to fetch custom roles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, color, assigned_by, assigned_date } = await request.json();

    const { data, error } = await supabaseServerClient
      .from('custom_roles')
      .insert([{ name, color, assigned_by, assigned_date }])
      .select()

    if (error) {
      console.error("Error posting custom role:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Unexpected error posting custom role:", error);
    return NextResponse.json({ error: "Failed to post custom role" }, { status: 500 });
  }
}
