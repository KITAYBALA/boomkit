import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifySession } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase-server-client'
import { sessionQuestion } from '@/lib/session-policy'
const input = z.discriminatedUnion('action', [
  z.object({action:z.literal('sets')}).strict(),
  z.object({action:z.literal('friends')}).strict(),
  z.object({action:z.literal('activity')}).strict(),
  z.object({action:z.literal('claims')}).strict(),
  z.object({action:z.literal('create_set'),title:z.string().trim().min(1).max(200),description:z.string().max(2000),grade:z.number().int().min(1).max(12),subject:z.string().max(200),questions:z.array(sessionQuestion).min(1).max(100),is_public:z.boolean()}).strict(),
  z.object({action:z.literal('clan_chat'),clanId:z.string().uuid()}).strict(),
  z.object({action:z.literal('send_clan_chat'),message:z.string().trim().min(1).max(2000)}).strict(),
])
export async function POST(request:Request) {
  try {
    const session=await verifySession()
    if (!session) return NextResponse.json({error:'Unauthorized'},{status:401})
    const parsed=input.safeParse(await request.json().catch(()=>null))
    if (!parsed.success) return NextResponse.json({error:'Invalid community action'},{status:400})
    const value=parsed.data, db=getSupabaseServerClient()
    const {error:rateError}=await db.rpc('enforce_action_limit',{p_key:`community:${value.action}:${session.userId}`,p_limit:value.action==='create_set'?5:60,p_seconds:60})
    if (rateError) return NextResponse.json({error:'Please wait before trying again'},{status:429})
    if (['friends','activity','claims'].includes(value.action)) {
      const {data:actor,error:actorError}=await db.from('users').select('username').eq('id',session.userId).single()
      if (actorError || !actor) throw new Error('Missing account')
      if (value.action==='friends') {
        const sent=await db.from('friends').select('*').eq('user_username',actor.username).limit(500)
        const received=await db.from('friends').select('*').eq('friend_username',actor.username).limit(500)
        if (sent.error || received.error) throw new Error('Friend lookup failed')
        return NextResponse.json([...new Map([...(sent.data||[]),...(received.data||[])].map(f=>[f.id,f])).values()],{headers:{'Cache-Control':'private, no-store'}})
      }
      const result=value.action==='claims' ? await db.from('claimed_season_rewards').select('reward_id').eq('user_id',session.userId)
        : await db.from('user_activity').select('*').eq('username',actor.username).order('created_at',{ascending:false}).limit(20)
      if (result.error) throw result.error
      return NextResponse.json(result.data||[],{headers:{'Cache-Control':'private, no-store'}})
    }
    if (value.action==='sets') {
      const publicSets=await db.from('custom_sets').select('*').eq('is_public',true).order('created_at',{ascending:false}).limit(200)
      const ownSets=await db.from('custom_sets').select('*').eq('creator_id',session.userId).order('created_at',{ascending:false}).limit(200)
      if (publicSets.error || ownSets.error) throw new Error('Set lookup failed')
      return NextResponse.json([...new Map([...(ownSets.data||[]),...(publicSets.data||[])].map(s=>[s.id,s])).values()],{headers:{'Cache-Control':'private, no-store'}})
    }
    if (value.action==='create_set') {
      const {action,...fields}=value
      const {data,error}=await db.from('custom_sets').insert({...fields,creator_id:session.userId}).select('*').single()
      if (error) throw error
      return NextResponse.json(data)
    }
    const {data,error}=await db.rpc('secure_clan_chat',{p_user_id:session.userId,p_clan_id:value.action==='clan_chat'?value.clanId:null,p_message:value.action==='send_clan_chat'?value.message:null})
    if (error) return NextResponse.json({error:error.code==='P0001'?error.message:'Clan chat unavailable'},{status:400})
    return NextResponse.json(data,{headers:{'Cache-Control':'private, no-store'}})
  } catch { return NextResponse.json({error:'Community service unavailable'},{status:503}) }
}
