-- ============================================
-- ACHIEVEMENTS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    requirement_type TEXT NOT NULL, -- 'games_played', 'tokens_earned', 'booms_collected'
    requirement_value INTEGER NOT NULL,
    reward_tokens NUMERIC DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(username, achievement_id)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view user achievements" ON public.user_achievements;
CREATE POLICY "Anyone can view user achievements" ON public.user_achievements FOR SELECT USING (true);

-- Insert some default achievements
INSERT INTO public.achievements (name, description, icon, requirement_type, requirement_value, reward_tokens) VALUES
('Beginner Boomist', 'Play your first game!', '🎮', 'games_played', 1, 500),
('Token Collector', 'Earn 10,000 tokens total!', '💰', 'tokens_earned', 10000, 1000),
('Market Mogul', 'Earn 50,000 tokens total!', '🏛️', 'tokens_earned', 50000, 5000),
('Boom Veteran', 'Play 50 games!', '🎖️', 'games_played', 50, 5000),
('Vault Master', 'Collect 20 unique Booms!', '📂', 'booms_collected', 20, 10000),
('Socialite', 'Add 5 friends!', '🤝', 'friends_count', 5, 2000),
('World Traveler', 'Play 100 games!', '🌎', 'games_played', 100, 10000),
('Evolutionist', 'Evolve 1 Boom!', '🧬', 'evolved_count', 1, 3000),
('Master Crafter', 'Craft 5 items!', '🛠️', 'crafted_count', 5, 4000),
('Rental Landlord', 'Rent out a boom 1 time!', '🏠', 'rentals_count', 1, 1500),
('Auction King', 'Win your first auction!', '🔨', 'auctions_won', 1, 2000),
('Legendary Status', 'Reach Level 100!', '👑', 'level', 100, 50000),
('Rich Student', 'Hold 1,000,000 tokens at once!', '🏦', 'tokens_held', 1000000, 25000),
('Boom Chemist', 'Fuse 10 Booms in the Lab!', '🧪', 'fusions_performed', 10, 5000),
('Wall Street', 'Make 50 trades in the Marketplace!', '📈', 'market_trades', 50, 7500),
('Unstoppable', 'Get a 30-day login streak!', '🔥', 'login_streak', 30, 20000)
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    requirement_type = EXCLUDED.requirement_type,
    requirement_value = EXCLUDED.requirement_value,
    reward_tokens = EXCLUDED.reward_tokens;

-- ============================================
-- BOOM EVOLUTION (Phase 6)
-- ============================================

-- Track individual boom progression
-- We use a separate table for evolved booms because the main 'booms' column is just a count JSON
CREATE TABLE IF NOT EXISTS public.user_boom_evolution (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL,
    boom_name TEXT NOT NULL,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    is_fully_evolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(username, boom_name)
);

ALTER TABLE public.user_boom_evolution ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view boom evolution" ON public.user_boom_evolution;
CREATE POLICY "Anyone can view boom evolution" ON public.user_boom_evolution FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own boom evolution" ON public.user_boom_evolution;
CREATE POLICY "Users can update their own boom evolution" ON public.user_boom_evolution FOR UPDATE USING (username = auth.uid()::text);

-- ============================================
-- SEASON PASS
-- ============================================

-- Add season columns to users
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='season_xp') THEN
        ALTER TABLE public.users ADD COLUMN season_xp INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='has_plus_pass') THEN
        ALTER TABLE public.users ADD COLUMN has_plus_pass BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='games_played') THEN
        ALTER TABLE public.users ADD COLUMN games_played INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='total_tokens_earned') THEN
        ALTER TABLE public.users ADD COLUMN total_tokens_earned NUMERIC DEFAULT 0;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.seasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.season_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
    tier INTEGER NOT NULL,
    xp_required INTEGER NOT NULL,
    reward_type TEXT NOT NULL, -- 'tokens', 'boom', 'plus_days'
    reward_value TEXT NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    UNIQUE(season_id, tier, is_premium)
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view seasons" ON public.seasons;
CREATE POLICY "Anyone can view seasons" ON public.seasons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view rewards" ON public.season_rewards;
CREATE POLICY "Anyone can view rewards" ON public.season_rewards FOR SELECT USING (true);

