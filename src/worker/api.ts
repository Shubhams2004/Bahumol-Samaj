/**
 * @file api.ts
 * Cloudflare Worker REST API router for Bahumol Samaj Weekly Newspaper.
 * Production-Safe Architecture:
 * 1. Public read-only endpoints (published stories only, public cache)
 * 2. Authenticated Editorial Newsroom endpoints (/api/editorial/*) protected by server-side D1 sessions
 * 3. Secret validation against Cloudflare secret ADMIN_API_KEY (no hardcoded fallbacks)
 */

import { Env, StoryRow, StoryStatus, EditorialCounts, EditorialUpdatePayload } from './types';
import { runIngestionPipeline, computeContentHash } from './ingestion';

/**
 * Helper to build JSON responses with security and CORS headers
 */
export function jsonResponse(
  data: unknown,
  status: number = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': status === 200 && !extraHeaders['Set-Cookie'] ? 'public, max-age=30, s-maxage=60' : 'no-store',
      ...extraHeaders,
    },
  });
}

/**
 * Constant-time comparison between user-provided credential and server-configured secret
 * Prevents timing attacks and guarantees no hardcoded fallback is used.
 */
export async function verifyAdminSecret(
  providedKey: string | undefined | null,
  configuredSecret: string | undefined | null
): Promise<boolean> {
  if (!configuredSecret || typeof configuredSecret !== 'string' || !configuredSecret.trim()) {
    // Secret is not configured in Cloudflare environment
    return false;
  }
  if (!providedKey || typeof providedKey !== 'string' || !providedKey.trim()) {
    return false;
  }

  const encoder = new TextEncoder();
  const aHash = await crypto.subtle.digest('SHA-256', encoder.encode(providedKey.trim()));
  const bHash = await crypto.subtle.digest('SHA-256', encoder.encode(configuredSecret.trim()));

  const aBytes = new Uint8Array(aHash);
  const bBytes = new Uint8Array(bHash);

  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

/**
 * Generate and store a secure server-side session in D1
 */
export async function createEditorialSession(db: Env['DB']): Promise<string> {
  const tokenBytes = new Uint8Array(24);
  crypto.getRandomValues(tokenBytes);
  const tokenHex = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const sessionId = `ses_${tokenHex}`;

  // Session valid for 24 hours
  await db
    .prepare(
      "INSERT INTO editorial_sessions (id, created_at, expires_at) VALUES (?, datetime('now'), datetime('now', '+24 hours'))"
    )
    .bind(sessionId)
    .run();

  return sessionId;
}

/**
 * Destroy a session in D1 on logout
 */
export async function destroyEditorialSession(db: Env['DB'], sessionId: string): Promise<void> {
  await db.prepare('DELETE FROM editorial_sessions WHERE id = ?').bind(sessionId).run();
}

/**
 * Extract and validate session token from HttpOnly cookie or Authorization Bearer header
 * Returns session ID if valid and unexpired in D1; null otherwise.
 */
export async function getAuthenticatedSession(request: Request, env: Env): Promise<string | null> {
  let sessionId: string | null = null;

  // 1. Check HttpOnly Cookie
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)editorial_session=([^;]+)/);
  if (cookieMatch) {
    sessionId = decodeURIComponent(cookieMatch[1]);
  }

  // 2. Check Authorization Bearer header (supports session tokens e.g. Bearer ses_...)
  if (!sessionId) {
    const authHeader = request.headers.get('Authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token.startsWith('ses_')) {
        sessionId = token;
      }
    }
  }

  if (!sessionId) {
    return null;
  }

  // 3. Verify in D1 database that session exists and is unexpired
  const row = await env.DB.prepare(
    "SELECT id FROM editorial_sessions WHERE id = ? AND expires_at > datetime('now') LIMIT 1"
  )
    .bind(sessionId)
    .first<{ id: string }>();

  return row ? row.id : null;
}

/**
 * Helper to fetch a story with joined source details
 */
async function getJoinedStoryById(db: Env['DB'], id: string): Promise<StoryRow | null> {
  return await db
    .prepare(`
      SELECT
        stories.*,
        news_sources.name as source_name,
        news_sources.source_group as source_group,
        news_sources.source_url as source_homepage
      FROM stories
      LEFT JOIN news_sources ON stories.source_id = news_sources.id
      WHERE stories.id = ?
      LIMIT 1
    `)
    .bind(id)
    .first<StoryRow>();
}

/**
 * Main API request dispatcher
 */
