# Boomkit Security and Correctness Audit

Date: 2026-09-20; third pass updated 2026-09-21. Base checkout: `86bd1086096c2ce42d175741e619090001a10229`.

## Status

**Incomplete security remediation. Do not treat this patch as a production security clearance.**

This pass inspected authentication, API authorization, SQL permissions and transactions, payments,
chat, auctions/trades, game logic, the Discord bot and dependency advisories. It does not certify
every file or every historical database installation. No live database migration was applied,
no real purchase was made, and no production account was created or modified during testing.

### Release Preparation Update

- The user reports applying the username repair and migrations 025-030 in Supabase. That live
  database state has not been independently inspected by the agent.
- The user explicitly selected pushing to `main`, with notice that this may deploy production.
- The current regression suite passes 65/65 tests, including five account-rename repair tests.
  The repair is now one atomic SQL statement, including its temporary tables and helper function;
  it handles exact-case references and rolls back on conflicts or unsupported schemas.
- A fresh `npm run build` passed before the push, including TypeScript checks and all 30 static
  pages. The Discord bot syntax check and staged whitespace check passed as well.
- A scan of changed files found no local secret-value matches or checked credential patterns.
  This is a limited pre-commit check, not a complete repository-history secret audit.
- Authenticated production login, registration, multiplayer and multi-connection tests remain
  unverified. Earlier pass notes below describe the state at the time of those checks.

## Fixed in This Patch

- Replaced the known development JWT signing key with a process-local random key. Session
  authorization rechecks current roles, approval, bans, credential-reset requirements and revocation.
- Restricted password-reset sessions to password recovery; fixed resets to write `user_secrets`.
  Bounded password/hash inputs and preserved upgrades of valid older passwords.
- Escaped identity lookup wildcards. Authentication rate limiting now uses an atomic database
  operation and fails closed on errors. Forwarded IP headers require a trusted proxy configuration.
- Registration creates the user and credentials and consumes the access key in one transaction.
- Added authenticated, allowlisted RPC dispatch with server-bound caller identities. Migration 026
  removes browser execution of privileged functions, including inherited PostgreSQL PUBLIC grants.
- Reworked token/boom transfers, trades and auctions into validated, locked transactions. Auction
  bids reserve funds and refund displaced bidders; accepted trades and auction claims cannot replay.
- Disabled the debug purchase endpoint. Webhooks validate signatures, store, live/paid status and
  catalog variants; database receipts make fulfillment idempotent. Plus tokens and booster awards
  are committed together. The initial subscription events no longer grant the same purchase twice.
- Made booster activation and season reward claims atomic. Temporary Plus rewards use an expiry
  instead of granting the privileged `tester` role.
- Removed public DM broadcasts and browser access to private conversation tables. Trade reads and
  mutations now check membership through authenticated APIs.
- Restricted image uploads to staff, with size and actual file-signature checks; required
  authentication and bounded input/output for AI set generation.
- Protected owner/staff accounts in chat moderation, removed tester moderation powers, repaired
  alt-account lookups after the secrets migration, fixed bigint mute timestamps and rejected
  malformed chat messages. Edits check the account ID and current mute state. Reactions are atomic
  and scoped to the signed-in user. Migration 026 blocks direct browser chat writes.
- IP blacklist audit entries derive the actor from the session; IP validation uses `node:net`.
- Fixed repeated merge rewards, unreachable rarity ranges, duplicate answers/casts, stale drop
  state, conditional hook ordering and callbacks after game completion. Game clocks use deadlines
  so background-tab throttling does not extend their duration.
- Removed hardcoded account level elevation and the client effect that repeatedly reminted pass
  rewards after items were sold/transferred. Profile updates no longer send forbidden IP fields.
- Updated Next.js and vulnerable transitive dependencies; updated the Discord bot dependency lock.
- Corrected Next.js's workspace tracing root. Windows uses an in-memory Webpack cache after
  repeat builds failed in filesystem snapshot hashing. This trades persistent cache speed for
  build reliability; other platforms retain the default cache configuration.

## Remaining Production Blockers

1. **Deployment required: server-owned economy.** Ordinary profile writes to balances, inventory,
   XP and stats are blocked. Apply 025-030 with the matching application and Discord bot before
   relying on these protections. Inspect the actual installed legacy functions on staging.
2. **Deployment required: public user privacy.** Migration 027 revokes table-wide and historical
   column-level SELECT privileges, then grants an explicit public projection. Private profile
   details are restricted to authenticated self/moderator APIs; credentials never leave the server.
3. **Staging and abuse testing.** Room control, membership, private content and scores now use
   authenticated APIs. Account and multiplayer rewards derive from trusted-bank answers, not
   client scores. This is not a bot-detection system: bank answers are discoverable and gameplay
   can still be automated. Verify authenticated multi-player workflows and production policies.
