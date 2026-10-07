/**
 * @file test_editorial_dashboard.ts
 * Comprehensive Test Suite for Editorial Dashboard and API Operations.
 * Uses Production Session Authentication.
 */

import { handleApiRequest } from '../src/worker/api';
import { Env, StoryRow, NewsSourceRow, EditorialSessionRow } from '../src/worker/types';

class MockPreparedStatement {
  constructor(private sql: string, private db: MockDatabase, private params: (string | number)[] = []) {}

  bind(...params: (string | number)[]) {
    return new MockPreparedStatement(this.sql, this.db, params);
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const res = await this.all<T>();
    return res.results && res.results.length > 0 ? res.results[0] : null;
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean; meta: Record<string, unknown> }> {
    const normalized = this.sql.replace(/\s+/g, ' ').toUpperCase();

    // SELECT from editorial_sessions
    if (normalized.includes('FROM EDITORIAL_SESSIONS')) {
      const sessionId = this.params[0] as string;
      const now = new Date();
      const valid = this.db.sessions.filter(
        (s) => s.id === sessionId && new Date(s.expires_at) > now
      );
      return { results: valid as unknown as T[], success: true, meta: {} };
    }

    // Group stats: SELECT status, COUNT(*) as count FROM stories GROUP BY status
    if (normalized.includes('COUNT(*)') && normalized.includes('GROUP BY STATUS')) {
      const counts: Record<string, number> = {};
      for (const s of this.db.stories) {
        counts[s.status] = (counts[s.status] || 0) + 1;
      }
      const results = Object.entries(counts).map(([status, count]) => ({ status, count }));
      return { results: results as unknown as T[], success: true, meta: {} };
    }

    // COUNT(*) queries
    if (normalized.includes('COUNT(*)')) {
      let filtered = [...this.db.stories];
      if (normalized.includes("STORIES.STATUS = 'PUBLISHED'") || normalized.includes("STATUS = 'PUBLISHED'")) {
        filtered = filtered.filter((s) => s.status === 'published');
      }
      if (normalized.includes("STORIES.STATUS = 'INCOMING'") || normalized.includes("STATUS = 'INCOMING'")) {
        filtered = filtered.filter((s) => s.status === 'incoming');
      }
      if (normalized.includes('STORIES.STATUS = ?') || normalized.includes('STATUS = ?')) {
        const targetStatus = this.params[0];
        if (targetStatus && targetStatus !== 'all') {
          filtered = filtered.filter((s) => s.status === targetStatus);
        }
      }
      return { results: [{ count: filtered.length }] as unknown as T[], success: true, meta: {} };
    }

    // SELECT stories
    if (normalized.includes('FROM STORIES')) {
      let filtered = this.db.stories.map((s) => {
        const src = this.db.sources.find((src) => src.id === s.source_id);
        return {
          ...s,
          source_name: src ? src.name : s.source_id,
          source_group: src ? src.source_group : 'Indian News',
          source_homepage: src ? src.source_url : s.source_url,
        };
      });

      if (normalized.includes("STORIES.STATUS = 'PUBLISHED'") || normalized.includes("STATUS = 'PUBLISHED'")) {
        filtered = filtered.filter((s) => s.status === 'published');
      }
      if (normalized.includes("STORIES.STATUS = 'INCOMING'") || normalized.includes("STATUS = 'INCOMING'")) {
        filtered = filtered.filter((s) => s.status === 'incoming');
      }
      if (normalized.includes('WHERE STORIES.STATUS = ?') || normalized.includes('WHERE STATUS = ?')) {
        const targetStatus = this.params[0];
        if (targetStatus && targetStatus !== 'all') {
          filtered = filtered.filter((s) => s.status === targetStatus);
        }
      }
      if (normalized.includes('WHERE STORIES.ID = ?') || normalized.includes('WHERE ID = ?')) {
        const id = this.params[0];
        filtered = filtered.filter((s) => s.id === id);
      }
      if (normalized.includes('(STORIES.ID = ? OR STORIES.SOURCE_GUID = ?)') || normalized.includes('(ID = ? OR SOURCE_GUID = ?)')) {
        const target = this.params[0];
        filtered = filtered.filter((s) => s.id === target || s.source_guid === target);
      }

      // Sort by published_at DESC
      filtered.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

      return { results: filtered as unknown as T[], success: true, meta: {} };
    }

    return { results: [] as T[], success: true, meta: {} };
  }

