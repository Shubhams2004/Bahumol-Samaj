/**
 * @file types.ts
 * Cloudflare Worker and D1 Database Types for Bahumol Samaj Newsroom Ingestion Pipeline
 */

import type { D1Database, Fetcher, ExecutionContext, ScheduledEvent } from '@cloudflare/workers-types';

export type { D1Database, Fetcher, ExecutionContext, ScheduledEvent };

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_API_KEY?: string;
  ENVIRONMENT?: string;
}

export type StoryStatus =
  | 'incoming'
  | 'review'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'archived';

export interface NewsSourceRow {
  id: string;
  name: string;
  feed_url: string;
  source_url: string;
  source_type: string;
  language: string;
  default_category: string;
  active: number;
  last_fetched_at: string | null;
  created_at: string;
}

export interface StoryRow {
  id: string;
  source_id: string;
  source_url: string;
  source_guid: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  author: string | null;
  published_at: string;
  category: string;
  language: string;
  status: StoryStatus;
  content_hash: string;
  created_at: string;
  updated_at: string;
}

export interface ParsedFeedItem {
  guid?: string;
  title: string;
  link: string;
  description?: string;
  imageUrl?: string;
  author?: string;
  publishedAt: string;
  categoryCandidate?: string;
}

export interface IngestionResult {
  sourceId: string;
  sourceName: string;
  fetchedCount: number;
  insertedCount: number;
  duplicateCount: number;
  error?: string;
}

export interface IngestionSummary {
  timestamp: string;
  totalSources: number;
  successfulSources: number;
  failedSources: number;
  newStoriesInserted: number;
  duplicatesSkipped: number;
  details: IngestionResult[];
}
