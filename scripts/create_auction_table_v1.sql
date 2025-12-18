-- Create auction items table
CREATE TABLE IF NOT EXISTS auction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boom_name TEXT NOT NULL,
  seller TEXT NOT NULL,
  current_bid INTEGER NOT NULL DEFAULT 0,
  top_bidder TEXT,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE auction_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read auction items
CREATE POLICY "Anyone can read auction items"
  ON auction_items
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert auction items
CREATE POLICY "Anyone can create auction items"
  ON auction_items
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow anyone to update auction items (for bidding)
CREATE POLICY "Anyone can update auction items"
  ON auction_items
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_auction_items_ends_at 
  ON auction_items(ends_at ASC);
