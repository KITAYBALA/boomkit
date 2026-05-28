-- Migration: Fix Fusion Lab to support actual in-game Booms and upgrade paths

-- 1. Helper function: Get Boom Rarity based on Name
CREATE OR REPLACE FUNCTION public.get_boom_rarity(p_boom_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_boom_name IN ('DeepSeek', 'Butterfly', 'Parrot', 'Alien', 'Castle', 'Elephant') THEN
    RETURN 'uncommon';
  ELSIF p_boom_name IN ('Microsoft Copilot', 'Bee', 'Treasure Chest', 'Planet', 'Dragon', 'Giraffe') THEN
    RETURN 'rare';
  ELSIF p_boom_name IN ('Claude', 'Spider', 'Ghost Ship', 'Black Hole', 'Wizard', 'Rhino') THEN
    RETURN 'epic';
  ELSIF p_boom_name IN ('ChatGPT', 'Golden Beetle', 'Kraken', 'Galaxy', 'Crown Jewels', 'White Tiger') THEN
    RETURN 'legendary';
  ELSIF p_boom_name IN ('Vercel', 'Rainbow Dragonfly', 'Golden Compass', 'Cosmic Dragon', 'Excalibur', 'Golden Leopard') THEN
    RETURN 'chroma';
  ELSIF p_boom_name IN ('Google Gemini', 'Cosmic Mantis', 'Davy Jones', 'Universe Core', 'Merlin''s Staff', 'Spirit Lion') THEN
    RETURN 'mystical';
  ELSE
    RETURN 'uncommon'; -- fallback
  END IF;
END;
$$;


-- 2. Helper function: Get next tier rarity
CREATE OR REPLACE FUNCTION public.get_next_rarity(p_rarity TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_rarity = 'uncommon' THEN RETURN 'rare';
  ELSIF p_rarity = 'rare' THEN RETURN 'epic';
  ELSIF p_rarity = 'epic' THEN RETURN 'legendary';
  ELSIF p_rarity = 'legendary' THEN RETURN 'chroma';
  ELSIF p_rarity = 'chroma' THEN RETURN 'mystical';
  ELSE RETURN 'mystical';
  END IF;
END;
$$;


-- 3. Helper function: Get a random Boom from a specific rarity tier
CREATE OR REPLACE FUNCTION public.get_random_boom_by_rarity(p_rarity TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_booms TEXT[];
BEGIN
  IF p_rarity = 'uncommon' THEN
    v_booms := ARRAY['DeepSeek', 'Butterfly', 'Parrot', 'Alien', 'Castle', 'Elephant'];
  ELSIF p_rarity = 'rare' THEN
    v_booms := ARRAY['Microsoft Copilot', 'Bee', 'Treasure Chest', 'Planet', 'Dragon', 'Giraffe'];
  ELSIF p_rarity = 'epic' THEN
    v_booms := ARRAY['Claude', 'Spider', 'Ghost Ship', 'Black Hole', 'Wizard', 'Rhino'];
  ELSIF p_rarity = 'legendary' THEN
    v_booms := ARRAY['ChatGPT', 'Golden Beetle', 'Kraken', 'Galaxy', 'Crown Jewels', 'White Tiger'];
  ELSIF p_rarity = 'chroma' THEN
    v_booms := ARRAY['Vercel', 'Rainbow Dragonfly', 'Golden Compass', 'Cosmic Dragon', 'Excalibur', 'Golden Leopard'];
  ELSIF p_rarity = 'mystical' THEN
    v_booms := ARRAY['Google Gemini', 'Cosmic Mantis', 'Davy Jones', 'Universe Core', 'Merlin''s Staff', 'Spirit Lion'];
  ELSE
    v_booms := ARRAY['DeepSeek', 'Butterfly', 'Parrot', 'Alien', 'Castle', 'Elephant']; -- fallback
  END IF;

  RETURN v_booms[floor(random() * array_length(v_booms, 1)) + 1];
END;
$$;


-- 4. Redefine fuse_booms function to use actual rarities and roll rules
DROP FUNCTION IF EXISTS public.fuse_booms(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.fuse_booms(p_username TEXT, p_boom1 TEXT, p_boom2 TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_booms JSONB;
    v_boom1_count INTEGER;
    v_boom2_count INTEGER;
    v_rarity1 TEXT;
    v_rarity2 TEXT;
    v_base_rarity TEXT;
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

    -- 3. Determine base rarity
    v_rarity1 := public.get_boom_rarity(p_boom1);
    v_rarity2 := public.get_boom_rarity(p_boom2);
    
    -- If same rarity, use it. If different, use the lower of the two.
    IF v_rarity1 = v_rarity2 THEN
      v_base_rarity := v_rarity1;
    ELSE
      -- Determine lower rarity
      IF v_rarity1 = 'uncommon' OR v_rarity2 = 'uncommon' THEN v_base_rarity := 'uncommon';
      ELSIF v_rarity1 = 'rare' OR v_rarity2 = 'rare' THEN v_base_rarity := 'rare';
      ELSIF v_rarity1 = 'epic' OR v_rarity2 = 'epic' THEN v_base_rarity := 'epic';
      ELSIF v_rarity1 = 'legendary' OR v_rarity2 = 'legendary' THEN v_base_rarity := 'legendary';
      ELSIF v_rarity1 = 'chroma' OR v_rarity2 = 'chroma' THEN v_base_rarity := 'chroma';
      ELSE v_base_rarity := 'mystical';
      END IF;
    END IF;

    -- 4. Fusion Logic Roll
    v_roll := floor(random() * 100);

    -- 30% chance of failure (lose both items)
    IF v_roll < 30 THEN
      v_success := FALSE;
      v_message := 'The fusion failed! You lost both materials.';
    -- 50% chance of success (random item of the SAME rarity)
    ELSIF v_roll < 80 THEN
      v_success := TRUE;
      v_result_rarity := v_base_rarity;
      v_result_boom := public.get_random_boom_by_rarity(v_result_rarity);
      v_message := 'Fusion successful! You received a ' || v_result_boom || ' (' || INITCAP(v_result_rarity) || ')';
    -- 20% chance of critical success (random item of the NEXT higher rarity)
    ELSE
      v_success := TRUE;
      v_result_rarity := public.get_next_rarity(v_base_rarity);
      v_result_boom := public.get_random_boom_by_rarity(v_result_rarity);
      v_message := 'CRITICAL SUCCESS! You upgraded to a ' || v_result_boom || ' (' || INITCAP(v_result_rarity) || ')! 🎉';
    END IF;

    -- 5. Add result if success
    IF v_success AND v_result_boom IS NOT NULL THEN
        v_user_booms := jsonb_set(
            COALESCE(v_user_booms, '{}'::jsonb), 
            ARRAY[v_result_boom], 
            to_jsonb(COALESCE((v_user_booms->>v_result_boom)::INTEGER, 0) + 1)
        );
    END IF;

    UPDATE public.users SET booms = v_user_booms WHERE username = p_username;

    -- 6. Log activity
    PERFORM log_user_activity(
      p_username, 
      'fusion', 
      v_message, 
      jsonb_build_object('boom1', p_boom1, 'boom2', p_boom2, 'success', v_success, 'result', v_result_boom)
    );

    RETURN jsonb_build_object('success', v_success, 'message', v_message, 'result_boom', v_result_boom);
END;
$$;
