/**
 * @file api.ts
 * Cloudflare Worker REST API router for Bahumol Samaj Weekly Newspaper.
 * Provides public read-only endpoints (published stories only) and protected ingestion/admin endpoints.
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
  // -------------------------------------------------------------
  if (method === 'GET' && path === '/api/sources') {
    const rows = await env.DB.prepare(
      'SELECT id, name, source_url, source_type, language, default_category, active, last_fetched_at FROM news_sources WHERE active = 1 ORDER BY name ASC'
    ).all();

    return jsonResponse({
      success: true,
      sources: rows.results || [],
    });
  }

  // -------------------------------------------------------------
  // Public Endpoint: GET /api/news
  // Returns published stories only with pagination and optional category
  // -------------------------------------------------------------
  if (method === 'GET' && path === '/api/news') {
    const categoryParam = url.searchParams.get('category');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10) || 10));
    const offset = (page - 1) * limit;

    let countQuery = "SELECT COUNT(*) as count FROM stories WHERE status = 'published'";
    let selectQuery = "SELECT * FROM stories WHERE status = 'published'";
    const queryParams: (string | number)[] = [];

    if (categoryParam && categoryParam.trim()) {
      countQuery += ' AND category = ?';
      selectQuery += ' AND category = ?';
      queryParams.push(categoryParam.trim());
    }

    selectQuery += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';

    const countStmt = env.DB.prepare(countQuery);
    const totalRow = (queryParams.length > 0
      ? await countStmt.bind(queryParams[0]).first<{ count: number }>()
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

    const rows = await env.DB.prepare(
      "SELECT * FROM stories WHERE status = 'published' AND category = ? ORDER BY published_at DESC LIMIT ? OFFSET ?"
    )
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

    const story = await env.DB.prepare(
      "SELECT * FROM stories WHERE (id = ? OR source_guid = ?) AND status = 'published' LIMIT 1"
    )
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
  // Triggers manual RSS ingestion cycle across all active sources
  // -------------------------------------------------------------
  if (method === 'POST' && (path === '/api/admin/refresh' || path === '/api/ingest')) {
    if (!isAuthorizedAdmin(request, env)) {
      return jsonResponse({ error: 'अनधिकृत प्रवेश (Unauthorized: Invalid or missing admin key)' }, 401);
    }

    const summary = await runIngestionPipeline(env);
    return jsonResponse({
      success: true,
      message: 'साप्ताहिक वृत्त संकलन यशस्वीरीत्या पूर्ण झाले (Ingestion completed)',
      summary,
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
    const sourceId = body.source_id || 'src_pib_mr';
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

    const createdStory = await env.DB.prepare('SELECT * FROM stories WHERE id = ?')
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

    const updated = await env.DB.prepare('SELECT * FROM stories WHERE id = ?')
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

    let query = 'SELECT * FROM stories';
    const params: (string | number)[] = [];

    if (statusParam) {
      query += ' WHERE status = ?';
      params.push(statusParam);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
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
