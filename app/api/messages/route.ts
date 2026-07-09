import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const session = await verifySession()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const conversationId = searchParams.get('conversation_id')

        if (!conversationId) {
            return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 })
        }

        const supabase = getSupabaseServerClient()

        // Verify membership
        const { data: memberData, error: memberError } = await supabase
            .from('conversation_members')
            .select('id')
            .eq('conversation_id', conversationId)
            .eq('user_id', session.userId)
            .maybeSingle()

        if (memberError || !memberData) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Fetch messages
        const { data: messages, error: messagesError } = await supabase
            .from('direct_messages')
            .select('id, conversation_id, sender_id, sender_username, message, inserted_at')
            .eq('conversation_id', conversationId)
            .order('inserted_at', { ascending: false })
            .limit(50)

        if (messagesError) {
            console.error('Error fetching messages:', messagesError)
            return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
        }

        return NextResponse.json(messages || [])
    } catch (error) {
        console.error('Unexpected error fetching messages:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await verifySession()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { conversationId, message } = body

        if (!conversationId || !message || message.trim() === '') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        const supabase = getSupabaseServerClient()

        // Verify membership
        const { data: memberData, error: memberError } = await supabase
            .from('conversation_members')
            .select('id')
            .eq('conversation_id', conversationId)
            .eq('user_id', session.userId)
            .maybeSingle()

        if (memberError || !memberData) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Get user details for sender_username
        const { data: userData } = await supabase
            .from('users')
            .select('username, is_muted')
            .eq('id', session.userId)
            .single()

        if (userData?.is_muted) {
            return NextResponse.json({ error: 'MUTED' }, { status: 403 })
        }

        const senderUsername = userData?.username || 'Unknown'

        // Insert message
        const { data: insertedMsg, error: insertError } = await supabase
            .from('direct_messages')
            .insert({
                conversation_id: conversationId,
                sender_id: session.userId,
                sender_username: senderUsername,
                message: message.trim()
            })
            .select()
            .single()

        if (insertError || !insertedMsg) {
            console.error('Error inserting message:', insertError)
            return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
        }

        // Broadcast message to clients securely via Broadcast channel
        supabase.channel(`private_chat_${conversationId}`).send({
            type: 'broadcast',
            event: 'new_message',
            payload: insertedMsg
        })

        // Also update conversations updated_at (fire and forget)
        supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId).then()

        return NextResponse.json({ success: true, message: insertedMsg })
    } catch (error) {
        console.error('Unexpected error sending message:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
