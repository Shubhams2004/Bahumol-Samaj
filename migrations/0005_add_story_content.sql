-- Migration 0005: Add full content / body column to stories table
ALTER TABLE stories ADD COLUMN content TEXT;
