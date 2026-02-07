-- ROBUST SCORE SYNC v2
-- This script fixes the issue where scores either stay at 0 or don't sync 
-- by improving the matching logic and preventing JSON corruption.

CREATE OR REPLACE FUNCTION update_game_score(
  p_pin TEXT,
  p_user_id TEXT,
  p_score INT
)
RETURNS VOID AS $$
BEGIN
  -- Defensive Update:
  -- 1. Atomic update of the JSONB array
  -- 2. Matches by exact ID or case-insensitive username fallback
  -- 3. COALESCE to prevent NULL errors if players array is missing
  UPDATE game_sessions
  SET players = (
    SELECT jsonb_agg(
      CASE 
        WHEN (elem->>'id')::text = p_user_id 
             OR LOWER(elem->>'username') = LOWER(p_user_id)
             OR (elem->>'username') = p_user_id THEN 
          jsonb_set(elem, '{score}', to_jsonb(p_score))
        ELSE elem
      END
    )
    FROM jsonb_array_elements(COALESCE(players, '[]'::jsonb)) AS elem
  )
  WHERE pin = p_pin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify RLS again for absolute certainty
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable update for all" ON game_sessions;
CREATE POLICY "Enable update for all" ON game_sessions FOR UPDATE USING (true) WITH CHECK (true);
