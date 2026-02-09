import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server-client"
import { generateGeminiResponse } from "@/lib/gemini"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    // Try created_at first, then inserted_at then id
    let { data, error } = await supabase.from("chat_messages").select("*").order("created_at", { ascending: true })

    if (error && error.message.includes("column \"created_at\" does not exist")) {
      console.log("[v0] Falling back to inserted_at for chat fetch")
      const fallback = await supabase.from("chat_messages").select("*").order("inserted_at", { ascending: true })
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error("[v0] Error fetching chat messages from DB:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const count = data?.length || 0
    console.log(`[v0] [API] Successfully fetched ${count} chat messages at ${new Date().toISOString()}`)
    return NextResponse.json(data || [], { status: 200 })
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

    // BURST SLOWMODE CHECK (allow 5 messages per 15 seconds)
    let { data: previousMessages }: { data: any[] | null } = await supabase
      .from("chat_messages")
      .select("created_at")
      .eq("username", username)
      .order("created_at", { ascending: false })
      .limit(5)

    if (!previousMessages) {
      // Try fallback column
      const fallback = await supabase
        .from("chat_messages")
        .select("inserted_at")
        .eq("username", username)
        .order("inserted_at", { ascending: false })
        .limit(5)
      previousMessages = fallback.data
    }

    if (previousMessages && previousMessages.length === 5) {
      // Check the 5th message back. If it was less than 15s ago, user is too fast.
      const fifthLastMessage = previousMessages[4]
      const timeStr = fifthLastMessage.created_at || (fifthLastMessage as any).inserted_at
      if (timeStr) {
        const lastTime = new Date(timeStr).getTime()
        const timeDiff = Date.now() - lastTime
        if (timeDiff < 15000) {
          const waitTime = Math.ceil((15000 - timeDiff) / 1000)
          return NextResponse.json({
            error: "SLOWMODE",
            message: `Burst limit reached. Please wait ${waitTime} seconds before typing again.`
          }, { status: 429 })
        }
      }
    }

    // Use Date.now() for consistency if that is what number implies, or ISO if it was string. 
    // Type definition said `timestamp: number`. So `Date.now()` is correct.

    const payload: any = {
      id: crypto.randomUUID(), // Generate ID in case DB doesn't have default
      username,
      message,
      role,
      timestamp: Date.now(), // Fallback for BIGINT timestamp column
      created_at: new Date().toISOString(), // Fallback for timestamptz column
      inserted_at: new Date().toISOString(), // Fallback for legacy column
    }

    // Try to insert with all possible columns, relying on DB to ignore extra or we might fail if strict.
    // Actually, sending extra props to Supabase insert usually fails if column doesn't exist.
    // We should try to determine which one to use or just use the one that matches the error.
    // But we can't see the error.

    // SAFE BET: Try to select first to see columns? No, too slow.
    // Better: Just fix the error reporting first so we can see what's wrong.

    // ACTUALLY, checking previous code, it used `inserted_at`. 
    // And `scripts/create_chat_messages_table_v1.sql` uses `timestamp`.

    // Let's rely on the error message to debug.

    const { data, error } = await supabase.from("chat_messages").insert([
      {
        username,
        message,
        role,
        // The DB will handle the timestamp (created_at or inserted_at) via defaults
      }
    ]).select()

    if (error) {
      console.error("[v0] Error posting chat message:", error)
      // Return the actual error to the client for debugging
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    console.log("[v0] Successfully posted chat message:", data)

    // GEMINI CHAT BOT INTEGRATION
    if (message.toLowerCase().includes("@gemini")) {
      const query = message.replace(/@gemini/gi, "").trim()

      if (query) {
        try {
          const aiResponse = await generateGeminiResponse(query)
          if (aiResponse) {
            await supabase.from("chat_messages").insert([{
              username: "Gemini 🤖",
              message: aiResponse,
              role: "admin", // Bot gets admin role for special color/status
            }])
            console.log("[GEMINI] Successfully responded to query in production mode")
          }
        } catch (err) {
          console.error("[GEMINI] Production error responding:", err)
        }
      }
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Unexpected error posting chat message:", error)
    return NextResponse.json({ error: error.message || "Failed to post chat message" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, username, message } = await request.json()
    const supabase = getSupabaseServerClient()

    // Ensure the message belongs to the user
    const { data: existingMessage, error: fetchError } = await supabase
      .from("chat_messages")
      .select("username")
      .eq("id", id)
      .single()

    if (fetchError || !existingMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    if (existingMessage.username !== username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Profanity check for edits too
    if (containsProfanity(message)) {
      return NextResponse.json({ error: "PROFANITY_DETECTED" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .update({ message })
      .eq("id", id)
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 200 })
  } catch (error) {
    console.error("[v0] Error updating message:", error)
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const username = searchParams.get("username")

    if (!id || !username) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Get the requester's role
    const { data: requesterData, error: requesterError } = await supabase
      .from("users")
      .select("role")
      .ilike("username", username)
      .single()

    if (requesterError || !requesterData) {
      return NextResponse.json({ error: "Requester not found" }, { status: 403 })
    }

    const isStaff = ["owner", "admin", "senior_moderator", "moderator", "tester"].includes(requesterData.role)

    // Ensure the message belongs to the user or requester is staff
    const { data: existingMessage, error: fetchError } = await supabase
      .from("chat_messages")
      .select("username")
      .eq("id", id)
      .single()

    if (fetchError || !existingMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    if (existingMessage.username !== username && !isStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error deleting message:", error)
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
  }
}
