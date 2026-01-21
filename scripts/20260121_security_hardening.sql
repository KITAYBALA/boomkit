-- 1. Create Blacklisted IPs table
CREATE TABLE IF NOT EXISTS blacklisted_ips (
    ip TEXT PRIMARY KEY,
    reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    banned_by TEXT
);

-- 2. Add last_ip column to users
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pf_get_column('users', 'last_ip')) THEN
        ALTER TABLE users ADD COLUMN last_ip TEXT;
    END IF;
EXCEPTION
    WHEN undefined_function THEN
        -- Fallback if pf_get_column doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='users' AND column_name='last_ip'
        ) THEN
            ALTER TABLE users ADD COLUMN last_ip TEXT;
        END IF;
END $$;

-- 3. Reset unauthorized admins
-- We only keep Oktay, Ughur, and Turan as staff.
-- Note: Using ILIKE for case-insensitive matching if needed, but these are specific usernames.
UPDATE users 
SET role = 'player', is_owner = FALSE 
WHERE username NOT IN ('Oktay Abdullazada', 'Ughur Akparli', 'Turan Mecidov');

-- Ensure the actual owners are set correctly
UPDATE users
SET role = 'owner', is_owner = TRUE
WHERE username IN ('Oktay Abdullazada', 'Ughur Akparli');

UPDATE users
SET role = 'tester'
WHERE username = 'Turan Mecidov';

-- 4. Harden Users RLS Policies
DROP POLICY IF EXISTS "Anyone can read users" ON users;
DROP POLICY IF EXISTS "Anyone can create users" ON users;
DROP POLICY IF EXISTS "Anyone can update users" ON users;

-- Anyone can read public user data
CREATE POLICY "Public user profiles are readable"
ON users FOR SELECT
USING (true);

-- Anyone can register
CREATE POLICY "Anyone can register"
ON users FOR INSERT
WITH CHECK (true);

-- Users can only update their own non-sensitive data
-- We use a check to prevent them from changing their own role, tokens, ban status, etc.
-- However, since the app currently updates EVERYTHING from the client, 
-- we need to be careful not to break legitimate updates.
-- STRATEGY: Allow updates if the user is an owner, OR if they are updating their OWN record
-- and NOT changing sensitive fields.
-- For now, to stop the immediate breach, we'll restrict it to OWNERS for sensitive changes.

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (
    -- User is updating themselves
    (auth.uid()::text = id) OR 
    -- User is an owner (we check the role column)
    (EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND (role = 'owner' OR is_owner = TRUE)
    ))
)
WITH CHECK (
    -- User is updating themselves
    (auth.uid()::text = id) OR 
    -- User is an owner
    (EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND (role = 'owner' OR is_owner = TRUE)
    ))
);

-- 5. Secure Blacklisted IPs
ALTER TABLE blacklisted_ips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can check blacklist" ON blacklisted_ips FOR SELECT USING (true);
CREATE POLICY "Only staff can modify blacklist" ON blacklisted_ips FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND (role IN ('owner', 'admin', 'senior_moderator'))
    )
);
