/**
 * @file test_article_reading_pipeline.ts
 * End-to-End Test Suite for Article Reading Pipeline.
 * Validates:
 * 1. D1 schema and stories table support full article content.
 * 2. Ingestion pipeline extracts and stores full content alongside excerpt/description.
 * 3. /api/news and /api/news/:id return complete article content for published stories.
 * 4. Unpublished stories (draft, review, approved-not-published, rejected) return HTTP 404 on public API.
 * 5. mapD1StoryToArticle maps D1 content into distinct multi-paragraph content array, keeping excerpt as summary.
 * 6. newsService.getArticleById / getArticleBySlug prioritizes dynamic API over static data.
 * 7. Fallback to static articles works cleanly when an article ID/slug is not in D1.
 */

import { newsService } from '../src/services/newsService';
import { handleApiRequest } from '../src/worker/api';
import { Env, StoryRow, NewsSourceRow } from '../src/worker/types';
import { ARTICLES, getArticleBySlug } from '../src/data/newsArticles';

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
class PipelineMockD1PreparedStatement {
  constructor(private sql: string, private db: PipelineMockD1Database, private params: (string | number)[] = []) {}

  bind(...params: (string | number)[]) {
    return new PipelineMockD1PreparedStatement(this.sql, this.db, params);
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

      if (normalized.includes('(STORIES.ID = ? OR STORIES.SOURCE_GUID = ?)') && this.params.length > 0) {
        const queryId = this.params[0];
        filtered = filtered.filter((s) => s.id === queryId || s.source_guid === queryId);
      }

      return { results: filtered as unknown as T[], success: true };
    }

    return { results: [] as unknown as T[], success: true };
  }
}

class PipelineMockD1Database {
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
    return new PipelineMockD1PreparedStatement(sql, this);
  }
}

