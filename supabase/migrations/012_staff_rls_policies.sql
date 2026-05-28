-- Migration: Add Staff policies for tournaments, seasons and rewards
-- This permits authorized staff members to manage tournaments, seasons and their rewards.

-- 1. Tournaments Policies
DROP POLICY IF EXISTS "Staff can insert tournaments" ON public.tournaments;
CREATE POLICY "Staff can insert tournaments" ON public.tournaments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()::text
            AND users.role IN ('owner', 'admin', 'senior_moderator', 'moderator')
        )
    );

DROP POLICY IF EXISTS "Staff can update tournaments" ON public.tournaments;
CREATE POLICY "Staff can update tournaments" ON public.tournaments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()::text
            AND users.role IN ('owner', 'admin', 'senior_moderator', 'moderator')
        )
    );

DROP POLICY IF EXISTS "Staff can delete tournaments" ON public.tournaments;
CREATE POLICY "Staff can delete tournaments" ON public.tournaments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()::text
            AND users.role IN ('owner', 'admin')
        )
    );

-- 2. Seasons Policies
DROP POLICY IF EXISTS "Staff can manage seasons" ON public.seasons;
CREATE POLICY "Staff can manage seasons" ON public.seasons
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()::text
            AND users.role IN ('owner', 'admin', 'senior_moderator', 'moderator')
        )
    );

-- 3. Season Rewards Policies
DROP POLICY IF EXISTS "Staff can manage season rewards" ON public.season_rewards;
CREATE POLICY "Staff can manage season rewards" ON public.season_rewards
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()::text
            AND users.role IN ('owner', 'admin', 'senior_moderator', 'moderator')
        )
    );
