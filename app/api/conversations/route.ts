import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await verifySession()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseServerClient()

        // Get conversations for user
        const { data: myMemberships, error: membershipError } = await supabase
            .from('conversation_members')
            .select('conversation_id, conversations(id, name, is_group, updated_at)')
            .eq('user_id', session.userId)

        if (membershipError) {
            console.error('Error fetching conversations:', membershipError)
            return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
        }

        if (!myMemberships || myMemberships.length === 0) {
            return NextResponse.json([])
        }

        const conversationIds = myMemberships.map((m: any) => m.conversation_id)

        // Get all members for these conversations
        const { data: allMembers, error: membersError } = await supabase
            .from('conversation_members')
            .select('conversation_id, users!inner(username)')
            .in('conversation_id', conversationIds)

        if (membersError) {
            console.error('Error fetching conversation members:', membersError)
            return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
        }

        const conversationsMap = new Map()

        myMemberships.forEach((row: any) => {
            const conv = row.conversations
            if (conv) {
                conversationsMap.set(conv.id, {
                    id: conv.id,
                    name: conv.name,
                    is_group: conv.is_group,
                    updated_at: conv.updated_at,
                    members: []
                })
            }
        })

        allMembers?.forEach((m: any) => {
            const conv = conversationsMap.get(m.conversation_id)
            if (conv && m.users?.username) {
                conv.members.push(m.users.username)
            }
        })

        const result = Array.from(conversationsMap.values())
        return NextResponse.json(result)
    } catch (error) {
        console.error('Unexpected error fetching conversations:', error)
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
        const { selectedUsers, groupName } = body

        if (!selectedUsers || !Array.isArray(selectedUsers) || selectedUsers.length === 0) {
            return NextResponse.json({ error: 'Selected users are required' }, { status: 400 })
        }

        const isGroup = selectedUsers.length > 1 || (groupName && groupName.trim() !== '')

        const supabase = getSupabaseServerClient()

        // Create conversation
        const { data: conv, error: convError } = await supabase
            .from('conversations')
            .insert({
                name: isGroup ? (groupName || 'Group Chat') : null,
                is_group: isGroup,
                created_by: session.userId
            })
            .select()
            .single()

        if (convError || !conv) {
            console.error('Error creating conversation:', convError)
            return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
        }

        // Add members
        const membersToAdd = [...new Set([...selectedUsers, session.userId])].map(uid => ({
            conversation_id: conv.id,
            user_id: uid
        }))

        const { error: memberError } = await supabase
            .from('conversation_members')
            .insert(membersToAdd)

        if (memberError) {
            console.error('Error adding members:', memberError)
            return NextResponse.json({ error: 'Failed to add members' }, { status: 500 })
        }

        return NextResponse.json({ success: true, conversation: conv })
    } catch (error) {
        console.error('Unexpected error creating conversation:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
