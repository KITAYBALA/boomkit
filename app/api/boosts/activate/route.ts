import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { boosterId } = await request.json()
    if (typeof boosterId !== 'string' || !/^luck-charm-(2x-[123]h|super-3x-1h)$/.test(boosterId)) {
      return NextResponse.json({ success: false, message: 'Invalid booster.' }, { status: 400 })
    }
    const { data, error } = await getSupabaseServerClient().rpc('activate_boomkit_boost', { p_user_id: session.userId, p_booster_id: boosterId })
    if (error?.code === 'P0001') return NextResponse.json({ success: false, message: error.message }, { status: 409 })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ success: false, message: 'Invalid JSON.' }, { status: 400 })
    console.error('[Boost] Activation failed:', error)
    return NextResponse.json({ success: false, message: 'Unable to activate booster.' }, { status: 500 })
  }
}
