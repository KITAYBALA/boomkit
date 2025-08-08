CREATE TABLE IF NOT EXISTS auction_items (
  id TEXT PRIMARY KEY,
  boom_name TEXT NOT NULL,
  seller TEXT NOT NULL,
  current_bid INTEGER NOT NULL,
  time_left INTEGER NOT NULL,
  bidders TEXT[] NOT NULL DEFAULT '{}'
);
