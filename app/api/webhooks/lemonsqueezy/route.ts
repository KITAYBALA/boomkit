import { NextResponse } from "next/server"
import { headers } from "next/headers"
import crypto from "crypto"
import { supabaseServerClient } from "@/lib/supabase-server-client"

export async function POST(req: Request) {
  const body = await req.text()
  const headerList = await headers()
  const sig = headerList.get("x-signature")

  if (!sig) {
    console.error("Missing Lemon Squeezy signature header")
    return new NextResponse("Missing signature", { status: 400 })
  }

  const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("Missing LEMON_SQUEEZY_WEBHOOK_SECRET environment variable")
    return new NextResponse("Webhook secret not configured", { status: 500 })
  }

  // Verify signature
  const hmac = crypto.createHmac("sha256", webhookSecret)
  const digest = hmac.update(body).digest("hex")

  const sigBuffer = Buffer.from(sig, "utf-8")
  const digestBuffer = Buffer.from(digest, "utf-8")

  if (sigBuffer.length !== digestBuffer.length || !crypto.timingSafeEqual(sigBuffer, digestBuffer)) {
    console.error("Lemon Squeezy signature verification failed")
    return new NextResponse("Invalid signature", { status: 400 })
  }

  const payload = JSON.parse(body)
  const eventName = payload.meta?.event_name
  const customData = payload.meta?.custom_data

  if (!customData || !customData.userId || !customData.productId) {
    console.warn("Lemon Squeezy webhook received but missing custom_data details:", payload.meta)
    return NextResponse.json({ received: true, error: "Missing metadata" })
  }

  const { userId, productId, tokens } = customData
  const parsedTokens = parseInt(tokens || "0", 10)

  const supabase = supabaseServerClient()

  // We handle order creation, subscription creation, and subscription payment success (renewal) events
  if (
    eventName === "order_created" ||
    eventName === "subscription_created" ||
    eventName === "subscription_payment_success"
  ) {
    // Retrieve the user to verify existence and get current tokens, username & inventory
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("username, tokens, is_plus_user, has_plus_pass, inventory")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      console.error("User not found or database error in Lemon Squeezy webhook:", userError)
      return new NextResponse("User not found", { status: 404 })
    }

    const updates: any = {}

    if (productId === "boomkit-plus") {
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
    }

    const boosterProducts = new Set([
      "luck-charm-2x-1h",
      "luck-charm-2x-2h",
      "luck-charm-2x-3h",
      "luck-charm-super-3x-1h"
    ])

    if (boosterProducts.has(productId)) {
      const currentInventory = Array.isArray(user.inventory) ? user.inventory : []
      const updatedInventory = [...currentInventory]
      const itemIndex = updatedInventory.findIndex((item: any) => item.id === productId)
      if (itemIndex > -1) {
        updatedInventory[itemIndex].quantity = (updatedInventory[itemIndex].quantity || 0) + 1
      } else {
        updatedInventory.push({ id: productId, quantity: 1 })
      }
      updates.inventory = updatedInventory
    }

    if (parsedTokens > 0) {
      updates.tokens = (user.tokens || 0) + parsedTokens
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userId)

      if (updateError) {
        console.error("Failed to update user in Lemon Squeezy webhook:", updateError)
        return new NextResponse("Database update failed", { status: 500 })
      }

      // Log activity
      try {
        let actDesc = `Purchased ${productId === "boomkit-plus" ? "Boomkit Plus" : `${parsedTokens} Tokens`}`
        if (boosterProducts.has(productId)) {
          actDesc = `Purchased Booster: ${productId}`
        }
        await supabase.from("user_activity").insert({
          username: user.username,
          activity_type: "purchase",
          description: actDesc,
          details: { productId, tokens: parsedTokens, provider: "lemonsqueezy" }
        })
      } catch (logErr) {
        console.error("Failed to log activity in Lemon Squeezy webhook:", logErr)
      }
    }
  }

  return NextResponse.json({ received: true })
}
