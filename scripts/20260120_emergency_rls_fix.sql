-- EMERGENCY RLS RESET FOR ALL CRITICAL TABLES
-- This ensures that the app works even if Supabase Auth isn't perfectly synced with custom user IDs

-- 1. Game Sessions (Multisplayer PIN)
DROP POLICY IF EXISTS "Anyone can see game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Anyone can create sessions" ON game_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON game_sessions;

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Select" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update" ON game_sessions FOR UPDATE USING (true);
CREATE POLICY "Public Delete" ON game_sessions FOR DELETE USING (true);

-- 2. Conversations (Chat)
DROP POLICY IF EXISTS "Anyone can see their conversations" ON conversations;
DROP POLICY IF EXISTS "Anyone can create a conversation" ON conversations;
DROP POLICY IF EXISTS "Anyone can update conversations" ON conversations;

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Select" ON conversations FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update" ON conversations FOR UPDATE USING (true);
CREATE POLICY "Public Delete" ON conversations FOR DELETE USING (true);

-- 3. Conversation Members
DROP POLICY IF EXISTS "Members can see other members in their chats" ON conversation_members;
DROP POLICY IF EXISTS "Anyone can join a conversation" ON conversation_members;

ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Select" ON conversation_members FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON conversation_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update" ON conversation_members FOR UPDATE USING (true);
CREATE POLICY "Public Delete" ON conversation_members FOR DELETE USING (true);

-- 4. Direct Messages
DROP POLICY IF EXISTS "Members can see messages in their chats" ON direct_messages;
DROP POLICY IF EXISTS "Members can send messages" ON direct_messages;

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Select" ON direct_messages FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON direct_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update" ON direct_messages FOR UPDATE USING (true);

-- 5. Trades (Ensuring no RLS blocks here either)
DROP POLICY IF EXISTS "Anyone can read trades" ON trades;
DROP POLICY IF EXISTS "Users can only create trades if not banned" ON trades;
DROP POLICY IF EXISTS "Anyone can update trades" ON trades;

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Select" ON trades FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON trades FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update" ON trades FOR UPDATE USING (true);
CREATE POLICY "Public Delete" ON trades FOR DELETE USING (true);

-- 6. Enable Realtime Replication Defensively
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'game_sessions') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'direct_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversation_members') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'trades') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
    END IF;
END $$;
