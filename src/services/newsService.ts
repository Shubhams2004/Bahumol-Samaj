/**
 * @file newsService.ts
 * Centralized content abstraction layer for Bahumol Samaj Weekly Newspaper.
 * Encapsulates all data access (Edition -> Sections -> Articles).
 * Supports fetching live timeline data from Cloudflare D1 /api/news with seamless local mock fallback.
 */

import { Article, BreakingItem, Category, CategorySlug, WeeklyEdition } from '../types/news';
import {
  ARTICLES,
  getArticleBySlug as fetchArticleBySlug,
  getArticleById as fetchArticleById,
  getArticlesByCategory as fetchArticlesByCategory,
  getLeadArticle as fetchLeadArticle,
  getSecondaryLeadArticles as fetchSecondaryLeadArticles,
  getLatestArticles as fetchLatestArticles,
  getTrendingArticles as fetchTrendingArticles,
  searchArticles as fetchSearchArticles,
} from '../data/newsArticles';
import { ALL_CATEGORIES, getCategoryBySlug as fetchCategoryBySlug } from '../data/categories';
import { BREAKING_NEWS_ITEMS } from '../data/tickerData';
import { CURRENT_WEEKLY_EDITION, EDITORIAL_TEAM } from '../data/editionData';

export interface BackendSource {
  id: string;
  name: string;
  source_url: string;
  source_type: string;
  language: string;
  default_category: string;
  active: number;
  source_group: 'Indian News' | 'Government Sources' | 'International News' | string;
  last_fetched_at: string | null;
}

export interface TimelineStory {
  id: string;
  source_id: string;
  source_name?: string;
  source_group?: string;
  source_url: string;
  source_guid: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  author: string | null;
  published_at: string;
  category: string;
  language: string;
  status: string;
  created_at: string;
}

export interface NewsRepository {
  getCurrentEdition(): WeeklyEdition;
  getEditorialTeam(): typeof EDITORIAL_TEAM;
  getAllArticles(): Promise<Article[]>;
  getArticleBySlug(slug: string): Promise<Article | undefined>;
  getArticleById(id: string): Promise<Article | undefined>;
  getArticlesByCategory(category: CategorySlug | string): Promise<Article[]>;
  getLeadStory(): Promise<Article>;
  getSecondaryLeadStories(): Promise<Article[]>;
  getLatestStories(limit?: number): Promise<Article[]>;
  getTrendingStories(limit?: number): Promise<Article[]>;
  search(query: string, categoryFilter?: string): Promise<Article[]>;
  getCategories(): Category[];
  getCategoryBySlug(slug: string): Category | undefined;
  getBreakingUpdates(): BreakingItem[];
  fetchPublishedFromApi(category?: string, limit?: number): Promise<Article[]>;
  fetchActiveSources(): Promise<BackendSource[]>;
  fetchTimelineStories(params?: {
    category?: string;
    source_group?: string;
    page?: number;
    limit?: number;
  }): Promise<{ stories: TimelineStory[]; total: number; totalPages: number }>;
  triggerManualIngestion(sourceId?: string): Promise<{ success: boolean; message: string; summary?: unknown }>;
}

// Convert D1 story row to frontend Article structure
function mapD1StoryToArticle(row: Record<string, unknown>): Article {
  const publishedAt = (row.published_at as string) || new Date().toISOString();
  const category = (row.category as CategorySlug) || 'maharashtra';
  const id = String(row.id || '');
  const title = String(row.title || '');
  const description = String(row.description || '');

  return {
    id,
    slug: (row.source_guid as string) || id,
    title,
    excerpt: description,
    category,
    image:
      (row.image_url as string) ||
      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1000&q=80',
    location: 'महाराष्ट्र',
    publishedAt,
    readTimeMinutes: 3,
    viewsCount: 1200,
    sharesCount: 150,
    tags: [category, 'साप्ताहिक'],
    author: {
      name: (row.author as string) || (row.source_name as string) || 'विशेष वार्ताहर',
      role: 'वार्ताहर',
      location: 'महाराष्ट्र',
    },
    content: description ? [description] : [title],
  };
}

