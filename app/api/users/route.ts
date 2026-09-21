import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'
import { isModerator } from '@/lib/moderation-policy'
import { serializeUser } from '@/lib/user-profile'

export async function GET() {
  try {
    const session = await verifySession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const db = getSupabaseServerClient()
    const { data, error } = await db.from('users').select('*').order('id').limit(1000)
    if (error) throw error
    const rows = data || []
    if (!rows.some(row => row.id === session.userId)) {
      const { data: self, error: selfError } = await db.from('users').select('*').eq('id', session.userId).single()
      if (selfError) throw selfError
      rows.push(self)
    }
    const staff = isModerator({ role: session.role, is_owner: session.isOwner })
    return NextResponse.json(rows.map(row => serializeUser(row, staff || row.id === session.userId)), { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('User list failed', error)
    return NextResponse.json({ error: 'Unable to load players' }, { status: 503 })
  }
}
