import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase-server-client';

interface Params {
  id: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseServerClient
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(`Unexpected error fetching user with ID ${id}:`, error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
