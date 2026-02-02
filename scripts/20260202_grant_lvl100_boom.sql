-- Grant Level 100 Gamepass Boom "Cosmic Admin Engine" to HadiGidek
-- This boom should have been automatically granted at level 100

UPDATE users 
SET booms = jsonb_set(
  COALESCE(booms, '{}'::jsonb),
  '{Cosmic Admin Engine}',
  to_jsonb(COALESCE((booms->>'Cosmic Admin Engine')::int, 0) + 1)
)
WHERE username = 'HadiGidek' AND level >= 100;

-- Verification
SELECT id, username, level, booms->'Cosmic Admin Engine' as cosmic_admin_engine_count 
FROM users 
WHERE username = 'HadiGidek';
