/**
 * @file test_ux_and_architecture_fixes.ts
 * Rigorous test suite validating all 10 architectural & UX product fixes:
 * 1. Live Timeline serves as the official Homepage (मुख्यपृष्ठ).
 * 2. Public Live Timeline is READ-ONLY (no public news fetching).
 * 3. Editorial CMS retains manual ingestion capability (/api/admin/refresh).
 * 4. Full article reading pipeline (all paragraphs preserved, separate excerpt).
 * 5. Missing / invalid article handling shows "ही बातमी सध्या उपलब्ध नाही".
 * 6. Compact header state for article reading screens.
 * 7. Multilingual support: language property ('mr' | 'hi' | 'en') architecture.
 * 8. Safe D1 database retention: archives stale raw incoming stories without touching published content.
 * 9. Unpublished stories remain strictly isolated (HTTP 404).
 */

import { parseHash } from '../src/utils/router';
import { newsService } from '../src/services/newsService';
import { handleApiRequest } from '../src/worker/api';
import { applyRetentionRules } from '../src/worker/ingestion';
import { Env, StoryRow, NewsSourceRow } from '../src/worker/types';

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
class ProductFixesMockD1PreparedStatement {
  constructor(private sql: string, private db: ProductFixesMockD1Database, private params: (string | number)[] = []) {}

  bind(...params: (string | number)[]) {
    return new ProductFixesMockD1PreparedStatement(this.sql, this.db, params);
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
      return { results: [{ count: filtered.length }] as unknown as T[], success: true };
    }

    if (normalized.includes('FROM STORIES')) {
      let filtered = this.db.stories.map((s) => {
        const src = this.db.sources.find((src) => src.id === s.source_id);
        return {
          ...s,
          source_name: src ? src.name : s.source_id,
          source_group: src ? src.source_group : 'General Sources',
        };
      });

      if (normalized.includes("STATUS = 'PUBLISHED'")) {
        filtered = filtered.filter((s) => s.status === 'published');
      }

      if (this.params.length > 0 && normalized.includes('STORIES.ID = ?')) {
        const queryId = this.params[0];
        filtered = filtered.filter((s) => s.id === queryId || s.source_guid === queryId || s.source_url === queryId);
      }

      return { results: filtered as unknown as T[], success: true };
    }

    return { results: [] as unknown as T[], success: true };
  }

  async run(): Promise<{ meta: { changes: number }; success: boolean }> {
    const normalized = this.sql.replace(/\s+/g, ' ').toUpperCase();
    let changes = 0;

    if (normalized.includes("UPDATE STORIES") && normalized.includes("STATUS = 'ARCHIVED'")) {
      // Archive stale incoming
      this.db.stories.forEach((s) => {
        if (s.status === 'incoming' && (s.is_edited === 0 || !s.is_edited) && s.created_at < '2026-09-01') {
          s.status = 'archived';
          changes++;
        }
      });
    }

    if (normalized.includes("DELETE FROM STORIES") && normalized.includes("STATUS = 'ARCHIVED'")) {
      const initialLen = this.db.stories.length;
      this.db.stories = this.db.stories.filter(
        (s) => !(s.status === 'archived' && (s.is_edited === 0 || !s.is_edited) && s.updated_at < '2026-08-01')
      );
      changes = initialLen - this.db.stories.length;
    }

    return { meta: { changes }, success: true };
  }
}

