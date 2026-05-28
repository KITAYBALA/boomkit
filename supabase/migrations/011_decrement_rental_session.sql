-- Migration: Create decrement_rental_session RPC
-- When a user plays a game and wins, if they had the boom rented, we decrement sessions remaining.
-- If sessions remaining hits 0, the boom is completed and returned to the owner.

CREATE OR REPLACE FUNCTION public.decrement_rental_session(p_renter TEXT, p_boom_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rental RECORD;
  v_owner_booms JSONB;
BEGIN
  -- Find the oldest active rental for this renter and boom
  SELECT * INTO v_rental 
  FROM public.boom_rentals 
  WHERE renter_username = p_renter 
    AND boom_name = p_boom_name 
    AND status = 'rented'
  ORDER BY rented_at ASC
  LIMIT 1
  FOR UPDATE;

  IF v_rental IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'No active rental found.');
  END IF;

  IF v_rental.sessions_remaining > 1 THEN
    -- Just decrement sessions
    UPDATE public.boom_rentals 
    SET sessions_remaining = sessions_remaining - 1 
    WHERE id = v_rental.id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Session used. Sessions remaining: ' || (v_rental.sessions_remaining - 1));
  ELSE
    -- Complete the rental and return the boom to the owner
    UPDATE public.boom_rentals 
    SET sessions_remaining = 0, status = 'completed' 
    WHERE id = v_rental.id;

    SELECT booms INTO v_owner_booms FROM public.users WHERE username = v_rental.owner_username FOR UPDATE;
    v_owner_booms := jsonb_set(
      COALESCE(v_owner_booms, '{}'::jsonb),
      ARRAY[v_rental.boom_name],
      to_jsonb(COALESCE((v_owner_booms->>v_rental.boom_name)::INTEGER, 0) + 1)
    );
    UPDATE public.users SET booms = v_owner_booms WHERE username = v_rental.owner_username;

    -- Log activity
    PERFORM log_user_activity(
      v_rental.owner_username, 
      'rental_completed', 
      'Your rental listing for ' || v_rental.boom_name || ' has ended and the boom was returned.', 
      jsonb_build_object('boom_name', v_rental.boom_name, 'renter', p_renter)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Rental completed. Boom returned to owner ' || v_rental.owner_username);
  END IF;
END;
$$;
