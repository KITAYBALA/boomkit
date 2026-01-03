# Root Cause Analysis - Login Failure

## STEP 0: Auth System Confirmed

**System:** Custom auth using `public.users` table (NOT Supabase Auth)
- Registration: `app/api/auth/register/route.ts` → writes to `users.password_hash`
- Login: `app/api/auth/login/route.ts` → reads from `users.password_hash`
- Both use SHA-256 hashing with hex encoding

## STEP 1: Data Flow Analysis

### Registration Flow:
1. Receives: `{ username, email, password, age, reason }`
2. Hashes: `createHash('sha256').update(password).digest('hex')`
3. Stores: `users.password_hash = <64-char hex string>`
4. Table: `public.users`
5. Column: `password_hash` (TEXT)

### Login Flow:
1. Receives: `{ username, password }`
2. Queries: `users` table where `username = ?` or `email = ?`
3. Reads: `password_hash` column
4. Hashes: `createHash('sha256').update(password).digest('hex')`
5. Compares: `providedHash === storedHash`

## STEP 2: Debug Logs Added

Comprehensive debug logs added to both routes (guarded by `DEBUG_AUTH` or `NODE_ENV !== 'production'`):

**Login logs:**
- Input username and password length
- Table/column being queried
- Query results (found/not found)
- User record details
- Stored hash existence, type, length
- Computed hash length
- Hash comparison result
- Full error stack if any

**Registration logs:**
- Username and password length
- Hashing algorithm
- Computed hash length and prefix
- Table/column being written
- Insert result and stored hash verification

## STEP 3: Potential Root Causes to Check

Based on the code analysis, here are the most likely issues:

### A) Column Doesn't Exist
**Symptom:** Query returns user but `password_hash` is null/undefined
**Check:** Run `scripts/add_password_hash_column.sql` if not already run
**Fix:** Ensure column exists: `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`

### B) RLS Blocking Query
**Symptom:** Query returns null even though user exists
**Check:** RLS policies might block server-side reads
**Fix:** Verify RLS policy allows SELECT on `users` table (should be `USING (true)`)

### C) Username/Email Case Sensitivity
**Symptom:** User exists but lookup fails
**Check:** Database might be case-sensitive
**Fix:** Use `ilike` instead of `eq` for case-insensitive matching

### D) Hash Encoding Mismatch
**Symptom:** Hashes don't match even with same password
**Check:** Registration might store differently than login reads
**Fix:** Verify both use exact same hashing: `createHash('sha256').update(password).digest('hex')`

### E) Old Users Have NULL/Invalid Hashes
**Symptom:** Old users can't login, new users work
**Check:** Users created before password hashing fix have `password_hash = NULL`
**Fix:** Use password reset mechanism (already implemented)

## STEP 4: Next Steps

1. **Enable debug logs:** Set `DEBUG_AUTH=true` in environment or run in development mode
2. **Test registration:** Register a new user and check logs
3. **Test login:** Try to login and check logs
4. **Identify failure point:** Logs will show exactly where it fails:
   - User not found? → RLS or username mismatch
   - Hash doesn't exist? → Column missing or old user
   - Hash length wrong? → Encoding mismatch
   - Hashes don't match? → Double-hash or algorithm mismatch

## Expected Log Output (Success)

```
[AUTH DEBUG] ===== LOGIN START =====
[AUTH DEBUG] Input username: testuser
[AUTH DEBUG] Querying table: users
[AUTH DEBUG] Querying column: password_hash
[AUTH DEBUG] User found by username
[AUTH DEBUG] User record found
[AUTH DEBUG] Stored password_hash exists: true
[AUTH DEBUG] Stored password_hash length: 64
[AUTH DEBUG] Hashing algorithm: sha256
[AUTH DEBUG] Computed hash length: 64
[AUTH DEBUG] Hash comparison result: true
[AUTH DEBUG] ===== LOGIN SUCCESS =====
```

## Files Modified

1. `app/api/auth/login/route.ts` - Added comprehensive debug logging
2. `app/api/auth/register/route.ts` - Added debug logging for registration

## How to Test

1. Set `DEBUG_AUTH=true` in `.env` or run in development
2. Register a new user
3. Check server console for registration logs
4. Try to login with that user
5. Check server console for login logs
6. Identify the exact failure point from logs

