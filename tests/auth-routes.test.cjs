const { test } = require('node:test')
const assert = require('node:assert/strict')
const { jwtVerify } = require('jose')
const load = require('./load-ts.cjs')
const password = load('lib/password.ts')
const input = load('lib/auth-input.ts')
const testKey = 'test-only-session-key-with-at-least-32-bytes'
const loginBody = { username: 'fixture_user', password: 'FixturePassword123!' }
const registerBody = { ...loginBody, age: 18, accessKey: 'fixture-key' }

function fixture(t, secret = testKey) {
  const previous = { NODE_ENV: process.env.NODE_ENV, JWT_SECRET: process.env.JWT_SECRET, DEBUG_AUTH: process.env.DEBUG_AUTH }
  process.env.NODE_ENV = 'production'
  process.env.DEBUG_AUTH = 'false'
  if (secret === undefined) delete process.env.JWT_SECRET
  else process.env.JWT_SECRET = secret
  t.after(() => {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  })
  // Expected error paths must not clutter the test output with internal details.
  t.mock.method(console, 'error', () => {})
  const state = {
    dbCalls: 0, registrations: 0, updates: 0, cookie: null, registrationError: null,
    user: { id: 'fixture-id', username: 'fixture_user', role: 'player', status: 'approved', is_owner: false },
    secrets: { password_hash: null, password_reset_required: false },
  }
  const db = {
    from(table) {
      state.dbCalls++
      return {
        select() { return this }, eq() { return this }, ilike() { return this },
        update() { state.updates++; return this },
        async maybeSingle() {
          return { data: table === 'users' ? { ...state.user } : table === 'user_secrets' ? state.secrets : null, error: null }
        },
      }
    },
    async rpc(name) {
      assert.equal(name, 'register_boomkit_user')
      state.registrations++
      return { data: { ...state.user, status: 'pending' }, error: state.registrationError }
    },
  }
  const auth = load('lib/auth-server.ts', {
    'next/headers': { cookies: async () => ({ set: (name, value, options) => { state.cookie = { name, value, options } } }) },
    './supabase-server-client': { getSupabaseServerClient: () => db },
  })
  const mocks = {
    '@/lib/auth-server': auth,
    '@/lib/supabase-server-client': { getSupabaseServerClient: () => db },
    '@/lib/rate-limiter': { checkRateLimiter: async () => ({ allowed: true }) },
    '@/lib/password': password,
    '@/lib/auth-input': input,
  }
  return {
    state, auth,
    login: load('app/api/auth/login/route.ts', mocks).POST,
    register: load('app/api/auth/register/route.ts', mocks).POST,
  }
}

const request = (route, body) => new Request(`https://boomkit.example/api/auth/${route}`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
})

for (const [label, key] of [['missing', ''], ['short', 'too-short']]) {
  for (const route of ['login', 'register']) {
    test(`${route}: ${label} production signing key fails before account writes or key consumption`, async t => {
      const { state, [route]: handler } = fixture(t, key)
      state.secrets.password_hash = await password.hashPassword(loginBody.password)
      const response = await handler(request(route, route === 'login' ? loginBody : registerBody))
      assert.equal(response.status, 503)
      const body = await response.json()
      assert.equal(body.success, false)
      assert.equal(body.code, 'AUTH_CONFIGURATION_ERROR')
      assert.match(body.message, /server configuration problem/)
      assert.doesNotMatch(JSON.stringify(body), /JWT_SECRET|too-short|32 random bytes/)
      assert.equal(state.dbCalls, 0)
      assert.equal(state.registrations, 0)
      assert.equal(state.updates, 0)
      assert.equal(state.cookie, null)
    })
  }
}

test('production session creation still rejects short signing keys', async t => {
  const { auth, state } = fixture(t, 'too-short')
  await assert.rejects(auth.createSession('fixture-id', 'player', false), auth.AuthConfigurationError)
  assert.equal(state.cookie, null)
})

test('valid production config signs a secure session only after correct password verification', async t => {
  const { login, state } = fixture(t)
  state.secrets.password_hash = await password.hashPassword(loginBody.password)
  const response = await login(request('login', loginBody))
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.success, true)
  assert.equal(body.user.id, 'fixture-id')
  assert.equal(body.user.password_hash, undefined)
  assert.equal(state.cookie.name, 'session_token')
  assert.equal(state.cookie.options.httpOnly, true)
  assert.equal(state.cookie.options.secure, true)
  assert.equal(state.cookie.options.sameSite, 'lax')
  const { payload } = await jwtVerify(state.cookie.value, new TextEncoder().encode(testKey))
  assert.equal(payload.userId, 'fixture-id')
  assert.equal(payload.resetOnly, false)
})

test('incorrect passwords still return 401 without a session', async t => {
  const { login, state } = fixture(t)
  state.secrets.password_hash = await password.hashPassword('AnotherPassword123!')
  const response = await login(request('login', loginBody))
  assert.equal(response.status, 401)
  assert.equal((await response.json()).message, 'Invalid username or password')
  assert.equal(state.cookie, null)
  assert.equal(state.updates, 0)
})

test('reset-required login retains its restricted session', async t => {
  const { login, state } = fixture(t)
  state.secrets.password_hash = await password.hashPassword(loginBody.password)
  state.secrets.password_reset_required = true
  const response = await login(request('login', loginBody))
  assert.equal(response.status, 403)
  assert.equal((await response.json()).requiresReset, true)
  const { payload } = await jwtVerify(state.cookie.value, new TextEncoder().encode(testKey))
  assert.equal(payload.resetOnly, true)
})

test('registration succeeds with valid session config and retains pending approval', async t => {
  const { register, state } = fixture(t)
  const response = await register(request('register', registerBody))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).user.status, 'pending')
  assert.equal(state.registrations, 1)
  const { payload } = await jwtVerify(state.cookie.value, new TextEncoder().encode(testKey))
  assert.equal(payload.isOwner, false)
  assert.equal(payload.role, 'player')
})

test('registration still rejects invalid access keys without issuing a session', async t => {
  const { register, state } = fixture(t)
  state.registrationError = { code: 'P0001', message: 'Access key is invalid or already used.' }
  const response = await register(request('register', registerBody))
  assert.equal(response.status, 400)
  assert.match((await response.json()).message, /Access key is invalid/)
  assert.equal(state.cookie, null)
})

test('malformed registration bodies are client errors, not service outages', async t => {
  const { register, state } = fixture(t)
  for (const body of [null, [], 'not-an-object']) {
    assert.equal((await register(request('register', body))).status, 400)
  }
  assert.equal(state.registrations, 0)
})
