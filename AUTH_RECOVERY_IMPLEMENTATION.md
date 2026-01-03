# Authentication Recovery Implementation Summary

## Problem

Old users created before the password hashing fix have `password_hash = NULL`, making login impossible. A system was needed to:
1. Reset all existing user passwords safely
2. Allow users to set new passwords
3. Make auth consistent for both old and new users

## Solution Implemented

### 1. Database Schema Change

**File:** `scripts/add_password_reset_required_column.sql`

Added `password_reset_required` column to track users who need to reset passwords:
- Type: `BOOLEAN NOT NULL DEFAULT FALSE`
- Purpose: Flag users who need password reset (set after admin reset)

### 2. Admin Password Reset Route

**File:** `app/api/admin/auth/reset-all-passwords/route.ts` (NEW)

**Purpose:** One-time admin route to reset all user passwords

**Security:**
- Requires `ADMIN_RESET_SECRET` environment variable
- Requires username parameter (must be owner)
- Verifies user is owner before allowing reset
- Logs only counts, never secrets

**Behavior:**
- Sets `password_hash = NULL` for all users
- Sets `password_reset_required = TRUE` for all users
- Returns count of affected users

**Usage:**
```bash
POST /api/admin/auth/reset-all-passwords
Body: { "username": "system", "secret": "your-admin-reset-secret" }
```

**After use:** Set `ADMIN_RESET_SECRET` to empty string or remove it to disable

### 3. Set Password Route (Updated)

**File:** `app/api/auth/set-password/route.ts`

**Updates:**
- Now clears `password_reset_required` flag when password is set
- Uses same SHA-256 hashing as registration/login
- Server-side only

**Usage:**
```bash
POST /api/auth/set-password
Body: { "username": "user", "password": "newpassword" }
```

### 4. Login Route (Updated)

**File:** `app/api/auth/login/route.ts`

**Updates:**
- Removed all debug logs
- Added `password_reset_required` to SELECT query
- Checks for `password_reset_required` or `NULL password_hash`
- Returns `requiresReset: true` when reset is needed
- Returns distinct error message: "Password reset required"

**Behavior:**
- If `password_reset_required = true` OR `password_hash = NULL`:
  - Returns `{ success: false, message: "Password reset required", requiresReset: true }`
  - Status: 403
- Otherwise, proceeds with normal password verification

### 5. Registration Route (Updated)

**File:** `app/api/auth/register/route.ts`

**Updates:**
- Removed debug logs
- Sets `password_reset_required = false` for new users
- New users don't need password reset

### 6. Reset Password UI Page

**File:** `app/reset-password/page.tsx` (NEW)

**Features:**
- Simple form for username, new password, confirm password
- Accepts username via query parameter (`?username=xxx`)
- Validates password match and minimum length (6 chars)
- Calls `/api/auth/set-password` API
- Shows success message and redirects to login
- Minimal UI, matches existing design patterns

### 7. Login Handler (Updated)

**File:** `app/page.tsx` - `handleLogin` function

**Updates:**
- Checks for `requiresReset` in login response
- Redirects to `/reset-password?username=xxx` when reset is needed
- Preserves existing login flow for successful logins

## Files Modified

1. **scripts/add_password_reset_required_column.sql** (NEW)
   - SQL migration to add `password_reset_required` column

2. **app/api/admin/auth/reset-all-passwords/route.ts** (NEW)
   - Admin route to reset all passwords

3. **app/api/auth/set-password/route.ts**
   - Updated to clear `password_reset_required` flag

4. **app/api/auth/login/route.ts**
   - Removed debug logs
   - Added password reset check
   - Returns `requiresReset` flag

5. **app/api/auth/register/route.ts**
   - Removed debug logs
   - Sets `password_reset_required = false`

6. **app/reset-password/page.tsx** (NEW)
   - Reset password UI page

7. **app/page.tsx**
   - Updated `handleLogin` to redirect on reset requirement

## How It Works

### For Existing Users (Before Fix)

1. **Admin runs reset:**
   - Calls `/api/admin/auth/reset-all-passwords` with owner username + secret
   - All users get `password_hash = NULL` and `password_reset_required = TRUE`

2. **User tries to login:**
   - Login returns `requiresReset: true`
   - Client redirects to `/reset-password?username=xxx`

3. **User sets new password:**
   - Enters new password on reset page
   - API sets `password_hash` (hashed) and `password_reset_required = FALSE`

4. **User can now login:**
   - Normal login flow works
   - Password verified using SHA-256 hash

### For New Users

1. **User registers:**
   - Password hashed with SHA-256 and stored
   - `password_reset_required = FALSE`
   - Can login immediately

## Security Features

✅ **All passwords hashed server-side** (SHA-256)
✅ **No plaintext passwords stored** anywhere
✅ **Admin reset route protected** (secret + owner check)
✅ **Reset can be disabled** (remove ADMIN_RESET_SECRET)
✅ **Server-side validation** only
✅ **Consistent hashing** across registration/login/reset

## Environment Variables

Add to `.env`:
```
ADMIN_RESET_SECRET=your-secure-random-string-here
```

**After use:** Remove or set to empty string to disable the reset route

## Testing Checklist

- [ ] Run SQL migration to add `password_reset_required` column
- [ ] Set `ADMIN_RESET_SECRET` in environment
- [ ] Call admin reset route to reset all passwords
- [ ] Try to login with existing user → should redirect to reset-password
- [ ] Set new password on reset page → should succeed
- [ ] Login with new password → should succeed
- [ ] Register new user → should work immediately
- [ ] Login with wrong password → should fail
- [ ] After testing, remove/clear `ADMIN_RESET_SECRET`

## What Was Wrong

**Old users:**
- Created before password hashing fix
- Had `password_hash = NULL`
- Could not login (login expected hash, got NULL)
- Needed a way to set passwords

**New system:**
- All passwords hashed consistently (SHA-256)
- Reset mechanism for old users
- Consistent flow for old and new users
- Clear separation between reset-required and invalid password errors

