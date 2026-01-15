-- Fix auction_items schema
ALTER TABLE auction_items 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS ends_at timestamptz;

-- Make sure existing rows have a default
UPDATE auction_items SET status = 'active' WHERE status IS NULL;
UPDATE auction_items SET ends_at = NOW() + INTERVAL '1 day' WHERE ends_at IS NULL;
