import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase-server-client';

export async function GET() {
  try {
    const safeColumns = "id, username, age, tokens, daily_tokens, packs, booms, is_owner, is_banned, is_muted, status, reason, role, join_date, boom_score, total_value, profile_picture, is_plus_user, name_color, banner_color, last_daily_spin, badges, mute_expiry, ban_expiry, last_seen, packs_opened, xp, level";
    const { data, error } = await supabaseServerClient()
      .from('users')
      .select(safeColumns)
      .limit(100);

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Unexpected error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
