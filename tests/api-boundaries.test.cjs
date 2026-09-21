const { test } = require('node:test')
const assert = require('node:assert/strict')
const load = require('./load-ts.cjs')
const input = load('lib/auth-input.ts')
const moderation = load('lib/moderation-policy.ts')

function fixture(file, rows = []) {
  const mutations = []
  const query = {
    select() { return this }, eq() { return this }, ilike() { return this },
    single: async () => ({ data: rows.shift(), error: null }),
    maybeSingle: async () => ({ data: rows.shift(), error: null }),
    update(data) { mutations.push(data); return this },
    upsert: async data => { mutations.push(data); return { error: null } },
  }
  const api = load(file, {
    '@/lib/auth-server': { verifySession: async () => ({ userId: 'actor-id' }) },
    '@/lib/supabase-server-client': { getSupabaseServerClient: () => ({ from: () => query }) },
    '@/lib/auth-input': input,
    '@/lib/moderation-policy': moderation,
    '@/lib/profile-update-policy': load('lib/profile-update-policy.ts'),
    '@/lib/profanity': { containsProfanity: () => false },
    '@/lib/gemini': { generateGeminiResponse: async () => null },
  })
  return { api, mutations }
}

const request = (body, method = 'POST') => new Request('https://example.test/api', {
  method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})

test('profile API blocks browser-owned rewards before any user mutation', async () => {
  const { api, mutations } = fixture('app/api/users/update/route.ts', [{id:'actor-id',role:'player',is_owner:false}])
  const response = await api.POST(request({targetUserId:'actor-id',updates:{tokens:99999}}))
  assert.equal(response.status,400)
  assert.equal(mutations.length,0)
})

test('economy API binds the signed-in account and rejects supplied prices', async () => {
  const catalog = load('lib/economy-catalog.ts')
  const policy = load('lib/economy-policy.ts', {'./economy-catalog':catalog})
  const calls = []
  const api = load('app/api/economy/route.ts', {
    '@/lib/auth-server': {verifySession:async()=>({userId:'actor-id'})},
    '@/lib/economy-policy':policy,
    '@/lib/supabase-server-client':{getSupabaseServerClient:()=>({rpc:async (method,args)=>{calls.push({method,args});return {data:{success:true,amount:100},error:null}}})},
  })
  const requestId = '00000000-0000-4000-8000-000000000001'
  assert.equal((await api.POST(request({action:'spin',requestId,amount:100000}))).status,400)
  assert.equal(calls.length,0)
  assert.equal((await api.POST(request({action:'spin',requestId}))).status,200)
  assert.equal(calls[0].args.p_user_id,'actor-id')
  assert.ok(policy.SPIN_REWARDS.includes(calls[0].args.p_details.amount))
})

test('room API binds identity, rejects forged state and stops rate-limited calls', async () => {
  const calls=[]
  let limited=false, signedIn=true
  const api=load('app/api/game-sessions/route.ts',{
    '@/lib/auth-server':{verifySession:async()=>signedIn?{userId:'actor-id'}:null},
    '@/lib/session-policy':load('lib/session-policy.ts'),
    '@/lib/supabase-server-client':{getSupabaseServerClient:()=>({rpc:async(method,args)=>{calls.push({method,args});return {data:{pin:'123456'},error:limited?{code:'P0001'}:null}}})},
  })
  assert.equal((await api.POST(request({action:'join',pin:'123456',userId:'victim',score:100}))).status,400)
  assert.equal(calls.length,0)
  assert.equal((await api.POST(request({action:'join',pin:'123456'}))).status,200)
  assert.equal(calls[1].args.p_user_id,'actor-id')
  limited=true
  assert.equal((await api.POST(request({action:'finish',pin:'123456'}))).status,429)
  assert.equal(calls.length,3)
  signedIn=false
  assert.equal((await api.POST(request({action:'read',pin:'123456'}))).status,401)
  assert.equal(calls.length,3)
})

