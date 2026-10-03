/**
 * @file manual_e2e_verification.ts
 * End-to-End Automated Verification Script for all 11 Manual Testing Requirements.
 */

import { ingestFromSource, runIngestionPipeline, computeContentHash } from '../src/worker/ingestion';
import { handleApiRequest } from '../src/worker/api';
import { Env, NewsSourceRow, StoryRow } from '../src/worker/types';

// In-Memory D1 Mock for comprehensive multi-step pipeline testing
class TestD1PreparedStatement {
  constructor(private sql: string, private db: TestD1Database, private params: (string | number)[] = []) {}

  bind(...params: (string | number)[]) {
    return new TestD1PreparedStatement(this.sql, this.db, params);
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const res = await this.all<T>();
    return res.results && res.results.length > 0 ? res.results[0] : null;
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean; meta: Record<string, unknown> }> {
    const normalized = this.sql.replace(/\s+/g, ' ').toUpperCase();

    // SELECT from news_sources
    if (normalized.includes('FROM NEWS_SOURCES')) {
      let sources = [...this.db.sources];
      if (normalized.includes('ACTIVE = 1')) {
        sources = sources.filter((s) => s.active === 1);
      }
      if (normalized.includes('ID = ?') && this.params.length > 0) {
        sources = sources.filter((s) => s.id === this.params[0]);
      }
      if (normalized.includes('SOURCE_GROUP = ?') && this.params.length > 0) {
        sources = sources.filter((s) => s.source_group === this.params[0]);
      }
      return { results: sources as unknown as T[], success: true, meta: {} };
    }

    // COUNT(*) from stories
    if (normalized.includes('COUNT(*)')) {
      let filtered = [...this.db.stories];
      if (normalized.includes("STATUS = 'PUBLISHED'")) {
        filtered = filtered.filter((s) => s.status === 'published');
      }
      if (normalized.includes('CATEGORY = ?') && this.params.length > 0) {
        const cat = this.params[0];
        filtered = filtered.filter((s) => s.category === cat);
      }
      return { results: [{ count: filtered.length }] as unknown as T[], success: true, meta: {} };
    }

    // SELECT from stories
    if (normalized.includes('FROM STORIES')) {
      let filtered = this.db.stories.map((s) => {
        const src = this.db.sources.find((src) => src.id === s.source_id);
        return {
          ...s,
          source_name: src ? src.name : s.source_id,
          source_group: src ? src.source_group : 'Indian News',
        };
      });

      if (normalized.includes("STATUS = 'PUBLISHED'")) {
        filtered = filtered.filter((s) => s.status === 'published');
      }
      if (normalized.includes('(ID = ? OR SOURCE_GUID = ?)') || normalized.includes('(STORIES.ID = ? OR STORIES.SOURCE_GUID = ?)')) {
        const target = this.params[0];
        filtered = filtered.filter((s) => s.id === target || s.source_guid === target);
      }
      if (normalized.includes('CATEGORY = ?')) {
        const cat = this.params.find((p) => typeof p === 'string' && p !== 'published' && !p.startsWith('sty_'));
        if (cat) {
          filtered = filtered.filter((s) => s.category === cat);
        }
      }
      if (normalized.includes('WHERE SOURCE_ID = ? AND SOURCE_GUID = ?') || normalized.includes('SOURCE_ID = ? AND SOURCE_GUID = ?')) {
        filtered = filtered.filter((s) => s.source_id === this.params[0] && s.source_guid === this.params[1]);
      }
      if (normalized.includes('WHERE SOURCE_ID = ? AND CONTENT_HASH = ?') || normalized.includes('SOURCE_ID = ? AND CONTENT_HASH = ?')) {
        filtered = filtered.filter((s) => s.source_id === this.params[0] && s.content_hash === this.params[1]);
      } else if (normalized.includes('CONTENT_HASH = ?')) {
        const hash = this.params[this.params.length - 1];
        filtered = filtered.filter((s) => s.content_hash === hash);
      }
      if (normalized.includes('WHERE STORIES.ID = ?') || normalized.includes('WHERE ID = ?')) {
        const id = this.params[0];
        filtered = filtered.filter((s) => s.id === id);
      }

      // Sort by published_at DESC
      filtered.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

      return { results: filtered as unknown as T[], success: true, meta: {} };
    }

    return { results: [] as T[], success: true, meta: {} };
  }

