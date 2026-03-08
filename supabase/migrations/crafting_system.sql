-- 1. Create the craft_recipes table
CREATE TABLE IF NOT EXISTS public.craft_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    output_boom TEXT NOT NULL,
    inputs JSONB NOT NULL, -- e.g. {"Basic Box": 3, "Rare Box": 1}
    token_cost NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add some default recipes
INSERT INTO public.craft_recipes (output_boom, inputs, token_cost) VALUES
('The Trophy', '{"Gold Bar": 2, "Diamond": 1}'::jsonb, 5000),
('Crown', '{"King Box": 3}'::jsonb, 10000),
('Rocket', '{"Firework": 5, "Dynamite": 2}'::jsonb, 2500)
ON CONFLICT DO NOTHING;

-- 3. Set up RLS for craft_recipes
ALTER TABLE public.craft_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view craft recipes" 
ON public.craft_recipes FOR SELECT 
USING (true);

CREATE POLICY "Only owners/admins can modify craft recipes" 
ON public.craft_recipes FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()::text 
    AND role IN ('owner', 'admin')
  )
);

-- 4. Create the RPC for crafting a boom
DROP FUNCTION IF EXISTS public.craft_boom(TEXT, UUID);
CREATE OR REPLACE FUNCTION craft_boom(
    p_player_username TEXT,
    p_recipe_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_recipe RECORD;
    v_player_tokens NUMERIC;
    v_player_booms JSONB;
    v_input_key TEXT;
    v_input_qty NUMERIC;
    v_player_qty NUMERIC;
BEGIN
    -- 1. Get the recipe
    SELECT * INTO v_recipe FROM public.craft_recipes WHERE id = p_recipe_id;
    IF v_recipe IS NULL THEN
        RAISE EXCEPTION 'Recipe not found.';
    END IF;

    -- 2. Get the player
    SELECT tokens, booms INTO v_player_tokens, v_player_booms 
    FROM public.users WHERE username = p_player_username FOR UPDATE;

    IF v_player_tokens IS NULL THEN
        RAISE EXCEPTION 'Player not found.';
    END IF;

    -- 3. Check token cost
    IF v_player_tokens < v_recipe.token_cost THEN
        RAISE EXCEPTION 'Not enough tokens to craft this item.';
    END IF;

    -- 4. Check input booms
    FOR v_input_key, v_input_qty IN SELECT * FROM jsonb_each_text(v_recipe.inputs) LOOP
        v_player_qty := COALESCE((v_player_booms->>v_input_key)::NUMERIC, 0);
        IF v_player_qty < v_input_qty::NUMERIC THEN
            RAISE EXCEPTION 'Missing required materials: % x%', v_input_qty, v_input_key;
        END IF;
    END LOOP;

    -- 5. Deduct tokens and materials
    UPDATE public.users SET tokens = tokens - v_recipe.token_cost WHERE username = p_player_username;
    
    FOR v_input_key, v_input_qty IN SELECT * FROM jsonb_each_text(v_recipe.inputs) LOOP
        v_player_qty := COALESCE((v_player_booms->>v_input_key)::NUMERIC, 0);
        IF v_player_qty = v_input_qty::NUMERIC THEN
            v_player_booms := v_player_booms - v_input_key;
        ELSE
            v_player_booms := jsonb_set(v_player_booms, ARRAY[v_input_key], to_jsonb(v_player_qty - v_input_qty::NUMERIC));
        END IF;
    END LOOP;

    -- 6. Add the output boom
    v_player_booms := jsonb_set(
        v_player_booms, 
        ARRAY[v_recipe.output_boom], 
        to_jsonb(COALESCE((v_player_booms->>v_recipe.output_boom)::NUMERIC, 0) + 1)
    );

    UPDATE public.users SET booms = v_player_booms WHERE username = p_player_username;

    -- 7. Log activity
    PERFORM log_user_activity(
        p_player_username, 
        'craft', 
        'Crafted ' || v_recipe.output_boom, 
        jsonb_build_object('output', v_recipe.output_boom, 'recipe_id', p_recipe_id)
    );

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Successfully crafted ' || v_recipe.output_boom || '!'
    );
END;
$$;