test('multiplayer reward starts use stored room questions and duration', async () => {
 const room={questions:[{question:'Stored?',options:['A','B']}],duration:60}, calls=[]
 const api=load('app/api/game-rewards/route.ts',{
  '@/lib/auth-server':{verifySession:async()=>({userId:'actor-id'})},
  '@/lib/game-reward-policy':load('lib/game-reward-policy.ts',{'./fallback-questions':{FALLBACK_QUESTIONS:{},TOPIC_FALLBACKS:{}},'./curated-curriculum':{CURATED_TOPIC_QUESTIONS:{}}}),
  '@/lib/economy-policy':{gameMilestoneRewards:()=>[]},
  '@/lib/supabase-server-client':{getSupabaseServerClient:()=>({rpc:async(method,args)=>{calls.push({method,args});return {data:method==='secure_game_session'?room:{success:true},error:null}}})},
 })
 assert.equal((await api.POST(request({action:'start',runId:'00000000-0000-4000-8000-000000000001',sessionPin:'123456',duration:3600,questions:[{question:'Forged?',options:['X','Y']}]}))).status,200)
 assert.equal(calls[1].args.p_details.duration,60)
 assert.equal(calls[1].args.p_details.session_pin,'123456')
 assert.equal(calls[1].args.p_details.questions[0].correct,null)
 assert.equal(calls[1].args.p_user_id,'actor-id')
 const crypto=require('node:crypto')
 assert.equal(calls[1].args.p_details.questions[0].key,crypto.createHash('sha256').update(JSON.stringify(['Stored?',['A','B']])).digest('hex'))
})

test('community chat rejects forged senders and binds the signed-in actor', async () => {
 const calls=[]
 const api=load('app/api/community/route.ts',{
  '@/lib/auth-server':{verifySession:async()=>({userId:'actor-id'})},
  '@/lib/session-policy':load('lib/session-policy.ts'),
  '@/lib/supabase-server-client':{getSupabaseServerClient:()=>({rpc:async(method,args)=>{calls.push({method,args});return {data:[],error:null}}})},
 })
 assert.equal((await api.POST(request({action:'send_clan_chat',message:'Hello',username:'victim'}))).status,400)
 assert.equal(calls.length,0)
 assert.equal((await api.POST(request({action:'send_clan_chat',message:'Hello'}))).status,200)
 assert.deepEqual(calls[1].args,{p_user_id:'actor-id',p_clan_id:null,p_message:'Hello'})
})

test('chat rejects non-text and excessive messages before database access', async () => {
  const { api, mutations } = fixture('app/api/chat-messages/route.ts')
  for (const message of [null, {}, [], '', 'x'.repeat(2001)]) {
    assert.equal((await api.POST(request({ message }))).status, 400)
  }
  assert.equal(mutations.length, 0)
})

test('chat commands cannot bypass owner protection', async () => {
  const { api, mutations } = fixture('app/api/chat-messages/route.ts', [
    { id: 'actor-id', username: 'Mod', role: 'moderator', is_muted: false },
    { id: 'owner-id', username: 'Owner', role: 'owner', is_owner: true },
  ])
  assert.equal((await api.POST(request({ message: '/ban Owner' }))).status, 403)
  assert.equal(mutations.length, 0)
})

test('muted accounts cannot edit messages or react', async () => {
  for (const body of [{ id: 'message', message: 'edited' }, { id: 'message', emoji: 'test', active: true }]) {
    const { api, mutations } = fixture('app/api/chat-messages/route.ts', [{ username: 'Alice', is_muted: true, mute_expiry: null }])
    assert.equal((await api.PATCH(request(body, 'PATCH'))).status, 403)
    assert.equal(mutations.length, 0)
  }
})

test('message edits use account IDs, not a matching display name', async () => {
  const { api, mutations } = fixture('app/api/chat-messages/route.ts', [
    { username: 'Alice', is_muted: false }, { user_id: 'other-id', username: 'Alice' },
  ])
  assert.equal((await api.PATCH(request({ id: 'message', message: 'edited' }, 'PATCH'))).status, 403)
  assert.equal(mutations.length, 0)
})

test('IP blacklist derives the staff identity from the session and rejects invalid IPs', async () => {
  const actor = { id: 'actor-id', role: 'admin', is_owner: false }
  const { api, mutations } = fixture('app/api/admin/blacklist-ip/route.ts', [actor, actor])
  assert.equal((await api.POST(request({ ip: 'abc' }))).status, 400)
  assert.equal((await api.POST(request({ ip: '192.0.2.1', banned_by: 'forged-owner-id' }))).status, 200)
  assert.equal(mutations.length, 1)
  assert.equal(mutations[0].banned_by, actor.id)
})

test('auction bids reject fractions, strings and out-of-range amounts before RPC execution', async () => {
  const { api } = fixture('app/api/auction/place-bid/route.ts')
  for (const amount of [-1, 0, 1.5, '10', 1000000001]) {
    assert.equal((await api.POST(request({ auctionId: 'c058bb7f-d7da-4a10-9227-e5ac09991cf9', amount }))).status, 400)
  }
})
