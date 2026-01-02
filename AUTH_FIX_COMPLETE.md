# Authentication Fix - Complete Summary

## Problem Identified

**CRITICAL ISSUE:** Registration was NOT hashing passwords, causing login to fail even with correct credentials.

### Root Cause

1. **Registration (`app/page.tsx` - `handleRegister`):**
   - Collected password from form (`registerForm.password`)
   - Inserted user into database via `saveUser()` function
   - **NEVER hashed the password**
   - **NEVER stored `password_hash` in the database**
   - Users were created with `password_hash = NULL`

2. **Login (`app/api/auth/login/route.ts`):**
   - Correctly hashed provided password using SHA-256
   - Compared against stored `password_hash` from database
   - **But stored hash was NULL** (never set during registration)
   - Login always failed with "Invalid username or password"

### Why Correct Passwords Failed

Even when users entered the exact same password used during registration:
- Registration: Password was stored as `NULL` (not hashed, not saved)
- Login: Password was hashed and compared against `NULL`
- Result: Always failed → "Invalid username or password"

## Solution

### Changes Made

#### 1. Created Server-Side Registration API Route
**File: `app/api/auth/register/route.ts` (NEW)**

- **Hashes password using SHA-256** (same algorithm as login)
- Uses `createHash('sha256').update(password).digest('hex')`
- Stores hashed password in `password_hash` column
- Validates input server-side (age, required fields)
- Checks for existing users (username/email)
- Returns user data (excluding password_hash)

**Key code:**
\`\`\`typescript
// Hash password using SHA-256 (same algorithm as login)
const passwordHash = createHash('sha256').update(password).digest('hex')

// Store in database
const newUser = {
  ...
  password_hash: passwordHash, // Store hashed password
  ...
}
\`\`\`

#### 2. Updated Client-Side Registration Handler
**File: `app/page.tsx` - `handleRegister` function**

- Changed from client-side registration to calling server API route
- Calls `/api/auth/register` with form data
- Server handles password hashing and database insertion
- Maps server response to client-side `GameUser` format
- Never stores password in client state

**Before:** Client-side, no password hashing
**After:** Server-side API call, password hashed before storage

### Hashing Consistency

Both registration and login now use:
- **Algorithm:** SHA-256
- **Encoding:** Hex string (64 characters)
- **Storage:** `password_hash` column (TEXT)
- **Comparison:** Direct hex string comparison (`hash1 === hash2`)

## Files Modified

1. **`app/api/auth/register/route.ts`** (NEW)
   - Server-side registration endpoint
   - Hashes passwords using SHA-256
   - Validates and stores user data

2. **`app/page.tsx`**
   - `handleRegister` function updated
   - Now calls `/api/auth/register` API route
   - Removed client-side database insertion

## Testing

To verify the fix works:

1. **Register a new user:**
   - Password is hashed server-side and stored in `password_hash`

2. **Login with same credentials:**
   - Password is hashed using same algorithm
   - Comparison: `hash(login_password) === stored_hash`
   - Should succeed

3. **Check server logs:**
   - `[AUTH] User registered: <username>` - registration success
   - `[AUTH] Successful login for user <username>` - login success

## Important Notes

1. **Existing users need password reset:**
   - Users registered before this fix have `password_hash = NULL`
   - They cannot log in until password is set
   - Use `scripts/hash_password_for_user.sql` to set passwords for existing users

2. **Password security:**
   - Passwords are hashed server-side (never sent/stored as plaintext)
   - SHA-256 is used (simple but secure for this use case)
   - Consider upgrading to bcrypt in production for better security

3. **No client-side password storage:**
   - Client never stores or sends plaintext passwords (except during registration/login API calls)
   - Password hash is never returned to client
   - Server-side validation ensures security

## Verification Checklist

- [x] Registration hashes passwords using SHA-256
- [x] Login hashes passwords using SHA-256 (already working)
- [x] Both use same algorithm (SHA-256)
- [x] Both use same encoding (hex string)
- [x] Both use same column (`password_hash`)
- [x] Registration stores `password_hash` in database
- [x] Login compares against `password_hash` from database
- [x] Server-side validation (no client-side auth decisions)
- [x] Debug logging added for troubleshooting
