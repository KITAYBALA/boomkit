import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server-client"

// Admin API endpoint to clear all chat messages
// Requires owner verification via environment variable
export async function DELETE(request: Request) {
    try {
        // Verify owner access using server-side environment variable
        const authHeader = request.headers.get("Authorization")
        const ownerSecret = process.env.OWNER_SECRET_KEY

        if (!ownerSecret) {
            console.error("[v0] OWNER_SECRET_KEY environment variable not set")
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
        }

        if (!authHeader || authHeader !== `Bearer ${ownerSecret}`) {
            console.warn("[v0] Unauthorized attempt to clear chat messages")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const supabase = getSupabaseServerClient()

        // Delete all chat messages from the database
        const { error, count } = await supabase
            .from("chat_messages")
            .delete()
            .neq("id", 0) // This effectively selects all rows (id is never 0 for valid records)

        if (error) {
            console.error("[v0] Error clearing chat messages:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log("[v0] Successfully cleared all chat messages. Count:", count)
        return NextResponse.json({
            success: true,
            message: "All chat messages have been cleared",
            deletedCount: count
        }, { status: 200 })

    } catch (error) {
        console.error("[v0] Unexpected error clearing chat messages:", error)
        return NextResponse.json({ error: "Failed to clear chat messages" }, { status: 500 })
    }
}