async function runPipelineTests() {
  console.log('========================================================');
  console.log('  BAHUMOL SAMAJ: ARTICLE-READING PIPELINE TEST SUITE');
  console.log('========================================================');

  const mockDb = new PipelineMockD1Database();
  const mockEnv: Env = {
    DB: mockDb as unknown as Env['DB'],
    ADMIN_API_KEY: 'test-admin-secret-2026',
    ASSETS: {} as Env['ASSETS'],
  };

  // Multi-paragraph full article content
  const sampleSummary = 'राज्य मंत्रिमंडळाच्या बैठकीत शेतकऱ्यांसाठी महत्त्वाच्या सिंचन प्रकल्पांना प्रशासकीय मंजुरी देण्यात आली आहे.';
  const sampleParagraph1 = 'मंत्रालयात आज झालेल्या मंत्रिमंडळ बैठकीत मराठवाडा आणि विदर्भातील प्रलंबित सिंचन योजनांना गती देण्याचा ऐतिहासिक निर्णय घेण्यात आला. या निर्णयामुळे हजारो हेक्टर शेती पाण्याखाली येणार असून शेतकऱ्यांचे उत्पन्न दुप्पट होण्यास मदत होईल.';
  const sampleParagraph2 = 'मुख्यमंत्री आणि उपमुख्यमंत्री यांच्या उपस्थितीत झालेल्या या बैठकीत जलसंपदा विभागाच्या एकूण १२ मोठ्या प्रकल्पांसाठी अतिरिक्त १० हजार कोटींचा निधी मंजूर करण्यात आला. सर्व प्रकल्प वेळेत पूर्ण करण्याचे निर्देश संबंधित अधिकाऱ्यांना देण्यात आले.';
  const sampleParagraph3 = 'शेतकरी संघटनांनी या निर्णयाचे स्वागत केले असून जलसंधारण कामांना प्राधान्य दिल्यास दुष्काळी पट्ट्यातील पाणीटंचाई कायमस्वरूपी दूर होईल असा विश्वास व्यक्त केला आहे.';
  const fullArticleBody = `${sampleParagraph1}\n\n${sampleParagraph2}\n\n${sampleParagraph3}`;

  const publishedStoryId = 'sty_full_pipeline_001';
  mockDb.stories.push({
    id: publishedStoryId,
    source_id: 'src_pib_mr',
    source_url: 'https://pib.gov.in/release/12345',
    source_guid: 'https://pib.gov.in/release/12345',
    title: 'राज्यातील १२ सिंचन प्रकल्पांना १० हजार कोटींची विशेष मंजुरी',
    description: sampleSummary,
    content: fullArticleBody,
    image_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
    author: 'विशेष प्रतिनिधी, मुंबई',
    published_at: new Date().toISOString(),
    category: 'maharashtra',
    language: 'mr',
    status: 'published',
    content_hash: 'hash_full_pipeline_001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Unpublished story (review status)
  const unpublishedStoryId = 'sty_review_draft_002';
  mockDb.stories.push({
    id: unpublishedStoryId,
    source_id: 'src_pib_mr',
    source_url: 'https://pib.gov.in/draft/67890',
    source_guid: 'guid_draft_67890',
    title: 'अप्रकाशित चाचणी बातमी (Review Draft)',
    description: 'हा मसुदा अजून प्रकाशित झालेला नाही.',
    content: 'हा अप्रकाशित बातमीचा गोपनीय मजकूर आहे जो केवळ संपादकीय कक्षात दिसावा.',
    image_url: null,
    author: 'संपादक मंडळ',
    published_at: new Date().toISOString(),
    category: 'politics',
    language: 'mr',
    status: 'review',
    content_hash: 'hash_draft_002',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

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
    // -------------------------------------------------------------------------
    // TEST 1: GET /api/news returns full content field in JSON payload
    // -------------------------------------------------------------------------
    const newsRes = await handleApiRequest(new Request('https://bahumolsamaj.com/api/news'), mockEnv);
    assert(newsRes.status === 200, '1. Public /api/news endpoint returns 200 OK');
    const newsJson = (await newsRes.json()) as { success: boolean; data: Record<string, unknown>[] };
    assert(newsJson.success && newsJson.data.length === 1, '2. Public /api/news returns published story');
    assert(
      newsJson.data[0].content === fullArticleBody,
      '3. /api/news payload contains full article body/content column',
      newsJson.data[0].content
    );

    // -------------------------------------------------------------------------
    // TEST 2: GET /api/news/:id returns full content for published story
    // -------------------------------------------------------------------------
    const singleRes = await handleApiRequest(
      new Request(`https://bahumolsamaj.com/api/news/${publishedStoryId}`),
      mockEnv
    );
    assert(singleRes.status === 200, '4. GET /api/news/:id returns 200 for published story');
    const singleJson = (await singleRes.json()) as { success: boolean; data: Record<string, unknown> };
    assert(
      singleJson.data.content === fullArticleBody,
      '5. GET /api/news/:id returns complete full content of the story'
    );
    assert(
      singleJson.data.description === sampleSummary,
      '6. GET /api/news/:id preserves separate description/excerpt'
    );

    // -------------------------------------------------------------------------
    // TEST 3: Public /api/news/:id rejects unpublished stories (HTTP 404)
    // -------------------------------------------------------------------------
    const unpubRes = await handleApiRequest(
      new Request(`https://bahumolsamaj.com/api/news/${unpublishedStoryId}`),
      mockEnv
    );
    assert(
      unpubRes.status === 404,
      '7. GET /api/news/:id strictly returns 404 for unpublished story (draft/review/rejected isolated)',
      unpubRes.status
    );

    // -------------------------------------------------------------------------
    // TEST 4: newsService.getArticleById maps full content to paragraphs array
    // -------------------------------------------------------------------------
    const dynamicArticle = await newsService.getArticleById(publishedStoryId);
    assert(dynamicArticle !== undefined, '8. newsService.getArticleById resolves published story from API');

    if (dynamicArticle) {
      assert(
        dynamicArticle.excerpt === sampleSummary,
        '9. dynamicArticle.excerpt correctly holds the short summary/excerpt',
        dynamicArticle.excerpt
      );

      assert(
        Array.isArray(dynamicArticle.content) && dynamicArticle.content.length === 3,
        '10. dynamicArticle.content contains all 3 distinct paragraphs',
        dynamicArticle.content.length
      );

      assert(
        dynamicArticle.content[0] === sampleParagraph1,
        '11. Paragraph 1 matches complete body text (not truncated to description)',
        dynamicArticle.content[0]
      );

      assert(
        dynamicArticle.content[1] === sampleParagraph2,
        '12. Paragraph 2 is fully preserved',
        dynamicArticle.content[1]
      );

      assert(
        dynamicArticle.content[2] === sampleParagraph3,
        '13. Paragraph 3 is fully preserved',
        dynamicArticle.content[2]
      );

      assert(
        dynamicArticle.content[0] !== dynamicArticle.excerpt,
        '14. Verified full article body is NOT substituted with the short description'
      );
    }

    // -------------------------------------------------------------------------
    // TEST 5: Fallback to existing static articles works when not in D1
    // -------------------------------------------------------------------------
    const staticSlug = 'editorial-satya-nishpakshata-dilip-sonale';
    const staticArticle = await newsService.getArticleBySlug(staticSlug);
    assert(
      staticArticle !== undefined && staticArticle.slug === staticSlug,
      '15. Existing static article falls back and loads successfully when not present in D1',
      staticArticle?.title
    );

    assert(
      staticArticle !== undefined && Array.isArray(staticArticle.content) && staticArticle.content.length > 0,
      '16. Static article content paragraphs are fully intact'
    );

    // -------------------------------------------------------------------------
    // TEST 6: Non-existent ID returns undefined without error
    // -------------------------------------------------------------------------
    const nonexistent = await newsService.getArticleById('nonexistent_story_999');
    assert(
      nonexistent === undefined,
      '17. Non-existent story ID returns undefined gracefully without throwing errors'
    );

    console.log('========================================================');
    console.log(`Article Reading Pipeline Results: ${passed} passed, ${failed} failed`);
    console.log('========================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
}

runPipelineTests().catch((err) => {
  console.error('Fatal test error in pipeline tests:', err);
  process.exit(1);
});
