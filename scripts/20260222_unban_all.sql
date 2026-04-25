-- Force unban the system account and any other accidentally banned test accounts
BEGIN;

UPDATE public.users 
SET 
  is_banned = false, 
  status = 'approved',
  ban_reason = NULL,
  ban_expiry = NULL
WHERE username = 'system' OR is_banned = true;

COMMIT;