-- Migration 0004: Create editorial_sessions table for production-safe authentication
CREATE TABLE IF NOT EXISTS editorial_sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON editorial_sessions(expires_at);