4. **Billing excluded by user request.** This pass does not finish refunds, cancellations or
   subscription expiration. Existing checkout code was not removed. Do not enable real-money
   payments without completing that separate lifecycle work and provider integration testing.
5. **Multi-connection tests still needed.** Legacy feature wrappers acquire locks before their
   reads; Discord player wallets use transactional receipts. The isolated database fixture tests
   actual clan donation/upgrade implementations, not every deployed legacy body or concurrent
   PostgREST connection. Race/deadlock recovery and historical rentals need staging validation.
6. **Operational:** historic migrations have divergent schemas, overloads and repeatability issues.
   This pass did not replay the entire SQL history on an empty database or inspect deployed grants.
   Schedule the supplied rate-limit cleanup script. A deployment without a trusted proxy shares the
   `unknown` authentication bucket, which is intentionally restrictive but unsuitable for traffic.

## Verification

### Third Pass

- Migration 029 revokes browser mutations on application tables, private table/view reads and
  non-extension public RPC execution. It also removes browser schema creation and sets restrictive
  defaults for objects created by the migration owner. Inspect grants from other owners separately.
- Room creation, joining, reads and host-only start/finish are authenticated and rate-limited.
  Players cannot provide identities or leaderboard scores. Expired rooms reject joins and stale
  game runs cannot be attached to another room. Host finish still settles accepted answers.
- Multiplayer leaderboard score is ten points per distinct verified correct answer, not local
  merging/fishing physics points. Custom/unknown questions remain practice-only. Room starts use
  the stored questions/duration; client-supplied replacements are ignored.
- Private sets, friends, activity, season claims and clan chat use authenticated APIs. Clan chat
  enforces membership and mutes. Browser writes to the shared question bank are removed.
- Migration 030 adds nonnegative-wallet and integer-inventory checks, wraps installed legacy
  transactions with locks, and adds receipt-backed Discord coinflip/daily/trivia/promo operations.
  Discord and website daily claims share the UTC claim date; coinflip cooldown survives restarts.
  Trivia collectors are message-bound and failed account settlement does not consume the winner.
- Login now has an account-based rate bucket in addition to the network bucket. Production rejects
  JWT secrets shorter than 32 bytes; use a cryptographically random secret, not a long password.
- `npm test`: 60/60 tests passed. New coverage includes API identity/room snapshot binding,
  permissions, host controls, run re-binding, expired joins, inventory constraints under the service
  role, clan chat mutes, legacy clan spending and Discord replay/cooldown behavior.
- `npm run build`: passed, including TypeScript validation and all 30 static pages.
  `node --check discord-bot/index.js`: passed after the final trivia correction.
- Final standalone TypeScript and `git diff --check` passed. Local HTTP: home 200, room/community/
  game-reward unauthenticated requests 401 JSON, cross-origin room writes 403 JSON, frame denial
  header present. Development preview is running at `http://127.0.0.1:3000/`.
- Migrations 025-030 execute twice in the isolated fixture. No live Supabase changes or Git push
  were performed. Browser attachment is unavailable; authenticated visual checks are not claimed.

### Second Pass

- Pack opening, sales, limited purchases and UTC daily spins use locked, receipt-backed operations.
  Drop randomness and prices come from the server catalog. Repeated receipts cannot mint twice.
- Ordinary profile updates cannot set economic fields, roles, privileges or gameplay statistics.
  Removed the owner's automatic inventory refill. Username changes are refused until all related
  username-keyed tables can be migrated atomically.
- Game rewards are 10 tokens and 5 XP per distinct correctly answered trusted-bank question per run,
  subject to the existing 5,000-token lifetime cap. Unknown/custom/AI questions remain practice-only.
  Repeated questions do not repeatedly award tokens. Starting another run abandons the prior run.
- Level milestones, owned pinned-item evolution, season XP, enrolled clan tournament scores and
  rental consumption settle in the same transaction. Results display the actual server receipt.
- Browser writes to clan/tournament/evolution reward state are revoked by 028. Client RPC access to
  arbitrary clan XP, tournament scores and rental decrements is removed.
- User and leaderboard polling compensate for restricted public Realtime access. Expired cached
  bans no longer redirect before the server has checked the account.
- Production build passed with the new routes; final TypeScript check passed. The expanded
  regression suite passed all 50 tests and covers profile/economy API boundaries, replayed actions, private column grants,
  authoritative game rewards, milestones, evolution and clan progress. All migrations 025-028
  execute twice in the isolated database test fixture.
- Final local HTTP checks: home 200, unauthenticated economy/game-reward/profile requests 401 JSON,
  cross-origin economy POST 403 JSON. Preview is running at `http://127.0.0.1:3000/`.
  Browser attachment still fails on the existing error-page tab; authenticated visual testing is
  not claimed. Final retry handling and removal of unused callbacks were typechecked and tested
  after the successful production build.
