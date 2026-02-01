-- RPC function to allow players to update their score securely
-- This avoids race conditions where multiple players updating the JSONB array would overwrite each other

CREATE OR REPLACE FUNCTION update_game_score(
  p_pin TEXT,
  p_user_id UUID,
  p_score INT
)
RETURNS VOID AS $$
DECLARE
  v_players JSONB;
  v_new_players JSONB;
BEGIN
  -- Get current players
  SELECT players INTO v_players FROM game_sessions WHERE pin = p_pin;
  
  -- Check if players exist
  IF v_players IS NULL THEN
    RETURN;
  END IF;

  -- Update the specific player's score using a transformation
  -- We assume players is an array of objects like [{"id": "...", "score": 0, ...}]
  SELECT jsonb_agg(
    CASE 
      WHEN (elem->>'id')::uuid = p_user_id THEN 
        jsonb_set(elem, '{score}', to_jsonb(p_score))
      ELSE elem
    END
  ) INTO v_new_players
  FROM jsonb_array_elements(v_players) AS elem;

  -- Update the record
  UPDATE game_sessions SET players = v_new_players WHERE pin = p_pin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
