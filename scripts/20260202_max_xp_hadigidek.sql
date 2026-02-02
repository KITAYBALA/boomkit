-- Grant Max XP and Level to HadiGidek (Ughur Akparli)
UPDATE users 
SET xp = 100, level = 100, is_plus_user = TRUE
WHERE username = 'HadiGidek' OR username = 'Ughur Akparli';

-- Verification
SELECT id, username, xp, level, is_plus_user FROM users 
WHERE username IN ('HadiGidek', 'Ughur Akparli');
