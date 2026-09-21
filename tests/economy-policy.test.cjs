const { test } = require('node:test')
const assert = require('node:assert/strict')
const load = require('./load-ts.cjs')
const catalog = load('lib/economy-catalog.ts')
const economy = load('lib/economy-policy.ts', { './economy-catalog': catalog })
const { serializeUser } = load('lib/user-profile.ts')
const { parseProfileUpdates } = load('lib/profile-update-policy.ts')
const curriculum = load('lib/curated-curriculum.ts')
const fallback = load('lib/fallback-questions.ts', { './curated-curriculum': curriculum })
const game = load('lib/game-reward-policy.ts', { './fallback-questions': fallback, './curated-curriculum': curriculum })
const id = '00000000-0000-4000-8000-000000000001'

test('network retries reuse the economy receipt instead of issuing another purchase', async () => {
  const original = global.fetch
  const bodies = []
  global.fetch = async (_url, options) => {
    bodies.push(JSON.parse(options.body))
    if (bodies.length === 1) throw new Error('response lost')
    return Response.json({success:true})
  }
  try {
    const { economyAction } = load('lib/secure-rpc.ts')
    assert.equal((await economyAction('open_pack',{packId:'og'},id)).success,true)
    assert.equal(bodies.length,2)
    assert.deepEqual(bodies[0],bodies[1])
  } finally { global.fetch = original }
})

test('profile updates reject balances, arbitrary inventory, achievements and privilege changes', () => {
  const actor = { id: 'alice', role: 'player', is_owner: false }
  for (const updates of [{ tokens: 999 }, { booms: { Mythical: 9 } }, { xp: 1 }, { season_xp: 100 }, { games_played: 10 }, { role: 'admin' }, { is_plus_user: true }]) {
    assert.throws(() => parseProfileUpdates(updates, actor, actor.id))
  }
  assert.deepEqual(parseProfileUpdates({ name_color: 'text-white' }, actor, actor.id), { name_color: 'text-white' })
  assert.throws(() => parseProfileUpdates({ tokens: 1 }, { ...actor, role: 'moderator' }, 'bob'))
  assert.deepEqual(parseProfileUpdates({ is_banned: true }, { ...actor, role: 'moderator' }, 'bob'), { is_banned: true })
})

test('public profiles never include private account fields or credentials', () => {
  const raw = { id, username: 'Alice', email: 'a@example.test', age: 18, reason: 'private', inventory: [], password_hash: 'secret', last_ip: 'secret', mac_address: 'secret', is_banned: true, ban_expiry: Date.now()-1000 }
  const publicUser = serializeUser(raw)
  for (const key of ['email','age','reason','inventory','password_hash','last_ip','mac_address','ban_expiry']) assert.equal(key in publicUser, false)
  assert.equal(publicUser.is_banned, false)
  const privateUser = serializeUser(raw, true)
  assert.equal(privateUser.email, raw.email)
  assert.equal('password_hash' in privateUser, false)
})

test('economy inputs reject client prices, forged outcomes and invalid quantities', () => {
  for (const value of [{ action: 'spin', amount: 100000 }, { action: 'open_pack', packId: 'og', price: 0 }, { action: 'sell', boomName: 'Boom', quantity: -1 }, { action: 'sell', boomName: 'Boom', quantity: 0.5 }]) {
    assert.equal(economy.economyInput.safeParse({ ...value, requestId: id }).success, false)
  }
  for (const pack of catalog.PACKS) {
    const result = economy.economyDetails({ action: 'open_pack', packId: pack.id, requestId: id }, 1, () => 0)
    assert.equal(result.price, pack.price)
    assert.ok(pack.booms.some(b => b.name === result.name))
  }
  assert.throws(() => economy.economyDetails({ action: 'buy_limited', boomName: 'fake', requestId: id }))
})

test('game validation ignores client answer keys and makes unknown questions practice-only', () => {
  const question = fallback.FALLBACK_QUESTIONS.math_elementary[0]
  const keys = game.verifiedQuestionKeys([{ ...question, correctIndex: 999 }, { question: 'Made up', options: ['A','B'] }])
  assert.equal(keys[0].correct, question.correctIndex)
  assert.equal(keys[1].correct, null)
  assert.equal(keys[0].key.length, 64)
  assert.equal(game.gameRewardInput.safeParse({ action: 'finish', runId: id, tokens: 100 }).success, false)
})