-- Insert a default season
INSERT INTO public.seasons (name, start_date, end_date) 
VALUES ('Season 1: Boom Genesis', NOW(), NOW() + INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- Insert some rewards for Season 1
DO $$
DECLARE
    v_season_id UUID;
BEGIN
    SELECT id INTO v_season_id FROM public.seasons WHERE name = 'Season 1: Boom Genesis' LIMIT 1;
    
    INSERT INTO public.season_rewards (season_id, tier, xp_required, reward_type, reward_value, is_premium) VALUES
    (v_season_id, 1, 100, 'tokens', '1000', FALSE),
    (v_season_id, 1, 100, 'tokens', '5000', TRUE),
    (v_season_id, 2, 250, 'boom', 'Rare Box', FALSE),
    (v_season_id, 2, 250, 'boom', 'Epic Box', TRUE),
    (v_season_id, 3, 500, 'tokens', '2500', FALSE),
    (v_season_id, 3, 500, 'plus_days', '7', TRUE)
    ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- FIXED-PRICE SHOP
-- ============================================

CREATE TABLE IF NOT EXISTS public.shop_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    boom_name TEXT NOT NULL UNIQUE,
    token_cost NUMERIC NOT NULL,
    stock INTEGER DEFAULT -1, -- -1 for infinite
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view shop items" ON public.shop_items;
CREATE POLICY "Anyone can view shop items" ON public.shop_items FOR SELECT USING (true);

INSERT INTO public.shop_items (boom_name, token_cost, stock) VALUES
('Basic Box', 500, -1),
('Rare Box', 2500, 100),
('Epic Box', 10000, 50),
('King Box', 25000, 10)
ON CONFLICT (boom_name) DO UPDATE SET 
    token_cost = EXCLUDED.token_cost,
    stock = EXCLUDED.stock;

-- ============================================
-- RPCs
-- ============================================

-- Check and award achievements
DROP FUNCTION IF EXISTS public.check_achievements(TEXT, TEXT, INTEGER);
CREATE OR REPLACE FUNCTION check_achievements(p_username TEXT, p_type TEXT, p_value INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ach RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_ach IN 
        SELECT * FROM public.achievements 
        WHERE requirement_type = p_type AND requirement_value <= p_value
        AND id NOT IN (SELECT achievement_id FROM public.user_achievements WHERE username = p_username)
    LOOP
        INSERT INTO public.user_achievements (username, achievement_id) VALUES (p_username, v_ach.id);
        UPDATE public.users SET tokens = tokens + v_ach.reward_tokens WHERE username = p_username;
        v_count := v_count + 1;
        
        PERFORM log_user_activity(
            p_username, 
            'achievement', 
            'Earned achievement: ' || v_ach.name, 
            jsonb_build_object('achievement_id', v_ach.id, 'reward', v_ach.reward_tokens)
        );
    END LOOP;

    RETURN jsonb_build_object('success', true, 'awarded_count', v_count);
END;
$$;

-- Buy item from shop
DROP FUNCTION IF EXISTS public.buy_shop_item(TEXT, UUID);
CREATE OR REPLACE FUNCTION buy_shop_item(p_username TEXT, p_item_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_tokens NUMERIC;
BEGIN
    SELECT * INTO v_item FROM public.shop_items WHERE id = p_item_id AND is_active = TRUE FOR UPDATE;
    IF v_item IS NULL THEN RAISE EXCEPTION 'Item not found.'; END IF;
    IF v_item.stock = 0 THEN RAISE EXCEPTION 'Item out of stock.'; END IF;

    SELECT tokens INTO v_tokens FROM public.users WHERE username = p_username FOR UPDATE;
    IF v_tokens < v_item.token_cost THEN RAISE EXCEPTION 'Not enough tokens.'; END IF;

    -- Deduct tokens
    UPDATE public.users SET tokens = tokens - v_item.token_cost WHERE username = p_username;
    
    -- Add boom
    UPDATE public.users 
    SET booms = jsonb_set(
        COALESCE(booms, '{}'::jsonb),
        ARRAY[v_item.boom_name],
        to_jsonb(COALESCE((booms->>v_item.boom_name)::NUMERIC, 0) + 1)
    )
    WHERE username = p_username;

    -- Update stock
    IF v_item.stock > 0 THEN
        UPDATE public.shop_items SET stock = stock - 1 WHERE id = p_item_id;
    END IF;

    -- Log activity
    PERFORM log_user_activity(
        p_username, 
        'shop_purchase', 
        'Bought ' || v_item.boom_name || ' from shop', 
        jsonb_build_object('boom', v_item.boom_name, 'cost', v_item.token_cost)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Purchased ' || v_item.boom_name || '!');
END;
$$;

-- Claim season reward
DROP FUNCTION IF EXISTS public.claim_season_reward(TEXT, UUID);
CREATE OR REPLACE FUNCTION claim_season_reward(p_username TEXT, p_reward_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reward RECORD;
    v_user RECORD;
BEGIN
    SELECT * INTO v_reward FROM public.season_rewards WHERE id = p_reward_id;
    SELECT * INTO v_user FROM public.users WHERE username = p_username FOR UPDATE;

    IF v_user.season_xp < v_reward.xp_required THEN RAISE EXCEPTION 'Insufficient XP for this tier.'; END IF;
    IF v_reward.is_premium AND NOT v_user.has_plus_pass THEN RAISE EXCEPTION 'Premium pass required.'; END IF;

    -- Track claimed in a new table (simple check for now)
    -- In a real app, you'd want a user_claims table. Let's add it for robustness.
    IF EXISTS (SELECT 1 FROM public.user_activity WHERE username = p_username AND activity_type = 'season_claim' AND (details->>'reward_id')::UUID = p_reward_id) THEN
        RAISE EXCEPTION 'Reward already claimed.';
    END IF;

    IF v_reward.reward_type = 'tokens' THEN
        UPDATE public.users SET tokens = tokens + v_reward.reward_value::NUMERIC WHERE username = p_username;
    ELSIF v_reward.reward_type = 'boom' THEN
        UPDATE public.users 
        SET booms = jsonb_set(
            COALESCE(booms, '{}'::jsonb),
            ARRAY[v_reward.reward_value],
            to_jsonb(COALESCE((booms->>v_reward.reward_value)::NUMERIC, 0) + 1)
        )
        WHERE username = p_username;
    ELSIF v_reward.reward_type = 'plus_days' THEN
        -- Assuming subscription logic exists or simply tagging
        UPDATE public.users SET role = 'tester' WHERE username = p_username AND role = 'user'; -- Example perk
    END IF;

    -- Log claim
    PERFORM log_user_activity(
        p_username, 
        'season_claim', 
        'Claimed tier ' || v_reward.tier || ' season reward', 
        jsonb_build_object('reward_id', p_reward_id, 'type', v_reward.reward_type)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Reward claimed!');
END;
$$;
