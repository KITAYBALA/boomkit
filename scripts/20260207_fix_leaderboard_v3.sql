-- ROBUST SCORE SYNC v3
-- Supports matching by both ID and Username to handle all auth states.

CREATE OR REPLACE FUNCTION update_game_score(
  p_pin TEXT,
  p_player_id TEXT,
  p_player_username TEXT,
  p_score INT
)
RETURNS JSONB AS $$
DECLARE
  v_updated_players JSONB;
BEGIN
  -- Update the players array defensively
  UPDATE game_sessions
  SET players = (
    SELECT jsonb_agg(
      CASE 
        -- Match by ID OR Username OR Case-Insensitive Username
        WHEN (elem->>'id')::text = p_player_id 
             OR (elem->>'username')::text = p_player_username
             OR LOWER((elem->>'username')::text) = LOWER(p_player_username)
             OR (elem->>'id')::text = p_player_username -- Edge case fallback
             OR (elem->>'username')::text = p_player_id -- Edge case fallback
        THEN 
          jsonb_set(elem, '{score}', to_jsonb(p_score))
        ELSE elem
      END
    )
    FROM jsonb_array_elements(COALESCE(players, '[]'::jsonb)) AS elem
  )
  WHERE pin = p_pin
  RETURNING players INTO v_updated_players;

  RETURN v_updated_players;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant execute just in case
GRANT EXECUTE ON FUNCTION update_game_score(TEXT, TEXT, TEXT, INT) TO anon, authenticated, service_role;
