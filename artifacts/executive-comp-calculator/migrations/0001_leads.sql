CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  consent INTEGER NOT NULL,
  scenario TEXT NOT NULL,
  created_at TEXT NOT NULL,
  email_status TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at);