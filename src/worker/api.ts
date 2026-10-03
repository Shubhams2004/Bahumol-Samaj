/**
 * @file api.ts
 * Cloudflare Worker REST API router for Bahumol Samaj Weekly Newspaper.
 * Provides public read-only endpoints (published stories only with joined source info)
 * and protected ingestion/editorial admin endpoints.
 */

import { Env, StoryRow, StoryStatus } from './types';
import { runIngestionPipeline, computeContentHash } from './ingestion';

/**
 * Helper to build JSON responses with security and CORS headers
 */
export function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
      'Cache-Control': status === 200 ? 'public, max-age=60, s-maxage=120' : 'no-store',
    },
  });
}

/**
 * Validate admin authorization token
 */
function isAuthorizedAdmin(request: Request, env: Env): boolean {
  const adminKey = env.ADMIN_API_KEY || 'bahumol-news-admin-2026';
  const authHeader = request.headers.get('Authorization') || '';
  const xAdminKey = request.headers.get('X-Admin-Key') || '';

  if (xAdminKey && xAdminKey === adminKey) return true;
  if (authHeader.startsWith('Bearer ') && authHeader.slice(7).trim() === adminKey) return true;

  return false;
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
      },
    });
  }

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
  // Returns published stories only with pagination, optional category, and source_group
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
  // -------------------------------------------------------------
  if (method === 'GET' && path.startsWith('/api/news/')) {
    const storyId = decodeURIComponent(path.replace('/api/news/', ''));
    if (!storyId || storyId.includes('/')) {
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

  // -------------------------------------------------------------
  // Protected Endpoint: POST /api/admin/refresh (or /api/ingest)
  // Supports optional ?source_id=... to test single feeds
  // -------------------------------------------------------------
  if (method === 'POST' && (path === '/api/admin/refresh' || path === '/api/ingest')) {
    if (!isAuthorizedAdmin(request, env)) {
      return jsonResponse({ error: 'अनधिकृत प्रवेश (Unauthorized: Invalid or missing admin key)' }, 401);
    }

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

  // -------------------------------------------------------------
  // Protected Endpoint: POST /api/admin/publish-batch
  // Publishes incoming stories for editorial verification
  // -------------------------------------------------------------
  if (method === 'POST' && path === '/api/admin/publish-batch') {
    if (!isAuthorizedAdmin(request, env)) {
      return jsonResponse({ error: 'अनधिकृत प्रवेश (Unauthorized)' }, 401);
    }

    let body: { source_id?: string; limit?: number } = {};
    try {
      body = await request.json();
    } catch {}

    const limit = Math.min(50, body.limit || 10);
    let updateSql = `
      UPDATE stories
      SET status = 'published', updated_at = datetime('now')
      WHERE id IN (
        SELECT id FROM stories WHERE status = 'incoming'
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

  // -------------------------------------------------------------
  // Protected Endpoint: POST /api/admin/stories/sample
  // Helper for testing insertion of a sample story
  // -------------------------------------------------------------
  if (method === 'POST' && path === '/api/admin/stories/sample') {
    if (!isAuthorizedAdmin(request, env)) {
      return jsonResponse({ error: 'अनधिकृत प्रवेश (Unauthorized)' }, 401);
    }

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
        id, source_id, source_url, source_guid, title, description,
        image_url, author, published_at, category, language,
        status, content_hash, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'mr', ?, ?, datetime('now'), datetime('now'))
    `)
      .bind(
        storyId,
        sourceId,
        sourceUrl,
        body.source_guid || sourceUrl,
        title,
        body.description || 'महाराष्ट्रातील ग्रामीण विकासाला गती देण्यासाठी राज्य शासनाची महत्त्वपूर्ण घोषणा.',
        body.image_url || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1000&q=80',
        body.author || 'मुख्य संपादक दिलीप सोनाळे विशेष ब्युरो',
        publishedAt,
        category,
        status,
        contentHash
      )
      .run();

    const createdStory = await env.DB.prepare(`
      SELECT
        stories.*,
        news_sources.name as source_name,
        news_sources.source_group as source_group
      FROM stories
      LEFT JOIN news_sources ON stories.source_id = news_sources.id
      WHERE stories.id = ?
    `)
      .bind(storyId)
      .first<StoryRow>();

    return jsonResponse(
      {
        success: true,
        message: 'चाचणी बातमी यशस्वीरीत्या जतन केली (Sample story created)',
        data: createdStory,
      },
      201
    );
  }

  // -------------------------------------------------------------
  // Protected Endpoint: POST /api/admin/stories/:id/status
  // Updates story status (e.g. approve/publish)
  // -------------------------------------------------------------
  if (method === 'POST' && path.startsWith('/api/admin/stories/') && path.endsWith('/status')) {
    if (!isAuthorizedAdmin(request, env)) {
      return jsonResponse({ error: 'अनधिकृत प्रवेश (Unauthorized)' }, 401);
    }

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

    const updated = await env.DB.prepare(`
      SELECT
        stories.*,
        news_sources.name as source_name,
        news_sources.source_group as source_group
      FROM stories
      LEFT JOIN news_sources ON stories.source_id = news_sources.id
      WHERE stories.id = ?
    `)
      .bind(storyId)
      .first<StoryRow>();

    return jsonResponse({
      success: true,
      data: updated,
    });
  }

  // -------------------------------------------------------------
  // Protected Endpoint: GET /api/admin/stories
  // Allows viewing stories of any status (incoming, review, etc.)
  // -------------------------------------------------------------
  if (method === 'GET' && path === '/api/admin/stories') {
    if (!isAuthorizedAdmin(request, env)) {
      return jsonResponse({ error: 'अनधिकृत प्रवेश (Unauthorized)' }, 401);
    }

    const statusParam = url.searchParams.get('status');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10) || 20));
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        stories.*,
        news_sources.name as source_name,
        news_sources.source_group as source_group
      FROM stories
      LEFT JOIN news_sources ON stories.source_id = news_sources.id
    `;
    const params: (string | number)[] = [];

    if (statusParam) {
      query += ' WHERE stories.status = ?';
      params.push(statusParam);
    }

    query += ' ORDER BY stories.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await env.DB.prepare(query).bind(...params).all<StoryRow>();

    return jsonResponse({
      success: true,
      page,
      limit,
      data: rows.results || [],
    });
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
