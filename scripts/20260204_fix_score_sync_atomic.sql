-- RPC function to allow players to update their score securely and ATOMICALLY
-- This version uses a single UPDATE statement to avoid race conditions

CREATE OR REPLACE FUNCTION update_game_score(
  p_pin TEXT,
  p_user_id UUID,
  p_score INT
)
RETURNS VOID AS $$
BEGIN
  -- We perform a single atomic update to the players JSONB array
  UPDATE game_sessions
  SET players = (
    SELECT jsonb_agg(
      CASE 
        WHEN (elem->>'id')::uuid = p_user_id THEN 
          jsonb_set(elem, '{score}', to_jsonb(p_score))
        ELSE elem
      END
    )
    FROM jsonb_array_elements(players) AS elem
  )
  WHERE pin = p_pin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