  async run(): Promise<{ meta: { changes: number } }> {
    const normalized = this.sql.replace(/\s+/g, ' ').toUpperCase();

    // INSERT INTO editorial_sessions
    if (normalized.includes('INSERT INTO EDITORIAL_SESSIONS')) {
      const sessionId = this.params[0] as string;
      this.db.sessions.push({
        id: sessionId,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400 * 1000).toISOString(),
      });
      return { meta: { changes: 1 } };
    }

    // DELETE FROM editorial_sessions
    if (normalized.includes('DELETE FROM EDITORIAL_SESSIONS')) {
      const sessionId = this.params[0] as string;
      const index = this.db.sessions.findIndex((s) => s.id === sessionId);
      if (index !== -1) {
        this.db.sessions.splice(index, 1);
        return { meta: { changes: 1 } };
      }
      return { meta: { changes: 0 } };
    }

    // UPDATE stories status
    if (normalized.includes('UPDATE STORIES SET STATUS = ?') || normalized.includes("UPDATE STORIES SET STATUS = '")) {
      const targetId = this.params[this.params.length - 1];
      const story = this.db.stories.find((s) => s.id === targetId);
      if (story) {
        if (normalized.includes("STATUS = 'REVIEW'")) story.status = 'review';
        else if (normalized.includes("STATUS = 'APPROVED'")) story.status = 'approved';
        else if (normalized.includes("STATUS = 'REJECTED'")) {
          story.status = 'rejected';
          if (normalized.includes('EDITORIAL_NOTES = ?')) {
            story.editorial_notes = this.params[0] as string;
          }
        } else if (normalized.includes("STATUS = 'PUBLISHED'")) story.status = 'published';
        else if (normalized.includes("STATUS = 'ARCHIVED'")) story.status = 'archived';
        else if (this.params[0]) story.status = this.params[0] as StoryRow['status'];

        story.updated_at = new Date().toISOString();
        return { meta: { changes: 1 } };
      }
      return { meta: { changes: 0 } };
    }

    // UPDATE stories with full editorial fields (PATCH)
    if (normalized.includes('UPDATE STORIES SET TITLE = ?')) {
      const [title, desc, content, cat, img, author, tags, notes, origTitle, origDesc, status, id] = this.params as string[];
      const story = this.db.stories.find((s) => s.id === id);
      if (story) {
        story.title = title;
        story.description = desc;
        story.content = content;
        story.category = cat;
        story.image_url = img;
        story.author = author;
        story.tags = tags;
        story.editorial_notes = notes;
        story.original_title = origTitle;
        story.original_description = origDesc;
        story.is_edited = 1;
        story.status = status as StoryRow['status'];
        story.updated_at = new Date().toISOString();
        return { meta: { changes: 1 } };
      }
      return { meta: { changes: 0 } };
    }

    return { meta: { changes: 1 } };
  }
}

