# Authentication Debug Guide

## Debug Logs Added

Debug logs have been added to the login route (`app/api/auth/login/route.ts`) to help identify authentication issues.

### What the Logs Show

When `DEBUG_AUTH=true` or `NODE_ENV !== 'production'`, the login route will log:

1. **LOGIN start** - Request received
2. **User found** - true/false (whether user was found in database)
3. **DB column read** - Always `password_hash`
4. **Stored password_hash exists** - true/false (whether the column has a value)
5. **Stored hash length** - Number of characters (64 for SHA-256 hex)
6. **Hashing algorithm** - Always `sha256`
7. **Computed hash length** - Number of characters (should be 64)
8. **Comparison result (match)** - true/false (whether hashes match)
9. **Password mismatch details** - First 16 chars of each hash if mismatch

### How Registration Works

**Registration (`app/api/auth/register/route.ts`):**
- Algorithm: SHA-256
- Encoding: Hex string
- Column: `password_hash`
- Hash length: 64 characters

**Login (`app/api/auth/login/route.ts`):**
- Algorithm: SHA-256
- Encoding: Hex string
- Column: `password_hash`
- Hash length: 64 characters
- Comparison: Direct string comparison after trimming stored hash

### Common Issues

1. **password_hash is NULL:**
   - Log shows: "Stored password_hash exists: false"
   - Solution: Use `/api/auth/set-password` route or SQL script to set password

2. **Hash length mismatch:**
   - Stored hash length ≠ 64 or computed hash length ≠ 64
   - Indicates encoding/algorithm mismatch

3. **Comparison fails:**
   - Hash lengths match but comparison is false
   - Check the logged hash prefixes to see if they're similar

### Helper Route

**POST `/api/auth/set-password`**
- Sets/resets password hash for existing users
- Body: `{ "username": "user", "password": "newpassword" }`
- Uses same SHA-256 hashing as registration/login

### SQL Script

See `scripts/hash_password_for_user.sql` for direct database password setting.

### Testing Checklist

After checking debug logs:

1. **Register new user** → Check registration logs → password_hash should be 64 chars
2. **Login with correct password** → Check login logs:
   - User found: true
   - Stored password_hash exists: true
   - Stored hash length: 64
   - Computed hash length: 64
   - Comparison result (match): true
3. **Login with wrong password** → Comparison result should be false
4. **Login with existing user (pre-fix)** → password_hash exists should be false → use set-password route
