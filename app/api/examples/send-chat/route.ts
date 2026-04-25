import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = await req.json()
    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { data: actor, error: actorError } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('id', session.userId)
      .single()

    if (actorError || !actor) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{ username: actor.username, role: actor.role || 'player', message: message.trim().slice(0, 500) }])
      .select('id, username, role, message, inserted_at, created_at, timestamp')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}
