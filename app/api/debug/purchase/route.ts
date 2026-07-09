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

    if (process.env.NODE_ENV === "production" && !session.isOwner && session.role !== "owner" && session.role !== "admin") {
      return NextResponse.json({ success: false, message: "Sandbox is disabled in production for non-staff users." }, { status: 403 })
    }

    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json({ success: false, message: "Missing productId" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Retrieve the user details
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("username, tokens, is_plus_user, has_plus_pass, inventory")
      .eq("id", session.userId)
      .single()

    if (userErr || !user) {
      console.error("[API/debug/purchase] User query error:", userErr)
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const updates: any = {}
    let message = ""

    if (productId === "tokens-10k") {
      updates.tokens = (user.tokens || 0) + 10000
      message = "Added 10,000 Sandbox tokens successfully!"
    } else if (productId === "boomkit-plus") {
      updates.is_plus_user = true
      updates.has_plus_pass = true
      updates.tokens = (user.tokens || 0) + 10000

      // Award 1 2x Luck Charm (1 hour)
      const currentInventory = Array.isArray(user.inventory) ? user.inventory : []
      const updatedInventory = [...currentInventory]
      const itemIndex = updatedInventory.findIndex((item: any) => item.id === "luck-charm-2x-1h")
      if (itemIndex > -1) {
        updatedInventory[itemIndex].quantity = (updatedInventory[itemIndex].quantity || 0) + 1
      } else {
        updatedInventory.push({ id: "luck-charm-2x-1h", quantity: 1 })
      }
      updates.inventory = updatedInventory
      message = "Acquired Boomkit Plus! Awarded 10,000 tokens and 1x 2x Luck Charm (1h)."
    } else if (
      productId === "luck-charm-2x-1h" ||
      productId === "luck-charm-2x-2h" ||
      productId === "luck-charm-2x-3h" ||
      productId === "luck-charm-super-3x-1h"
    ) {
      const currentInventory = Array.isArray(user.inventory) ? user.inventory : []
      const updatedInventory = [...currentInventory]
      const itemIndex = updatedInventory.findIndex((item: any) => item.id === productId)
      
      if (itemIndex > -1) {
        updatedInventory[itemIndex].quantity = (updatedInventory[itemIndex].quantity || 0) + 1
      } else {
        updatedInventory.push({ id: productId, quantity: 1 })
      }
      updates.inventory = updatedInventory
      message = `Sandbox Purchase Success: Added ${productId} to your inventory.`
    } else {
      return NextResponse.json({ success: false, message: "Unsupported sandbox product ID" }, { status: 400 })
    }

    // Save user update in DB
    const { error: updateErr } = await supabase
      .from("users")
      .update(updates)
      .eq("id", session.userId)

    if (updateErr) {
      console.error("[API/debug/purchase] Database update error:", updateErr)
      return NextResponse.json({ success: false, message: "Failed to persist sandbox updates" }, { status: 500 })
    }

    // Log activity
    try {
      await supabase.from("user_activity").insert({
        username: user.username,
        activity_type: "purchase",
        description: `[SANDBOX] Simulated purchase of ${productId}`,
        details: { productId, provider: "sandbox" }
      })
    } catch (logErr) {
      console.error("[API/debug/purchase] Log activity error:", logErr)
    }

    return NextResponse.json({
      success: true,
      message,
      user: {
        ...user,
        ...updates
      }
    })
  } catch (err) {
    console.error("[API/debug/purchase] Unexpected error:", err)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
