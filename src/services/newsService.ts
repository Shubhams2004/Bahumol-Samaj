/**
 * @file newsService.ts
 * Data Layer abstraction separating UI components from the underlying data source.
 * Currently uses local structured mock data, but designed for seamless future migration
 * to Cloudflare Workers, Firestore, REST APIs, or headless CMS without modifying UI components.
 */

import { Article, BreakingItem, Category, CategorySlug } from '../types/news';
import {
  ARTICLES,
  getArticleById as fetchArticleById,
  getArticlesByCategory as fetchArticlesByCategory,
  getLeadArticle as fetchLeadArticle,
  getSupportingArticles as fetchSupportingArticles,
  getLatestArticles as fetchLatestArticles,
  getTrendingArticles as fetchTrendingArticles,
  searchArticles as fetchSearchArticles,
} from '../data/newsArticles';
import { ALL_CATEGORIES, getCategoryBySlug as fetchCategoryBySlug } from '../data/categories';
import { BREAKING_NEWS_ITEMS } from '../data/tickerData';

export interface NewsRepository {
  getAllArticles(): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | undefined>;
  getArticlesByCategory(category: CategorySlug | string): Promise<Article[]>;
  getLeadStory(): Promise<Article>;
  getSupportingStories(limit?: number): Promise<Article[]>;
  getLatestStories(limit?: number): Promise<Article[]>;
  getTrendingStories(limit?: number): Promise<Article[]>;
  search(query: string): Promise<Article[]>;
  getCategories(): Category[];
  getCategoryBySlug(slug: string): Category | undefined;
  getBreakingUpdates(): BreakingItem[];
}

/**
 * Local Data Provider Implementation
 * Future migration path: Replace or swap provider with CloudflareWorkerNewsProvider or ApiNewsProvider
 */
export const newsService: NewsRepository = {
  async getAllArticles(): Promise<Article[]> {
    return ARTICLES;
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

  async getSupportingStories(limit: number = 3): Promise<Article[]> {
    return fetchSupportingArticles().slice(0, limit);
  },

  async getLatestStories(limit: number = 8): Promise<Article[]> {
    return fetchLatestArticles(limit);
  },

  async getTrendingStories(limit: number = 5): Promise<Article[]> {
    return fetchTrendingArticles().slice(0, limit);
  },

  async search(query: string): Promise<Article[]> {
    return fetchSearchArticles(query);
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
