import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { gameRewardInput, verifiedQuestionKeys } from '@/lib/game-reward-policy'
import { gameMilestoneRewards } from '@/lib/economy-policy'

export async function POST(request: Request) {
  try {
    const session = await verifySession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const input = gameRewardInput.safeParse(await request.json().catch(() => null))
    if (!input.success) return NextResponse.json({ error: 'Invalid game action' }, { status: 400 })
    const { action, runId } = input.data
    const db=getSupabaseServerClient()
    if (input.data.action==='start' && input.data.sessionPin) {
      const {data:room,error}=await db.rpc('secure_game_session',{p_user_id:session.userId,p_pin:input.data.sessionPin,p_action:'read',p_details:{}})
      if (error || !room) return NextResponse.json({error:'Joined room required'},{status:403})
      input.data.questions=room.questions
      input.data.duration=room.duration
    }
    const details = action === 'start' ? { duration: input.data.duration, questions: verifiedQuestionKeys(input.data.questions) }
      : action === 'answer' ? { ordinal: input.data.ordinal, answer: input.data.answer } : { milestones: gameMilestoneRewards() }
    if (input.data.action==='start' && input.data.sessionPin) Object.assign(details,{session_pin:input.data.sessionPin})
    const { data, error } = await db.rpc('apply_boomkit_game_action', {
      p_user_id: session.userId, p_run_id: runId, p_action: action, p_details: details,
    })
    if (error) return NextResponse.json({ error: error.code === 'P0001' ? error.message : 'Unable to save game' }, { status: 400 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Game service unavailable' }, { status: 503 })
  }
}
