/**
 * @file ingestion.ts
 * Resilient, free-tier news ingestion pipeline for Cloudflare Workers & D1.
 * Fetches, parses, deduplicates and stores legitimate feeds into D1.
 */

import { Env, IngestionResult, IngestionSummary, NewsSourceRow, ParsedFeedItem, D1Database } from './types';
import { parseFeedXml } from './rssParser';
import { classifyArticle } from './classifier';

/**
 * Generate a deterministic SHA-256 hex string using Web Crypto API
 */
export async function computeContentHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Fetch a single source feed with strict timeout and error isolation
 */
async function fetchSourceWithTimeout(url: string, timeoutMs: number = 8000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Bahumol-Samaj-Bot/1.0',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Process a single news source: fetch, parse, check duplicates, and insert new stories
 */
export async function ingestFromSource(
  source: NewsSourceRow,
  db: D1Database
): Promise<IngestionResult> {
  const result: IngestionResult = {
    sourceId: source.id,
    sourceName: source.name,
    fetchedCount: 0,
    insertedCount: 0,
    duplicateCount: 0,
  };

  try {
    // 1. Fetch XML with timeout
    const xmlContent = await fetchSourceWithTimeout(source.feed_url);

    // 2. Parse RSS or Atom
    const items: ParsedFeedItem[] = parseFeedXml(xmlContent);
    result.fetchedCount = items.length;

    // 3. Process each item (up to 25 most recent per feed to stay within free-tier compute)
    const recentItems = items.slice(0, 25);

    for (const item of recentItems) {
      // Deterministic content hash for deduplication
      const hashKey = `${item.title}|${item.guid || item.link}`;
      const contentHash = await computeContentHash(hashKey);

      // Check deduplication
      // A: by (source_id, source_guid)
      if (item.guid) {
        const existingGuid = await db
          .prepare('SELECT id FROM stories WHERE source_id = ? AND source_guid = ? LIMIT 1')
          .bind(source.id, item.guid)
          .first<{ id: string }>();

        if (existingGuid) {
          result.duplicateCount++;
          continue;
        }
      }

      // B: by content_hash across same source
      const existingHash = await db
        .prepare('SELECT id FROM stories WHERE source_id = ? AND content_hash = ? LIMIT 1')
        .bind(source.id, contentHash)
        .first<{ id: string }>();

      if (existingHash) {
        result.duplicateCount++;
        continue;
      }

      // Deterministic Marathi category assignment
      const assignedCategory = classifyArticle(
        item.title,
        item.description,
        item.categoryCandidate,
        source.default_category
      );

      const storyId = `sty_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

      // Insert new story (default status: 'incoming' for editorial review)
      await db
        .prepare(`
          INSERT INTO stories (
            id, source_id, source_url, source_guid, title, description,
            image_url, author, published_at, category, language,
            status, content_hash, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'incoming', ?, datetime('now'), datetime('now'))
        `)
        .bind(
          storyId,
          source.id,
          item.link,
          item.guid || null,
          item.title,
          item.description || null,
          item.imageUrl || null,
          item.author || source.name,
          item.publishedAt,
          assignedCategory,
          source.language || 'mr',
          contentHash
        )
        .run();

      result.insertedCount++;
    }

    // 4. Update source last_fetched_at
    await db
      .prepare("UPDATE news_sources SET last_fetched_at = datetime('now') WHERE id = ?")
      .bind(source.id)
      .run();
  } catch (err: unknown) {
    result.error = err instanceof Error ? err.message : String(err);
  }

  return result;
}

/**
 * Run complete ingestion cycle across active sources (or single target source)
 */
export async function runIngestionPipeline(
  env: Env,
  targetSourceId?: string
): Promise<IngestionSummary> {
  const timestamp = new Date().toISOString();

  // Fetch active news sources from D1
  let query = 'SELECT * FROM news_sources WHERE active = 1';
  const params: string[] = [];

  if (targetSourceId) {
    query += ' AND id = ?';
    params.push(targetSourceId);
  }

  query += ' ORDER BY created_at ASC';

  const stmt = env.DB.prepare(query);
  const sourcesResult = params.length > 0
    ? await stmt.bind(params[0]).all<NewsSourceRow>()
    : await stmt.all<NewsSourceRow>();

  const sources = sourcesResult.results || [];

  const summary: IngestionSummary = {
    timestamp,
    totalSources: sources.length,
    successfulSources: 0,
    failedSources: 0,
    newStoriesInserted: 0,
    duplicatesSkipped: 0,
    details: [],
  };

  // Ingest sequentially or with limited concurrency to avoid D1 connection spikes
  for (const source of sources) {
    const res = await ingestFromSource(source, env.DB);
    summary.details.push(res);

    if (res.error) {
      summary.failedSources++;
    } else {
      summary.successfulSources++;
    }

    summary.newStoriesInserted += res.insertedCount;
    summary.duplicatesSkipped += res.duplicateCount;
  }

  return summary;
}
