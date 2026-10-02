/**
 * @file newsService.ts
 * Centralized content abstraction layer for Bahumol Samaj Weekly Newspaper.
 * Encapsulates all data access (Edition -> Sections -> Articles).
 * Designed for future drop-in replacement by Cloudflare Workers, KV, D1, or external API.
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
    return fetchArticleBySlug(slug);
  },

  async getArticleById(id: string): Promise<Article | undefined> {
    return fetchArticleById(id);
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
};
