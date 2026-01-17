-- Secure trades table by removing permissive policy and ensuring checks for banned status

-- Drop the old permissive policy if it exists
DROP POLICY IF EXISTS "Anyone can create trades" ON trades;

-- Create a stricter policy for creating trades
CREATE POLICY "Users can only create trades if not banned"
  ON trades
  FOR INSERT
  WITH CHECK (
    -- The user creating the trade must be the sender
    auth.uid()::text = sender_id
    AND
    -- The sender must NOT be banned
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
      AND is_banned = false
    )
    AND
    -- The receiver must NOT be banned (optional, but good for UX/consistency before RPC)
    EXISTS (
      SELECT 1 FROM users
      WHERE id = receiver_id
      AND is_banned = false
    )
  );
