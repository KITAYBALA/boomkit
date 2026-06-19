import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server-client"
import { verifySession } from "@/lib/auth-server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { rewardId } = body

    if (!rewardId) {
      return NextResponse.json({ success: false, message: "Missing rewardId" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // 1. Fetch reward details
    const { data: reward, error: rewardErr } = await supabase
      .from("season_rewards")
      .select("*")
      .eq("id", rewardId)
      .single()

    if (rewardErr || !reward) {
      console.error("[API/season/claim] Reward fetch error:", rewardErr)
      return NextResponse.json({ success: false, message: "Season reward not found" }, { status: 404 })
    }

    // 2. Fetch user details
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.userId)
      .single()

    if (userErr || !user) {
      console.error("[API/season/claim] User fetch error:", userErr)
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // 3. Validation: Check if user has sufficient XP
    const userXp = user.season_xp || 0
    if (userXp < reward.xp_required) {
      return NextResponse.json({
        success: false,
        message: `Insufficient XP. Requires ${reward.xp_required} XP (You have ${userXp} XP).`
      }, { status: 400 })
    }

    // 4. Validation: Check Premium requirement (Plus Pass or Staff member)
    const isStaff = ["owner", "admin", "senior_moderator", "moderator", "tester"].includes(
      (user.role || "").toLowerCase()
    )
    const hasPlusPass = user.has_plus_pass || isStaff

    if (reward.is_premium && !hasPlusPass) {
      return NextResponse.json({
        success: false,
        message: "Plus Pass or Plus membership is required for premium rewards."
      }, { status: 400 })
    }

    // 5. Validation: Check/register claim atomically in claimed_season_rewards
    const { error: claimInsertErr } = await supabase
      .from("claimed_season_rewards")
      .insert({
        user_id: session.userId,
        reward_id: rewardId
      })

    if (claimInsertErr) {
      if (claimInsertErr.code === "23505") {
        return NextResponse.json({ success: false, message: "Reward already claimed." }, { status: 400 })
      }
      console.error("[API/season/claim] Claim registration error:", claimInsertErr)
      return NextResponse.json({ success: false, message: "Verification failed or already claimed." }, { status: 500 })
    }

    // 6. Process Reward
    const userUpdates: any = {}

    if (reward.reward_type === "tokens") {
      const rewardTokens = parseFloat(reward.reward_value) || 0
      userUpdates.tokens = (user.tokens || 0) + rewardTokens
    } else if (reward.reward_type === "boom") {
      const currentBooms = user.booms || {}
      const updatedBooms = { ...currentBooms }
      const boomName = reward.reward_value
      updatedBooms[boomName] = (updatedBooms[boomName] || 0) + 1
      userUpdates.booms = updatedBooms
    } else if (reward.reward_type === "plus_days") {
      // If user has a default 'user' role, elevate them to tester for access, or just update plus status
      if (user.role === "user") {
        userUpdates.role = "tester"
      }
      userUpdates.is_plus_user = true
      userUpdates.has_plus_pass = true
    }

    // 7. Update User in DB
    const { error: updateErr } = await supabase
      .from("users")
      .update(userUpdates)
      .eq("id", user.id)

    if (updateErr) {
      console.error("[API/season/claim] User update error:", updateErr)
      return NextResponse.json({ success: false, message: "Failed to award season pass item" }, { status: 500 })
    }

    // 8. Log Claim Activity
    try {
      await supabase.from("user_activity").insert({
        username: user.username,
        activity_type: "season_claim",
        description: `Claimed Tier ${reward.tier} Season Reward: ${reward.reward_value}`,
        details: { reward_id: rewardId, type: reward.reward_type, reward_value: reward.reward_value }
      })
    } catch (logErr) {
      console.error("[API/season/claim] Log activity error:", logErr)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully collected Tier ${reward.tier} reward: ${reward.reward_value}!`
    })
  } catch (err) {
    console.error("[API/season/claim] Unexpected error:", err)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
