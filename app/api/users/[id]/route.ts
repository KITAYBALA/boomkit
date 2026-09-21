import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'
import { isModerator } from '@/lib/moderation-policy'
import { serializeUser } from '@/lib/user-profile'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const { data, error } = await getSupabaseServerClient().from('users').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const privateAccess = session.userId === id || isModerator({ role: session.role, is_owner: session.isOwner })
    return NextResponse.json(serializeUser(data, privateAccess), { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ error: 'Unable to load player' }, { status: 503 })
  }
}