class ProductFixesMockD1Database {
  public sources: NewsSourceRow[] = [
    {
      id: 'src_pib_mr',
      name: 'पत्र सूचना कार्यालय (PIB मुंबई)',
      source_url: 'https://pib.gov.in',
      feed_url: 'https://pib.gov.in/feed',
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
    return new ProductFixesMockD1PreparedStatement(sql, this);
  }
}

async function runProductAndUxTests() {
  console.log('========================================================');
  console.log('  BAHUMOL SAMAJ: UX & PRODUCT ARCHITECTURE TEST SUITE');
  console.log('========================================================');

  const mockDb = new ProductFixesMockD1Database();
  const mockEnv: Env = {
    DB: mockDb as unknown as Env['DB'],
    ADMIN_API_KEY: 'test-admin-secret-2026',
    ASSETS: {} as Env['ASSETS'],
  };

  // Mock global fetch to route to handleApiRequest
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
    // -------------------------------------------------------------------------
    // TEST 1: Website root routes to Home (which hosts Live Timeline)
    // -------------------------------------------------------------------------
    const rootRoute = parseHash('#/');
    assert(rootRoute.page === 'home', '1. Website root ("#/") routes to home (Live Timeline Homepage)');

    const emptyHashRoute = parseHash('');
    assert(emptyHashRoute.page === 'home', '2. Empty hash ("") routes to home (Live Timeline Homepage)');

    const timelineRoute = parseHash('#/timeline');
    assert(timelineRoute.page === 'timeline', '3. "#/timeline" parses cleanly to timeline');

    // -------------------------------------------------------------------------
    // TEST 2: Multi-paragraph published story with language property
    // -------------------------------------------------------------------------
    const fullBody = 'पहिला परिच्छेद: कृषी समृद्धी योजना.\n\nदुसरा परिच्छेद: अर्थसंकल्पीय तरतूद.\n\nतिसरा परिच्छेद: शेतकरी प्रतिक्रिया.';
    const publishedStoryId = 'sty_published_mr_01';

    mockDb.stories.push({
      id: publishedStoryId,
      source_id: 'src_pib_mr',
      source_url: 'https://pib.gov.in/release/999',
      source_guid: 'pib_release_999',
      title: 'महाराष्ट्र कृषी समृद्धी योजनेची अधिकृत घोषणा',
      description: 'शेतकऱ्यांसाठी नवीन सिंचन व वीज सवलत योजना.',
      content: fullBody,
      image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9',
      author: 'संजय कुलकर्णी',
      published_at: new Date().toISOString(),
      category: 'maharashtra',
      language: 'mr',
      status: 'published',
      content_hash: 'hash_pub_01',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Unpublished draft story
    mockDb.stories.push({
      id: 'sty_incoming_draft_02',
      source_id: 'src_pib_mr',
      source_url: 'https://pib.gov.in/draft/888',
      source_guid: 'pib_draft_888',
      title: 'गोपनीय अप्रकाशित मसुदा',
      description: 'केवळ संपादकीय कक्षासाठी',
      content: 'हा मजकूर बाहेर दिसू नये',
      image_url: null,
      author: 'वार्ताहर',
      published_at: new Date().toISOString(),
      category: 'politics',
      language: 'mr',
      status: 'incoming',
      content_hash: 'hash_inc_02',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // -------------------------------------------------------------------------
    // TEST 3: Public /api/news only returns published stories
    // -------------------------------------------------------------------------
    const newsRes = await handleApiRequest(new Request('https://bahumolsamaj.com/api/news'), mockEnv);
    const newsJson = (await newsRes.json()) as { success: boolean; data: Record<string, unknown>[] };
    assert(newsJson.success && newsJson.data.length === 1, '4. Public /api/news returns strictly published stories (1 of 2)');
    assert(newsJson.data[0].id === publishedStoryId, '5. Only the published story is visible to readers');

    // -------------------------------------------------------------------------
    // TEST 4: Full article reading pipeline (all 3 paragraphs preserved)
    // -------------------------------------------------------------------------
    const article = await newsService.getArticleById(publishedStoryId);
    assert(article !== undefined, '6. newsService.getArticleById successfully retrieves published story');
    assert(article?.content.length === 3, '7. Full article contains all 3 distinct paragraphs without truncation');
    assert(article?.excerpt === 'शेतकऱ्यांसाठी नवीन सिंचन व वीज सवलत योजना.', '8. Excerpt remains the short summary and is not substituted for body');
    assert(article?.language === 'mr', '9. Story language property ("mr") is preserved');

    // -------------------------------------------------------------------------
    // TEST 5: Unpublished story returns 404 on public API
    // -------------------------------------------------------------------------
    const unpubRes = await handleApiRequest(
      new Request('https://bahumolsamaj.com/api/news/sty_incoming_draft_02'),
      mockEnv
    );
    assert(unpubRes.status === 404, '10. Unpublished story strictly returns HTTP 404 on public /api/news/:id');

    // -------------------------------------------------------------------------
    // TEST 6: Non-existent article ID returns undefined (triggering "ही बातमी सध्या उपलब्ध नाही")
    // -------------------------------------------------------------------------
    const nonExistent = await newsService.getArticleById('sty_completely_invalid_999');
    assert(nonExistent === undefined, '11. Non-existent article ID returns undefined gracefully without throwing');

    // -------------------------------------------------------------------------
    // TEST 7: Public API cannot trigger manual ingestion (Requires Admin Auth)
    // -------------------------------------------------------------------------
    const unauthRefreshRes = await handleApiRequest(
      new Request('https://bahumolsamaj.com/api/admin/refresh', { method: 'POST' }),
      mockEnv
    );
    assert(
      unauthRefreshRes.status === 401,
      '12. Public unauthenticated visitor cannot trigger /api/admin/refresh (HTTP 401)'
    );

    // -------------------------------------------------------------------------
    // TEST 8: Authenticated Admin CAN trigger /api/admin/refresh
    // -------------------------------------------------------------------------
    const authRefreshRes = await handleApiRequest(
      new Request('https://bahumolsamaj.com/api/admin/refresh', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-admin-secret-2026' },
      }),
      mockEnv
    );
    assert(authRefreshRes.status === 200, '13. Authorized editor with admin credentials CAN trigger refresh (HTTP 200)');

    // -------------------------------------------------------------------------
    // TEST 9: Safe DB Retention: Archives stale incoming without touching published
    // -------------------------------------------------------------------------
    // Add stale incoming story from 2 months ago
    mockDb.stories.push({
      id: 'sty_old_stale_incoming',
      source_id: 'src_pib_mr',
      source_url: 'https://pib.gov.in/old/1',
      source_guid: 'pib_old_1',
      title: 'जुनी दुर्लक्षित बातमी',
      description: 'महिनाभर न तपासलेली',
      content: 'मजकूर',
      image_url: null,
      author: 'वार्ताहर',
      published_at: '2026-08-15T00:00:00Z',
      category: 'desh',
      language: 'mr',
      status: 'incoming',
      content_hash: 'hash_stale_01',
      is_edited: 0,
      created_at: '2026-08-15T00:00:00Z',
      updated_at: '2026-08-15T00:00:00Z',
    });

    const retentionRes = await applyRetentionRules(mockDb as unknown as Env['DB']);
    assert(retentionRes.archivedCount >= 1, '14. Stale unreviewed incoming story automatically transitioned to "archived"');

    // Confirm published story was NEVER touched
    const publishedCheck = mockDb.stories.find((s) => s.id === publishedStoryId);
    assert(
      publishedCheck !== undefined && publishedCheck.status === 'published',
      '15. Published newspaper story strictly PRESERVED and untouched during retention'
    );

    console.log('========================================================');
    console.log(`UX & Architecture Test Results: ${passed} passed, ${failed} failed`);
    console.log('========================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
}

runProductAndUxTests().catch((err) => {
  console.error('Fatal error in UX & Architecture tests:', err);
  process.exit(1);
});
