import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'

export async function DELETE() {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseServerClient()
    const { data: actor, error: actorError } = await supabase
      .from('users')
      .select('id, role, is_owner')
      .eq('id', session.userId)
      .single()

    if (actorError || !actor || (!actor.is_owner && !['owner', 'admin'].includes(actor.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error, count } = await supabase
      .from('chat_messages')
      .delete({ count: 'exact' })
      .not('id', 'is', null)

    if (error) {
      console.error('[v0] Error clearing chat messages:', error)
      return NextResponse.json({ error: 'Failed to clear chat messages' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'All chat messages have been cleared',
      deletedCount: count,
    }, { status: 200 })
  } catch (error) {
    console.error('[v0] Unexpected error clearing chat messages:', error)
    return NextResponse.json({ error: 'Failed to clear chat messages' }, { status: 500 })
  }
}
