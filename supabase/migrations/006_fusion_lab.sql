/* RPC to fuse two booms */
DROP FUNCTION IF EXISTS public.fuse_booms(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION fuse_booms(p_username TEXT, p_boom1 TEXT, p_boom2 TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_booms JSONB;
    v_boom1_count INTEGER;
    v_boom2_count INTEGER;
    v_rarity1 TEXT;
    v_rarity2 TEXT;
    v_result_rarity TEXT;
    v_result_boom TEXT;
    v_roll INTEGER;
    v_success BOOLEAN := FALSE;
    v_message TEXT;
BEGIN
    -- 1. Get user and verify ownership
    SELECT booms INTO v_user_booms FROM public.users WHERE username = p_username FOR UPDATE;
    
    v_boom1_count := COALESCE((v_user_booms->>p_boom1)::INTEGER, 0);
    v_boom2_count := COALESCE((v_user_booms->>p_boom2)::INTEGER, 0);

    IF p_boom1 = p_boom2 THEN
        IF v_boom1_count < 2 THEN RAISE EXCEPTION 'Insufficient booms to fuse.'; END IF;
    ELSE
        IF v_boom1_count < 1 OR v_boom2_count < 1 THEN RAISE EXCEPTION 'Insufficient booms to fuse.'; END IF;
    END IF;

    -- 2. Deduct inputs
    v_user_booms := jsonb_set(v_user_booms, ARRAY[p_boom1], to_jsonb(GREATEST(0, (v_user_booms->>p_boom1)::INTEGER - 1)));
    IF (v_user_booms->>p_boom1)::INTEGER <= 0 THEN v_user_booms := v_user_booms - p_boom1; END IF;
    
    -- Re-fetch count for boom2 in case it's the same as boom1 and already modified
    v_boom2_count := COALESCE((v_user_booms->>p_boom2)::INTEGER, 0);
    v_user_booms := jsonb_set(v_user_booms, ARRAY[p_boom2], to_jsonb(GREATEST(0, v_boom2_count - 1)));
    IF (v_user_booms->>p_boom2)::INTEGER <= 0 THEN v_user_booms := v_user_booms - p_boom2; END IF;

    -- 3. Fusion Logic
    v_roll := floor(random() * 100);

    -- Determination of result based on roll
    -- In this simple version, we'll use 'Basic Box' -> 'Rare Box' -> 'Epic Box' -> 'King Box'
    -- If they fuse two 'Basic Box', 40% chance of another 'Basic Box', 30% 'Rare Box', 30% Lose.
    
    IF p_boom1 = 'Basic Box' OR p_boom2 = 'Basic Box' THEN
        IF v_roll < 30 THEN v_success := FALSE; v_message := 'The fusion fizzled! You lost both items.';
        ELSIF v_roll < 70 THEN v_success := TRUE; v_result_boom := 'Basic Box'; v_message := 'Fusion successful! You received a ' || v_result_boom;
        ELSE v_success := TRUE; v_result_boom := 'Rare Box'; v_message := 'CRITICAL SUCCESS! You upgraded to a ' || v_result_boom;
        END IF;
    ELSIF p_boom1 = 'Rare Box' OR p_boom2 = 'Rare Box' THEN
        IF v_roll < 40 THEN v_success := FALSE; v_message := 'The fusion fizzled! Rare materials are unstable.';
        ELSIF v_roll < 80 THEN v_success := TRUE; v_result_boom := 'Rare Box'; v_message := 'Fusion successful! You received a ' || v_result_boom;
        ELSE v_success := TRUE; v_result_boom := 'Epic Box'; v_message := 'CRITICAL SUCCESS! You upgraded to an ' || v_result_boom;
        END IF;
    ELSIF p_boom1 = 'Epic Box' OR p_boom2 = 'Epic Box' THEN
        IF v_roll < 50 THEN v_success := FALSE; v_message := 'The fusion failed! Epic power is hard to contain.';
        ELSIF v_roll < 90 THEN v_success := TRUE; v_result_boom := 'Epic Box'; v_message := 'Fusion successful! You received an ' || v_result_boom;
        ELSE v_success := TRUE; v_result_boom := 'King Box'; v_message := 'ULTIMATE SUCCESS! You upgraded to a ' || v_result_boom;
        END IF;
    ELSE
        -- Generic fallback
        IF v_roll < 50 THEN v_success := FALSE; v_message := 'The fusion failed.';
        ELSE v_success := TRUE; v_result_boom := p_boom1; v_message := 'Fusion successful! You received your item back.';
        END IF;
    END IF;

    -- 4. Add result if success
    IF v_success AND v_result_boom IS NOT NULL THEN
        v_user_booms := jsonb_set(
            COALESCE(v_user_booms, '{}'::jsonb), 
            ARRAY[v_result_boom], 
            to_jsonb(COALESCE((v_user_booms->>v_result_boom)::INTEGER, 0) + 1)
        );
    END IF;

    UPDATE public.users SET booms = v_user_booms WHERE username = p_username;

    -- 5. Log activity
    PERFORM log_user_activity(p_username, 'fusion', v_message, jsonb_build_object('boom1', p_boom1, 'boom2', p_boom2, 'success', v_success, 'result', v_result_boom));

    RETURN jsonb_build_object('success', v_success, 'message', v_message, 'result_boom', v_result_boom);
END;
$$;
