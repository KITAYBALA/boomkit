import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server-client"
import { verifySession } from "@/lib/auth-server"

export const dynamic = "force-dynamic"

const BOOST_SPECS: Record<string, { multiplier: number; duration_hours: number; name: string }> = {
  "luck-charm-2x-1h": { multiplier: 2, duration_hours: 1, name: "2x Luck Charm (1 Hour)" },
  "luck-charm-2x-2h": { multiplier: 2, duration_hours: 2, name: "2x Luck Charm (2 Hours)" },
  "luck-charm-2x-3h": { multiplier: 2, duration_hours: 3, name: "2x Luck Charm (3 Hours)" },
  "luck-charm-super-3x-1h": { multiplier: 3, duration_hours: 1, name: "SUPER LUCK CHARM (3x Luck, 1 Hour)" },
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { boosterId } = body

    if (!boosterId || !BOOST_SPECS[boosterId]) {
      return NextResponse.json({ success: false, message: "Invalid booster item specified" }, { status: 400 })
    }

    const spec = BOOST_SPECS[boosterId]
    const supabase = getSupabaseServerClient()

    // 1. Check if there is already an active global boost
    const nowStr = new Date().toISOString()
    const { data: activeBoosts, error: checkErr } = await supabase
      .from("active_boosts")
      .select("*")
      .gt("ends_at", nowStr)
      .limit(1)

    if (checkErr) {
      console.error("[API/boosts/activate] Check active boosts error:", checkErr)
      return NextResponse.json({ success: false, message: "Failed to verify active boosts status" }, { status: 500 })
    }

    if (activeBoosts && activeBoosts.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Another global booster is currently active. Please wait for it to expire."
      }, { status: 400 })
    }

    // 2. Retrieve the user's inventory
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("username, inventory")
      .eq("id", session.userId)
      .single()

    if (userErr || !user) {
      console.error("[API/boosts/activate] User query error:", userErr)
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const currentInventory = Array.isArray(user.inventory) ? user.inventory : []
    const updatedInventory = [...currentInventory]

    const itemIndex = updatedInventory.findIndex((item: any) => item.id === boosterId)
    if (itemIndex === -1 || (updatedInventory[itemIndex].quantity || 0) < 1) {
      return NextResponse.json({ success: false, message: "You do not own this booster item" }, { status: 400 })
    }

    // 3. Decrement booster quantity
    updatedInventory[itemIndex].quantity -= 1
    // Remove if quantity becomes 0 to keep clean
    if (updatedInventory[itemIndex].quantity <= 0) {
      updatedInventory.splice(itemIndex, 1)
    }

    // 4. Update user inventory
    const { error: updateErr } = await supabase
      .from("users")
      .update({ inventory: updatedInventory })
      .eq("id", session.userId)

    if (updateErr) {
      console.error("[API/boosts/activate] User inventory update error:", updateErr)
      return NextResponse.json({ success: false, message: "Failed to deduct booster from inventory" }, { status: 500 })
    }

    // 5. Insert active boost row
    const endsAt = new Date(Date.now() + spec.duration_hours * 60 * 60 * 1000).toISOString()
    const { error: insertErr } = await supabase
      .from("active_boosts")
      .insert({
        activated_by: user.username,
        multiplier: spec.multiplier,
        duration_hours: spec.duration_hours,
        ends_at: endsAt
      })

    if (insertErr) {
      console.error("[API/boosts/activate] Insert active boost error:", insertErr)
      // Attempt to rollback user inventory update (optimistic recovery)
      await supabase.from("users").update({ inventory: user.inventory }).eq("id", session.userId)
      return NextResponse.json({ success: false, message: "Failed to activate global boost" }, { status: 500 })
    }

    // 6. Log activity
    try {
      await supabase.from("user_activity").insert({
        username: user.username,
        activity_type: "boost_activated",
        description: `Activated ${spec.name} (Global ${spec.multiplier}x Luck Boost)`,
        details: { boosterId, multiplier: spec.multiplier, duration_hours: spec.duration_hours }
      })
    } catch (logErr) {
      console.error("[API/boosts/activate] Log activity error:", logErr)
    }

    return NextResponse.json({
      success: true,
      message: `${spec.name} activated successfully! All drop rates are now boosted.`,
      inventory: updatedInventory
    })
  } catch (err) {
    console.error("[API/boosts/activate] Unexpected error:", err)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
