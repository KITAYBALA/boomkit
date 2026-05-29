-- Migration: 018_fusion_cooldown_and_rarity_fix.sql
-- Description: Adds fusion state columns to public.users, updates rarity helper functions to list all in-game booms, and migrates fusion logic from instant to a time-based queue and claimed reward system with exponential cooldown.

-- 1. Add Fusion State Columns to public.users Table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fusion_cooldown_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS consecutive_fusions INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_fusion_claim_time TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS active_fusion_boom1 TEXT DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS active_fusion_boom2 TEXT DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS active_fusion_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS active_fusion_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Update Helper Function: Get Boom Rarity based on Name
CREATE OR REPLACE FUNCTION public.get_boom_rarity(p_boom_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_boom_name IN (
    'DeepSeek', 'Butterfly', 'Parrot', 'Alien', 'Castle', 'Elephant', 
    'Dolphin', 'Bacon', 'Triceratops', 'Drone', 'Cheshire Cat', 'Koala', 'Polar Bear'
  ) THEN
    RETURN 'uncommon';
  ELSIF p_boom_name IN (
    'Microsoft Copilot', 'Bee', 'Treasure Chest', 'Planet', 'Dragon', 'Giraffe', 
    'Octopus', 'Waffle', 'Pterodactyl', 'Cyborg', 'White Rabbit', 'Crocodile', 'Seal'
  ) THEN
    RETURN 'rare';
  ELSIF p_boom_name IN (
    'Claude', 'Spider', 'Ghost Ship', 'Black Hole', 'Wizard', 'Rhino', 
    'Whale', 'French Toast', 'Stegosaurus', 'AI Core', 'Queen of Hearts', 'Dingo', 'Yeti'
  ) THEN
    RETURN 'epic';
  ELSIF p_boom_name IN (
    'ChatGPT', 'Golden Beetle', 'Kraken', 'Galaxy', 'Crown Jewels', 'White Tiger', 
    'Mermaid', 'Golden Egg', 'Fossil', 'Quantum Computer', 'Magic Mushroom', 'Opal', 'Ice Crystal'
  ) THEN
    RETURN 'legendary';
  ELSIF p_boom_name IN (
    'Vercel', 'Rainbow Dragonfly', 'Golden Compass', 'Cosmic Dragon', 'Excalibur', 'Golden Leopard', 
    'Poseidon''s Trident', 'Rainbow Cereal', 'Meteor', 'Digital Soul', 'Looking Glass', 'Dreamtime Spirit', 'Aurora Borealis'
  ) THEN
    RETURN 'chroma';
  ELSIF p_boom_name IN (
    'Google Gemini', 'Cosmic Mantis', 'Davy Jones', 'Universe Core', 'Merlin''s Staff', 'Spirit Lion', 
    'Leviathan', 'Ambrosia', 'Primordial Beast', 'Singularity', 'Jabberwocky', 'Rainbow Serpent', 'Frost Titan', 
    'Void Dragon', 'Infinity Gauntlet', 'Cosmic Phoenix', 'God Eye', 'The Trophy'
  ) THEN
    RETURN 'mystical';
  ELSE
    RETURN 'uncommon'; -- fallback
  END IF;
END;
$$;

-- 3. Update Helper Function: Get a random Boom from a specific rarity tier
CREATE OR REPLACE FUNCTION public.get_random_boom_by_rarity(p_rarity TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_booms TEXT[];
BEGIN
  IF p_rarity = 'uncommon' THEN
    v_booms := ARRAY[
      'DeepSeek', 'Butterfly', 'Parrot', 'Alien', 'Castle', 'Elephant', 
      'Dolphin', 'Bacon', 'Triceratops', 'Drone', 'Cheshire Cat', 'Koala', 'Polar Bear'
    ];
  ELSIF p_rarity = 'rare' THEN
    v_booms := ARRAY[
      'Microsoft Copilot', 'Bee', 'Treasure Chest', 'Planet', 'Dragon', 'Giraffe', 
      'Octopus', 'Waffle', 'Pterodactyl', 'Cyborg', 'White Rabbit', 'Crocodile', 'Seal'
    ];
  ELSIF p_rarity = 'epic' THEN
    v_booms := ARRAY[
      'Claude', 'Spider', 'Ghost Ship', 'Black Hole', 'Wizard', 'Rhino', 
      'Whale', 'French Toast', 'Stegosaurus', 'AI Core', 'Queen of Hearts', 'Dingo', 'Yeti'
    ];
  ELSIF p_rarity = 'legendary' THEN
    v_booms := ARRAY[
      'ChatGPT', 'Golden Beetle', 'Kraken', 'Galaxy', 'Crown Jewels', 'White Tiger', 
      'Mermaid', 'Golden Egg', 'Fossil', 'Quantum Computer', 'Magic Mushroom', 'Opal', 'Ice Crystal'
    ];
  ELSIF p_rarity = 'chroma' THEN
    v_booms := ARRAY[
      'Vercel', 'Rainbow Dragonfly', 'Golden Compass', 'Cosmic Dragon', 'Excalibur', 'Golden Leopard', 
      'Poseidon''s Trident', 'Rainbow Cereal', 'Meteor', 'Digital Soul', 'Looking Glass', 'Dreamtime Spirit', 'Aurora Borealis'
    ];
  ELSIF p_rarity = 'mystical' THEN
    -- Include limited and trophy ones too for mystical fusion reward pool
    v_booms := ARRAY[
      'Google Gemini', 'Cosmic Mantis', 'Davy Jones', 'Universe Core', 'Merlin''s Staff', 'Spirit Lion', 
      'Leviathan', 'Ambrosia', 'Primordial Beast', 'Singularity', 'Jabberwocky', 'Rainbow Serpent', 'Frost Titan', 
      'Void Dragon', 'Infinity Gauntlet', 'Cosmic Phoenix', 'God Eye', 'The Trophy'
    ];
  ELSE
    v_booms := ARRAY['DeepSeek', 'Butterfly', 'Parrot', 'Alien', 'Castle', 'Elephant']; -- fallback
  END IF;

  RETURN v_booms[floor(random() * array_length(v_booms, 1)) + 1];
END;
$$;

-- 4. Redefine fuse_booms function to START the fusion queue (deducts items, sets ends_at)
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
    v_cooldown_ends TIMESTAMP WITH TIME ZONE;
    v_active_ends TIMESTAMP WITH TIME ZONE;
    v_rarity1 TEXT;
    v_rarity2 TEXT;
    v_highest_rarity TEXT;
    v_duration_seconds INTEGER;
BEGIN
    -- 1. Fetch user data with lock
    SELECT booms, fusion_cooldown_ends_at, active_fusion_ends_at 
    INTO v_user_booms, v_cooldown_ends, v_active_ends 
    FROM public.users WHERE username = p_username FOR UPDATE;
    
    -- 2. Verify cooldown
    IF v_cooldown_ends IS NOT NULL AND NOW() < v_cooldown_ends THEN
      RAISE EXCEPTION 'Fusion Lab is on cooldown. Please wait until %.', v_cooldown_ends;
    END IF;

    -- 3. Verify no active fusion process
    IF v_active_ends IS NOT NULL THEN
      RAISE EXCEPTION 'You already have a fusion in progress.';
    END IF;

    -- 4. Verify boom ownership
    v_boom1_count := COALESCE((v_user_booms->>p_boom1)::INTEGER, 0);
    v_boom2_count := COALESCE((v_user_booms->>p_boom2)::INTEGER, 0);

    IF p_boom1 = p_boom2 THEN
        IF v_boom1_count < 2 THEN RAISE EXCEPTION 'Insufficient booms to fuse.'; END IF;
    ELSE
        IF v_boom1_count < 1 OR v_boom2_count < 1 THEN RAISE EXCEPTION 'Insufficient booms to fuse.'; END IF;
    END IF;

    -- 5. Deduct inputs immediately
    v_user_booms := jsonb_set(v_user_booms, ARRAY[p_boom1], to_jsonb(GREATEST(0, (v_user_booms->>p_boom1)::INTEGER - 1)));
    IF (v_user_booms->>p_boom1)::INTEGER <= 0 THEN v_user_booms := v_user_booms - p_boom1; END IF;
    
    -- Re-fetch count for boom2 in case it was the same as boom1 and modified
    v_boom2_count := COALESCE((v_user_booms->>p_boom2)::INTEGER, 0);
    v_user_booms := jsonb_set(v_user_booms, ARRAY[p_boom2], to_jsonb(GREATEST(0, v_boom2_count - 1)));
    IF (v_user_booms->>p_boom2)::INTEGER <= 0 THEN v_user_booms := v_user_booms - p_boom2; END IF;

    -- 6. Determine highest rarity and duration
    v_rarity1 := public.get_boom_rarity(p_boom1);
    v_rarity2 := public.get_boom_rarity(p_boom2);

    -- Sort rarities: uncommon (lowest) to mystical (highest)
    IF v_rarity1 = 'mystical' OR v_rarity2 = 'mystical' THEN v_highest_rarity := 'mystical';
    ELSIF v_rarity1 = 'chroma' OR v_rarity2 = 'chroma' THEN v_highest_rarity := 'chroma';
    ELSIF v_rarity1 = 'legendary' OR v_rarity2 = 'legendary' THEN v_highest_rarity := 'legendary';
    ELSIF v_rarity1 = 'epic' OR v_rarity2 = 'epic' THEN v_highest_rarity := 'epic';
    ELSIF v_rarity1 = 'rare' OR v_rarity2 = 'rare' THEN v_highest_rarity := 'rare';
    ELSE v_highest_rarity := 'uncommon';
    END IF;

    -- Rarity duration mapping:
    -- uncommon: 10 seconds
    -- rare: 30 seconds
    -- epic: 1 minute (60 seconds)
    -- legendary: 10 minutes (600 seconds)
    -- chroma: 30 minutes (1800 seconds)
    -- mystical: 1 hour (3600 seconds)
    IF v_highest_rarity = 'mystical' THEN v_duration_seconds := 3600;
    ELSIF v_highest_rarity = 'chroma' THEN v_duration_seconds := 1800;
    ELSIF v_highest_rarity = 'legendary' THEN v_duration_seconds := 600;
    ELSIF v_highest_rarity = 'epic' THEN v_duration_seconds := 60;
    ELSIF v_highest_rarity = 'rare' THEN v_duration_seconds := 30;
    ELSE v_duration_seconds := 10;
    END IF;

    -- 7. Update user's inventory and active fusion state
    UPDATE public.users 
    SET booms = v_user_booms,
        active_fusion_boom1 = p_boom1,
        active_fusion_boom2 = p_boom2,
        active_fusion_started_at = NOW(),
        active_fusion_ends_at = NOW() + (v_duration_seconds * INTERVAL '1 second')
    WHERE username = p_username;

    -- Log activity
    PERFORM log_user_activity(
      p_username, 
      'fusion_start', 
      'Started fusing ' || p_boom1 || ' and ' || p_boom2 || '. Estimated wait time: ' || (v_duration_seconds || ' seconds.'), 
      jsonb_build_object('boom1', p_boom1, 'boom2', p_boom2, 'duration_seconds', v_duration_seconds)
    );

    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Fusion process started! It will take ' || v_duration_seconds || ' seconds.',
      'ends_at', NOW() + (v_duration_seconds * INTERVAL '1 second')
    );
END;
$$;

-- 5. Create claim_fusion_result function to complete the fusion and start cooldown
CREATE OR REPLACE FUNCTION public.claim_fusion_result(p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_booms JSONB;
    v_boom1 TEXT;
    v_boom2 TEXT;
    v_active_ends TIMESTAMP WITH TIME ZONE;
    v_last_claim TIMESTAMP WITH TIME ZONE;
    v_consecutive INTEGER;
    v_rarity1 TEXT;
    v_rarity2 TEXT;
    v_base_rarity TEXT;
    v_result_rarity TEXT;
    v_result_boom TEXT;
    v_roll INTEGER;
    v_success BOOLEAN := FALSE;
    v_message TEXT;
    v_cooldown_minutes INTEGER;
    v_cooldown_ends TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 1. Fetch user data with lock
    SELECT booms, active_fusion_boom1, active_fusion_boom2, active_fusion_ends_at, last_fusion_claim_time, consecutive_fusions
    INTO v_user_booms, v_boom1, v_boom2, v_active_ends, v_last_claim, v_consecutive
    FROM public.users WHERE username = p_username FOR UPDATE;

    -- 2. Verify active fusion exists and is complete
    IF v_boom1 IS NULL OR v_active_ends IS NULL THEN
      RAISE EXCEPTION 'No active fusion to claim.';
    END IF;

    IF NOW() < v_active_ends THEN
      RAISE EXCEPTION 'Fusion is still in progress. Please wait.';
    END IF;

    -- 3. Determine base rarity (If same rarity, use it. If different, use the lower of the two)
    v_rarity1 := public.get_boom_rarity(v_boom1);
    v_rarity2 := public.get_boom_rarity(v_boom2);
    
    IF v_rarity1 = v_rarity2 THEN
      v_base_rarity := v_rarity1;
    ELSE
      IF v_rarity1 = 'uncommon' OR v_rarity2 = 'uncommon' THEN v_base_rarity := 'uncommon';
      ELSIF v_rarity1 = 'rare' OR v_rarity2 = 'rare' THEN v_base_rarity := 'rare';
      ELSIF v_rarity1 = 'epic' OR v_rarity2 = 'epic' THEN v_base_rarity := 'epic';
      ELSIF v_rarity1 = 'legendary' OR v_rarity2 = 'legendary' THEN v_base_rarity := 'legendary';
      ELSIF v_rarity1 = 'chroma' OR v_rarity2 = 'chroma' THEN v_base_rarity := 'chroma';
      ELSE v_base_rarity := 'mystical';
      END IF;
    END IF;

    -- 4. Fusion Probability Roll
    v_roll := floor(random() * 100);

    -- 30% chance of failure (lose both items)
    IF v_roll < 30 THEN
      v_success := FALSE;
      v_message := 'The fusion failed! Both materials disintegrated.';
    -- 50% chance of success (random item of the SAME rarity)
    ELSIF v_roll < 80 THEN
      v_success := TRUE;
      v_result_rarity := v_base_rarity;
      v_result_boom := public.get_random_boom_by_rarity(v_result_rarity);
      v_message := 'Fusion successful! You received a ' || v_result_boom || ' (' || INITCAP(v_result_rarity) || ')';
    -- 20% chance of critical success (random item of the NEXT higher rarity)
    ELSE
      v_success := TRUE;
      -- Get next rarity helper inline logic
      IF v_base_rarity = 'uncommon' THEN v_result_rarity := 'rare';
      ELSIF v_base_rarity = 'rare' THEN v_result_rarity := 'epic';
      ELSIF v_base_rarity = 'epic' THEN v_result_rarity := 'legendary';
      ELSIF v_base_rarity = 'legendary' THEN v_result_rarity := 'chroma';
      ELSE v_result_rarity := 'mystical';
      END IF;

      v_result_boom := public.get_random_boom_by_rarity(v_result_rarity);
      v_message := 'CRITICAL SUCCESS! You upgraded to a ' || v_result_boom || ' (' || INITCAP(v_result_rarity) || ')! 🎉';
    END IF;

    -- 5. Add result to user booms if success
    IF v_success AND v_result_boom IS NOT NULL THEN
        v_user_booms := jsonb_set(
            COALESCE(v_user_booms, '{}'::jsonb), 
            ARRAY[v_result_boom], 
            to_jsonb(COALESCE((v_user_booms->>v_result_boom)::INTEGER, 0) + 1)
        );
    END IF;

    -- 6. Calculate cooldown logic with consecutive multiplier
    -- If they have not claimed a fusion in over 24 hours (or it's their first time), reset consecutive count to 0.
    IF v_last_claim IS NULL OR NOW() - v_last_claim > INTERVAL '24 hours' THEN
      v_consecutive := 0;
    END IF;

    -- Cooldown starts at 5 minutes, then doubles: 5, 10, 20, 40, 80...
    -- Formula: 5 * (2 ^ v_consecutive) minutes
    v_cooldown_minutes := 5 * power(2, v_consecutive);
    v_cooldown_ends := NOW() + (v_cooldown_minutes * INTERVAL '1 minute');

    -- Update database user profile
    UPDATE public.users 
    SET booms = v_user_booms,
        fusion_cooldown_ends_at = v_cooldown_ends,
        consecutive_fusions = v_consecutive + 1,
        last_fusion_claim_time = NOW(),
        active_fusion_boom1 = NULL,
        active_fusion_boom2 = NULL,
        active_fusion_ends_at = NULL,
        active_fusion_started_at = NULL
    WHERE username = p_username;

    -- 7. Log activity
    PERFORM log_user_activity(
      p_username, 
      'fusion', 
      v_message, 
      jsonb_build_object(
        'boom1', v_boom1, 
        'boom2', v_boom2, 
        'success', v_success, 
        'result', v_result_boom, 
        'cooldown_minutes', v_cooldown_minutes
      )
    );

    RETURN jsonb_build_object(
      'success', v_success, 
      'message', v_message, 
      'result_boom', v_result_boom,
      'cooldown_ends_at', v_cooldown_ends,
      'consecutive_count', v_consecutive + 1
    );
END;
$$;
