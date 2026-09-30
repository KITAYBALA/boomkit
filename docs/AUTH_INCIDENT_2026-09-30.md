# Authentication investigation, 2026-09-30

## Verified observations

- The current KitaysPC checkout is `Desktop/boomkit-1`, at `02fa55a`, matching remote
  `main` when checked. Work was isolated in a separate checkout; existing files were preserved.
- `https://boomkit.org` responds. Empty login/registration requests return validation
  errors (400). A deliberately nonexistent login returns invalid credentials (401).
  Registration with a deliberately invalid access key returns the database's invalid-key
  rejection (400). No real account was accessed or created, and no valid key was consumed.
- These probes reach the auth routes and registration RPC; they do not establish that
  account creation, credential lookup for a real account, or session signing works.
- A local fixture reproduces the reported generic login error when a correct password
  is verified with a production `JWT_SECRET` shorter than 32 bytes. The previous code
  throws after password verification and hides this particular configuration exception
  behind `An unexpected error occurred` (500).
- With that same configuration failure, the previous registration route calls the
  account-creation transaction before session signing fails. This can leave an account
  created and its access key consumed even though the UI reports registration failure.

## Focused change

Login and registration now check the existing session-signing requirements before
account lookup/creation. Missing or short production signing keys return a safe 503
with `code: AUTH_CONFIGURATION_ERROR`; details remain in server logs. Registration
does not reach its account-creation RPC when this check fails. Malformed registration
bodies return 400 instead of a false service outage. Other unexpected login failures
return a temporary-unavailability response rather than exposing internal configuration.

Production still requires a configured key of at least 32 bytes. Password verification,
rate limits, access keys, approval checks, session restrictions and cookie protections
are retained. No environment settings, database schema, or account data were changed.

## Verification and remaining diagnosis

- Eleven route/session regression tests cover missing/short/valid production keys,
  successful password verification and secure cookies, wrong passwords, reset-only
  sessions, pending registrations, invalid access keys and malformed request bodies.
- Against the original source, five of these regression cases fail; all eleven pass
  with this patch. The full suite passes 76 tests. TypeScript validation passes.
- These route tests use a simulated database with real password hashing and JWT signing.
  Existing SQL tests use isolated PGlite fixtures, not production Supabase.
- Production runtime logs have **not** been inspected. A short signing key is a
  plausible shared cause, not a confirmed diagnosis of the deployed failure. There is
  no authenticated Vercel CLI/connector available, and the supported desktop/browser
  automation runtime is not exposed in this environment. Real-account browser login
  and successful production registration remain untested.

The next diagnostic step is to inspect the Vercel runtime exception for the user's
failed `POST /api/auth/login`. If it reports `JWT_SECRET must contain at least 32 random
bytes in production`, an authorized operator must configure a strong random production
signing key and redeploy. Do not reduce the minimum or introduce a fallback. Changing
that key invalidates existing sessions. Do not paste its value into logs, issues or chat.
If the exception differs, diagnose that exception before changing configuration.

This patch improves failure handling and prevents configuration-related registration
side effects; pushing it to a review branch does not restore production authentication.
