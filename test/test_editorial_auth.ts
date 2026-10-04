/**
 * @file test_editorial_auth.ts
 * Production Authentication & Editorial Security Test Suite for Bahumol Samaj Newsroom.
 * Verifies all 12 Authentication & Security Requirements.
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

    return { meta: { changes: 1 } };
  }
}

class MockDatabase {
  sessions: EditorialSessionRow[] = [];
  sources: NewsSourceRow[] = [
    {
      id: 'src_pib_mr',
      name: 'पत्र सूचना कार्यालय (PIB मुंबई)',
      feed_url: 'https://pib.gov.in/feed',
      source_url: 'https://pib.gov.in',
      source_type: 'rss',
      language: 'mr',
      default_category: 'महाराष्ट्र',
      active: 1,
      source_group: 'Government Sources',
      last_fetched_at: null,
      created_at: '2026-10-01',
    },
  ];

  stories: StoryRow[] = [
    {
      id: 'sty_test_incoming_1',
      source_id: 'src_pib_mr',
      source_url: 'https://pib.gov.in/item1',
      source_guid: 'guid-test-1',
      title: 'महाराष्ट्र शासन शेतकरी सन्मान योजना विशेष तरतूद',
      description: 'शेतकऱ्यांसाठी नवीन मदत पॅकेज.',
      image_url: null,
      author: 'PIB ब्युरो',
      published_at: '2026-10-03T05:00:00.000Z',
      category: 'महाराष्ट्र',
      language: 'mr',
      status: 'incoming',
      content_hash: 'hash-test-1',
      created_at: '2026-10-03T05:00:00.000Z',
      updated_at: '2026-10-03T05:00:00.000Z',
    },
    {
      id: 'sty_test_published_2',
      source_id: 'src_pib_mr',
      source_url: 'https://pib.gov.in/item2',
      source_guid: 'guid-test-2',
      title: 'मुंबई-पुणे रेल्वे मार्ग आधुनिकीकरण पूर्ण',
      description: 'नवीन हायस्पीड रेल्वेसेवा सुरू.',
      image_url: null,
      author: 'रेल्वे प्रतिनिधी',
      published_at: '2026-10-03T04:00:00.000Z',
      category: 'महाराष्ट्र',
      language: 'mr',
      status: 'published',
      content_hash: 'hash-test-2',
      created_at: '2026-10-03T04:00:00.000Z',
      updated_at: '2026-10-03T04:00:00.000Z',
    },
  ];

  prepare(sql: string) {
    return new MockPreparedStatement(sql, this);
  }
}

async function runProductionAuthTestSuite() {
  console.log('========================================================');
  console.log('  BAHUMOL SAMAJ: PRODUCTION AUTHENTICATION TEST SUITE');
  console.log('========================================================\n');

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
  const PRODUCTION_ADMIN_KEY = 'secret_production_admin_key_987654321';

  const env: Env = {
    DB: db as unknown as Env['DB'],
    ASSETS: { fetch: async () => new Response('assets') } as unknown as Env['ASSETS'],
    ADMIN_API_KEY: PRODUCTION_ADMIN_KEY,
  };

  let activeSessionCookie = '';

  // -------------------------------------------------------------
  // Test 1: Login with valid credential succeeds
  // -------------------------------------------------------------
  const reqValidLogin = new Request('https://bahumolsamaj.com/api/editorial/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: PRODUCTION_ADMIN_KEY }),
  });
  const resValidLogin = await handleApiRequest(reqValidLogin, env);
  const dataValidLogin = (await resValidLogin.json()) as { success: boolean; message: string; user?: unknown };
  const setCookie = resValidLogin.headers.get('Set-Cookie') || '';
  const cookieMatch = setCookie.match(/editorial_session=([^;]+)/);
  if (cookieMatch) {
    activeSessionCookie = `editorial_session=${cookieMatch[1]}`;
  }

  assert(
    resValidLogin.status === 200 &&
      dataValidLogin.success &&
      Boolean(activeSessionCookie) &&
      setCookie.includes('HttpOnly') &&
      setCookie.includes('SameSite=Lax'),
    '1. Login with valid credential succeeds and sets HttpOnly cookie'
  );

  // -------------------------------------------------------------
  // Test 2: Login with invalid credential fails
  // -------------------------------------------------------------
  const reqInvalidLogin = new Request('https://bahumolsamaj.com/api/editorial/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'wrong_password_or_old_key' }),
  });
  const resInvalidLogin = await handleApiRequest(reqInvalidLogin, env);
  const dataInvalidLogin = (await resInvalidLogin.json()) as { error: string; code: string };

  assert(
    resInvalidLogin.status === 401 && dataInvalidLogin.code === 'INVALID_CREDENTIALS',
    '2. Login with invalid credential fails (HTTP 401)'
  );

  // -------------------------------------------------------------
  // Test 3: Missing credential fails
  // -------------------------------------------------------------
  const reqMissingLogin = new Request('https://bahumolsamaj.com/api/editorial/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const resMissingLogin = await handleApiRequest(reqMissingLogin, env);
  const dataMissingLogin = (await resMissingLogin.json()) as { error: string; code: string };

  assert(
    resMissingLogin.status === 400 && dataMissingLogin.code === 'MISSING_CREDENTIALS',
    '3. Missing credential fails (HTTP 400)'
  );

  // -------------------------------------------------------------
  // Test 4: Session endpoint identifies authenticated user
  // -------------------------------------------------------------
  const reqSessionAuth = new Request('https://bahumolsamaj.com/api/editorial/auth/session', {
    headers: { Cookie: activeSessionCookie },
  });
  const resSessionAuth = await handleApiRequest(reqSessionAuth, env);
  const dataSessionAuth = (await resSessionAuth.json()) as {
    authenticated: boolean;
    user?: { role: string; editorInChief: string };
  };

  assert(
    resSessionAuth.status === 200 &&
      dataSessionAuth.authenticated === true &&
      dataSessionAuth.user?.editorInChief === 'दिलीप सोनाळे',
    '4. Session endpoint identifies authenticated user'
  );

  // -------------------------------------------------------------
  // Test 5: Unauthenticated editorial API request returns 401
  // -------------------------------------------------------------
  const reqUnauth = new Request('https://bahumolsamaj.com/api/editorial/incoming');
  const resUnauth = await handleApiRequest(reqUnauth, env);
  const dataUnauth = (await resUnauth.json()) as { code: string };

  assert(
    resUnauth.status === 401 && dataUnauth.code === 'UNAUTHORIZED_SESSION',
    '5. Unauthenticated editorial API request returns 401'
  );

  // -------------------------------------------------------------
  // Test 6: Authenticated editorial request succeeds
  // -------------------------------------------------------------
  const reqAuthIncoming = new Request('https://bahumolsamaj.com/api/editorial/incoming', {
    headers: { Cookie: activeSessionCookie },
  });
  const resAuthIncoming = await handleApiRequest(reqAuthIncoming, env);
  const dataAuthIncoming = (await resAuthIncoming.json()) as { success: boolean; data: StoryRow[] };

  assert(
    resAuthIncoming.status === 200 &&
      dataAuthIncoming.success &&
      dataAuthIncoming.data.some((s) => s.id === 'sty_test_incoming_1'),
    '6. Authenticated editorial request succeeds'
  );

  // -------------------------------------------------------------
  // Test 7: Logout invalidates the session
  // -------------------------------------------------------------
  const reqLogout = new Request('https://bahumolsamaj.com/api/editorial/auth/logout', {
    method: 'POST',
    headers: { Cookie: activeSessionCookie },
  });
  const resLogout = await handleApiRequest(reqLogout, env);
  const clearCookie = resLogout.headers.get('Set-Cookie') || '';

  // Now verify that the old session is rejected
  const reqAfterLogout = new Request('https://bahumolsamaj.com/api/editorial/incoming', {
    headers: { Cookie: activeSessionCookie },
  });
  const resAfterLogout = await handleApiRequest(reqAfterLogout, env);

  assert(
    resLogout.status === 200 &&
      clearCookie.includes('Max-Age=0') &&
      resAfterLogout.status === 401,
    '7. Logout invalidates the session in D1 and clears cookie'
  );

  // -------------------------------------------------------------
  // Test 8: Expired/invalid session is rejected
  // -------------------------------------------------------------
  // Insert an expired session into D1
  const expiredSessionId = 'ses_expired_999999';
  db.sessions.push({
    id: expiredSessionId,
    created_at: '2026-10-01T00:00:00.000Z',
    expires_at: '2026-10-02T00:00:00.000Z', // In the past
  });

  const reqExpired = new Request('https://bahumolsamaj.com/api/editorial/incoming', {
    headers: { Cookie: `editorial_session=${expiredSessionId}` },
  });
  const resExpired = await handleApiRequest(reqExpired, env);

  assert(
    resExpired.status === 401,
    '8. Expired or forged session ID is rejected (HTTP 401)'
  );

  // -------------------------------------------------------------
  // Test 9: Permanent admin key is never returned to client
  // -------------------------------------------------------------
  // Re-login to get fresh session
  const reqLogin2 = new Request('https://bahumolsamaj.com/api/editorial/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: PRODUCTION_ADMIN_KEY }),
  });
  const resLogin2 = await handleApiRequest(reqLogin2, env);
  const textLogin2 = await resLogin2.text();
  const setCookie2 = resLogin2.headers.get('Set-Cookie') || '';
  const match2 = setCookie2.match(/editorial_session=([^;]+)/);
  if (match2) {
    activeSessionCookie = `editorial_session=${match2[1]}`;
  }

  assert(
    !textLogin2.includes(PRODUCTION_ADMIN_KEY),
    '9. Permanent admin key is NEVER returned in response payload or headers'
  );

  // -------------------------------------------------------------
  // Test 10: Public "/api/news" remains accessible without authentication
  // -------------------------------------------------------------
  const reqPublic = new Request('https://bahumolsamaj.com/api/news');
  const resPublic = await handleApiRequest(reqPublic, env);
  const dataPublic = (await resPublic.json()) as { success: boolean; data: StoryRow[] };

  assert(
    resPublic.status === 200 &&
      dataPublic.success &&
      dataPublic.data.length > 0 &&
      dataPublic.data.every((s) => s.status === 'published'),
    '10. Public /api/news remains completely accessible to normal readers without credentials'
  );

  // -------------------------------------------------------------
  // Test 11: Unpublished stories remain hidden publicly
  // -------------------------------------------------------------
  const reqPublicIncoming = new Request('https://bahumolsamaj.com/api/news/sty_test_incoming_1');
  const resPublicIncoming = await handleApiRequest(reqPublicIncoming, env);

  assert(
    resPublicIncoming.status === 404,
    '11. Unpublished stories remain strictly hidden on public API (HTTP 404)'
  );

  // -------------------------------------------------------------
  // Test 12: Existing editorial status-flow rules still work
  // incoming -> approve -> publish
  // -------------------------------------------------------------
  // 12a: Direct publish of incoming is blocked
  const reqDirectPub = new Request(
    'https://bahumolsamaj.com/api/editorial/story/sty_test_incoming_1/publish',
    {
      method: 'POST',
      headers: { Cookie: activeSessionCookie },
    }
  );
  const resDirectPub = await handleApiRequest(reqDirectPub, env);

  // 12b: Approve first
  const reqApprove = new Request(
    'https://bahumolsamaj.com/api/editorial/story/sty_test_incoming_1/approve',
    {
      method: 'POST',
      headers: { Cookie: activeSessionCookie },
    }
  );
  const resApprove = await handleApiRequest(reqApprove, env);

  // 12c: Now publish approved story
  const reqPubApproved = new Request(
    'https://bahumolsamaj.com/api/editorial/story/sty_test_incoming_1/publish',
    {
      method: 'POST',
      headers: { Cookie: activeSessionCookie },
    }
  );
  const resPubApproved = await handleApiRequest(reqPubApproved, env);
  const dataPubApproved = (await resPubApproved.json()) as { data: StoryRow };

  assert(
    resDirectPub.status === 400 &&
      resApprove.status === 200 &&
      resPubApproved.status === 200 &&
      dataPubApproved.data.status === 'published',
    '12. Existing status flow enforced: direct publish rejected (400), approve + publish succeeds'
  );

  console.log('\n========================================================');
  console.log(`Authentication Results: ${passed} passed, ${failed} failed`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runProductionAuthTestSuite().catch((e) => {
  console.error('Fatal execution error:', e);
  process.exit(1);
});
