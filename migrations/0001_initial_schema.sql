-- D1 Schema Migration for Bahumol Samaj Weekly Newspaper Ingestion Pipeline
-- Phase 1: Sources, Stories, Indexes, and Initial Legitimate Marathi Feeds

CREATE TABLE IF NOT EXISTS news_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  feed_url TEXT NOT NULL UNIQUE,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'rss',
  language TEXT NOT NULL DEFAULT 'mr',
  default_category TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  last_fetched_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_guid TEXT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  author TEXT,
  published_at TEXT NOT NULL,
  category TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'mr',
  status TEXT NOT NULL DEFAULT 'incoming' CHECK(status IN ('incoming', 'review', 'approved', 'published', 'rejected', 'archived')),
  content_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Appropriate indexes for fast querying, filtering, and deduplication
CREATE INDEX IF NOT EXISTS idx_stories_published_at ON stories(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_category ON stories(category);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_source_id ON stories(source_id);
CREATE INDEX IF NOT EXISTS idx_stories_content_hash ON stories(content_hash);
CREATE INDEX IF NOT EXISTS idx_stories_source_guid ON stories(source_id, source_guid);
CREATE INDEX IF NOT EXISTS idx_stories_status_published_at ON stories(status, published_at DESC);

-- Seed legitimate official and accredited Marathi news feeds
INSERT OR IGNORE INTO news_sources (id, name, feed_url, source_url, source_type, language, default_category, active)
VALUES
  (
    'src_pib_mr',
    'पत्र सूचना कार्यालय (PIB मुंबई - मराठी)',
    'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=4',
    'https://pib.gov.in',
    'rss',
    'mr',
    'महाराष्ट्र',
    1
  ),
  (
    'src_air_mr',
    'आकाशवाणी प्रादेशिक वृत्त (AIR News Marathi)',
    'https://newsonair.gov.in/rss/marathi.xml',
    'https://newsonair.gov.in',
    'rss',
    'mr',
    'देश',
    1
  ),
  (
    'src_dd_mr',
    'दूरदर्शन सह्याद्री वृत्त (DD Sahyadri)',
    'https://ddnews.gov.in/mr/feed/',
    'https://ddnews.gov.in',
    'rss',
    'mr',
    'महाराष्ट्र',
    1
  ),
  (
    'src_sakal_mr',
    'सकाळ वृत्तसेवा (Sakal RSS)',
    'https://www.esakal.com/feed',
    'https://www.esakal.com',
    'rss',
    'mr',
    'महाराष्ट्र',
    1
  ),
  (
    'src_loksatta_mr',
    'लोकसत्ता वृत्तसंपादकीय (Loksatta RSS)',
    'https://www.loksatta.com/feed/',
    'https://www.loksatta.com',
    'rss',
    'mr',
    'संपादकीय',
    1
  );
