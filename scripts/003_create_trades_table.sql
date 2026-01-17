-- Create trades table for the trading system
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL,
  sender_username TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  receiver_username TEXT NOT NULL,
  sender_booms JSONB NOT NULL DEFAULT '{}',
  receiver_booms JSONB NOT NULL DEFAULT '{}',
  sender_tokens INTEGER NOT NULL DEFAULT 0,
  receiver_tokens INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Policies for trades table
CREATE POLICY "Anyone can read trades" ON trades FOR SELECT USING (true);
CREATE POLICY "Users can only create trades if not banned" ON trades FOR INSERT WITH CHECK (
  auth.uid()::text = sender_id 
  AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND is_banned = false)
  AND EXISTS (SELECT 1 FROM users WHERE id = receiver_id AND is_banned = false)
);
CREATE POLICY "Anyone can update trades" ON trades FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete trades" ON trades FOR DELETE USING (true);
