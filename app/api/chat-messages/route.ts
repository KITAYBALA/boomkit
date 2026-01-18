import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server-client"
import { generateGeminiResponse } from "@/lib/gemini"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase.from("chat_messages").select("*").order("inserted_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching chat messages:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully fetched chat messages:", data?.length || 0)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[v0] Unexpected error fetching chat messages:", error)
    return NextResponse.json({ error: "Failed to fetch chat messages" }, { status: 500 })
  }
}

import { containsProfanity } from "@/lib/profanity"

export async function POST(request: Request) {
  try {
    const { username, message, role } = await request.json()

    const supabase = getSupabaseServerClient()

    console.log("[v0] Verifying user for chat:", username)
    // Check if user is muted before allowing message
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, is_muted, mute_expiry")
      .ilike("username", username)
      .maybeSingle()

    if (userError) {
      console.error("[v0] Error checking user mute status:", userError)
      return NextResponse.json({ error: `Failed to verify user status: ${userError.message}` }, { status: 500 })
    }

    if (!userData) {
      console.error("[v0] User not found for chat verification:", username)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if mute has expired
    if (userData.is_muted && userData.mute_expiry) {
      const muteExpiry = new Date(userData.mute_expiry)
      if (muteExpiry <= new Date()) {
        // Mute has expired, unmute the user
        await supabase
          .from("users")
          .update({ is_muted: false, mute_expiry: null })
          .eq("id", userData.id)
        console.log("[v0] Auto-unmuted user (mute expired):", username)
      } else {
        // Still muted
        return NextResponse.json({ error: "MUTED" }, { status: 403 })
      }
    } else if (userData.is_muted) {
      // Permanently muted (no expiry)
      return NextResponse.json({ error: "MUTED" }, { status: 403 })
    }

    // PROFANITY FILTER: Check message for inappropriate content
    if (containsProfanity(message)) {
      console.log("[v0] Profanity detected in message from:", username)

      // Auto-mute the user for 1 hour
      const muteExpiry = new Date()
      muteExpiry.setHours(muteExpiry.getHours() + 1)

      const { error: muteError } = await supabase
        .from("users")
        .update({
          is_muted: true,
          mute_expiry: muteExpiry.toISOString()
        })
        .eq("id", userData.id)

      if (muteError) {
        console.error("[v0] Error auto-muting user:", muteError)
      } else {
        console.log("[v0] Auto-muted user for 1 hour due to profanity:", username)
      }

      return NextResponse.json({
        error: "PROFANITY_DETECTED",
        message: "Your message contained inappropriate language. You have been muted for 1 hour."
      }, { status: 403 })
    }

    // SLOWMODE CHECK (15 seconds)
    const { data: lastMessage } = await supabase
      .from("chat_messages")
      .select("inserted_at")
      .eq("username", username)
      .order("inserted_at", { ascending: false })
      .limit(1)
      .single()

    if (lastMessage) {
      // Supabase returns inserted_at as an ISO string (e.g., "2023-01-01T12:00:00.000Z")
      const lastTime = new Date(lastMessage.inserted_at).getTime()
      const timeDiff = Date.now() - lastTime
      if (timeDiff < 15000) {
        const waitTime = Math.ceil((15000 - timeDiff) / 1000)
        return NextResponse.json({
          error: "SLOWMODE",
          message: `Please wait ${waitTime} seconds before typing again.`
        }, { status: 429 })
      }
    }

    // Use Date.now() for consistency if that is what number implies, or ISO if it was string. 
    // Type definition said `timestamp: number`. So `Date.now()` is correct.

    const { data, error } = await supabase.from("chat_messages").insert([{
      username,
      message,
      role,
    }]).select()

    if (error) {
      console.error("[v0] Error posting chat message:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully posted chat message:", data)

    // GEMINI CHAT BOT INTEGRATION
    if (message.toLowerCase().includes("@gemini")) {
      // Run AI response as a side effect (not blocking the initial message response)
      // Since this is a serverless route, we might want to wait or use a background task if supported
      // But for simplicity and reliability in this environment, we will process it before returning
      // or right after inserting the user message.

      const query = message.replace(/@gemini/gi, "").trim()

      if (query) {
        // We use a separate async operation to not block the user's message return
        // but since this is a standard Next.js route, we should probably handle it carefully.
        // Let's generate and insert the bot response.

        generateGeminiResponse(query).then(async (aiResponse) => {
          if (aiResponse) {
            await supabase.from("chat_messages").insert([{
              username: "Gemini 🤖",
              message: aiResponse,
              role: "admin", // Bot gets admin role for special color/status
            }])
            console.log("[GEMINI] Responded to query:", query)
          }
        }).catch(err => console.error("[GEMINI] Error:", err))
      }
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Unexpected error posting chat message:", error)
    return NextResponse.json({ error: "Failed to post chat message" }, { status: 500 })
  }
}
