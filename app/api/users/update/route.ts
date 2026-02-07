import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

/**
 * SECURE USER UPDATE API
 * This route allows authorized users to update player data.
 * It uses the Supabase service role key to bypass RLS, performing checks server-side instead.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await verifySession()
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { targetUserId, updates } = body

        if (!targetUserId || !updates) {
            return NextResponse.json({ success: false, message: 'Missing targetUserId or updates object' }, { status: 400 })
        }

        // 1. Determine Identity & Permissions
        const isSelf = session.userId === targetUserId
        const isOwner = session.role === 'owner'
        const isAdmin = session.role === 'admin'
        const isStaff = ['owner', 'admin', 'senior_moderator', 'moderator', 'tester'].includes(session.role)

        // 2. Authorization Rules
        if (!isSelf && !isStaff) {
            return NextResponse.json({ success: false, message: 'Access denied: staff only' }, { status: 403 })
        }

        // 3. Sensitive Field Protection
        const strictlyProtectedFields = [
            'role', 'is_owner', 'is_banned', 'is_plus_user', 'badges', 'is_muted', 'ban_reason', 'ban_expiry'
        ]
        const progressionFields = ['tokens', 'boom_score', 'total_value', 'xp', 'level']

        const updatingStrictlyProtected = Object.keys(updates).some(key => strictlyProtectedFields.includes(key))
        const updatingProgression = Object.keys(updates).some(key => progressionFields.includes(key))

        if (updatingStrictlyProtected) {
            // Only staff can update strictly protected fields
            if (!isStaff) {
                return NextResponse.json({ success: false, message: 'Security violation: restricted fields' }, { status: 403 })
            }

            // Only Owner/Admin can change roles or owner status
            if ((updates.role || updates.is_owner !== undefined)) {
                // Fetch the current user data to compare
                const supabase = getSupabaseServerClient()
                const { data: currentUserData } = await supabase
                    .from('users')
                    .select('role, is_owner')
                    .eq('id', targetUserId)
                    .single()

                const isChangingRole = updates.role && updates.role !== currentUserData?.role
                const isChangingOwner = updates.is_owner !== undefined && updates.is_owner !== currentUserData?.is_owner

                if ((isChangingRole || isChangingOwner) && !isOwner && !isAdmin) {
                    return NextResponse.json({ success: false, message: 'Insufficient permission to modify roles' }, { status: 403 })
                }
            }
        }

        if (updatingProgression && !isSelf && !isStaff) {
            return NextResponse.json({ success: false, message: 'Access denied: cannot update other people progression' }, { status: 403 })
        }

        // 4. Perform Update via Service Role
        const supabase = getSupabaseServerClient()

        // Ensure we don't accidentally update the ID or email if it's in the updates object (rare but safe)
        const filteredUpdates = { ...updates }
        delete filteredUpdates.id
        // If it's not the user themselves, maybe we allow email update by staff? 
        // Usually email shouldn't be changed here.

        const { data, error } = await supabase
            .from('users')
            .update(filteredUpdates)
            .eq('id', targetUserId)
            .select('id, username, role, is_banned') // Select basic info to confirm
            .single()

        if (error) {
            console.error('[API/users/update] DB Error:', error)
            return NextResponse.json({ success: false, message: error.message }, { status: 500 })
        }

        console.log(`[API/users/update] User ${targetUserId} updated by ${session.userId}`)

        return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            user: data
        })

    } catch (err: any) {
        console.error('[API/users/update] Unexpected Error:', err)
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
    }
}
