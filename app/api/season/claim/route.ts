import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const parsed = z.object({ rewardId: z.string().uuid() }).safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ success: false, message: 'Invalid reward ID.' }, { status: 400 })
    const { data, error } = await getSupabaseServerClient().rpc('claim_boomkit_season_reward', { p_user_id: session.userId, p_reward_id: parsed.data.rewardId })
    if (error?.code === 'P0001') return NextResponse.json({ success: false, message: error.message }, { status: 409 })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ success: false, message: 'Invalid JSON.' }, { status: 400 })
    console.error('[Season] Claim failed:', error)
    return NextResponse.json({ success: false, message: 'Unable to claim reward.' }, { status: 500 })
  }
}
