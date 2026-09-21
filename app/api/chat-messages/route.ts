import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server-client"
import { generateGeminiResponse } from "@/lib/gemini"
import { escapeLikeLiteral } from "@/lib/auth-input"
import { canModerate, isModerator } from "@/lib/moderation-policy"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    // We've confirmed 'inserted_at' is the correct column in the live DB
    const { data, error } = await supabase.from("chat_messages").select("*").order("inserted_at", { ascending: false }).limit(50)
    // Reverse the data so it renders in chronological order
    const chronologicalData = data ? [...data].reverse() : []

    if (error) {
      console.error("[v0] Error fetching chat messages from DB:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const count = chronologicalData.length || 0
    console.log(`[v0] [API] Successfully fetched ${count} chat messages at ${new Date().toISOString()}`)
    return NextResponse.json(chronologicalData, { status: 200 })
  } catch (error) {
    console.error("[v0] Unexpected error fetching chat messages:", error)
    return NextResponse.json({ error: "Failed to fetch chat messages" }, { status: 500 })
  }
}

import { containsProfanity } from "@/lib/profanity"
import { verifySession } from "@/lib/auth-server"

async function handleStaffCommand(
  cmd: string,
  commandParts: string[],
  userData: { id: string; username: string; role: string; is_owner: boolean },
  supabase: any
) {
  const targetUsername = commandParts[1]?.trim();
  if (!targetUsername) {
    return NextResponse.json({ error: "Missing username parameter." }, { status: 400 });
  }

  // Find target user
  const { data: targetUser, error: fetchErr } = await supabase
    .from("users")
    .select("id, username, tokens, role, is_owner")
    .ilike("username", escapeLikeLiteral(targetUsername))
    .maybeSingle();

  if (fetchErr || !targetUser) {
    return NextResponse.json({ error: `User "${targetUsername}" not found.` }, { status: 404 });
  }

  let broadcastMessage = "";
  if (["/ban", "/unban", "/mute", "/unmute"].includes(cmd) && !canModerate(userData, targetUser)) {
    return NextResponse.json({ error: "You cannot moderate this account." }, { status: 403 });
  }

  if (cmd === "/ban") {
    let duration: number | null = null;
    let reason = "Banned by staff";
    if (commandParts.length > 2) {
      const lastPart = commandParts[commandParts.length - 1];
      const parsedDuration = parseInt(lastPart, 10);
      if (!isNaN(parsedDuration) && parsedDuration > 0) {
        if (!Number.isSafeInteger(parsedDuration) || parsedDuration > 87600) {
          return NextResponse.json({ error: "Duration must not exceed 87600 hours." }, { status: 400 });
        }
        duration = parsedDuration;
        reason = commandParts.slice(2, -1).join(" ") || "Banned by staff";
      } else {
        reason = commandParts.slice(2).join(" ");
      }
    }

    const expiryTime = duration ? (Date.now() + duration * 3600000) : null;
    const { error: updateErr } = await supabase
      .from("users")
      .update({
        is_banned: true,
        ban_reason: reason,
        ban_expiry: expiryTime
      })
      .eq("username", targetUser.username);

    if (updateErr) {
      return NextResponse.json({ error: `Failed to ban user ${targetUser.username}.` }, { status: 500 });
    }

    const durationText = duration ? `for ${duration} hours` : "permanently";
    broadcastMessage = `System 🛡️: User ${userData.username} has banned ${targetUser.username} ${durationText}. Reason: ${reason}`;
  } 
  else if (cmd === "/unban") {
    const { error: updateErr } = await supabase
      .from("users")
      .update({
        is_banned: false,
        ban_reason: null,
        ban_expiry: null
      })
      .eq("username", targetUser.username);

    if (updateErr) {
      return NextResponse.json({ error: `Failed to unban user ${targetUser.username}.` }, { status: 500 });
    }

    broadcastMessage = `System 🛡️: User ${userData.username} has unbanned ${targetUser.username}.`;
  }
  else if (cmd === "/mute") {
    let duration: number | null = null;
    let reason = "Muted by staff";
    if (commandParts.length > 2) {
      const lastPart = commandParts[commandParts.length - 1];
      const parsedDuration = parseInt(lastPart, 10);
      if (!isNaN(parsedDuration) && parsedDuration > 0) {
        if (!Number.isSafeInteger(parsedDuration) || parsedDuration > 87600) {
          return NextResponse.json({ error: "Duration must not exceed 87600 hours." }, { status: 400 });
        }
        duration = parsedDuration;
        reason = commandParts.slice(2, -1).join(" ") || "Muted by staff";
      } else {
        reason = commandParts.slice(2).join(" ");
      }
    }

    let expiryTime = null;
    if (duration) {
      expiryTime = Date.now() + duration * 3600000;
    }

    const { error: updateErr } = await supabase
      .from("users")
      .update({
        is_muted: true,
        mute_expiry: expiryTime
      })
      .eq("username", targetUser.username);

    if (updateErr) {
      return NextResponse.json({ error: `Failed to mute user ${targetUser.username}.` }, { status: 500 });
    }

    const durationText = duration ? `for ${duration} hours` : "permanently";
    broadcastMessage = `System 🛡️: User ${userData.username} has muted ${targetUser.username} ${durationText}. Reason: ${reason}`;
  }
  else if (cmd === "/unmute") {
    const { error: updateErr } = await supabase
      .from("users")
      .update({
        is_muted: false,
        mute_expiry: null
      })
      .eq("username", targetUser.username);

    if (updateErr) {
      return NextResponse.json({ error: `Failed to unmute user ${targetUser.username}.` }, { status: 500 });
    }

    broadcastMessage = `System 🛡️: User ${userData.username} has unmuted ${targetUser.username}.`;
  }
  else if (cmd === "/check-alts") {
    const { data: fullTargetUser, error: dbErr } = await supabase
      .from("user_secrets")
      .select("last_ip, mac_address")
      .eq("user_id", targetUser.id)
      .single();

    if (dbErr || !fullTargetUser) {
      return NextResponse.json({ error: `Could not fetch data for ${targetUser.username}.` }, { status: 500 });
    }

    const mac = fullTargetUser.mac_address;
    const ip = fullTargetUser.last_ip;

    if (mac && mac.trim() !== "" && mac !== "null") {
      // Check based on device ID (mac_address)
      const { data: matches, error: matchError } = await supabase
        .from("user_secrets")
        .select("user_id")
        .eq("mac_address", mac);
      if (matchError) throw matchError;
      const { data: alts, error: altsErr } = await supabase.from("users")
        .select("username, is_banned").in("id", matches.map((match: { user_id: string }) => match.user_id));

      if (altsErr || !alts) {
        return NextResponse.json({ error: "Error querying for alt accounts." }, { status: 500 });
      }

      const otherAlts = alts.filter((a: any) => a.username.toLowerCase() !== targetUser.username.toLowerCase());
      if (otherAlts.length === 0) {
        broadcastMessage = `System 🛡️: Alt accounts check for ${targetUser.username}: No other accounts found on this device.`;
      } else {
        const altNames = otherAlts.map((a: any) => `${a.username}${a.is_banned ? " (Banned)" : ""}`).join(", ");
        broadcastMessage = `System 🛡️: Alt accounts check for ${targetUser.username} found on same device: ${altNames}`;
      }
    } else if (ip && !["127.0.0.1", "::1", "unknown"].includes(ip)) {
      // Fallback to IP address if no device ID is registered
      const { data: matches, error: matchError } = await supabase
        .from("user_secrets")
        .select("user_id")
        .eq("last_ip", ip);
      if (matchError) throw matchError;
      const { data: alts, error: altsErr } = await supabase.from("users")
        .select("username, is_banned").in("id", matches.map((match: { user_id: string }) => match.user_id));

      if (altsErr || !alts) {
        return NextResponse.json({ error: "Error querying for alt accounts." }, { status: 500 });
      }

      const otherAlts = alts.filter((a: any) => a.username.toLowerCase() !== targetUser.username.toLowerCase());
      if (otherAlts.length === 0) {
        broadcastMessage = `System 🛡️: Alt accounts check for ${targetUser.username}: No other accounts found on this IP.`;
      } else {
        const altNames = otherAlts.map((a: any) => `${a.username}${a.is_banned ? " (Banned)" : ""}`).join(", ");
        broadcastMessage = `System 🛡️: Alt accounts check for ${targetUser.username} found on same IP: ${altNames} (IP Redacted)`;
      }
    } else {
      broadcastMessage = `System 🛡️: User ${targetUser.username} has no device ID or logged IP address. Cannot check alts.`;
    }
    return NextResponse.json({ success: true, localOnly: true, message: broadcastMessage }, { status: 200 });
  }
  else if (cmd === "/gift-tokens") {
    const amountStr = commandParts[2];
    if (!amountStr) {
      return NextResponse.json({ error: "Missing amount parameter." }, { status: 400 });
    }
    const amount = Number(amountStr);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1000000000) {
      return NextResponse.json({ error: "Invalid amount. Must be a positive integer." }, { status: 400 });
    }

    if (userData.username.toLowerCase() === targetUser.username.toLowerCase()) {
      return NextResponse.json({ error: "You cannot gift tokens to yourself!" }, { status: 400 });
    }

    // Call transfer_tokens RPC
    const { error: rpcErr } = await supabase
      .rpc('transfer_tokens', {
        p_sender_username: userData.username,
        p_receiver_username: targetUser.username,
        p_amount: amount
      });

    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message || "Transfer failed." }, { status: 500 });
    }

    broadcastMessage = `System 🛡️: User ${userData.username} has gifted ${amount} tokens to ${targetUser.username}.`;
  }

  // Insert broadcast message into chat_messages
  const { data: insertData, error: insertErr } = await supabase
    .from("chat_messages")
    .insert([
      {
        username: "System 🛡️",
        message: broadcastMessage,
        role: "admin",
      }
    ])
    .select();

  if (insertErr) {
    console.error("[Staff Command Broadcast] Error:", insertErr);
    return NextResponse.json({ success: true, message: broadcastMessage, note: "Broadcast failed" }, { status: 201 });
  }

  return NextResponse.json(insertData, { status: 201 });
}

