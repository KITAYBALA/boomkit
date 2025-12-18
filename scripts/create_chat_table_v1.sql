-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  role TEXT NOT NULL,
  inserted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read messages
CREATE POLICY "Anyone can read chat messages"
  ON chat_messages
  FOR SELECT
  USING (true);

-- Create policy to allow authenticated users to insert messages
CREATE POLICY "Anyone can insert chat messages"
  ON chat_messages
  FOR INSERT
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_inserted_at 
  ON chat_messages(inserted_at DESC);
