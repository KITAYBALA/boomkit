CREATE TABLE IF NOT EXISTS custom_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  assigned_date TEXT NOT NULL
);
