/**
 * @file test_api_worker.ts
 * In-process integration test for Worker API router and D1 newsroom queries.
 */

import { handleApiRequest } from '../src/worker/api';
import { Env, StoryRow, NewsSourceRow } from '../src/worker/types';

// Mock in-memory D1 implementation to verify router logic with zero network overhead
class MockD1PreparedStatement {
  constructor(private sql: string, private db: MockD1Database, private params: (string | number)[] = []) {}

  bind(...params: (string | number)[]) {
    return new MockD1PreparedStatement(this.sql, this.db, params);
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const res = await this.all<T>();
    return res.results && res.results.length > 0 ? res.results[0] : null;
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean; meta: Record<string, unknown> }> {
    const upper = this.sql.toUpperCase();
    if (upper.includes('FROM NEWS_SOURCES')) {
      const active = this.db.sources.filter((s) => s.active === 1);
      return { results: active as unknown as T[], success: true, meta: {} };
    }

    if (upper.includes('COUNT(*)')) {
      let filtered = this.db.stories.filter((s) => s.status === 'published');
      if (this.sql.includes('category = ?') && this.params.length > 0) {
        filtered = filtered.filter((s) => s.category === this.params[0]);
      }
      return { results: [{ count: filtered.length }] as unknown as T[], success: true, meta: {} };
    }

    if (upper.includes('FROM STORIES')) {
      let filtered = [...this.db.stories];
      if (this.sql.includes("status = 'published'")) {
        filtered = filtered.filter((s) => s.status === 'published');
      }
      if (this.sql.includes('(id = ? OR source_guid = ?)')) {
        const target = this.params[0];
        filtered = filtered.filter((s) => s.id === target || s.source_guid === target);
      }
      if (this.sql.includes('category = ?')) {
        const cat = this.params[0];
        filtered = filtered.filter((s) => s.category === cat);
      }
      if (this.sql.includes('id = ?')) {
        const id = this.params[0];
        filtered = filtered.filter((s) => s.id === id);
      }
      return { results: filtered as unknown as T[], success: true, meta: {} };
    }

    return { results: [] as T[], success: true, meta: {} };
  }

  async run(): Promise<{ meta: { changes: number } }> {
    if (this.sql.includes('UPDATE stories SET status = ?')) {
      const newStatus = this.params[0] as StoryRow['status'];
      const id = this.params[1];
      const story = this.db.stories.find((s) => s.id === id);
      if (story) {
        story.status = newStatus;
        return { meta: { changes: 1 } };
      }
      return { meta: { changes: 0 } };
    }
    return { meta: { changes: 1 } };
  }
}

class MockD1Database {
  sources: NewsSourceRow[] = [
    {
      id: 'src_pib_mr',
      name: 'पत्र सूचना कार्यालय (PIB मुंबई - मराठी)',
      feed_url: 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=4',
      source_url: 'https://pib.gov.in',
      source_type: 'rss',
      language: 'mr',
      default_category: 'महाराष्ट्र',
      active: 1,
      last_fetched_at: '2026-10-02T00:00:00Z',
      created_at: '2026-10-01T00:00:00Z',
    },
  ];

  stories: StoryRow[] = [
    {
      id: 'sty_pub_1',
      source_id: 'src_pib_mr',
      source_url: 'https://pib.gov.in/1',
      source_guid: 'guid-1',
      title: 'महाराष्ट्र अर्थसंकल्प: ग्रामीण सिंचन योजना',
      description: '७५ हजार कोटींची ऐतिहासिक तरतूद',
      image_url: null,
      author: 'ब्युरो',
      published_at: '2026-10-02T08:00:00Z',
      category: 'महाराष्ट्र',
      language: 'mr',
      status: 'published',
      content_hash: 'hash1',
      created_at: '2026-10-02T08:00:00Z',
      updated_at: '2026-10-02T08:00:00Z',
    },
    {
      id: 'sty_inc_2',
      source_id: 'src_pib_mr',
      source_url: 'https://pib.gov.in/2',
      source_guid: 'guid-2',
      title: 'अप्रकाशित चाचणी बातमी',
      description: 'ही बातमी अजून प्रकाशित नाही',
      image_url: null,
      author: 'ब्युरो',
      published_at: '2026-10-02T09:00:00Z',
      category: 'महाराष्ट्र',
      language: 'mr',
      status: 'incoming', // Unpublished!
      content_hash: 'hash2',
      created_at: '2026-10-02T09:00:00Z',
      updated_at: '2026-10-02T09:00:00Z',
    },
    {
      id: 'sty_pub_3',
      source_id: 'src_pib_mr',
      source_url: 'https://pib.gov.in/3',
      source_guid: 'guid-3',
      title: 'शेती हमीभाव खरेदी सुरू',
      description: 'कापूस व सोयाबीन खरेदी',
      image_url: null,
      author: 'ब्युरो',
      published_at: '2026-10-02T10:00:00Z',
      category: 'अर्थव्यवस्था',
      language: 'mr',
      status: 'published',
      content_hash: 'hash3',
      created_at: '2026-10-02T10:00:00Z',
      updated_at: '2026-10-02T10:00:00Z',
    },
  ];

