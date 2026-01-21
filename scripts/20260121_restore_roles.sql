-- RESTORATION SCRIPT (Version 3)
-- Run this to fix your owner/staff status definitively

-- 1. Restore system (Oktay)
UPDATE users 
SET role = 'owner', is_owner = TRUE 
WHERE username = 'system' OR username = 'Oktay Abdullazada';

-- 2. Restore HadiGidek (Ughur) as Moderator
UPDATE users 
SET role = 'moderator', is_owner = FALSE 
WHERE username = 'HadiGidek' OR username = 'Ughur Akparli';

-- 3. Restore TUran1545 (Turan) as Tester
UPDATE users 
SET role = 'tester', is_owner = FALSE
WHERE username = 'TUran1545' OR username = 'Turan Mecidov';

-- Verification
SELECT id, username, role, is_owner FROM users 
WHERE username IN ('system', 'HadiGidek', 'TUran1545', 'Oktay Abdullazada', 'Ughur Akparli', 'Turan Mecidov');
