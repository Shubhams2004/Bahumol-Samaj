/**
 * @file test_homepage_api_integration.ts
 * Verification test suite for Homepage News Data Integration.
 * Verifies:
 * 1. newsService.fetchPublishedFromApi() calls /api/news
 * 2. Published articles from API are correctly mapped to Article structure
 * 3. Fallback to static ARTICLES data occurs when API returns no usable data or fails
 * 4. Only published articles are displayed when live data is present
 * 5. Newly published article in D1 appears via fetchPublishedFromApi()
 */

import { newsService } from '../src/services/newsService';
import { handleApiRequest } from '../src/worker/api';
import { Env, StoryRow, NewsSourceRow } from '../src/worker/types';
import { ARTICLES } from '../src/data/newsArticles';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: unknown) {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${testName}`);
    if (details !== undefined) {
      console.error('  Details:', details);
    }
    failed++;
  }
}

// In-Memory Test D1 Mock
class MockD1PreparedStatement {
  constructor(private sql: string, private db: MockD1Database, private params: (string | number)[] = []) {}

  bind(...params: (string | number)[]) {
    return new MockD1PreparedStatement(this.sql, this.db, params);
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const res = await this.all<T>();
    return res.results && res.results.length > 0 ? res.results[0] : null;
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }> {
    const normalized = this.sql.replace(/\s+/g, ' ').toUpperCase();

    if (normalized.includes('COUNT(*)')) {
      let filtered = [...this.db.stories];
      if (normalized.includes("STATUS = 'PUBLISHED'")) {
        filtered = filtered.filter((s) => s.status === 'published');
      }
      if (normalized.includes('CATEGORY = ?') && this.params.length > 0) {
        filtered = filtered.filter((s) => s.category === this.params[0]);
      }
      return { results: [{ count: filtered.length }] as unknown as T[], success: true };
    }

    if (normalized.includes('FROM STORIES')) {
      let filtered = this.db.stories.map((s) => {
        const src = this.db.sources.find((src) => src.id === s.source_id);
        return {
          ...s,
          source_name: src ? src.name : s.source_id,
          source_group: src ? src.source_group : 'General',
        };
      });

      if (normalized.includes("STATUS = 'PUBLISHED'")) {
        filtered = filtered.filter((s) => s.status === 'published');
      }

      if (normalized.includes('STORIES.CATEGORY = ?') && this.params.length > 0) {
        filtered = filtered.filter((s) => s.category === this.params[0]);
      }

      if (normalized.includes('(STORIES.ID = ? OR STORIES.SOURCE_GUID = ?)') && this.params.length > 0) {
        const queryId = this.params[0];
        filtered = filtered.filter((s) => s.id === queryId || s.source_guid === queryId);
      }

      return { results: filtered as unknown as T[], success: true };
    }

    return { results: [] as unknown as T[], success: true };
  }
}

class MockD1Database {
  public sources: NewsSourceRow[] = [
    {
      id: 'src_pib_mumbai',
      name: 'पत्र सूचना कार्यालय (PIB मुंबई)',
      source_url: 'https://pib.gov.in/RssMain.aspx?ModId=6&LangId=4',
      source_type: 'rss',
      language: 'mr',
      default_category: 'maharashtra',
      active: 1,
      source_group: 'Government Sources',
      last_fetched_at: '2026-10-06 12:00:00',
      created_at: '2026-10-01 00:00:00',
    },
  ];

  public stories: StoryRow[] = [];

  prepare(sql: string) {
    return new MockD1PreparedStatement(sql, this);
  }
}

async function runHomepageIntegrationTests() {
  console.log('========================================================');
  console.log('  BAHUMOL SAMAJ: HOMEPAGE NEWS DATA INTEGRATION TESTS');
  console.log('========================================================');

  const mockDb = new MockD1Database();
  const mockEnv: Env = {
    DB: mockDb as unknown as Env['DB'],
    ADMIN_API_KEY: 'test-admin-secret-2026',
    ASSETS: {} as Env['ASSETS'],
  };

  // Mock global fetch to dispatch to handleApiRequest
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (urlStr.startsWith('/api/')) {
      const fullUrl = `https://bahumolsamaj.com${urlStr}`;
      const req = new Request(fullUrl, init);
      return handleApiRequest(req, mockEnv);
    }
    return originalFetch(input, init);
  };

  try {
    // ---------------------------------------------------------
    // TEST 1: Initial state - No published stories in D1
    // fetchPublishedFromApi() returns [] allowing static fallback
    // ---------------------------------------------------------
    const initialArticles = await newsService.fetchPublishedFromApi(undefined, 50);
    assert(
      Array.isArray(initialArticles) && initialArticles.length === 0,
      '1. With 0 published stories in D1, fetchPublishedFromApi() returns [] (enables static fallback)'
    );

    // Verify static ARTICLES has fallback content
    assert(
      ARTICLES.length > 0 && typeof ARTICLES[0].title === 'string',
      '2. Static ARTICLES fallback data is preserved and intact'
    );

    // ---------------------------------------------------------
    // TEST 2: Ingest and publish a story in D1
    // ---------------------------------------------------------
    const publishedStoryId = 'sty_pub_test_001';
    mockDb.stories.push({
      id: publishedStoryId,
      source_id: 'src_pib_mumbai',
      source_url: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2099999',
      source_guid: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2099999',
      title: 'महाराष्ट्रात आधुनिक शेतीसाठी विशेष आर्थिक पॅकेज जाहीर',
      description: 'राज्य सरकारने शेतकऱ्यांसाठी ५ हजार कोटी रुपयांच्या विशेष अनुदानाची घोषणा केली आहे.',
      image_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
      author: 'विशेष प्रतिनिधी, मुंबई',
      published_at: new Date().toISOString(),
      category: 'maharashtra',
      language: 'mr',
      status: 'published',
      content_hash: 'hash_test_pub_001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // ---------------------------------------------------------
    // TEST 3: fetchPublishedFromApi() retrieves the newly published article
    // ---------------------------------------------------------
    const liveArticles = await newsService.fetchPublishedFromApi(undefined, 50);
    assert(
      liveArticles.length === 1,
      '3. Newly published D1 story appears via newsService.fetchPublishedFromApi()',
      liveArticles.length
    );

    const firstArticle = liveArticles[0];
    assert(
      firstArticle.id === publishedStoryId,
      '4. Returned article ID matches published story ID in D1',
      firstArticle.id
    );

    assert(
      firstArticle.title === 'महाराष्ट्रात आधुनिक शेतीसाठी विशेष आर्थिक पॅकेज जाहीर',
      '5. Returned article title matches published title',
      firstArticle.title
    );

    assert(
      firstArticle.category === 'maharashtra',
      '6. Returned article category is mapped accurately',
      firstArticle.category
    );

    assert(
      !firstArticle.slug.includes('/'),
      '7. Article slug is URL-safe (slashes stripped or sanitized to ID for hash routing)',
      firstArticle.slug
    );

    // ---------------------------------------------------------
    // TEST 4: Unpublished stories in D1 are NOT returned
    // ---------------------------------------------------------
    mockDb.stories.push({
      id: 'sty_incoming_draft',
      source_id: 'src_pib_mumbai',
      source_url: 'https://pib.gov.in/draft',
      source_guid: 'draft_guid',
      title: 'अप्रकाशित कच्ची बातमी (Draft Only)',
      description: 'हा मसुदा अद्याप मंजूर झालेला नाही.',
      image_url: null,
      author: 'बातमीदार',
      published_at: new Date().toISOString(),
      category: 'politics',
      language: 'mr',
      status: 'incoming', // Not published!
      content_hash: 'hash_draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const publishedOnly = await newsService.fetchPublishedFromApi(undefined, 50);
    assert(
      publishedOnly.length === 1 && !publishedOnly.some((a) => a.id === 'sty_incoming_draft'),
      '8. Unpublished stories (incoming/review/rejected) are strictly excluded from public API return'
    );

    // ---------------------------------------------------------
    // TEST 5: Category-filtered fetch
    // ---------------------------------------------------------
    mockDb.stories.push({
      id: 'sty_pub_politics',
      source_id: 'src_pib_mumbai',
      source_url: 'https://pib.gov.in/pol',
      source_guid: 'pol_guid',
      title: 'विधानसभा अधिवेशनात नवीन जनहित विधेयकाला मंजुरी',
      description: 'विधानसभेत आज बहुमताने जनहित विधेयक मंजूर करण्यात आले.',
      image_url: null,
      author: 'विधानसभा प्रतिनिधी',
      published_at: new Date().toISOString(),
      category: 'politics',
      language: 'mr',
      status: 'published',
      content_hash: 'hash_pol',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const politicsArticles = await newsService.fetchPublishedFromApi('politics', 10);
    assert(
      politicsArticles.length === 1 && politicsArticles[0].category === 'politics',
      '9. Category filter (/api/news/category/politics) returns only matching published category articles'
    );

    // ---------------------------------------------------------
    // TEST 6: getArticleBySlug / getArticleById for published D1 story
    // ---------------------------------------------------------
    const fetchedById = await newsService.getArticleById(publishedStoryId);
    assert(
      fetchedById !== undefined && fetchedById.id === publishedStoryId,
      '10. newsService.getArticleById() resolves published D1 article for ArticleDetailPage',
      fetchedById?.id
    );

    // ---------------------------------------------------------
    // TEST 7: Graceful error handling - Simulating network failure
    // ---------------------------------------------------------
    globalThis.fetch = async (): Promise<Response> => {
      throw new Error('Network offline or connection reset');
    };

    const fallbackArticles = await newsService.fetchPublishedFromApi(undefined, 50);
    assert(
      Array.isArray(fallbackArticles) && fallbackArticles.length === 0,
      '11. On API network failure, fetchPublishedFromApi() gracefully catches and returns [] (no crash/blank page)'
    );

    console.log('========================================================');
    console.log(`Homepage Integration Results: ${passed} passed, ${failed} failed`);
    console.log('========================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
}

runHomepageIntegrationTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
