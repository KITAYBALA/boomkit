import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { z } from 'zod'

const quantity = z.number().int().min(0).max(1000000000)
const booms = z.record(z.string().min(1).max(128), quantity.positive()).refine(value => Object.keys(value).length <= 100)
const offer = z.object({ receiver_id: z.string().min(1).max(128), sender_booms: booms, receiver_booms: booms,
  sender_tokens: quantity, receiver_tokens: quantity, message: z.string().max(1000).nullable().optional() })

export async function GET() {
  const session = await verifySession()
  if (!session) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
  const { data, error } = await getSupabaseServerClient().from('trades').select('*')
    .or(`sender_id.eq.${session.userId},receiver_id.eq.${session.userId}`).order('created_at', { ascending: false }).limit(200)
  return NextResponse.json({ data, error: error ? { message: 'Unable to fetch trades' } : null }, { status: error ? 500 : 200 })
}

export async function POST(request: Request) {
  try {
    const session = await verifySession()
    if (!session) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    const parsed = offer.safeParse(await request.json())
    if (!parsed.success || parsed.data.receiver_id === session.userId) return NextResponse.json({ error: { message: 'Invalid trade offer' } }, { status: 400 })
    const value = parsed.data
    if (!value.sender_tokens && !value.receiver_tokens && !Object.keys(value.sender_booms).length && !Object.keys(value.receiver_booms).length) {
      return NextResponse.json({ error: { message: 'Empty trade offer' } }, { status: 400 })
    }
    const db = getSupabaseServerClient()
    const { data: participants, error } = await db.from('users').select('id, username, is_banned, status').in('id', [session.userId, value.receiver_id])
    if (error) throw error
    if (participants?.length !== 2 || participants.some(user => user.is_banned || user.status !== 'approved')) return NextResponse.json({ error: { message: 'Participant unavailable' } }, { status: 403 })
    const sender = participants.find(user => user.id === session.userId)!
    const receiver = participants.find(user => user.id === value.receiver_id)!
    const { error: insertError } = await db.from('trades').insert({ ...value, sender_id: sender.id, sender_username: sender.username, receiver_username: receiver.username, status: 'pending' })
    if (insertError) throw insertError
    return NextResponse.json({ error: null })
  } catch (error) {
    return NextResponse.json({ error: { message: 'Unable to create trade' } }, { status: error instanceof SyntaxError ? 400 : 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await verifySession()
    if (!session) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    const parsed = z.object({ id: z.string().uuid(), status: z.enum(['declined', 'cancelled']) }).safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: { message: 'Invalid trade action' } }, { status: 400 })
    const { id, status } = parsed.data
    const { data, error } = await getSupabaseServerClient().from('trades').update({ status, updated_at: new Date().toISOString() })
      .eq('id', id).eq('status', 'pending').eq(status === 'declined' ? 'receiver_id' : 'sender_id', session.userId).select('id').maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: { message: 'Trade unavailable or permission denied' } }, { status: 403 })
    return NextResponse.json({ error: null })
  } catch (error) {
    return NextResponse.json({ error: { message: 'Unable to update trade' } }, { status: error instanceof SyntaxError ? 400 : 500 })
  }
}