export async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, ''); // Strip trailing slashes
  const method = request.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // =============================================================
  // PART 1: PUBLIC READ-ONLY ENDPOINTS (Strictly Published Stories)
  // Public visitors never need credentials and cannot see unpublished stories.
  // =============================================================

  // -------------------------------------------------------------
  // Public Endpoint: GET /api/sources
  // Returns active sources grouped by source_group
  // -------------------------------------------------------------
  if (method === 'GET' && path === '/api/sources') {
    const groupFilter = url.searchParams.get('group');
    let sql =
      'SELECT id, name, source_url, source_type, language, default_category, active, source_group, last_fetched_at FROM news_sources WHERE active = 1';
    const params: string[] = [];

    if (groupFilter) {
      sql += ' AND source_group = ?';
      params.push(groupFilter);
    }

    sql += ' ORDER BY source_group ASC, name ASC';

    const stmt = env.DB.prepare(sql);
    const rows = params.length > 0 ? await stmt.bind(params[0]).all() : await stmt.all();

    return jsonResponse({
      success: true,
      sources: rows.results || [],
    });
  }

  // -------------------------------------------------------------
  // Public Endpoint: GET /api/news
  // Returns PUBLISHED stories only with pagination, optional category, and source_group
  // -------------------------------------------------------------
  if (method === 'GET' && path === '/api/news') {
    const categoryParam = url.searchParams.get('category');
    const sourceGroupParam = url.searchParams.get('source_group') || url.searchParams.get('group');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10) || 10));
    const offset = (page - 1) * limit;

    let countQuery = `
      SELECT COUNT(*) as count
      FROM stories
      LEFT JOIN news_sources ON stories.source_id = news_sources.id
      WHERE stories.status = 'published'
    `;
    let selectQuery = `
      SELECT
        stories.*,
        news_sources.name as source_name,
        news_sources.source_group as source_group
      FROM stories
      LEFT JOIN news_sources ON stories.source_id = news_sources.id
      WHERE stories.status = 'published'
    `;
    const queryParams: (string | number)[] = [];

    if (categoryParam && categoryParam.trim()) {
      countQuery += ' AND stories.category = ?';
      selectQuery += ' AND stories.category = ?';
      queryParams.push(categoryParam.trim());
    }

    if (sourceGroupParam && sourceGroupParam.trim()) {
      countQuery += ' AND news_sources.source_group = ?';
      selectQuery += ' AND news_sources.source_group = ?';
      queryParams.push(sourceGroupParam.trim());
    }

    selectQuery += ' ORDER BY stories.published_at DESC LIMIT ? OFFSET ?';

    const countStmt = env.DB.prepare(countQuery);
    const totalRow = (queryParams.length > 0
      ? await countStmt.bind(...queryParams).first<{ count: number }>()
      : await countStmt.first<{ count: number }>()) || { count: 0 };

    const total = totalRow.count;
    const totalPages = Math.ceil(total / limit) || 1;

    const selectStmt = env.DB.prepare(selectQuery);
    const finalParams = [...queryParams, limit, offset];
    const storiesResult = await selectStmt.bind(...finalParams).all<StoryRow>();

    return jsonResponse({
      success: true,
      page,
      limit,
      total,
      totalPages,
      data: storiesResult.results || [],
    });
  }

  // -------------------------------------------------------------
  // Public Endpoint: GET /api/news/category/:category
  // -------------------------------------------------------------
  if (method === 'GET' && path.startsWith('/api/news/category/')) {
    const rawCategory = decodeURIComponent(path.replace('/api/news/category/', ''));
    if (!rawCategory) {
      return jsonResponse({ error: 'वर्गवारी (category) आवश्यक आहे' }, 400);
    }

    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10) || 10));
    const offset = (page - 1) * limit;

    const countResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM stories WHERE status = 'published' AND category = ?"
    )
      .bind(rawCategory)
      .first<{ count: number }>();

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const rows = await env.DB.prepare(`
      SELECT
        stories.*,
        news_sources.name as source_name,
        news_sources.source_group as source_group
      FROM stories
      LEFT JOIN news_sources ON stories.source_id = news_sources.id
      WHERE stories.status = 'published' AND stories.category = ?
      ORDER BY stories.published_at DESC
      LIMIT ? OFFSET ?
    `)
      .bind(rawCategory, limit, offset)
      .all<StoryRow>();

    return jsonResponse({
      success: true,
      category: rawCategory,
      page,
      limit,
      total,
      totalPages,
      data: rows.results || [],
    });
  }

  // -------------------------------------------------------------
  // Public Endpoint: GET /api/news/:id
  // Strictly returns published stories. 404 for anything else.
  // -------------------------------------------------------------
  if (method === 'GET' && path.startsWith('/api/news/')) {
    const rawParam = path.slice('/api/news/'.length);
    const storyId = decodeURIComponent(rawParam).trim();
    if (!storyId) {
      return jsonResponse({ error: 'बातमी ओळख क्रमांक (ID) आवश्यक आहे' }, 400);
    }

    const story = await env.DB.prepare(`
      SELECT
        stories.*,
        news_sources.name as source_name,
        news_sources.source_group as source_group
      FROM stories
      LEFT JOIN news_sources ON stories.source_id = news_sources.id
      WHERE (stories.id = ? OR stories.source_guid = ?) AND stories.status = 'published'
      LIMIT 1
    `)
      .bind(storyId, storyId)
      .first<StoryRow>();

    if (!story) {
      return jsonResponse(
        { error: 'बातमी सापडली नाही किंवा अद्याप प्रकाशित झालेली नाही (Story not found or not published)' },
        404
      );
    }

    return jsonResponse({
      success: true,
      data: story,
    });
  }

  // =============================================================
  // PART 2: EDITORIAL AUTHENTICATION (/api/editorial/auth/*)
  // =============================================================

  // -------------------------------------------------------------
  // POST /api/editorial/auth/login
  // Validates secret against ADMIN_API_KEY, issues HttpOnly cookie
  // -------------------------------------------------------------
  if (method === 'POST' && path === '/api/editorial/auth/login') {
    let key = '';
    try {
      const body = (await request.json()) as { key?: string; password?: string; adminKey?: string; secret?: string };
      key = body?.key || body?.password || body?.adminKey || body?.secret || '';
    } catch {
      return jsonResponse({ error: 'अवैध विनंती डेटा (Invalid JSON)', code: 'INVALID_BODY' }, 400);
    }

    if (!key || typeof key !== 'string' || !key.trim()) {
      return jsonResponse(
        { error: 'संपादकीय सुरक्षा की आवश्यक आहे (Secret access key required)', code: 'MISSING_CREDENTIALS' },
        400
      );
    }

    // Check if Cloudflare secret is configured
    if (!env.ADMIN_API_KEY || !env.ADMIN_API_KEY.trim()) {
      return jsonResponse(
        {
          error:
            'सर्व्हर सुरक्षा की सेट केलेली नाही. कृपया Cloudflare मध्ये ADMIN_API_KEY कॉन्फिगर करा (Server ADMIN_API_KEY secret not configured)',
          code: 'SECRET_NOT_CONFIGURED',
        },
        503
      );
    }

    const isValid = await verifyAdminSecret(key, env.ADMIN_API_KEY);
    if (!isValid) {
      return jsonResponse(
        { error: 'अवैध संपादकीय सुरक्षा की (Invalid secret key)', code: 'INVALID_CREDENTIALS' },
        401
      );
    }

    // Create session in D1
    const sessionId = await createEditorialSession(env.DB);
    const isHttps = url.protocol === 'https:' || env.ENVIRONMENT === 'production';
    const cookieHeader = `editorial_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${
      isHttps ? '; Secure' : ''
    }`;

    // Return session response (NEVER return permanent ADMIN_API_KEY to browser)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'संपादकीय ओळख यशस्वीरीत्या पडताळली (Authentication successful)',
        user: { role: 'editor', editorInChief: 'दिलीप सोनाळे' },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Set-Cookie': cookieHeader,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  // -------------------------------------------------------------
  // POST /api/editorial/auth/logout
  // Invalidates session in D1 and clears cookie
  // -------------------------------------------------------------
  if (method === 'POST' && path === '/api/editorial/auth/logout') {
    const sessionId = await getAuthenticatedSession(request, env);
    if (sessionId) {
      await destroyEditorialSession(env.DB, sessionId);
    }

    const isHttps = url.protocol === 'https:' || env.ENVIRONMENT === 'production';
    const clearCookieHeader = `editorial_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${
      isHttps ? '; Secure' : ''
    }`;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'सत्र यशस्वीरीत्या समाप्त केले (Logged out)',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Set-Cookie': clearCookieHeader,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  // -------------------------------------------------------------
  // GET /api/editorial/auth/session
  // Checks if client has an active authenticated session
  // -------------------------------------------------------------
  if (method === 'GET' && path === '/api/editorial/auth/session') {
    const sessionId = await getAuthenticatedSession(request, env);
    if (!sessionId) {
      return jsonResponse({ authenticated: false }, 200);
    }

    return jsonResponse(
      {
        authenticated: true,
        user: { role: 'editor', editorInChief: 'दिलीप सोनाळे' },
      },
      200
    );
  }

  // =============================================================
  // PART 3: PROTECTED EDITORIAL DASHBOARD ENDPOINTS (/api/editorial/*)
  // All endpoints require a valid session in D1.
  // =============================================================

  if (path.startsWith('/api/editorial')) {
    const sessionId = await getAuthenticatedSession(request, env);
    if (!sessionId) {
      return jsonResponse(
        {
          error:
            'अनधिकृत प्रवेश: सक्रिय संपादकीय सत्र आवश्यक (Unauthorized: Active editorial session required. Please login)',
          code: 'UNAUTHORIZED_SESSION',
        },
        401
      );
    }

    // -----------------------------------------------------------
    // GET /api/editorial/stats
    // Returns counts across all editorial statuses
    // -----------------------------------------------------------
    if (method === 'GET' && path === '/api/editorial/stats') {
      const rows = await env.DB.prepare(
        'SELECT status, COUNT(*) as count FROM stories GROUP BY status'
      ).all<{ status: StoryStatus; count: number }>();

      const counts: EditorialCounts = {
        all: 0,
        incoming: 0,
        review: 0,
        approved: 0,
        published: 0,
        rejected: 0,
        archived: 0,
      };

      if (rows.results) {
        for (const r of rows.results) {
          if (r.status in counts) {
            counts[r.status] = r.count;
            counts.all += r.count;
          }
        }
      }

      return jsonResponse({
        success: true,
        stats: counts,
      });
    }

    // -----------------------------------------------------------
    // GET /api/editorial/incoming
    // Returns incoming stories strictly (newest first)
    // -----------------------------------------------------------
    if (method === 'GET' && path === '/api/editorial/incoming') {
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10) || 25));
      const offset = (page - 1) * limit;
      const categoryParam = url.searchParams.get('category');
      const sourceGroupParam = url.searchParams.get('source_group');
      const searchParam = url.searchParams.get('search');
      const sortParam = url.searchParams.get('sort') || 'newest';

      let countQuery =
        "SELECT COUNT(*) as count FROM stories LEFT JOIN news_sources ON stories.source_id = news_sources.id WHERE stories.status = 'incoming'";
      let selectQuery = `
        SELECT
          stories.*,
          news_sources.name as source_name,
          news_sources.source_group as source_group
        FROM stories
        LEFT JOIN news_sources ON stories.source_id = news_sources.id
        WHERE stories.status = 'incoming'
      `;
      const queryParams: (string | number)[] = [];

      if (categoryParam && categoryParam.trim()) {
        countQuery += ' AND stories.category = ?';
        selectQuery += ' AND stories.category = ?';
        queryParams.push(categoryParam.trim());
      }

      if (sourceGroupParam && sourceGroupParam.trim()) {
        countQuery += ' AND news_sources.source_group = ?';
        selectQuery += ' AND news_sources.source_group = ?';
        queryParams.push(sourceGroupParam.trim());
      }

      if (searchParam && searchParam.trim()) {
        countQuery += ' AND (stories.title LIKE ? OR stories.description LIKE ?)';
        selectQuery += ' AND (stories.title LIKE ? OR stories.description LIKE ?)';
        const likeTerm = `%${searchParam.trim()}%`;
        queryParams.push(likeTerm, likeTerm);
      }

      const sortOrder = sortParam === 'oldest' ? 'ASC' : 'DESC';
      selectQuery += ` ORDER BY stories.published_at ${sortOrder}, stories.created_at ${sortOrder} LIMIT ? OFFSET ?`;

      const countStmt = env.DB.prepare(countQuery);
      const totalRow = (queryParams.length > 0
        ? await countStmt.bind(...queryParams).first<{ count: number }>()
        : await countStmt.first<{ count: number }>()) || { count: 0 };

      const total = totalRow.count;
      const totalPages = Math.ceil(total / limit) || 1;

      const selectStmt = env.DB.prepare(selectQuery);
      const finalParams = [...queryParams, limit, offset];
      const storiesResult = await selectStmt.bind(...finalParams).all<StoryRow>();

      return jsonResponse({
        success: true,
        page,
        limit,
        total,
        totalPages,
        data: storiesResult.results || [],
      });
    }

    // -----------------------------------------------------------
    // GET /api/editorial/stories
    // Generic query by status (incoming, review, approved, published, rejected, archived)
    // -----------------------------------------------------------
    if (method === 'GET' && path === '/api/editorial/stories') {
      const statusParam = url.searchParams.get('status');
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10) || 25));
      const offset = (page - 1) * limit;
      const categoryParam = url.searchParams.get('category');
      const sourceGroupParam = url.searchParams.get('source_group');
      const searchParam = url.searchParams.get('search');
      const sortParam = url.searchParams.get('sort') || 'newest';

      let countQuery =
        'SELECT COUNT(*) as count FROM stories LEFT JOIN news_sources ON stories.source_id = news_sources.id WHERE 1=1';
      let selectQuery = `
        SELECT
          stories.*,
          news_sources.name as source_name,
          news_sources.source_group as source_group
        FROM stories
        LEFT JOIN news_sources ON stories.source_id = news_sources.id
        WHERE 1=1
      `;
      const queryParams: (string | number)[] = [];

      if (statusParam && statusParam !== 'all') {
        countQuery += ' AND stories.status = ?';
        selectQuery += ' AND stories.status = ?';
        queryParams.push(statusParam);
      }

      if (categoryParam && categoryParam.trim()) {
        countQuery += ' AND stories.category = ?';
        selectQuery += ' AND stories.category = ?';
        queryParams.push(categoryParam.trim());
      }

      if (sourceGroupParam && sourceGroupParam.trim()) {
        countQuery += ' AND news_sources.source_group = ?';
        selectQuery += ' AND news_sources.source_group = ?';
        queryParams.push(sourceGroupParam.trim());
      }

      if (searchParam && searchParam.trim()) {
        countQuery += ' AND (stories.title LIKE ? OR stories.description LIKE ?)';
        selectQuery += ' AND (stories.title LIKE ? OR stories.description LIKE ?)';
        const likeTerm = `%${searchParam.trim()}%`;
        queryParams.push(likeTerm, likeTerm);
      }

      const sortOrder = sortParam === 'oldest' ? 'ASC' : 'DESC';
      selectQuery += ` ORDER BY stories.published_at ${sortOrder}, stories.created_at ${sortOrder} LIMIT ? OFFSET ?`;

      const countStmt = env.DB.prepare(countQuery);
      const totalRow = (queryParams.length > 0
        ? await countStmt.bind(...queryParams).first<{ count: number }>()
        : await countStmt.first<{ count: number }>()) || { count: 0 };

      const total = totalRow.count;
      const totalPages = Math.ceil(total / limit) || 1;

      const selectStmt = env.DB.prepare(selectQuery);
      const finalParams = [...queryParams, limit, offset];
      const storiesResult = await selectStmt.bind(...finalParams).all<StoryRow>();

      return jsonResponse({
        success: true,
        page,
        limit,
        total,
        totalPages,
        data: storiesResult.results || [],
      });
    }

    // -----------------------------------------------------------
    // GET /api/editorial/story/:id
    // Return full story with joined source details
    // -----------------------------------------------------------
    if (method === 'GET' && path.startsWith('/api/editorial/story/')) {
      const storyId = decodeURIComponent(path.replace('/api/editorial/story/', ''));
      if (!storyId || storyId.includes('/')) {
        return jsonResponse({ error: 'अवैध बातमी क्रमांक (Invalid story ID)' }, 400);
      }

      const story = await getJoinedStoryById(env.DB, storyId);
      if (!story) {
        return jsonResponse({ error: 'बातमी सापडली नाही (Story not found)' }, 404);
      }

      return jsonResponse({
        success: true,
        data: story,
      });
    }

    // -----------------------------------------------------------
    // PATCH /api/editorial/story/:id
    // Modify editorial fields while preserving original source data
    // -----------------------------------------------------------
    if (method === 'PATCH' && path.startsWith('/api/editorial/story/')) {
      const storyId = decodeURIComponent(path.replace('/api/editorial/story/', ''));
      if (!storyId || storyId.includes('/')) {
        return jsonResponse({ error: 'अवैध बातमी क्रमांक (Invalid story ID)' }, 400);
      }

      const existing = await env.DB.prepare('SELECT * FROM stories WHERE id = ?').bind(storyId).first<StoryRow>();
      if (!existing) {
        return jsonResponse({ error: 'बातमी सापडली नाही (Story not found)' }, 404);
      }

      let body: EditorialUpdatePayload & { status?: StoryStatus } = {};
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: 'अवैध JSON डेटा (Invalid JSON)' }, 400);
      }

      // Preserve original source data on initial edit
      const origTitle = existing.original_title || existing.title;
      const origDesc =
        existing.original_description !== undefined && existing.original_description !== null
          ? existing.original_description
          : existing.description;

      const newTitle = body.title !== undefined ? body.title.trim() : existing.title;
      const newDesc = body.description !== undefined ? body.description.trim() : existing.description;
      const newContent =
        body.content !== undefined
          ? body.content.trim()
          : existing.content !== undefined && existing.content !== null
          ? existing.content
          : existing.description;
      const newCategory = body.category !== undefined ? body.category.trim() : existing.category;
      const newLanguage =
        body.language !== undefined && ['mr', 'hi', 'en'].includes(body.language.trim().toLowerCase())
          ? body.language.trim().toLowerCase()
          : existing.language || 'mr';
      const newImageUrl = body.image_url !== undefined ? body.image_url.trim() : existing.image_url;
      const newAuthor = body.author !== undefined ? body.author.trim() : existing.author;
      const newTags = body.tags !== undefined ? body.tags.trim() : existing.tags || '';
      const newNotes = body.editorial_notes !== undefined ? body.editorial_notes.trim() : existing.editorial_notes || '';
      const newStatus =
        body.status && ['incoming', 'review', 'approved', 'published', 'rejected', 'archived'].includes(body.status)
          ? body.status
          : existing.status;

      await env.DB.prepare(`
        UPDATE stories
        SET
          title = ?,
          description = ?,
          content = ?,
          category = ?,
          language = ?,
          image_url = ?,
          author = ?,
          tags = ?,
          editorial_notes = ?,
          original_title = ?,
          original_description = ?,
          is_edited = 1,
          status = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `)
        .bind(
          newTitle,
          newDesc,
          newContent,
          newCategory,
          newLanguage,
          newImageUrl,
          newAuthor,
          newTags,
          newNotes,
          origTitle,
          origDesc,
          newStatus,
          storyId
        )
        .run();

      const updated = await getJoinedStoryById(env.DB, storyId);
      return jsonResponse({
        success: true,
        message: 'संपादकीय बदल यशस्वीरीत्या जतन केले (Editorial changes saved)',
        data: updated,
      });
    }

    // -----------------------------------------------------------
    // POST /api/editorial/story/:id/review
    // Moves story to 'review' status
    // -----------------------------------------------------------
    if (method === 'POST' && path.match(/^\/api\/editorial\/story\/[^/]+\/review$/)) {
      const storyId = decodeURIComponent(path.split('/')[4]);
      const existing = await env.DB.prepare('SELECT id, status FROM stories WHERE id = ?')
        .bind(storyId)
        .first<{ id: string; status: StoryStatus }>();

      if (!existing) {
        return jsonResponse({ error: 'बातमी सापडली नाही (Story not found)' }, 404);
      }

      await env.DB.prepare("UPDATE stories SET status = 'review', updated_at = datetime('now') WHERE id = ?")
        .bind(storyId)
        .run();

      const updated = await getJoinedStoryById(env.DB, storyId);
      return jsonResponse({
        success: true,
        message: 'बातमी पुनरावलोकन विभागात पाठवली (Moved to review)',
        data: updated,
      });
    }

    // -----------------------------------------------------------
    // POST /api/editorial/story/:id/approve
    // Moves story from 'incoming' or 'review' to 'approved'
    // -----------------------------------------------------------
    if (method === 'POST' && path.match(/^\/api\/editorial\/story\/[^/]+\/approve$/)) {
      const storyId = decodeURIComponent(path.split('/')[4]);
      const existing = await env.DB.prepare('SELECT id, status FROM stories WHERE id = ?')
        .bind(storyId)
        .first<{ id: string; status: StoryStatus }>();

      if (!existing) {
        return jsonResponse({ error: 'बातमी सापडली नाही (Story not found)' }, 404);
      }

      if (existing.status === 'published') {
        return jsonResponse({ error: 'सदर बातमी आधीच प्रकाशित झालेली आहे (Already published)' }, 400);
      }

      await env.DB.prepare("UPDATE stories SET status = 'approved', updated_at = datetime('now') WHERE id = ?")
        .bind(storyId)
        .run();

      const updated = await getJoinedStoryById(env.DB, storyId);
      return jsonResponse({
        success: true,
        message: 'बातमी प्रकाशनासाठी मंजूर केली (Story approved for publication)',
        data: updated,
      });
    }

    // -----------------------------------------------------------
    // POST /api/editorial/story/:id/reject
    // Moves story to 'rejected' status with optional reason
    // -----------------------------------------------------------
    if (method === 'POST' && path.match(/^\/api\/editorial\/story\/[^/]+\/reject$/)) {
      const storyId = decodeURIComponent(path.split('/')[4]);
      const existing = await env.DB.prepare('SELECT id, status, editorial_notes FROM stories WHERE id = ?')
        .bind(storyId)
        .first<{ id: string; status: StoryStatus; editorial_notes?: string }>();

      if (!existing) {
        return jsonResponse({ error: 'बातमी सापडली नाही (Story not found)' }, 404);
      }

      let reason = '';
      try {
        const body = (await request.json()) as { reason?: string };
        reason = body?.reason || '';
      } catch {}

      const updatedNotes = reason
        ? `${existing.editorial_notes ? existing.editorial_notes + ' | ' : ''}नाकारण्याचे कारण: ${reason}`
        : existing.editorial_notes || '';

      await env.DB.prepare("UPDATE stories SET status = 'rejected', editorial_notes = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(updatedNotes, storyId)
        .run();

      const updated = await getJoinedStoryById(env.DB, storyId);
      return jsonResponse({
        success: true,
        message: 'बातमी नाकारली (Story rejected)',
        data: updated,
      });
    }

    // -----------------------------------------------------------
    // POST /api/editorial/story/:id/publish
    // Enforces status flow:
    // Approved stories can be published manually.
    // Rejects publishing direct 'incoming' stories to ensure editorial control.
    // -----------------------------------------------------------
    if (method === 'POST' && path.match(/^\/api\/editorial\/story\/[^/]+\/publish$/)) {
      const storyId = decodeURIComponent(path.split('/')[4]);
      const existing = await env.DB.prepare('SELECT id, status FROM stories WHERE id = ?')
        .bind(storyId)
        .first<{ id: string; status: StoryStatus }>();

      if (!existing) {
        return jsonResponse({ error: 'बातमी सापडली नाही (Story not found)' }, 404);
      }

      // Check status flow constraint
      if (existing.status === 'incoming') {
        return jsonResponse(
          {
            error:
              "थेट अप्रमाणित बातमी प्रकाशित करता येत नाही. आधी बातमी तपासून 'मंजूर' (approve) करा. (Story must be reviewed and approved before publishing)",
            code: 'STATUS_FLOW_VIOLATION',
          },
          400
        );
      }

      if (existing.status === 'published') {
        return jsonResponse({
          message: 'सदर बातमी आधीच प्रकाशित आहे',
          data: await getJoinedStoryById(env.DB, storyId),
        });
      }

      await env.DB.prepare("UPDATE stories SET status = 'published', updated_at = datetime('now') WHERE id = ?")
        .bind(storyId)
        .run();

      const updated = await getJoinedStoryById(env.DB, storyId);
      return jsonResponse({
        success: true,
        message: 'बातमी बहुमोल समाज सार्वजनिक टाइमलाइनवर प्रकाशित केली (Story published to public timeline)',
        data: updated,
      });
    }

    // -----------------------------------------------------------
    // POST /api/editorial/story/:id/archive
    // Moves published or rejected story to 'archived'
    // -----------------------------------------------------------
    if (method === 'POST' && path.match(/^\/api\/editorial\/story\/[^/]+\/archive$/)) {
      const storyId = decodeURIComponent(path.split('/')[4]);
      const existing = await env.DB.prepare('SELECT id, status FROM stories WHERE id = ?')
        .bind(storyId)
        .first<{ id: string; status: StoryStatus }>();

      if (!existing) {
        return jsonResponse({ error: 'बातमी सापडली नाही (Story not found)' }, 404);
      }

      await env.DB.prepare("UPDATE stories SET status = 'archived', updated_at = datetime('now') WHERE id = ?")
        .bind(storyId)
        .run();

      const updated = await getJoinedStoryById(env.DB, storyId);
      return jsonResponse({
        success: true,
        message: 'बातमी संग्रहित केली (Story archived)',
        data: updated,
      });
    }
  }

  // =============================================================
  // PART 4: BACKGROUND INGESTION & ADMIN ENDPOINTS (/api/admin/*)
  // Protected strictly via authenticated session OR valid Bearer ADMIN_API_KEY
  // (No hardcoded fallback strings allowed)
  // =============================================================

  if (path.startsWith('/api/admin/')) {
    const hasSession = Boolean(await getAuthenticatedSession(request, env));
    let hasValidSecret = false;
    const authHeader = request.headers.get('Authorization') || '';
    const xAdminKey = request.headers.get('X-Admin-Key') || '';

    if (authHeader.startsWith('Bearer ') && env.ADMIN_API_KEY && env.ADMIN_API_KEY.trim()) {
      const token = authHeader.slice(7).trim();
      hasValidSecret = await verifyAdminSecret(token, env.ADMIN_API_KEY);
    } else if (xAdminKey && env.ADMIN_API_KEY && env.ADMIN_API_KEY.trim()) {
      hasValidSecret = await verifyAdminSecret(xAdminKey, env.ADMIN_API_KEY);
    }

    if (!hasSession && !hasValidSecret) {
      return jsonResponse(
        { error: 'अनधिकृत प्रवेश (Unauthorized: Valid admin authentication required)' },
        401
      );
    }

    // -----------------------------------------------------------
    // POST /api/admin/refresh (or /api/ingest)
    // -----------------------------------------------------------
    if (method === 'POST' && (path === '/api/admin/refresh' || path === '/api/ingest')) {
      let targetSourceId = url.searchParams.get('source_id') || undefined;
      if (!targetSourceId) {
        try {
          const body = (await request.json()) as { source_id?: string; sourceId?: string };
          targetSourceId = body.source_id || body.sourceId;
        } catch {}
      }

      const summary = await runIngestionPipeline(env, targetSourceId);
      return jsonResponse({
        success: true,
        message: 'साप्ताहिक वृत्त संकलन यशस्वीरीत्या पूर्ण झाले (Ingestion completed)',
        targetSourceId: targetSourceId || 'all_active',
        summary,
      });
    }

    // -----------------------------------------------------------
    // POST /api/admin/publish-batch
    // -----------------------------------------------------------
    if (method === 'POST' && path === '/api/admin/publish-batch') {
      let body: { source_id?: string; limit?: number } = {};
      try {
        body = await request.json();
      } catch {}

      const limit = Math.min(50, body.limit || 10);
      let updateSql = `
        UPDATE stories
        SET status = 'published', updated_at = datetime('now')
        WHERE id IN (
          SELECT id FROM stories WHERE status IN ('incoming', 'approved')
      `;
      const params: (string | number)[] = [];

      if (body.source_id) {
        updateSql += ' AND source_id = ?';
        params.push(body.source_id);
      }

      updateSql += ' ORDER BY published_at DESC LIMIT ?)';
      params.push(limit);

      const updateRes = await env.DB.prepare(updateSql).bind(...params).run();

      return jsonResponse({
        success: true,
        publishedCount: updateRes.meta.changes,
        message: `${updateRes.meta.changes} बातम्या प्रकाशित केल्या (Published stories)`,
      });
    }

    // -----------------------------------------------------------
    // POST /api/admin/stories/sample
    // -----------------------------------------------------------
    if (method === 'POST' && path === '/api/admin/stories/sample') {
      let body: Partial<StoryRow> = {};
      try {
        body = await request.json();
      } catch {}

      const title = body.title || 'महाराष्ट्र विधिमंडळ: शेतकरी सिंचन व रोजगार योजनेसाठी विशेष तरतूद';
      const sourceUrl = body.source_url || 'https://pib.gov.in/sample-story-1';
      const sourceId = body.source_id || 'src_gov_pib_mr';
      const category = body.category || 'महाराष्ट्र';
      const status: StoryStatus = body.status || 'published';
      const publishedAt = body.published_at || new Date().toISOString();
      const contentHash = await computeContentHash(`${title}|${sourceUrl}`);
      const storyId = body.id || `sty_sample_${Date.now()}`;

      // Verify duplicate before insert
      const existing = await env.DB.prepare('SELECT id FROM stories WHERE content_hash = ? LIMIT 1')
        .bind(contentHash)
        .first<{ id: string }>();

      if (existing) {
        return jsonResponse(
          {
            success: false,
            duplicate: true,
            message: 'सदर बातमी आधीच अस्तित्वात आहे (Duplicate story detected via content_hash)',
            existingId: existing.id,
          },
          409
        );
      }

      await env.DB.prepare(`
        INSERT INTO stories (
          id, source_id, source_url, source_guid, title, description, content,
          image_url, author, published_at, category, language,
          status, content_hash, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'mr', ?, ?, datetime('now'), datetime('now'))
      `)
        .bind(
          storyId,
          sourceId,
          sourceUrl,
          body.source_guid || sourceUrl,
          title,
          body.description || 'महाराष्ट्रातील ग्रामीण विकासाला गती देण्यासाठी राज्य शासनाची महत्त्वपूर्ण घोषणा.',
          body.content || body.description || null,
          body.image_url ||
            'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1000&q=80',
          body.author || 'मुख्य संपादक दिलीप सोनाळे विशेष ब्युरो',
          publishedAt,
          category,
          status,
          contentHash
        )
        .run();

      const createdStory = await getJoinedStoryById(env.DB, storyId);

      return jsonResponse(
        {
          success: true,
          message: 'चाचणी बातमी यशस्वीरीत्या जतन केली (Sample story created)',
          data: createdStory,
        },
        201
      );
    }

    // -----------------------------------------------------------
    // POST /api/admin/stories/:id/status
    // -----------------------------------------------------------
    if (method === 'POST' && path.startsWith('/api/admin/stories/') && path.endsWith('/status')) {
      const storyId = path.replace('/api/admin/stories/', '').replace('/status', '');
      let body: { status?: StoryStatus } = {};
      try {
        body = await request.json();
      } catch {}

      const validStatuses: StoryStatus[] = [
        'incoming',
        'review',
        'approved',
        'published',
        'rejected',
        'archived',
      ];

      if (!body.status || !validStatuses.includes(body.status)) {
        return jsonResponse(
          { error: `अवैध स्थिती (Invalid status). Allowed: ${validStatuses.join(', ')}` },
          400
        );
      }

      const updateRes = await env.DB.prepare(
        "UPDATE stories SET status = ?, updated_at = datetime('now') WHERE id = ?"
      )
        .bind(body.status, storyId)
        .run();

      if (updateRes.meta.changes === 0) {
        return jsonResponse({ error: 'बातमी सापडली नाही (Story not found)' }, 404);
      }

      const updated = await getJoinedStoryById(env.DB, storyId);
      return jsonResponse({
        success: true,
        data: updated,
      });
    }
  }

  // Fallback 404 for unknown /api/* routes
  return jsonResponse(
    {
      error: 'अवैध API मार्ग (Invalid API route)',
      path,
    },
    404
  );
}
