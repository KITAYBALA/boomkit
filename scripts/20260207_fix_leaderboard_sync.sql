-- RPC function to allow players to update their score securely and ATOMICALLY
-- This version is robust and matches by both ID and Username to ensure synchronization
-- Even if different join paths use slightly different identifiers.

CREATE OR REPLACE FUNCTION update_game_score(
  p_pin TEXT,
  p_user_id TEXT,
  p_score INT
)
RETURNS VOID AS $$
BEGIN
  -- We perform a single atomic update to the players JSONB array
  UPDATE game_sessions
  SET players = (
    SELECT jsonb_agg(
      CASE 
        -- Match by ID (primary) or Username (fallback) to ensure sync
        WHEN (elem->>'id') = p_user_id OR (elem->>'username') = p_user_id THEN 
          jsonb_set(elem, '{score}', to_jsonb(p_score))
        ELSE elem
      END
    )
    FROM jsonb_array_elements(COALESCE(players, '[]'::jsonb)) AS elem
  )
  WHERE pin = p_pin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
