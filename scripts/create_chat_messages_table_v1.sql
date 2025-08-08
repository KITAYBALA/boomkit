CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  role TEXT NOT NULL
);
