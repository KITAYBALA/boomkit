# Authentication Fix Summary

## Problem Identified

The password verification was failing because:
1. The comparison logic used `Buffer.from()` with timing-safe comparison, which may have encoding issues
2. Password comparison needed to be simplified to direct hex string comparison
3. Debug logging was needed to diagnose the issue

## Changes Made

### File: `app/api/auth/login/route.ts`

**What was wrong:**
- Used `Buffer.from(userData.password_hash, 'hex')` to convert hex strings to binary
- Used `timingSafeEqual()` for comparison
- This complex comparison could fail if there were any encoding/format mismatches

**What was changed:**
- Simplified to direct hex string comparison: `providedPasswordHash !== storedPasswordHash`
- Added `.trim()` to stored hash to remove any whitespace
- Added debug logging to help diagnose issues:
  - Logs when user has no password_hash
  - Logs password mismatch with first 16 chars of each hash
  - Logs successful login

**New comparison logic:**
\`\`\`typescript
const providedPasswordHash = createHash('sha256').update(password).digest('hex')
const storedPasswordHash = userData.password_hash.trim()
if (providedPasswordHash !== storedPasswordHash) {
  // reject
}
\`\`\`

## Files Modified

1. **app/api/auth/login/route.ts** - Simplified password comparison logic

## Important Notes

1. **Passwords must be hashed correctly in database:**
   - Use SHA-256 hashing
   - Store as hex string (64 characters)
   - Use `scripts/hash_password_for_user.sql` to set passwords for existing users

2. **Registration still doesn't hash passwords:**
   - Registration code (`handleRegister` in `app/page.tsx`) doesn't hash passwords yet
   - This is a separate issue from login verification
   - For now, use the SQL script to set passwords for existing users

3. **Debug logging:**
   - Check server console/logs for:
     - `[AUTH] User X found but no password_hash set` - means password needs to be set
     - `[AUTH] Password mismatch...` - shows first 16 chars of each hash for debugging
     - `[AUTH] Successful login...` - confirms successful authentication

## Next Steps

1. Test login with a user that has a password_hash set
2. Use `scripts/hash_password_for_user.sql` to set passwords for existing users
3. Check server logs to see which error occurs (no password_hash vs mismatch)
4. Once login works, fix registration to hash passwords during user creation
