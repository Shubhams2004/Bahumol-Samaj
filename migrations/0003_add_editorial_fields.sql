-- Migration 0003: Add editorial editing and audit tracking columns
-- Allows editing headline, description, tags, author, category while preserving original source data

ALTER TABLE stories ADD COLUMN original_title TEXT;
ALTER TABLE stories ADD COLUMN original_description TEXT;
ALTER TABLE stories ADD COLUMN tags TEXT DEFAULT '';
ALTER TABLE stories ADD COLUMN editorial_notes TEXT DEFAULT '';
ALTER TABLE stories ADD COLUMN is_edited INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_stories_status_created_at ON stories(status, created_at DESC);
