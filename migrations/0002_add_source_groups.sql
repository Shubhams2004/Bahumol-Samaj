-- Migration 0002: Add source_group to news_sources and populate verified 3-tier registry
-- Groups: 'Indian News', 'Government Sources', 'International News'

ALTER TABLE news_sources ADD COLUMN source_group TEXT NOT NULL DEFAULT 'Indian News';

CREATE INDEX IF NOT EXISTS idx_news_sources_source_group ON news_sources(source_group);

-- Update existing Marathi sources
UPDATE news_sources SET source_group = 'Government Sources' WHERE id IN ('src_pib_mr', 'src_air_mr', 'src_dd_mr');
UPDATE news_sources SET source_group = 'Indian News' WHERE id IN ('src_sakal_mr', 'src_loksatta_mr');

-- Insert or replace verified feeds across all 3 source groups
INSERT OR REPLACE INTO news_sources (id, name, feed_url, source_url, source_type, language, default_category, active, source_group)
VALUES
  -- 1. Government Sources
  (
    'src_gov_pib_mr',
    'पत्र सूचना कार्यालय (PIB मुंबई / महाराष्ट्र)',
    'https://news.google.com/rss/search?q=site:pib.gov.in+Maharashtra&hl=mr&gl=IN&ceid=IN:mr',
    'https://pib.gov.in',
    'rss',
    'mr',
    'महाराष्ट्र',
    1,
    'Government Sources'
  ),
  (
    'src_gov_mahanews',
    'महाराष्ट्र शासन माहिती व जनसंपर्क (MahaNews DGIPR)',
    'https://news.google.com/rss/search?q=site:mahanews.gov.in+OR+site:dgipr.maharashtra.gov.in&hl=mr&gl=IN&ceid=IN:mr',
    'https://mahanews.gov.in',
    'rss',
    'mr',
    'महाराष्ट्र',
    1,
    'Government Sources'
  ),
  (
    'src_gov_rbi',
    'भारतीय रिझर्व्ह बँक अधिकृत प्रसिद्धीपत्रके (RBI Official)',
    'https://rbi.org.in/pressreleases_rss.xml',
    'https://rbi.org.in',
    'rss',
    'en',
    'अर्थव्यवस्था',
    1,
    'Government Sources'
  ),
  (
    'src_gov_pib_national',
    'PIB National (पंतप्रधान व केंद्र शासन प्रेस रिलीज)',
    'https://news.google.com/rss/search?q=site:pib.gov.in&hl=en-IN&gl=IN&ceid=IN:en',
    'https://pib.gov.in',
    'rss',
    'en',
    'देश',
    1,
    'Government Sources'
  ),

  -- 2. Indian News
  (
    'src_in_sakal',
    'सकाळ वृत्तसेवा (Sakal Marathi)',
    'https://www.esakal.com/feed',
    'https://www.esakal.com',
    'rss',
    'mr',
    'महाराष्ट्र',
    1,
    'Indian News'
  ),
  (
    'src_in_thehindu',
    'The Hindu National News',
    'https://www.thehindu.com/news/national/feeder/default.rss',
    'https://www.thehindu.com',
    'rss',
    'en',
    'देश',
    1,
    'Indian News'
  ),
  (
    'src_in_ndtv',
    'NDTV Top Stories',
    'https://feeds.feedburner.com/ndtvnews-top-stories',
    'https://www.ndtv.com',
    'rss',
    'en',
    'देश',
    1,
    'Indian News'
  ),

  -- 3. International News
  (
    'src_intl_bbc',
    'BBC News World',
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.bbc.com/news/world',
    'rss',
    'en',
    'जग',
    1,
    'International News'
  ),
  (
    'src_intl_un',
    'संयुक्त राष्ट्र वृत्त (UN News All)',
    'https://news.un.org/feed/subscribe/en/news/all/rss.xml',
    'https://news.un.org',
    'rss',
    'en',
    'जग',
    1,
    'International News'
  ),
  (
    'src_intl_aljazeera',
    'Al Jazeera World News',
    'https://www.aljazeera.com/xml/rss/all.xml',
    'https://www.aljazeera.com',
    'rss',
    'en',
    'जग',
    1,
    'International News'
  );
