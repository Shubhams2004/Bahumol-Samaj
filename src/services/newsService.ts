/**
 * @file newsService.ts
 * Centralized content abstraction layer for Bahumol Samaj Weekly Newspaper.
 * Encapsulates all data access (Edition -> Sections -> Articles).
 * Supports fetching live timeline data from Cloudflare D1 /api/news with seamless local mock fallback.
 * Includes production-safe Editorial Dashboard API service with HttpOnly session authentication.
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
  content?: string | null;
  image_url: string | null;
  author: string | null;
  published_at: string;
  category: string;
  language: string;
  status: string;
  created_at: string;
}

export interface EditorialStory extends TimelineStory {
  content_hash: string;
  updated_at: string;
  original_title?: string | null;
  original_description?: string | null;
  tags?: string | null;
  editorial_notes?: string | null;
  is_edited?: number;
}

export interface EditorialStats {
  all: number;
  incoming: number;
  review: number;
  approved: number;
  published: number;
  rejected: number;
  archived: number;
}

export interface EditorialUpdatePayload {
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  image_url?: string;
  author?: string;
  tags?: string;
  editorial_notes?: string;
  status?: string;
}

export interface EditorialSessionState {
  authenticated: boolean;
  user?: { role: string; editorInChief: string };
}

// Convert D1 story row to frontend Article structure
function mapD1StoryToArticle(row: Record<string, unknown>): Article {
  const publishedAt = (row.published_at as string) || new Date().toISOString();
  const category = (row.category as CategorySlug) || 'maharashtra';
  const id = String(row.id || '');
  const title = String(row.title || '');
  const description = String(row.description || '');
  const rawGuid = row.source_guid ? String(row.source_guid) : '';
  const slug = rawGuid && !rawGuid.includes('/') && !rawGuid.includes(' ') ? rawGuid : id;
  const rawContent = (row.content as string) || '';

  // Extract full article paragraphs: D1 full content/body is primary, description only fallback
  let contentParagraphs: string[] = [];
  if (rawContent && rawContent.trim()) {
    contentParagraphs = rawContent
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (contentParagraphs.length === 0) {
      contentParagraphs = [rawContent.trim()];
    }
  } else if (description && description.trim()) {
    contentParagraphs = [description.trim()];
  } else {
    contentParagraphs = [title];
  }

  // Calculate realistic read time based on Marathi word count
  const totalWords = contentParagraphs.join(' ').split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(totalWords / 130));

  return {
    id,
    slug,
    title,
    excerpt: description,
    category,
    image:
      (row.image_url as string) ||
      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1000&q=80',
    location: (row.source_name as string) || 'महाराष्ट्र',
    publishedAt,
    readTimeMinutes,
    viewsCount: 1200,
    sharesCount: 150,
    tags: [category, 'साप्ताहिक'],
    author: {
      name: (row.author as string) || (row.source_name as string) || 'विशेष वार्ताहर',
      role: 'वार्ताहर',
      location: 'महाराष्ट्र',
    },
    content: contentParagraphs,
  };
}

export const newsService = {
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
    // 1. Prioritize dynamic published article from Worker API
    try {
      const res = await fetch(`/api/news/${encodeURIComponent(slug)}`);
      if (res.ok) {
        const json = (await res.json()) as { success: boolean; data: Record<string, unknown> };
        if (json.success && json.data) {
          return mapD1StoryToArticle(json.data);
        }
      }
    } catch {}

    // 2. Fallback to existing static article data
    const local = fetchArticleBySlug(slug) || fetchArticleById(slug);
    return local;
  },

  async getArticleById(id: string): Promise<Article | undefined> {
    // 1. Prioritize dynamic published article from Worker API
    try {
      const res = await fetch(`/api/news/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = (await res.json()) as { success: boolean; data: Record<string, unknown> };
        if (json.success && json.data) {
          return mapD1StoryToArticle(json.data);
        }
      }
    } catch {}

    // 2. Fallback to existing static article data
    const local = fetchArticleById(id) || fetchArticleBySlug(id);
    return local;
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
   * Fetch live published stories from Cloudflare D1 API.
   * Returns empty array if API returns no published stories or request fails,
   * allowing the caller to use static ARTICLES data as fallback.
   */
  async fetchPublishedFromApi(category?: string, limit: number = 50): Promise<Article[]> {
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

    return [];
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
  async fetchTimelineStories(
    params: {
      category?: string;
      source_group?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ stories: TimelineStory[]; total: number; totalPages: number }> {
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

  // =============================================================
  // PRODUCTION-SAFE EDITORIAL AUTHENTICATION METHODS
  // (Uses HttpOnly Cookies and server-side D1 sessions)
  // =============================================================

  /**
   * Check if current browser session is authenticated
   */
  async checkEditorialSession(): Promise<EditorialSessionState> {
    try {
      const res = await fetch('/api/editorial/auth/session', {
        credentials: 'include',
      });
      if (res.ok) {
        const json = (await res.json()) as EditorialSessionState;
        return json;
      }
    } catch (e) {
      console.warn('[newsService] checkEditorialSession failed:', e);
    }
    return { authenticated: false };
  },

  /**
   * Login with Secret Key
   */
  async loginEditorial(
    secretKey: string
  ): Promise<{ success: boolean; message: string; user?: unknown; error?: string; code?: string }> {
    try {
      const res = await fetch('/api/editorial/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: secretKey }),
      });

      const json = (await res.json()) as {
        success: boolean;
        message: string;
        user?: unknown;
        error?: string;
        code?: string;
      };

      if (!res.ok) {
        return {
          success: false,
          message: json.error || 'लॉगिन अयशस्वी झाले (Authentication failed)',
          code: json.code,
        };
      }

      return json;
    } catch (e) {
      return {
        success: false,
        message: e instanceof Error ? e.message : 'सर्व्हरशी संपर्क होऊ शकला नाही',
      };
    }
  },

  /**
   * Logout and clear session
   */
  async logoutEditorial(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/editorial/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      const json = (await res.json()) as { success: boolean; message: string };
      return json;
    } catch {
      return { success: true, message: 'सत्र समाप्त झाले' };
    }
  },

  // =============================================================
  // PROTECTED EDITORIAL API METHODS (Requires Active Session)
  // =============================================================

  /**
   * Fetch counts for all editorial tabs
   */
  async fetchEditorialStats(): Promise<EditorialStats> {
    const fallbackStats: EditorialStats = {
      all: 0,
      incoming: 0,
      review: 0,
      approved: 0,
      published: 0,
      rejected: 0,
      archived: 0,
    };

    try {
      const res = await fetch('/api/editorial/stats', {
        credentials: 'include',
      });
      if (res.ok) {
        const json = (await res.json()) as { success: boolean; stats: EditorialStats };
        if (json.success && json.stats) {
          return json.stats;
        }
      }
    } catch (e) {
      console.warn('[newsService] fetchEditorialStats failed:', e);
    }

    return fallbackStats;
  },

  /**
   * Fetch incoming stories (Section 1)
   */
  async fetchEditorialIncoming(
    params: {
      page?: number;
      limit?: number;
      category?: string;
      source_group?: string;
      search?: string;
      sort?: 'newest' | 'oldest';
    } = {}
  ): Promise<{ stories: EditorialStory[]; total: number; totalPages: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', String(params.page));
      if (params.limit) queryParams.set('limit', String(params.limit || 25));
      if (params.category && params.category !== 'all') queryParams.set('category', params.category);
      if (params.source_group && params.source_group !== 'all') queryParams.set('source_group', params.source_group);
      if (params.search) queryParams.set('search', params.search);
      if (params.sort) queryParams.set('sort', params.sort);

      const res = await fetch(`/api/editorial/incoming?${queryParams.toString()}`, {
        credentials: 'include',
      });

      if (res.ok) {
        const json = (await res.json()) as {
          success: boolean;
          total: number;
          totalPages: number;
          data: EditorialStory[];
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
      console.warn('[newsService] fetchEditorialIncoming failed:', e);
    }

    return { stories: [], total: 0, totalPages: 1 };
  },

  /**
   * Generic stories query by status
   */
  async fetchEditorialStories(
    params: {
      status?: string;
      page?: number;
      limit?: number;
      category?: string;
      source_group?: string;
      search?: string;
      sort?: 'newest' | 'oldest';
    } = {}
  ): Promise<{ stories: EditorialStory[]; total: number; totalPages: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.set('status', params.status);
      if (params.page) queryParams.set('page', String(params.page));
      if (params.limit) queryParams.set('limit', String(params.limit || 25));
      if (params.category && params.category !== 'all') queryParams.set('category', params.category);
      if (params.source_group && params.source_group !== 'all') queryParams.set('source_group', params.source_group);
      if (params.search) queryParams.set('search', params.search);
      if (params.sort) queryParams.set('sort', params.sort);

      const res = await fetch(`/api/editorial/stories?${queryParams.toString()}`, {
        credentials: 'include',
      });

      if (res.ok) {
        const json = (await res.json()) as {
          success: boolean;
          total: number;
          totalPages: number;
          data: EditorialStory[];
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
      console.warn('[newsService] fetchEditorialStories failed:', e);
    }

    return { stories: [], total: 0, totalPages: 1 };
  },

  /**
   * Fetch a single story for review
   */
  async fetchEditorialStoryById(id: string): Promise<EditorialStory | null> {
    try {
      const res = await fetch(`/api/editorial/story/${encodeURIComponent(id)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = (await res.json()) as { success: boolean; data: EditorialStory };
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[newsService] fetchEditorialStoryById failed:', e);
    }
    return null;
  },

  /**
   * Save editorial updates (Section 3: EDIT)
   */
  async updateEditorialStory(
    id: string,
    payload: EditorialUpdatePayload
  ): Promise<{ success: boolean; message: string; data?: EditorialStory }> {
    try {
      const res = await fetch(`/api/editorial/story/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as {
        success: boolean;
        message: string;
        data?: EditorialStory;
        error?: string;
      };
      if (res.ok && json.success) {
        return { success: true, message: json.message || 'बदल जतन झाले', data: json.data };
      }
      return { success: false, message: json.error || 'बदल जतन करण्यात अयशस्वी' };
    } catch (e) {
      return {
        success: false,
        message: e instanceof Error ? e.message : 'सर्व्हरशी संपर्क होऊ शकला नाही',
      };
    }
  },

  /**
   * Move story to 'review' status
   */
  async reviewStory(id: string): Promise<{ success: boolean; message: string; data?: EditorialStory }> {
    try {
      const res = await fetch(`/api/editorial/story/${encodeURIComponent(id)}/review`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = (await res.json()) as {
        success: boolean;
        message: string;
        data?: EditorialStory;
        error?: string;
      };
      return { success: res.ok && json.success, message: json.message || json.error || '', data: json.data };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'त्रुटी आली' };
    }
  },

  /**
   * Approve a story for publication (incoming/review -> approved)
   */
  async approveStory(id: string): Promise<{ success: boolean; message: string; data?: EditorialStory }> {
    try {
      const res = await fetch(`/api/editorial/story/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = (await res.json()) as {
        success: boolean;
        message: string;
        data?: EditorialStory;
        error?: string;
      };
      return { success: res.ok && json.success, message: json.message || json.error || '', data: json.data };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'त्रुटी आली' };
    }
  },

  /**
   * Reject a story with optional editorial notes
   */
  async rejectStory(
    id: string,
    reason?: string
  ): Promise<{ success: boolean; message: string; data?: EditorialStory }> {
    try {
      const res = await fetch(`/api/editorial/story/${encodeURIComponent(id)}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      const json = (await res.json()) as {
        success: boolean;
        message: string;
        data?: EditorialStory;
        error?: string;
      };
      return { success: res.ok && json.success, message: json.message || json.error || '', data: json.data };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'त्रुटी आली' };
    }
  },

  /**
   * Publish an approved story to public timeline
   */
  async publishStory(id: string): Promise<{ success: boolean; message: string; data?: EditorialStory }> {
    try {
      const res = await fetch(`/api/editorial/story/${encodeURIComponent(id)}/publish`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = (await res.json()) as {
        success: boolean;
        message: string;
        data?: EditorialStory;
        error?: string;
      };
      return { success: res.ok && json.success, message: json.message || json.error || '', data: json.data };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'त्रुटी आली' };
    }
  },

  /**
   * Archive a story (published/rejected -> archived)
   */
  async archiveStory(id: string): Promise<{ success: boolean; message: string; data?: EditorialStory }> {
    try {
      const res = await fetch(`/api/editorial/story/${encodeURIComponent(id)}/archive`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = (await res.json()) as {
        success: boolean;
        message: string;
        data?: EditorialStory;
        error?: string;
      };
      return { success: res.ok && json.success, message: json.message || json.error || '', data: json.data };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'त्रुटी आली' };
    }
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
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const json = (await res.json()) as { success: boolean; message: string; summary?: unknown };
      return json;
    } catch (e) {
      return {
        success: false,
        message: e instanceof Error ? e.message : 'संकलन अयशस्वी झाले (Ingestion request failed)',
      };
    }
  },
};
