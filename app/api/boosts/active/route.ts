import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server-client"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const nowStr = new Date().toISOString()

    const { data: activeBoosts, error } = await supabase
      .from("active_boosts")
      .select("activated_by, multiplier, duration_hours, ends_at")
      .gt("ends_at", nowStr)
      .order("ends_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("[API/boosts/active] Database error:", error)
      return NextResponse.json({ success: false, message: "Database query failed" }, { status: 500 })
    }

    const activeBoost = activeBoosts && activeBoosts.length > 0 ? activeBoosts[0] : null

    return NextResponse.json({
      success: true,
      activeBoost
    })
  } catch (err) {
    console.error("[API/boosts/active] Unexpected error:", err)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