export const newsService: NewsRepository = {
  getCurrentEdition(): WeeklyEdition {
    return CURRENT_WEEKLY_EDITION;
  },

  getEditorialTeam() {
    return EDITORIAL_TEAM;
  },

  async getAllArticles(): Promise<Article[]> {
    return ARTICLES;
  },

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const local = fetchArticleBySlug(slug);
    if (local) return local;

    try {
      const res = await fetch(`/api/news/${encodeURIComponent(slug)}`);
      if (res.ok) {
        const json = (await res.json()) as { success: boolean; data: Record<string, unknown> };
        if (json.success && json.data) {
          return mapD1StoryToArticle(json.data);
        }
      }
    } catch {}

    return undefined;
  },

  async getArticleById(id: string): Promise<Article | undefined> {
    const local = fetchArticleById(id);
    if (local) return local;

    try {
      const res = await fetch(`/api/news/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = (await res.json()) as { success: boolean; data: Record<string, unknown> };
        if (json.success && json.data) {
          return mapD1StoryToArticle(json.data);
        }
      }
    } catch {}

    return undefined;
  },

  async getArticlesByCategory(category: CategorySlug | string): Promise<Article[]> {
    return fetchArticlesByCategory(category);
  },

  async getLeadStory(): Promise<Article> {
    return fetchLeadArticle();
  },

  async getSecondaryLeadStories(): Promise<Article[]> {
    return fetchSecondaryLeadArticles();
  },

  async getLatestStories(limit: number = 8): Promise<Article[]> {
    return fetchLatestArticles(limit);
  },

  async getTrendingStories(limit: number = 5): Promise<Article[]> {
    return fetchTrendingArticles().slice(0, limit);
  },

  async search(query: string, categoryFilter?: string): Promise<Article[]> {
    return fetchSearchArticles(query, categoryFilter);
  },

  getCategories(): Category[] {
    return ALL_CATEGORIES;
  },

  getCategoryBySlug(slug: string): Category | undefined {
    return fetchCategoryBySlug(slug);
  },

  getBreakingUpdates(): BreakingItem[] {
    return BREAKING_NEWS_ITEMS;
  },

  /**
   * Fetch live published stories from Cloudflare D1 API with graceful fallback to mock data
   */
  async fetchPublishedFromApi(category?: string, limit: number = 10): Promise<Article[]> {
    try {
      const endpoint = category
        ? `/api/news/category/${encodeURIComponent(category)}?limit=${limit}`
        : `/api/news?limit=${limit}`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const json = (await res.json()) as { success: boolean; data: Record<string, unknown>[] };
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data.map(mapD1StoryToArticle);
        }
      }
    } catch {}

    return category ? fetchArticlesByCategory(category) : fetchLatestArticles(limit);
  },

  /**
   * Fetch list of active news sources from Cloudflare D1
   */
  async fetchActiveSources(): Promise<BackendSource[]> {
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const json = (await res.json()) as { success: boolean; sources: BackendSource[] };
        if (json.success && Array.isArray(json.sources)) {
          return json.sources;
        }
      }
    } catch {}

    return [];
  },

  /**
   * Fetch timeline stories with pagination, category filter and source group filter
   */
  async fetchTimelineStories(params: {
    category?: string;
    source_group?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ stories: TimelineStory[]; total: number; totalPages: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.category) queryParams.set('category', params.category);
      if (params.source_group) queryParams.set('source_group', params.source_group);
      if (params.page) queryParams.set('page', String(params.page));
      if (params.limit) queryParams.set('limit', String(params.limit || 15));

      const res = await fetch(`/api/news?${queryParams.toString()}`);
      if (res.ok) {
        const json = (await res.json()) as {
          success: boolean;
          total: number;
          totalPages: number;
          data: TimelineStory[];
        };
        if (json.success && Array.isArray(json.data)) {
          return {
            stories: json.data,
            total: json.total || json.data.length,
            totalPages: json.totalPages || 1,
          };
        }
      }
    } catch (e) {
      console.warn('[newsService] Failed to fetch timeline stories from /api/news:', e);
    }

    return { stories: [], total: 0, totalPages: 1 };
  },

  /**
   * Trigger manual ingestion cycle for all sources or single source
   */
  async triggerManualIngestion(
    sourceId?: string
  ): Promise<{ success: boolean; message: string; summary?: unknown }> {
    try {
      const url = sourceId
        ? `/api/admin/refresh?source_id=${encodeURIComponent(sourceId)}`
        : '/api/admin/refresh';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Admin-Key': 'bahumol-news-admin-2026',
          'Content-Type': 'application/json',
        },
      });

      const json = await res.json() as { success: boolean; message: string; summary?: unknown };
      return json;
    } catch (e) {
      return {
        success: false,
        message: e instanceof Error ? e.message : 'संकलन अयशस्वी झाले (Ingestion request failed)',
      };
    }
  },
};