export async function POST(request: Request) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message } = await request.json()
    if (typeof message !== "string" || !message.trim() || message.length > 2000) {
      return NextResponse.json({ error: "Message must contain 1 to 2000 characters." }, { status: 400 })
    }
    const supabase = getSupabaseServerClient()

    // Get the actual user data corresponding to the verified session
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, username, role, is_owner, is_muted, mute_expiry")
      .eq("id", session.userId)
      .single()

    if (userError || !userData) {
      console.error("[v0] User not found for chat verification:", session.userId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const username = userData.username
    const role = userData.role

    console.log("[v0] Verifying user for chat:", username)

    // Intercept staff-only commands
    const cleanMsg = message?.trim() || "";
    if (cleanMsg.startsWith("/")) {
      const commandParts = cleanMsg.split(/\s+/);
      const cmd = commandParts[0].toLowerCase();
      const supportedCommands = ["/ban", "/unban", "/mute", "/unmute", "/check-alts", "/gift-tokens"];
      
      if (supportedCommands.includes(cmd)) {
        if (!isModerator(userData)) {
          return NextResponse.json({ error: "Unauthorized command: Staff only." }, { status: 403 });
        }
        return await handleStaffCommand(cmd, commandParts, userData, supabase);
      }
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
          mute_expiry: muteExpiry.getTime()
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
    const { data: previousMessages }: { data: any[] | null } = await supabase
      .from("chat_messages")
      .select("inserted_at")
      .eq("user_id", session.userId)
      .order("inserted_at", { ascending: false })
      .limit(5)

    if (previousMessages && previousMessages.length === 5) {
      // Check the 5th message back. If it was less than 15s ago, user is too fast.
      const fifthLastMessage = previousMessages[4]
      const timeStr = fifthLastMessage.inserted_at
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
        user_id: session.userId,
        // The DB will handle the timestamp (created_at or inserted_at) via defaults
      }
    ]).select()

    if (error) {
      console.error("[v0] Error posting chat message:", error)
      // Return the actual error to the client for debugging
      return NextResponse.json({ error: "Failed to post chat message" }, { status: 500 })
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
    return NextResponse.json({ error: "Failed to post chat message" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await verifySession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id, message, emoji, active } = await request.json()
    if (typeof id !== "string" || !id || id.length > 100 ||
      (emoji === undefined && (typeof message !== "string" || !message.trim() || message.length > 2000))) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 })
    }
    const supabase = getSupabaseServerClient()

    // Get the requester's username
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("username, is_muted, mute_expiry")
      .eq("id", session.userId)
      .single()

    if (userError || !userData) return NextResponse.json({ error: "User not found" }, { status: 404 })
    const username = userData.username
    if (userData.is_muted && (!userData.mute_expiry || !(new Date(userData.mute_expiry).getTime() <= Date.now()))) {
      return NextResponse.json({ error: "MUTED" }, { status: 403 })
    }
    if (emoji !== undefined) {
      if (!["👍", "❤️", "😂", "🔥", "💀", "👀"].includes(emoji) || typeof active !== "boolean") {
        return NextResponse.json({ error: "Invalid reaction" }, { status: 400 })
      }
      const { data, error } = await supabase.rpc('set_boomkit_chat_reaction', {
        p_message_id: id, p_username: username, p_emoji: emoji, p_active: active,
      })
      if (error) throw error
      return NextResponse.json({ reactions: data })
    }

    // Ensure the message belongs to the user
    const { data: existingMessage, error: fetchError } = await supabase
      .from("chat_messages")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError || !existingMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    if (existingMessage.user_id !== session.userId) {
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
    const session = await verifySession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Get the requester's info
    const { data: requesterData, error: requesterError } = await supabase
      .from("users")
      .select("username, role, is_owner")
      .eq("id", session.userId)
      .single()

    if (requesterError || !requesterData) {
      return NextResponse.json({ error: "Requester not found" }, { status: 403 })
    }

    const username = requesterData.username
    const isStaff = isModerator(requesterData)

    // Ensure the message belongs to the user or requester is staff
    const { data: existingMessage, error: fetchError } = await supabase
      .from("chat_messages")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError || !existingMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    if (existingMessage.user_id !== session.userId && !isStaff) {
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