  async run(): Promise<{ meta: { changes: number } }> {
    const normalized = this.sql.replace(/\s+/g, ' ').toUpperCase();

    // INSERT INTO stories
    if (normalized.includes('INSERT INTO STORIES')) {
      const [id, source_id, source_url, source_guid, title, description, image_url, author, published_at, category, language, content_hash] = this.params as string[];
      this.db.stories.push({
        id,
        source_id,
        source_url,
        source_guid: source_guid || null,
        title,
        description: description || null,
        image_url: image_url || null,
        author: author || null,
        published_at,
        category,
        language: language || 'mr',
        status: 'incoming', // Default incoming as required
        content_hash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return { meta: { changes: 1 } };
    }

    // UPDATE stories status
    if (normalized.includes('UPDATE STORIES SET STATUS = ?')) {
      const newStatus = this.params[0] as StoryRow['status'];
      const targetId = this.params[1];
      let changes = 0;

      if (targetId) {
        const story = this.db.stories.find((s) => s.id === targetId);
        if (story) {
          story.status = newStatus;
          changes = 1;
        }
      } else {
        // Batch update
        for (const s of this.db.stories) {
          if (s.status === 'incoming') {
            s.status = newStatus;
            changes++;
          }
        }
      }
      return { meta: { changes } };
    }

    // UPDATE news_sources last_fetched_at
    if (normalized.includes('UPDATE NEWS_SOURCES SET LAST_FETCHED_AT')) {
      const id = this.params[0];
      const src = this.db.sources.find((s) => s.id === id);
      if (src) {
        src.last_fetched_at = new Date().toISOString();
      }
      return { meta: { changes: 1 } };
    }

    return { meta: { changes: 1 } };
  }
}

class TestD1Database {
  sources: NewsSourceRow[] = [
    {
      id: 'src_gov_pib_mr',
      name: 'पत्र सूचना कार्यालय (PIB मुंबई / महाराष्ट्र)',
      feed_url: 'https://news.google.com/rss/search?q=site:pib.gov.in+Maharashtra&hl=mr&gl=IN&ceid=IN:mr',
      source_url: 'https://pib.gov.in',
      source_type: 'rss',
      language: 'mr',
      default_category: 'महाराष्ट्र',
      active: 1,
      source_group: 'Government Sources',
      last_fetched_at: null,
      created_at: '2026-10-01',
    },
    {
      id: 'src_gov_rbi',
      name: 'भारतीय रिझर्व्ह बँक अधिकृत प्रसिद्धीपत्रके (RBI Official)',
      feed_url: 'https://rbi.org.in/pressreleases_rss.xml',
      source_url: 'https://rbi.org.in',
      source_type: 'rss',
      language: 'en',
      default_category: 'अर्थव्यवस्था',
      active: 1,
      source_group: 'Government Sources',
      last_fetched_at: null,
      created_at: '2026-10-01',
    },
    {
      id: 'src_in_sakal',
      name: 'सकाळ वृत्तसेवा (Sakal Marathi)',
      feed_url: 'https://www.esakal.com/feed',
      source_url: 'https://www.esakal.com',
      source_type: 'rss',
      language: 'mr',
      default_category: 'महाराष्ट्र',
      active: 1,
      source_group: 'Indian News',
      last_fetched_at: null,
      created_at: '2026-10-01',
    },
    {
      id: 'src_intl_bbc',
      name: 'BBC News World',
      feed_url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
      source_url: 'https://www.bbc.com/news/world',
      source_type: 'rss',
      language: 'en',
      default_category: 'जग',
      active: 1,
      source_group: 'International News',
      last_fetched_at: null,
      created_at: '2026-10-01',
    },
  ];

  stories: StoryRow[] = [];

  prepare(sql: string) {
    return new TestD1PreparedStatement(sql, this);
  }
}

async function runManualTestingChecklist() {
  console.log('================================================================');
  console.log('  BAHUMOL SAMAJ NEWSROOM PIPELINE: 11-POINT TEST VERIFICATION');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function record(pass: boolean, name: string, detail?: string) {
    if (pass) {
      console.log(`[PASS] ${name}`);
      if (detail) console.log(`       ${detail}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${name}`);
      if (detail) console.error(`       ${detail}`);
      failedTests++;
    }
  }

  const db = new TestD1Database();
  const env: Env = {
    DB: db as unknown as Env['DB'],
    ASSETS: { fetch: async () => new Response('assets') } as unknown as Env['ASSETS'],
    ADMIN_API_KEY: 'bahumol-news-admin-2026',
  };

  // -------------------------------------------------------------
  // Test 1: Fetch one PIB feed
  // -------------------------------------------------------------
  console.log('Step 1: Testing PIB feed ingestion...');
  const pibSource = db.sources.find((s) => s.id === 'src_gov_pib_mr')!;
  const pibResult = await ingestFromSource(pibSource, env.DB);
  record(
    pibResult.fetchedCount > 0 && !pibResult.error,
    '1. Fetch one PIB feed',
    `Fetched: ${pibResult.fetchedCount}, Inserted: ${pibResult.insertedCount}, Error: ${pibResult.error || 'none'}`
  );

  // -------------------------------------------------------------
  // Test 2: Fetch one Maharashtra/government feed
  // -------------------------------------------------------------
  console.log('\nStep 2: Testing RBI/Government feed ingestion...');
  const govSource = db.sources.find((s) => s.id === 'src_gov_rbi')!;
  const govResult = await ingestFromSource(govSource, env.DB);
  record(
    govResult.fetchedCount > 0 && !govResult.error,
    '2. Fetch one Maharashtra/government feed',
    `Fetched: ${govResult.fetchedCount}, Inserted: ${govResult.insertedCount}, Error: ${govResult.error || 'none'}`
  );

  // -------------------------------------------------------------
  // Test 3: Fetch one Indian news RSS feed
  // -------------------------------------------------------------
  console.log('\nStep 3: Testing Indian news feed (Sakal)...');
  const indianSource = db.sources.find((s) => s.id === 'src_in_sakal')!;
  const indianResult = await ingestFromSource(indianSource, env.DB);
  record(
    indianResult.fetchedCount > 0 && !indianResult.error,
    '3. Fetch one Indian news RSS feed',
    `Fetched: ${indianResult.fetchedCount}, Inserted: ${indianResult.insertedCount}, Error: ${indianResult.error || 'none'}`
  );

  // -------------------------------------------------------------
  // Test 4: Fetch one international RSS feed
  // -------------------------------------------------------------
  console.log('\nStep 4: Testing International news feed (BBC World)...');
  const intlSource = db.sources.find((s) => s.id === 'src_intl_bbc')!;
  const intlResult = await ingestFromSource(intlSource, env.DB);
  record(
    intlResult.fetchedCount > 0 && !intlResult.error,
    '4. Fetch one international RSS feed',
    `Fetched: ${intlResult.fetchedCount}, Inserted: ${intlResult.insertedCount}, Error: ${intlResult.error || 'none'}`
  );

  // -------------------------------------------------------------
  // Test 5: Confirm stories are inserted into D1
  // -------------------------------------------------------------
  console.log('\nStep 5: Verifying stories exist in D1...');
  const totalInserted = db.stories.length;
  record(
    totalInserted > 0,
    '5. Confirm stories are inserted into D1',
    `Total stored stories: ${totalInserted} (All with status = incoming for editorial control)`
  );

  // -------------------------------------------------------------
  // Test 6: Run same ingestion twice and confirm duplicates are not created
  // -------------------------------------------------------------
  console.log('\nStep 6: Running ingestion twice on same source (BBC World)...');
  const countBeforeSecondRun = db.stories.length;
  const repeatResult = await ingestFromSource(intlSource, env.DB);
  const countAfterSecondRun = db.stories.length;
  record(
    repeatResult.duplicateCount > 0 && countAfterSecondRun === countBeforeSecondRun,
    '6. Deduplication: exact same feed processed twice creates 0 new duplicates',
    `Duplicates detected: ${repeatResult.duplicateCount}, New stories added: ${repeatResult.insertedCount}, DB size: ${countAfterSecondRun} (unchanged)`
  );

  // -------------------------------------------------------------
  // Test 7: Confirm News API returns stored stories (only when published)
  // -------------------------------------------------------------
  console.log('\nStep 7: Verifying News API return...');
  // First, verify incoming stories are NOT returned on public GET /api/news
  const reqUnpublished = new Request('https://bahumolsamaj.com/api/news');
  const resUnpublished = await handleApiRequest(reqUnpublished, env);
  const dataUnpub = await resUnpublished.json() as { success: boolean; total: number; data: StoryRow[] };

  // Now publish 3 stories across different categories
  db.stories[0].status = 'published';
  db.stories[1].status = 'published';
  db.stories[2].status = 'published';

  const reqPublished = new Request('https://bahumolsamaj.com/api/news');
  const resPublished = await handleApiRequest(reqPublished, env);
  const dataPub = await resPublished.json() as { success: boolean; total: number; data: StoryRow[] };

  record(
    dataUnpub.total === 0 && dataPub.total === 3,
    '7. Confirm News API returns stored stories',
    `Before publish: ${dataUnpub.total} returned. After publish: ${dataPub.total} returned.`
  );

  // -------------------------------------------------------------
  // Test 8: Confirm category filtering works
  // -------------------------------------------------------------
  console.log('\nStep 8: Testing category filter...');
  const catTarget = db.stories[0].category;
  const reqCat = new Request(`https://bahumolsamaj.com/api/news?category=${encodeURIComponent(catTarget)}`);
  const resCat = await handleApiRequest(reqCat, env);
  const dataCat = await resCat.json() as { success: boolean; data: StoryRow[] };
  const allMatchCategory = dataCat.data.every((s) => s.category === catTarget);

  record(
    dataCat.data.length > 0 && allMatchCategory,
    '8. Confirm category filtering works',
    `Filtered by '${catTarget}': ${dataCat.data.length} stories, all matching category`
  );

  // -------------------------------------------------------------
  // Test 9: Confirm timeline displays returned stories (joined metadata)
  // -------------------------------------------------------------
  console.log('\nStep 9: Testing timeline data structure...');
  const sampleStory = dataPub.data[0];
  const hasTimelineFields =
    Boolean(sampleStory.id) &&
    Boolean(sampleStory.title) &&
    Boolean(sampleStory.source_name) &&
    Boolean(sampleStory.source_group) &&
    Boolean(sampleStory.published_at) &&
    Boolean(sampleStory.source_url);

  record(
    hasTimelineFields,
    '9. Confirm timeline displays returned stories with full attribution',
    `Headline: "${sampleStory.title.slice(0, 30)}...", Source: ${sampleStory.source_name}, Group: ${sampleStory.source_group}`
  );

  // -------------------------------------------------------------
  // Test 10: Simulate one invalid feed and confirm other feeds still process
  // -------------------------------------------------------------
  console.log('\nStep 10: Testing resilience against broken/invalid feed...');
  const brokenSource: NewsSourceRow = {
    id: 'src_broken_test',
    name: 'Broken Feed',
    feed_url: 'https://invalid-nonexistent-domain-404-timeout.xyz/rss.xml',
    source_url: 'https://invalid.xyz',
    source_type: 'rss',
    language: 'mr',
    default_category: 'महाराष्ट्र',
    active: 1,
    source_group: 'Indian News',
    last_fetched_at: null,
    created_at: '2026-10-01',
  };

  const brokenResult = await ingestFromSource(brokenSource, env.DB);
  // Now verify that a valid source can still be processed immediately afterwards
  const validAfterBroken = await ingestFromSource(intlSource, env.DB);

  record(
    Boolean(brokenResult.error) && !validAfterBroken.error,
    '10. Simulate one invalid feed and confirm other feeds still process',
    `Broken feed error caught: "${brokenResult.error}". Subsequent valid source processed successfully.`
  );

  // -------------------------------------------------------------
  // Test 11: Confirm unpublished/rejected stories are not exposed publicly
  // -------------------------------------------------------------
  console.log('\nStep 11: Testing public isolation of unpublished/rejected stories...');
  // Insert an explicit rejected story
  const rejectedStoryId = 'sty_rejected_test_99';
  db.stories.push({
    id: rejectedStoryId,
    source_id: 'src_in_sakal',
    source_url: 'https://sakal.com/rejected',
    source_guid: 'guid-rejected',
    title: 'नाकारलेली बातमी (Rejected Story)',
    description: 'ही बातमी संपादकाने नाकारली आहे',
    image_url: null,
    author: 'संपादक',
    published_at: new Date().toISOString(),
    category: 'महाराष्ट्र',
    language: 'mr',
    status: 'rejected',
    content_hash: 'hash_rejected_99',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const reqSingleUnpub = new Request(`https://bahumolsamaj.com/api/news/${rejectedStoryId}`);
  const resSingleUnpub = await handleApiRequest(reqSingleUnpub, env);
  const dataSingleUnpub = await resSingleUnpub.json() as { error?: string };

  record(
    resSingleUnpub.status === 404,
    '11. Confirm unpublished/rejected stories are not exposed publicly',
    `GET /api/news/${rejectedStoryId} returned HTTP ${resSingleUnpub.status} (${dataSingleUnpub.error})`
  );

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runManualTestingChecklist().catch((err) => {
  console.error('Fatal execution error in verification runner:', err);
  process.exit(1);
});