class MockDatabase {
  sessions: EditorialSessionRow[] = [];
  sources: NewsSourceRow[] = [
    {
      id: 'src_pib_mr',
      name: 'पत्र सूचना कार्यालय (PIB मुंबई)',
      feed_url: 'https://news.google.com/rss/search?q=site:pib.gov.in&hl=mr',
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
      id: 'src_sakal_mr',
      name: 'सकाळ वृत्तसेवा',
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
  ];

  stories: StoryRow[] = [
    {
      id: 'sty_incoming_001',
      source_id: 'src_pib_mr',
      source_url: 'https://pib.gov.in/release-1',
      source_guid: 'guid-incoming-001',
      title: 'महाराष्ट्र कृषी अर्थसंकल्प: सिंचनासाठी ५००० कोटी रुपयांची घोषणा',
      description: 'राज्यातील दुष्काळग्रस्त भागासाठी विशेष सिंचन प्रकल्पांची सुरुवात.',
      image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9',
      author: 'PIB मुंबई ब्युरो',
      published_at: '2026-10-03T02:00:00.000Z',
      category: 'महाराष्ट्र',
      language: 'mr',
      status: 'incoming',
      content_hash: 'hash-incoming-001',
      created_at: '2026-10-03T02:05:00.000Z',
      updated_at: '2026-10-03T02:05:00.000Z',
    },
    {
      id: 'sty_published_002',
      source_id: 'src_sakal_mr',
      source_url: 'https://esakal.com/story-2',
      source_guid: 'guid-pub-002',
      title: 'पुणे-मुंबई एक्सप्रेसवेवर नवीन सुरक्षायंत्रणा कार्यान्वित',
      description: 'वाहतूक कोंडी सोडवण्यासाठी विशेष उपाययोजना.',
      image_url: null,
      author: 'सकाळ विशेष प्रतिनिधी',
      published_at: '2026-10-03T01:00:00.000Z',
      category: 'महाराष्ट्र',
      language: 'mr',
      status: 'published',
      content_hash: 'hash-pub-002',
      created_at: '2026-10-03T01:05:00.000Z',
      updated_at: '2026-10-03T01:05:00.000Z',
    },
  ];

  prepare(sql: string) {
    return new MockPreparedStatement(sql, this);
  }
}

async function runEditorialTestSuite() {
  console.log('--- Bahumol Samaj Editorial Dashboard Test Suite ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  const db = new MockDatabase();
  const ADMIN_SECRET = 'cf_secret_admin_editorial_pass_2026';
  const env: Env = {
    DB: db as unknown as Env['DB'],
    ASSETS: { fetch: async () => new Response('assets') } as unknown as Env['ASSETS'],
    ADMIN_API_KEY: ADMIN_SECRET,
  };

  // Perform login to establish an authenticated session
  const reqLogin = new Request('https://bahumolsamaj.com/api/editorial/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: ADMIN_SECRET }),
  });
  const resLogin = await handleApiRequest(reqLogin, env);
  const setCookie = resLogin.headers.get('Set-Cookie') || '';
  const cookieMatch = setCookie.match(/editorial_session=([^;]+)/);
  const sessionCookie = cookieMatch ? `editorial_session=${cookieMatch[1]}` : '';

  const authHeaders = {
    Cookie: sessionCookie,
    'Content-Type': 'application/json',
  };

  // -------------------------------------------------------------
  // Test 1: Incoming story appears in dashboard
  // -------------------------------------------------------------
  const reqIncoming = new Request('https://bahumolsamaj.com/api/editorial/incoming', {
    headers: authHeaders,
  });
  const resIncoming = await handleApiRequest(reqIncoming, env);
  const dataIncoming = (await resIncoming.json()) as { success: boolean; data: StoryRow[]; total: number };

  assert(
    resIncoming.status === 200 &&
      dataIncoming.success &&
      dataIncoming.data.some((s) => s.id === 'sty_incoming_001'),
    '1. Incoming story appears in dashboard (/api/editorial/incoming)'
  );

  // -------------------------------------------------------------
  // Test 2: Editing works (PATCH /api/editorial/story/:id)
  // -------------------------------------------------------------
  const reqEdit = new Request('https://bahumolsamaj.com/api/editorial/story/sty_incoming_001', {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'संपादकीय मथळा: महाराष्ट्र कृषी अर्थसंकल्पात सिंचनासाठी ५००० कोटी रुपयांची भरीव तरतूद',
      tags: 'शेती, सिंचन, महाराष्ट्र शासन',
      author: 'मुख्य संपादक दिलीप सोनाळे विशेष ब्युरो',
    }),
  });
  const resEdit = await handleApiRequest(reqEdit, env);
  const dataEdit = (await resEdit.json()) as { success: boolean; data: StoryRow };

  assert(
    resEdit.status === 200 &&
      dataEdit.data.title.startsWith('संपादकीय मथळा') &&
      dataEdit.data.original_title === 'महाराष्ट्र कृषी अर्थसंकल्प: सिंचनासाठी ५००० कोटी रुपयांची घोषणा' &&
      dataEdit.data.is_edited === 1 &&
      dataEdit.data.tags === 'शेती, सिंचन, महाराष्ट्र शासन',
    '2. Editing works without corrupting original source metadata'
  );

  // -------------------------------------------------------------
  // Test 3: Approve works (POST /api/editorial/story/:id/approve)
  // -------------------------------------------------------------
  const reqApprove = new Request('https://bahumolsamaj.com/api/editorial/story/sty_incoming_001/approve', {
    method: 'POST',
    headers: authHeaders,
  });
  const resApprove = await handleApiRequest(reqApprove, env);
  const dataApprove = (await resApprove.json()) as { success: boolean; data: StoryRow };

  assert(
    resApprove.status === 200 && dataApprove.data.status === 'approved',
    '3. Approve works (transitions story to approved status)'
  );

  // -------------------------------------------------------------
  // Test 4: Reject works (POST /api/editorial/story/:id/reject)
  // -------------------------------------------------------------
  db.stories.push({
    id: 'sty_to_reject_003',
    source_id: 'src_sakal_mr',
    source_url: 'https://esakal.com/story-3',
    source_guid: 'guid-003',
    title: 'चुकीची माहिती असलेली बातमी',
    description: 'तपासणीत असत्य आढळले.',
    image_url: null,
    author: 'अनामिक',
    published_at: '2026-10-03T03:00:00.000Z',
    category: 'देश',
    language: 'mr',
    status: 'incoming',
    content_hash: 'hash-003',
    created_at: '2026-10-03T03:00:00.000Z',
    updated_at: '2026-10-03T03:00:00.000Z',
  });

  const reqReject = new Request('https://bahumolsamaj.com/api/editorial/story/sty_to_reject_003/reject', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ reason: 'अपुऱ्या संदर्भामुळे संपादकाने नाकारले' }),
  });
  const resReject = await handleApiRequest(reqReject, env);
  const dataReject = (await resReject.json()) as { success: boolean; data: StoryRow };

  assert(
    resReject.status === 200 &&
      dataReject.data.status === 'rejected' &&
      (dataReject.data.editorial_notes || '').includes('अपुऱ्या संदर्भामुळे'),
    '4. Reject works (transitions story to rejected status with reason)'
  );

  // -------------------------------------------------------------
  // Test 5: Publish works (POST /api/editorial/story/:id/publish)
  // -------------------------------------------------------------
  const reqPublish = new Request('https://bahumolsamaj.com/api/editorial/story/sty_incoming_001/publish', {
    method: 'POST',
    headers: authHeaders,
  });
  const resPublish = await handleApiRequest(reqPublish, env);
  const dataPublish = (await resPublish.json()) as { success: boolean; data: StoryRow };

  assert(
    resPublish.status === 200 && dataPublish.data.status === 'published',
    '5. Publish works (approved story transitions to published status)'
  );

  // -------------------------------------------------------------
  // Test 6: Archived stories disappear from active lists
  // -------------------------------------------------------------
  const reqArchive = new Request('https://bahumolsamaj.com/api/editorial/story/sty_to_reject_003/archive', {
    method: 'POST',
    headers: authHeaders,
  });
  const resArchive = await handleApiRequest(reqArchive, env);
  const dataArchive = (await resArchive.json()) as { success: boolean; data: StoryRow };

  const reqIncomingAfter = new Request('https://bahumolsamaj.com/api/editorial/incoming', {
    headers: authHeaders,
  });
  const resIncomingAfter = await handleApiRequest(reqIncomingAfter, env);
  const dataIncomingAfter = (await resIncomingAfter.json()) as { data: StoryRow[] };

  assert(
    resArchive.status === 200 &&
      dataArchive.data.status === 'archived' &&
      !dataIncomingAfter.data.some((s) => s.id === 'sty_to_reject_003'),
    '6. Archived stories disappear from active lists'
  );

  // -------------------------------------------------------------
  // Test 7: Unpublished stories remain hidden from public API
  // -------------------------------------------------------------
  db.stories.push({
    id: 'sty_review_only',
    source_id: 'src_pib_mr',
    source_url: 'https://pib.gov.in/rev',
    source_guid: 'guid-rev',
    title: 'अद्याप पुनरावलोकनात असलेली बातमी',
    description: null,
    image_url: null,
    author: null,
    published_at: new Date().toISOString(),
    category: 'महाराष्ट्र',
    language: 'mr',
    status: 'review',
    content_hash: 'hash-rev',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const reqPublicList = new Request('https://bahumolsamaj.com/api/news');
  const resPublicList = await handleApiRequest(reqPublicList, env);
  const dataPublicList = (await resPublicList.json()) as { data: StoryRow[] };

  const reqPublicSingle = new Request('https://bahumolsamaj.com/api/news/sty_review_only');
  const resPublicSingle = await handleApiRequest(reqPublicSingle, env);

  const reqPublicRejected = new Request('https://bahumolsamaj.com/api/news/sty_to_reject_003');
  const resPublicRejected = await handleApiRequest(reqPublicRejected, env);

  assert(
    !dataPublicList.data.some((s) => s.status !== 'published') &&
      resPublicSingle.status === 404 &&
      resPublicRejected.status === 404,
    '7. Unpublished/review/rejected stories remain strictly hidden from public API (HTTP 404)'
  );

  // -------------------------------------------------------------
  // Test 8: Published stories appear in public API
  // -------------------------------------------------------------
  const reqPublicStory = new Request('https://bahumolsamaj.com/api/news/sty_incoming_001');
  const resPublicStory = await handleApiRequest(reqPublicStory, env);
  const dataPublicStory = (await resPublicStory.json()) as { success: boolean; data: StoryRow };

  assert(
    resPublicStory.status === 200 &&
      dataPublicStory.success &&
      dataPublicStory.data.id === 'sty_incoming_001' &&
      dataPublicStory.data.status === 'published',
    '8. Published stories appear in public API (/api/news/:id)'
  );

  // -------------------------------------------------------------
  // Test 9: Invalid story IDs return proper errors (HTTP 404)
  // -------------------------------------------------------------
  const reqNotFound = new Request('https://bahumolsamaj.com/api/editorial/story/nonexistent_id_9999', {
    headers: authHeaders,
  });
  const resNotFound = await handleApiRequest(reqNotFound, env);

  assert(resNotFound.status === 404, '9. Invalid story IDs return proper errors (HTTP 404)');

  // -------------------------------------------------------------
  // Test 10: Unauthorized editorial operations blocked (HTTP 401)
  // And status flow violations (publishing incoming directly) rejected (HTTP 400)
  // -------------------------------------------------------------
  const reqNoAuth = new Request('https://bahumolsamaj.com/api/editorial/story/sty_incoming_001/approve', {
    method: 'POST',
    // Missing session cookie
  });
  const resNoAuth = await handleApiRequest(reqNoAuth, env);

  // Add an incoming story and attempt to publish it directly without approval
  db.stories.push({
    id: 'sty_direct_incoming',
    source_id: 'src_pib_mr',
    source_url: 'https://pib.gov.in/direct',
    source_guid: 'guid-direct',
    title: 'थेट आलेली बातमी',
    description: null,
    image_url: null,
    author: null,
    published_at: new Date().toISOString(),
    category: 'महाराष्ट्र',
    language: 'mr',
    status: 'incoming',
    content_hash: 'hash-direct',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const reqDirectPublish = new Request(
    'https://bahumolsamaj.com/api/editorial/story/sty_direct_incoming/publish',
    {
      method: 'POST',
      headers: authHeaders,
    }
  );
  const resDirectPublish = await handleApiRequest(reqDirectPublish, env);
  const dataDirectPublish = (await resDirectPublish.json()) as { code?: string };

  assert(
    resNoAuth.status === 401 &&
      resDirectPublish.status === 400 &&
      dataDirectPublish.code === 'STATUS_FLOW_VIOLATION',
    '10. Security: Unauthorized requests blocked with 401; direct publishing of incoming rejected with 400'
  );

  console.log('\n========================================================');
  console.log(`Editorial Results: ${passed} passed, ${failed} failed`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runEditorialTestSuite().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