  prepare(sql: string) {
    return new MockD1PreparedStatement(sql, this);
  }
}

async function runApiTests() {
  console.log('--- Worker REST API Integration Tests ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${msg}`);
      failed++;
    }
  }

  const db = new MockD1Database();
  const env: Env = {
    DB: db as unknown as Env['DB'],
    ASSETS: { fetch: async () => new Response('assets') } as unknown as Env['ASSETS'],
    ADMIN_API_KEY: 'test-admin-secret-key',
  };

  // Test 1: GET /api/sources
  {
    const req = new Request('https://bahumolsamaj.com/api/sources');
    const res = await handleApiRequest(req, env);
    const data = await res.json() as { success: boolean; sources: unknown[] };
    assert(res.status === 200, 'GET /api/sources returns status 200');
    assert(data.success && data.sources.length === 1, 'GET /api/sources returns active sources');
  }

  // Test 2: GET /api/news (only published returned)
  {
    const req = new Request('https://bahumolsamaj.com/api/news');
    const res = await handleApiRequest(req, env);
    const data = await res.json() as { success: boolean; data: StoryRow[]; total: number };
    assert(res.status === 200, 'GET /api/news returns status 200');
    assert(data.total === 2, `GET /api/news returns only published stories (expected 2, got ${data.total})`);
    const containsIncoming = data.data.some((s) => s.status === 'incoming');
    assert(!containsIncoming, 'Unpublished stories are NOT returned by GET /api/news');
  }

  // Test 3: GET /api/news?category=अर्थव्यवस्था (category filter)
  {
    const req = new Request('https://bahumolsamaj.com/api/news?category=' + encodeURIComponent('अर्थव्यवस्था'));
    const res = await handleApiRequest(req, env);
    const data = await res.json() as { success: boolean; data: StoryRow[]; total: number };
    assert(res.status === 200, 'GET /api/news?category=अर्थव्यवस्था returns 200');
    assert(data.total === 1, `Category filter returned 1 story (got ${data.total})`);
    assert(data.data[0].category === 'अर्थव्यवस्था', 'Returned story belongs to अर्थव्यवस्था category');
  }

  // Test 4: GET /api/news/:id
  {
    const req = new Request('https://bahumolsamaj.com/api/news/sty_pub_1');
    const res = await handleApiRequest(req, env);
    assert(res.status === 200, 'GET /api/news/:id returns 200 for published story');

    const reqUnpublished = new Request('https://bahumolsamaj.com/api/news/sty_inc_2');
    const resUnpublished = await handleApiRequest(reqUnpublished, env);
    assert(resUnpublished.status === 404, 'GET /api/news/:id returns 404 for unpublished incoming story');
  }

  // Test 5: Protected Ingestion Refresh (Security check)
  {
    const reqUnauth = new Request('https://bahumolsamaj.com/api/admin/refresh', { method: 'POST' });
    const resUnauth = await handleApiRequest(reqUnauth, env);
    assert(resUnauth.status === 401, 'POST /api/admin/refresh rejects unauthenticated requests with 401');

    const reqAuth = new Request('https://bahumolsamaj.com/api/admin/refresh', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-admin-secret-key' },
    });
    const resAuth = await handleApiRequest(reqAuth, env);
    assert(resAuth.status === 200, 'POST /api/admin/refresh accepts authorized admin requests');
  }

  // Test 6: Status transition (Approve/Publish an incoming story)
  {
    const reqStatus = new Request('https://bahumolsamaj.com/api/admin/stories/sty_inc_2/status', {
      method: 'POST',
      headers: {
        'X-Admin-Key': 'test-admin-secret-key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'published' }),
    });
    const resStatus = await handleApiRequest(reqStatus, env);
    assert(resStatus.status === 200, 'POST status update returns 200');

    // Now sty_inc_2 should be published and accessible
    const reqNowPublished = new Request('https://bahumolsamaj.com/api/news/sty_inc_2');
    const resNowPublished = await handleApiRequest(reqNowPublished, env);
    assert(resNowPublished.status === 200, 'Formerly incoming story is now accessible after publishing');
  }

  console.log(`\n========================================`);
  console.log(`API Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runApiTests().catch((err) => {
  console.error('API Test runner failure:', err);
  process.exit(1);
});
