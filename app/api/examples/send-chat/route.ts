import { NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'

export async function POST(req: NextRequest) {
  try {
    const { user_id, username, message } = await req.json()

    if (!user_id || !username || !message) {
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{ user_id, username, message }])
      .select('*')
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ ok: true, message: data })
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}
