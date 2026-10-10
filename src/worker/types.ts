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
  source_group: 'Indian News' | 'Government Sources' | 'International News' | string;
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
  content?: string | null;
  image_url: string | null;
  author: string | null;
  published_at: string;
  category: string;
  language: string;
  status: StoryStatus;
  content_hash: string;
  created_at: string;
  updated_at: string;
  source_name?: string;
  source_group?: string;
  original_title?: string | null;
  original_description?: string | null;
  tags?: string | null;
  editorial_notes?: string | null;
  is_edited?: number;
}

export interface EditorialUpdatePayload {
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  language?: 'mr' | 'hi' | 'en' | string;
  image_url?: string;
  author?: string;
  tags?: string;
  editorial_notes?: string;
}

export interface EditorialCounts {
  all: number;
  incoming: number;
  review: number;
  approved: number;
  published: number;
  rejected: number;
  archived: number;
}

export interface EditorialSessionRow {
  id: string;
  created_at: string;
  expires_at: string;
}

export interface EditorialAuthUser {
  role: 'editor';
  editorInChief: string;
}

export interface ParsedFeedItem {
  guid?: string;
  title: string;
  link: string;
  description?: string;
  content?: string;
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
