const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createHash, createHmac } = require('node:crypto')
const load = require('./load-ts.cjs')
const password = load('lib/password.ts')
const input = load('lib/auth-input.ts')
const payments = load('lib/payment-validation.ts')
const rpcPolicy = load('lib/rpc-policy.ts')
const moderation = load('lib/moderation-policy.ts')
const { isAllowedRequestOrigin } = load('lib/request-origin.ts')

test('origin checks retain the public Host when Next normalizes a loopback URL', () => {
  const request = headers => new Request('http://localhost:3000/api/rpc', { headers })
  assert.equal(isAllowedRequestOrigin(request({ host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' })), true)
  assert.equal(isAllowedRequestOrigin(request({ host: '127.0.0.1:3000', origin: 'https://attacker.example' })), false)
  assert.equal(isAllowedRequestOrigin(request({ host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000', 'sec-fetch-site': 'cross-site' })), false)
  assert.equal(isAllowedRequestOrigin(request({ host: 'spoofed.example', origin: 'https://spoofed.example' }), 'https://boomkit.example'), false)
  assert.equal(isAllowedRequestOrigin(request({ host: 'internal:3000', origin: 'https://boomkit.example' }), 'https://boomkit.example/'), true)
  assert.equal(isAllowedRequestOrigin(request({ host: '127.0.0.1:3000', origin: 'null' })), false)
})

test('moderation excludes testers and protects owners and staff from moderators', () => {
  assert.equal(moderation.isModerator({ role: 'tester' }), false)
  assert.equal(moderation.canModerate({ role: 'moderator' }, { role: 'player' }), true)
  assert.equal(moderation.canModerate({ role: 'moderator' }, { role: 'admin' }), false)
  assert.equal(moderation.canModerate({ role: 'admin' }, { role: 'owner' }), false)
  assert.equal(moderation.canModerate({ role: 'admin' }, { role: 'player', is_owner: true }), false)
  assert.equal(moderation.canModerate({ role: 'player', is_owner: true }, { role: 'admin' }), true)
})

test('scrypt round trip, incorrect passwords and randomized salts', async () => {
  const first = await password.hashPassword('StrongPassword123!')
  const second = await password.hashPassword('StrongPassword123!')
  assert.notEqual(first, second)
  assert.deepEqual(await password.verifyPassword('StrongPassword123!', first), { valid: true, needsRehash: false })
  assert.equal((await password.verifyPassword('WrongPassword123!', first)).valid, false)
})

test('verified legacy passwords can be upgraded without meeting a newer signup policy', async () => {
  const legacy = createHash('sha256').update('oldpass').digest('hex')
  assert.deepEqual(await password.verifyPassword('oldpass', legacy), { valid: true, needsRehash: true })
  const upgraded = await password.hashPassword('oldpass')
  assert.equal((await password.verifyPassword('oldpass', upgraded)).valid, true)
  assert.notEqual(password.validatePassword('oldpass'), null)
})

test('malformed and excessively expensive hashes fail without exceptions', async () => {
  const salt = 'a'.repeat(32), key = 'b'.repeat(128)
  for (const value of [null, '', 'scrypt', `scrypt$0$8$1$${salt}$${key}`, `scrypt$1073741824$8$1$${salt}$${key}`,
    `scrypt$16384$8$999999$${salt}$${key}`, `scrypt$16384$8$1$${salt}$x`, `scrypt$16384$8$1$${salt}$${key}$extra`]) {
    assert.equal((await password.verifyPassword('pass', value)).valid, false)
  }
  assert.notEqual(password.validatePassword('A1!' + 'x'.repeat(256)), null)
})

test('login escapes wildcard characters instead of treating identities as patterns', () => {
  assert.equal(input.escapeLikeLiteral('alice_100%\\'), 'alice\\_100\\%\\\\')
  assert.equal(input.validUsername('valid_name1'), true)
  assert.equal(input.validUsername('%'), false)
  assert.equal(input.validUsername({ username: 'alice' }), false)
})

test('untrusted forwarded headers cannot rotate the authentication rate-limit bucket', () => {
  const proxy = process.env.TRUST_PROXY, vercel = process.env.VERCEL
  delete process.env.TRUST_PROXY
  delete process.env.VERCEL
  try {
    assert.equal(input.getClientIp(new Request('https://test.local', { headers: { 'x-forwarded-for': '8.8.8.8' } })), 'unknown')
    process.env.TRUST_PROXY = 'true'
    assert.equal(input.getClientIp(new Request('https://test.local', { headers: { 'x-forwarded-for': '8.8.8.8, 10.0.0.1' } })), '8.8.8.8')
    assert.equal(input.getClientIp(new Request('https://test.local', { headers: { 'x-forwarded-for': 'not-an-ip' } })), 'unknown')
  } finally {
    if (proxy === undefined) delete process.env.TRUST_PROXY; else process.env.TRUST_PROXY = proxy
    if (vercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = vercel
  }
})

test('payment signatures reject malformed input and body tampering', () => {
  const body = '{"paid":true}', secret = 'test-secret'
  const signature = createHmac('sha256', secret).update(body).digest('hex')
  assert.equal(payments.validWebhookSignature(body, signature, secret), true)
  for (const sig of [null, '', 'z'.repeat(64), signature + '0']) assert.equal(payments.validWebhookSignature(body, sig, secret), false)
  assert.equal(payments.validWebhookSignature(body + ' ', signature, secret), false)
})

test('payment grants come from the catalog, with Plus tokens and booster combined', () => {
  assert.deepEqual(payments.purchaseReward({ id: 'boomkit-plus', type: 'subscription' }, 1), { tokens: 10000, booster: 'luck-charm-2x-1h', plus: true })
  assert.deepEqual(payments.purchaseReward({ id: 'starter-tokens', type: 'tokens', tokens: 500 }, 1), { tokens: 500, booster: null, plus: false })
  for (const quantity of [0, -1, 1.1, NaN, Infinity, '1']) assert.throws(() => payments.purchaseReward({ type: 'tokens' }, quantity))
})

test('debug purchases cannot mutate shared data', async () => {
  const route = load('app/api/debug/purchase/route.ts')
  const response = await route.POST()
  assert.equal(response.status, 404)
  assert.equal((await response.json()).success, false)
})

test('RPC gateway discards supplied actor identities and denies unknown/staff operations', () => {
  const actor = { id: 'actor-id', username: 'Alice', role: 'player', is_owner: false }
  assert.deepEqual(rpcPolicy.authorizedRpc('transfer_tokens', { p_sender_username: 'Victim', p_receiver_username: 'Bob', p_amount: 10 }, actor), {
    p_sender_username: 'Alice', p_receiver_username: 'Bob', p_amount: 10,
  })
  assert.throws(() => rpcPolicy.authorizedRpc('fulfill_boomkit_purchase', {}, actor))
  for (const method of ['add_clan_xp','submit_clan_tournament_score','decrement_rental_session']) assert.throws(() => rpcPolicy.authorizedRpc(method, {}, actor))
  assert.throws(() => rpcPolicy.authorizedRpc('__proto__', {}, actor))
  assert.throws(() => rpcPolicy.authorizedRpc('start_new_season', { p_season_name: 'Fake season' }, actor))
  assert.throws(() => rpcPolicy.authorizedRpc('transfer_tokens', { p_receiver_username: 'Bob', p_amount: -1 }, actor))
})
