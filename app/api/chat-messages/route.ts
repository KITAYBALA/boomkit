import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server-client"

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

export async function POST(request: Request) {
  try {
    const { username, message, role } = await request.json()

    const supabase = getSupabaseServerClient()
    
    // Check if user is muted before allowing message
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_muted")
      .eq("username", username)
      .single()

    if (userError) {
      console.error("[v0] Error checking user mute status:", userError)
      return NextResponse.json({ error: "Failed to verify user status" }, { status: 500 })
    }

    // MUTE ENFORCEMENT: Block muted users from sending messages
    if (userData?.is_muted) {
      return NextResponse.json({ error: "MUTED" }, { status: 403 })
    }

    const { data, error } = await supabase.from("chat_messages").insert([{ username, message, role }]).select()

    if (error) {
      console.error("[v0] Error posting chat message:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully posted chat message:", data)
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Unexpected error posting chat message:", error)
    return NextResponse.json({ error: "Failed to post chat message" }, { status: 500 })
  }
}
