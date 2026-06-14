import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { supabaseServerClient } from "@/lib/supabase-server-client"

export async function POST(req: Request) {
  const body = await req.text()
  const headerList = await headers()
  const sig = headerList.get("stripe-signature")

  if (!sig) {
    console.error("Missing Stripe signature header")
    return new NextResponse("Missing Stripe signature", { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET environment variable")
    return new NextResponse("Webhook secret not configured", { status: 500 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any
    const metadata = session.metadata

    if (!metadata || !metadata.userId || !metadata.productId) {
      console.error("Missing metadata in Stripe session:", session.id)
      return NextResponse.json({ received: true, error: "Missing metadata" })
    }

    const { userId, productId, tokens } = metadata
    const parsedTokens = parseInt(tokens || "0", 10)

    const supabase = supabaseServerClient()

    // Retrieve the user to verify existence and get current tokens & username
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("username, tokens, is_plus_user, has_plus_pass")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      console.error("User not found or database error in webhook:", userError)
      return new NextResponse("User not found", { status: 404 })
    }

    const updates: any = {}

    if (productId === "boomkit-plus") {
      updates.is_plus_user = true
      updates.has_plus_pass = true
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
        console.error("Failed to update user in stripe webhook:", updateError)
        return new NextResponse("Database update failed", { status: 500 })
      }

      // Log activity
      try {
        await supabase.from("user_activity").insert({
          username: user.username,
          activity_type: "purchase",
          description: `Purchased ${productId === "boomkit-plus" ? "Boomkit Plus" : `${parsedTokens} Tokens`}`,
          details: { productId, tokens: parsedTokens }
        })
      } catch (logErr) {
        console.error("Failed to log activity in webhook:", logErr)
      }
    }
  }

  return NextResponse.json({ received: true })
}
