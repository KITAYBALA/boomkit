-- Ensure game_sessions policies allow updates to players
-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Drop strict policies if they exist (safe to drop 'Public' named ones from previous script)
DROP POLICY IF EXISTS "Public Select" ON game_sessions;
DROP POLICY IF EXISTS "Public Insert" ON game_sessions;
DROP POLICY IF EXISTS "Public Update" ON game_sessions;
DROP POLICY IF EXISTS "Public Delete" ON game_sessions;
DROP POLICY IF EXISTS "Anyone can see game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Anyone can create sessions" ON game_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON game_sessions;

-- Create permissive policies for game flow
CREATE POLICY "Enable read access for all users" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON game_sessions FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON game_sessions FOR DELETE USING (true);

-- Force Realtime replication (Safely)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'game_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
  END IF;
END $$;

-- Verify
SELECT * FROM pg_policies WHERE tablename = 'game_sessions';
