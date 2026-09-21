const { test } = require('node:test')
const assert = require('node:assert/strict')
const { SignJWT } = require('jose')
const load = require('./load-ts.cjs')

function fixture() {
  let cookie
  const user = { id: 'user-1', role: 'player', is_owner: false, is_banned: false, status: 'approved', ban_expiry: null }
  const secret = { password_reset_required: false, sessions_revoked_at: null }
  const cookies = { get: () => cookie ? { value: cookie } : undefined, set: (_key, value) => { cookie = value } }
  const db = { from: table => ({ select() { return this }, eq() { return this },
    update(values) { Object.assign(user, values); return this },
    maybeSingle: async () => ({ data: table === 'users' ? user : secret, error: null }),
  }) }
  const auth = load('lib/auth-server.ts', { 'next/headers': { cookies: async () => cookies }, './supabase-server-client': { getSupabaseServerClient: () => db } })
  return { auth, user, secret, cookies }
}

test('sessions read current database roles instead of trusting stale JWT staff claims', async () => {
  const { auth, user } = fixture()
  await auth.createSession('user-1', 'owner', true)
  assert.equal((await auth.verifySession()).role, 'player')
  assert.equal((await auth.verifySession()).isOwner, false)
  user.is_banned = true
  assert.equal(await auth.verifySession(), null)
})

test('password-reset sessions cannot authorize game/admin routes', async () => {
  const { auth, secret } = fixture()
  secret.password_reset_required = true
  await auth.createSession('user-1', 'player', false, true)
  assert.equal(await auth.verifySession(), null)
  assert.equal((await auth.verifySession({ allowPasswordReset: true })).resetOnly, true)
  secret.password_reset_required = false
  assert.equal(await auth.verifySession(), null)
})

test('invalid ban expiries fail closed but elapsed bans no longer block sessions', async () => {
  const { auth, user } = fixture()
  await auth.createSession('user-1', 'player', false)
  user.is_banned = true
  user.ban_expiry = 'invalid-date'
  assert.equal(await auth.verifySession(), null)
  user.ban_expiry = Date.now() - 1000
  assert.notEqual(await auth.verifySession(), null)
})

test('revocation invalidates existing sessions and logout removes the cookie', async () => {
  const { auth, secret } = fixture()
  await auth.createSession('user-1', 'player', false)
  secret.sessions_revoked_at = new Date(Date.now() + 1000).toISOString()
  assert.equal(await auth.verifySession(), null)
  secret.sessions_revoked_at = null
  await auth.clearSession()
  assert.equal(await auth.verifySession(), null)
})

test('pending accounts can check approval but cannot mutate game state', async () => {
  const { auth, user } = fixture()
  user.status = 'pending'
  await auth.createSession('user-1', 'player', false)
  assert.equal(await auth.verifySession(), null)
  assert.equal((await auth.verifySession({ allowPending: true })).status, 'pending')
  user.status = 'rejected'
  assert.equal(await auth.verifySession({ allowPending: true }), null)
})

test('known historical development signing key is rejected', async () => {
  const { auth, cookies } = fixture()
  const forged = await new SignJWT({ userId: 'user-1', role: 'owner', isOwner: true })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h')
    .sign(new TextEncoder().encode('dev-fallback-only-use-for-local-testing-purposes-1234567890'))
  cookies.set('session_token', forged)
  assert.equal(await auth.verifySession(), null)
})
