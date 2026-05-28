-- Migration: 016_clans_system.sql
-- Description: Sets up the Clans system database tables, columns, policies, and secure RPC functions.

-- 1. Create Clans Table
CREATE TABLE IF NOT EXISTS public.clans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    tag TEXT UNIQUE NOT NULL,
    tag_color TEXT NOT NULL DEFAULT 'text-purple-400',
    description TEXT DEFAULT '',
    logo TEXT NOT NULL DEFAULT '🛡️',
    leader TEXT NOT NULL, -- Leader username
    min_tokens INTEGER DEFAULT 0,
    min_rarity TEXT DEFAULT 'uncommon',
    min_rarity_count INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    bank_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Clan Chat Messages Table
CREATE TABLE IF NOT EXISTS public.clan_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add Clan references and cache fields to Users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS clan_id UUID REFERENCES public.clans(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS clan_role TEXT DEFAULT 'member';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS clan_tag TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS clan_tag_color TEXT;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies
DROP POLICY IF EXISTS "Anyone can view clans" ON public.clans;
CREATE POLICY "Anyone can view clans" ON public.clans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view clan chat messages" ON public.clan_chat_messages;
CREATE POLICY "Anyone can view clan chat messages" ON public.clan_chat_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can post clan chat messages" ON public.clan_chat_messages;
CREATE POLICY "Anyone can post clan chat messages" ON public.clan_chat_messages FOR INSERT WITH CHECK (true);

-- 6. Helper function to compare rarity tiers
CREATE OR REPLACE FUNCTION public.compare_rarity(p_rarity1 TEXT, p_rarity2 TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_val1 INTEGER;
  v_val2 INTEGER;
BEGIN
  v_val1 := CASE LOWER(p_rarity1)
    WHEN 'uncommon' THEN 1 
    WHEN 'rare' THEN 2 
    WHEN 'epic' THEN 3 
    WHEN 'legendary' THEN 4 
    WHEN 'chroma' THEN 5 
    WHEN 'mystical' THEN 6 
    ELSE 0 END;
  v_val2 := CASE LOWER(p_rarity2)
    WHEN 'uncommon' THEN 1 
    WHEN 'rare' THEN 2 
    WHEN 'epic' THEN 3 
    WHEN 'legendary' THEN 4 
    WHEN 'chroma' THEN 5 
    WHEN 'mystical' THEN 6 
    ELSE 0 END;
  RETURN v_val1 - v_val2;
END;
$$;

-- 7. RPC: Create Clan
DROP FUNCTION IF EXISTS public.create_clan(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.create_clan(
  p_username TEXT, 
  p_clan_name TEXT, 
  p_tag TEXT, 
  p_description TEXT, 
  p_logo TEXT, 
  p_tag_color TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_tokens INTEGER;
    v_clan_id UUID;
    v_clean_tag TEXT;
BEGIN
    -- Validation checks
    SELECT tokens INTO v_user_tokens FROM public.users WHERE username = p_username;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'User not found.';
    END IF;
    
    IF EXISTS (SELECT 1 FROM public.users WHERE username = p_username AND clan_id IS NOT NULL) THEN
      RAISE EXCEPTION 'You are already a member of a clan.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.clans WHERE LOWER(name) = LOWER(p_clan_name)) THEN
      RAISE EXCEPTION 'Clan name is already taken.';
    END IF;

    v_clean_tag := UPPER(TRIM(p_tag));
    IF LENGTH(v_clean_tag) < 3 OR LENGTH(v_clean_tag) > 6 THEN
      RAISE EXCEPTION 'Clan tag must be between 3 and 6 characters.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.clans WHERE UPPER(tag) = v_clean_tag) THEN
      RAISE EXCEPTION 'Clan tag is already taken.';
    END IF;

    IF v_user_tokens < 5000 THEN
      RAISE EXCEPTION 'Insufficient tokens. Creating a clan costs 5,000 tokens.';
    END IF;

    -- Deduct tokens & insert clan
    UPDATE public.users SET tokens = tokens - 5000 WHERE username = p_username;
    
    INSERT INTO public.clans (name, tag, tag_color, description, logo, leader)
    VALUES (p_clan_name, v_clean_tag, p_tag_color, p_description, p_logo, p_username)
    RETURNING id INTO v_clan_id;

    -- Update user to be the leader
    UPDATE public.users 
    SET clan_id = v_clan_id, 
        clan_role = 'leader', 
        clan_tag = v_clean_tag, 
        clan_tag_color = p_tag_color 
    WHERE username = p_username;

    -- Log activity
    PERFORM log_user_activity(
      p_username, 
      'clan_create', 
      'Created clan ' || p_clan_name || ' [' || v_clean_tag || ']', 
      jsonb_build_object('clan_id', v_clan_id, 'clan_name', p_clan_name, 'tag', v_clean_tag)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Clan created successfully!', 'clan_id', v_clan_id);
END;
$$;

-- 8. RPC: Join Clan
DROP FUNCTION IF EXISTS public.join_clan(TEXT, UUID);
CREATE OR REPLACE FUNCTION public.join_clan(p_username TEXT, p_clan_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_tokens INTEGER;
    v_user_booms JSONB;
    v_clan_name TEXT;
    v_clan_tag TEXT;
    v_clan_tag_color TEXT;
    v_min_tokens INTEGER;
    v_min_rarity TEXT;
    v_min_rarity_count INTEGER;
    v_eligible_count INTEGER := 0;
    v_boom_name TEXT;
    v_count_str TEXT;
BEGIN
    -- Verify user not in clan
    IF EXISTS (SELECT 1 FROM public.users WHERE username = p_username AND clan_id IS NOT NULL) THEN
      RAISE EXCEPTION 'You are already in a clan. Leave it first.';
    END IF;

    -- Get clan requirements
    SELECT name, tag, tag_color, min_tokens, min_rarity, min_rarity_count 
    INTO v_clan_name, v_clan_tag, v_clan_tag_color, v_min_tokens, v_min_rarity, v_min_rarity_count 
    FROM public.clans WHERE id = p_clan_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Clan not found.';
    END IF;

    -- Fetch user stats
    SELECT tokens, booms INTO v_user_tokens, v_user_booms FROM public.users WHERE username = p_username;

    -- Check token requirement
    IF v_user_tokens < v_min_tokens THEN
      RAISE EXCEPTION 'You do not meet the token requirement of % tokens.', v_min_tokens;
    END IF;

    -- Check Boom rarity requirement
    IF v_min_rarity_count > 0 THEN
      FOR v_boom_name, v_count_str IN SELECT * FROM jsonb_each_text(v_user_booms)
      LOOP
        IF public.compare_rarity(public.get_boom_rarity(v_boom_name), v_min_rarity) >= 0 THEN
          v_eligible_count := v_eligible_count + COALESCE(v_count_str::INTEGER, 0);
        END IF;
      END LOOP;

      IF v_eligible_count < v_min_rarity_count THEN
        RAISE EXCEPTION 'Requirements not met: You must own at least % % or higher Booms (You have %).', v_min_rarity_count, INITCAP(v_min_rarity), v_eligible_count;
      END IF;
    END IF;

    -- Join clan
    UPDATE public.users 
    SET clan_id = p_clan_id, 
        clan_role = 'member', 
        clan_tag = v_clan_tag, 
        clan_tag_color = v_clan_tag_color 
    WHERE username = p_username;

    -- Log activity
    PERFORM log_user_activity(
      p_username, 
      'clan_join', 
      'Joined clan ' || v_clan_name || ' [' || v_clan_tag || ']', 
      jsonb_build_object('clan_id', p_clan_id, 'clan_name', v_clan_name)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Welcome to ' || v_clan_name || '!');
END;
$$;

-- 9. RPC: Leave Clan
DROP FUNCTION IF EXISTS public.leave_clan(TEXT);
CREATE OR REPLACE FUNCTION public.leave_clan(p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
    v_clan_role TEXT;
    v_clan_name TEXT;
    v_other_member_count INTEGER;
BEGIN
    SELECT clan_id, clan_role INTO v_clan_id, v_clan_role FROM public.users WHERE username = p_username;
    
    IF v_clan_id IS NULL THEN
      RAISE EXCEPTION 'You are not in a clan.';
    END IF;

    SELECT name INTO v_clan_name FROM public.clans WHERE id = v_clan_id;

    -- If leader, check if other members exist
    IF v_clan_role = 'leader' THEN
      SELECT count(*) INTO v_other_member_count FROM public.users WHERE clan_id = v_clan_id AND username != p_username;
      
      IF v_other_member_count > 0 THEN
        RAISE EXCEPTION 'You must transfer leadership or kick all members before leaving the clan.';
      ELSE
        -- No other members, disband the clan
        DELETE FROM public.clans WHERE id = v_clan_id;
      END IF;
    END IF;

    -- Remove user from clan
    UPDATE public.users 
    SET clan_id = NULL, 
        clan_role = 'member', 
        clan_tag = NULL, 
        clan_tag_color = NULL 
    WHERE username = p_username;

    -- Log activity
    PERFORM log_user_activity(
      p_username, 
      'clan_leave', 
      'Left clan ' || v_clan_name, 
      jsonb_build_object('clan_id', v_clan_id, 'clan_name', v_clan_name)
    );

    RETURN jsonb_build_object('success', true, 'message', 'You have left the clan.');
END;
$$;

-- 10. RPC: Donate to Clan
DROP FUNCTION IF EXISTS public.donate_to_clan(TEXT, INTEGER);
CREATE OR REPLACE FUNCTION public.donate_to_clan(p_username TEXT, p_amount INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
    v_user_tokens INTEGER;
    v_xp_gain INTEGER;
    v_new_xp INTEGER;
    v_new_level INTEGER;
BEGIN
    IF p_amount <= 0 THEN
      RAISE EXCEPTION 'Donation amount must be greater than zero.';
    END IF;

    SELECT clan_id, tokens INTO v_clan_id, v_user_tokens FROM public.users WHERE username = p_username;
    
    IF v_clan_id IS NULL THEN
      RAISE EXCEPTION 'You are not in a clan.';
    END IF;

    IF v_user_tokens < p_amount THEN
      RAISE EXCEPTION 'Insufficient tokens for donation.';
    END IF;

    -- Deduct tokens & update clan bank/XP
    UPDATE public.users SET tokens = tokens - p_amount WHERE username = p_username;
    
    v_xp_gain := p_amount; -- 1 token = 1 XP
    
    UPDATE public.clans 
    SET bank_tokens = bank_tokens + p_amount,
        xp = xp + v_xp_gain
    WHERE id = v_clan_id
    RETURNING xp INTO v_new_xp;

    -- Calculate level: 10,000 XP per level
    v_new_level := 1 + FLOOR(v_new_xp / 10000);
    UPDATE public.clans SET level = v_new_level WHERE id = v_clan_id;

    -- Log activity
    PERFORM log_user_activity(
      p_username, 
      'clan_donate', 
      'Donated ' || p_amount || ' tokens to the clan bank', 
      jsonb_build_object('clan_id', v_clan_id, 'amount', p_amount)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Thank you for your donation of ' || p_amount || ' tokens!');
END;
$$;

-- 11. RPC: Kick from Clan
DROP FUNCTION IF EXISTS public.kick_from_clan(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.kick_from_clan(p_username TEXT, p_target_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
    v_caller_role TEXT;
    v_target_clan_id UUID;
    v_target_role TEXT;
BEGIN
    SELECT clan_id, clan_role INTO v_clan_id, v_caller_role FROM public.users WHERE username = p_username;
    SELECT clan_id, clan_role INTO v_target_clan_id, v_target_role FROM public.users WHERE username = p_target_username;

    IF v_clan_id IS NULL OR v_caller_role NOT IN ('leader', 'co_leader') THEN
      RAISE EXCEPTION 'You do not have permission to kick members.';
    END IF;

    IF v_target_clan_id IS NULL OR v_target_clan_id != v_clan_id THEN
      RAISE EXCEPTION 'Target user is not in your clan.';
    END IF;

    -- Leadership checks
    IF v_caller_role = 'co_leader' AND v_target_role IN ('leader', 'co_leader') THEN
      RAISE EXCEPTION 'Co-leaders cannot kick other co-leaders or the leader.';
    END IF;

    IF p_username = p_target_username THEN
      RAISE EXCEPTION 'You cannot kick yourself. Use Leave Clan instead.';
    END IF;

    -- Remove target user from clan
    UPDATE public.users 
    SET clan_id = NULL, 
        clan_role = 'member', 
        clan_tag = NULL, 
        clan_tag_color = NULL 
    WHERE username = p_target_username;

    -- Log activity
    PERFORM log_user_activity(
      p_username, 
      'clan_kick', 
      'Kicked ' || p_target_username || ' from the clan', 
      jsonb_build_object('clan_id', v_clan_id, 'target', p_target_username)
    );

    RETURN jsonb_build_object('success', true, 'message', p_target_username || ' has been kicked from the clan.');
END;
$$;

-- 12. RPC: Update Clan Info & Requirements
DROP FUNCTION IF EXISTS public.update_clan_info(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, INTEGER);
CREATE OR REPLACE FUNCTION public.update_clan_info(
  p_username TEXT, 
  p_description TEXT, 
  p_logo TEXT, 
  p_tag_color TEXT,
  p_min_tokens INTEGER,
  p_min_rarity TEXT,
  p_min_rarity_count INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
    v_role TEXT;
BEGIN
    SELECT clan_id, clan_role INTO v_clan_id, v_role FROM public.users WHERE username = p_username;

    IF v_clan_id IS NULL OR v_role NOT IN ('leader', 'co_leader') THEN
      RAISE EXCEPTION 'Only leaders and co-leaders can edit clan settings.';
    END IF;

    IF p_min_tokens < 0 OR p_min_rarity_count < 0 THEN
      RAISE EXCEPTION 'Requirements cannot have negative values.';
    END IF;

    -- Update clan
    UPDATE public.clans 
    SET description = p_description,
        logo = p_logo,
        tag_color = p_tag_color,
        min_tokens = p_min_tokens,
        min_rarity = LOWER(p_min_rarity),
        min_rarity_count = p_min_rarity_count
    WHERE id = v_clan_id;

    -- Sync cached tag color for all current members
    UPDATE public.users 
    SET clan_tag_color = p_tag_color 
    WHERE clan_id = v_clan_id;

    -- Log activity
    PERFORM log_user_activity(
      p_username, 
      'clan_update', 
      'Updated clan information and settings', 
      jsonb_build_object('clan_id', v_clan_id)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Clan settings updated successfully!');
END;
$$;

-- 13. RPC: Transfer Clan Leadership
DROP FUNCTION IF EXISTS public.transfer_clan_leadership(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.transfer_clan_leadership(p_username TEXT, p_target_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
    v_caller_role TEXT;
    v_target_clan_id UUID;
BEGIN
    SELECT clan_id, clan_role INTO v_clan_id, v_caller_role FROM public.users WHERE username = p_username;
    SELECT clan_id INTO v_target_clan_id FROM public.users WHERE username = p_target_username;

    IF v_clan_id IS NULL OR v_caller_role != 'leader' THEN
      RAISE EXCEPTION 'Only the clan leader can transfer leadership.';
    END IF;

    IF v_target_clan_id IS NULL OR v_target_clan_id != v_clan_id THEN
      RAISE EXCEPTION 'Target user is not in your clan.';
    END IF;

    -- Perform transfer
    UPDATE public.clans SET leader = p_target_username WHERE id = v_clan_id;
    UPDATE public.users SET clan_role = 'member' WHERE username = p_username;
    UPDATE public.users SET clan_role = 'leader' WHERE username = p_target_username;

    -- Log activity
    PERFORM log_user_activity(
      p_username, 
      'clan_transfer', 
      'Transferred leadership to ' || p_target_username, 
      jsonb_build_object('clan_id', v_clan_id, 'new_leader', p_target_username)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Leadership has been transferred to ' || p_target_username || '.');
END;
$$;

-- 14. RPC: Promote / Demote Clan Role
DROP FUNCTION IF EXISTS public.update_clan_member_role(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.update_clan_member_role(p_username TEXT, p_target_username TEXT, p_new_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
    v_caller_role TEXT;
    v_target_clan_id UUID;
BEGIN
    SELECT clan_id, clan_role INTO v_clan_id, v_caller_role FROM public.users WHERE username = p_username;
    SELECT clan_id INTO v_target_clan_id FROM public.users WHERE username = p_target_username;

    IF v_clan_id IS NULL OR v_caller_role != 'leader' THEN
      RAISE EXCEPTION 'Only the clan leader can update member roles.';
    END IF;

    IF v_target_clan_id IS NULL OR v_target_clan_id != v_clan_id THEN
      RAISE EXCEPTION 'Target user is not in your clan.';
    END IF;

    IF p_new_role NOT IN ('co_leader', 'member') THEN
      RAISE EXCEPTION 'Invalid role. Must be co_leader or member.';
    END IF;

    -- Perform role change
    UPDATE public.users SET clan_role = p_new_role WHERE username = p_target_username;

    -- Log activity
    PERFORM log_user_activity(
      p_username, 
      'clan_promote', 
      'Updated role of ' || p_target_username || ' to ' || p_new_role, 
      jsonb_build_object('clan_id', v_clan_id, 'target', p_target_username, 'role', p_new_role)
    );

    RETURN jsonb_build_object('success', true, 'message', format('%s''s role updated to %s.', p_target_username, INITCAP(REPLACE(p_new_role, '_', ' '))));
END;
$$;