- New SQL is tested on isolated fixtures, not a live Supabase deployment. In particular, historical
  rental and achievement module integration still requires staging validation. Receipt/run tables
  need a retention policy before high-volume deployment.

### First Pass

- `npm test`: 38 automated regression tests covering credentials, sessions, request boundaries,
  RPC policy, gameplay merging and database transactions/permissions.
- `npm run typecheck`: passed after the final origin-check correction.
- `npm run build`: production build passed, including TypeScript checks and all 25 static
  pages, after the Windows cache workaround. Two intermediate filesystem-cache builds failed;
  no generated cache files were deleted. The subsequent origin-check correction was verified
  through development compilation, TypeScript, regression tests and local HTTP checks.
- Local HTTP checks: home 200 with Boomkit HTML, unauthenticated verification/RPC 401 JSON,
  disabled debug purchase 404 JSON, cross-origin RPC 403 JSON. Same-origin loopback requests pass
  the origin check even when Next.js normalizes the internal URL to `localhost`.
- Preview: `http://127.0.0.1:3000/`. Browser attachment failed, so rendered-page and authenticated
  gameplay verification are not claimed. The server remains running for manual inspection.
- `node --check discord-bot/index.js`: passed.
- `pnpm audit`: zero reported known vulnerabilities after dependency updates.
- Discord bot lockfile audit: zero reported known vulnerabilities after `npm audit fix`.
- SQL tests execute 025 and 026 twice against an isolated PGlite fixture. They cover legacy void
  RPC return types, invalid amounts, rollback, replay, permission checks and escrow accounting.
- Limits: PGlite uses one connection; this is not a multi-connection race test or a deployed
  Supabase/PostgREST/RLS integration test. Authenticated UI, live payments, Discord and multiplayer
  end-to-end tests still require staging fixtures. Zero audit findings does not mean zero bugs.

## Migration and Deployment Notes

**Do not rerun all historical scripts, and do not paste these changes into production blindly.**

1. Back up the database and restore a staging copy. Inventory its schema, grants and installed RPCs.
   Migration 024's secrets split and the existing game tables must already be present.
2. Check case-insensitive username/email collisions before migration 025. Resolve any collisions
   explicitly; the unique indexes intentionally abort rather than silently merge accounts.
3. On staging, apply `supabase/migrations/025_atomic_auth_and_rewards.sql`, then
   `supabase/migrations/026_rpc_and_market_security.sql`, followed by
   `supabase/migrations/027_server_economy_and_profile_privacy.sql` and
   `supabase/migrations/028_verified_game_rewards.sql`, then
   `supabase/migrations/029_multiplayer_and_browser_boundaries.sql` and
   `supabase/migrations/030_legacy_transactions_and_discord.sql`, with this exact application version.
   The new auth routes need 025; the gateway/chat/market permission changes need 026. Old clients
   using direct RPCs/writes will no longer work after 026. The new economy/game routes require
   027/028 and the existing level, XP, progression and pinned-boom columns. Deploy during a
   maintenance window; do not run old scripts afterward to restore permissive grants.
   Run `scripts/security-preflight.sql` on the staging restore first. Repair invalid inventory
   rows explicitly: NOT VALID constraints leave old rows in place but check every later update.
   The room/community endpoints require 029; updated Discord reward commands require 030.
4. Test registration with disposable access keys, existing and reset-required login, approvals,
   moderation, private chat, reactions, trading, bid refunds, reward replays and webhook retries.
   Resolve the production blockers above before treating this as a completed security rollout.
5. Configure a strong random `JWT_SECRET`, server-only Supabase service key and payment secrets.
   Set `APP_ORIGIN` to the canonical site origin. Set `TRUST_PROXY=true` only behind a trusted proxy
   that overwrites forwarded headers; Vercel uses its platform-specific forwarding header.
6. Install the root dependencies from `pnpm-lock.yaml` with the overrides in `pnpm-workspace.yaml`.
   The repository also tracks Discord `node_modules`; those vendored files were not rewritten.
   Run `npm ci` in `discord-bot` before deploying it so the corrected lockfile is actually installed.

## Advisory References

- [Next.js August 2026 security release](https://nextjs.org/blog/august-2026-security-release)
- [Lemon Squeezy webhook event types](https://docs.lemonsqueezy.com/help/webhooks/event-types)
- [Lemon Squeezy subscription invoice object](https://docs.lemonsqueezy.com/api/subscription-invoices/the-subscription-invoice-object)
- [Webpack filesystem snapshot hashing issue](https://github.com/webpack/webpack/issues/21636)
- [Webpack cache configuration](https://webpack.js.org/configuration/cache/)
