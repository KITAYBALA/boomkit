-- Restore owner account and implement protections
BEGIN;

-- 1. Insert or Update the owner account
INSERT INTO public.users (
  id,
  username,
  email,
  is_owner,
  is_banned,
  status,
  tokens,
  role,
  booms,
  packs,
  join_date
)
SELECT 
  id,
  'oktay',
  'oktayabdullazada@gmail.com',
  true,
  false,
  'approved',
  1000000,
  'owner',
  '{}'::jsonb,
  ARRAY[]::text[],
  NOW()
FROM auth.users
WHERE email = 'oktayabdullazada@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET 
  is_owner = true,
  is_banned = false,
  status = 'approved',
  role = 'owner';

-- 2. Create a trigger function to protect the owner account
CREATE OR REPLACE FUNCTION protect_owner_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent deletion of owner account
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_owner = true OR OLD.username = 'oktay' THEN
      RAISE EXCEPTION 'Cannot delete the owner account.';
    END IF;
    RETURN OLD;
  END IF;

  -- Prevent banning or removing owner status
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_owner = true OR OLD.username = 'oktay' THEN
      -- Ensure it stays owner and unbanned
      NEW.is_owner := true;
      NEW.is_banned := false;
      NEW.status := 'approved';
      NEW.role := 'owner';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach the trigger to the users table
DROP TRIGGER IF EXISTS trg_protect_owner ON public.users;
CREATE TRIGGER trg_protect_owner
BEFORE UPDATE OR DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION protect_owner_account();

COMMIT;
