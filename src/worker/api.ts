/**
 * @file api.ts
 * Cloudflare Worker REST API router for Bahumol Samaj Weekly Newspaper.
 * Provides:
 * 1. Public read-only endpoints (published stories only with joined source info)
 * 2. Protected editorial newsroom endpoints (/api/editorial/*)
 * 3. Protected RSS ingestion & administration endpoints (/api/admin/*)
 */

import { Env, StoryRow, StoryStatus, EditorialCounts, EditorialUpdatePayload } from './types';
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
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key, X-Editorial-Key',
      'Cache-Control': status === 200 ? 'public, max-age=30, s-maxage=60' : 'no-store',
    },
  });
}

/**
 * Validate admin authorization token
 */
export function isAuthorizedAdmin(request: Request, env: Env): boolean {
  const adminKey = env.ADMIN_API_KEY || 'bahumol-news-admin-2026';
  const editorialKey = 'bahumol-editor-2026';
  const authHeader = request.headers.get('Authorization') || '';
  const xAdminKey = request.headers.get('X-Admin-Key') || '';
  const xEditorialKey = request.headers.get('X-Editorial-Key') || '';

  if (xAdminKey && (xAdminKey === adminKey || xAdminKey === editorialKey)) return true;
  if (xEditorialKey && (xEditorialKey === adminKey || xEditorialKey === editorialKey)) return true;
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token === adminKey || token === editorialKey) return true;
  }

  return false;
}

/**
 * Validate editorial authorization token
 */
export function isAuthorizedEditorial(request: Request, env: Env): boolean {
  return isAuthorizedAdmin(request, env);
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
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key, X-Editorial-Key',
      },
    });
  }

  // =============================================================
  // PART 1: PUBLIC READ-ONLY ENDPOINTS (Strictly Published Stories)
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

  // =============================================================
  // PART 2: PROTECTED EDITORIAL DASHBOARD ENDPOINTS (/api/editorial/*)
  // =============================================================

  if (path.startsWith('/api/editorial')) {
    // Safety check: Validate editorial authentication
    if (!isAuthorizedEditorial(request, env)) {
      return jsonResponse(
        {
          error: 'अनधिकृत प्रवेश: वैध संपादकीय सुरक्षा की आवश्यक (Unauthorized: Valid editorial key required)',
          code: 'UNAUTHORIZED_EDITORIAL',
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

      let countQuery = "SELECT COUNT(*) as count FROM stories LEFT JOIN news_sources ON stories.source_id = news_sources.id WHERE stories.status = 'incoming'";
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

      let countQuery = 'SELECT COUNT(*) as count FROM stories LEFT JOIN news_sources ON stories.source_id = news_sources.id WHERE 1=1';
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
      const origDesc = existing.original_description !== undefined && existing.original_description !== null
        ? existing.original_description
        : existing.description;

      const newTitle = body.title !== undefined ? body.title.trim() : existing.title;
      const newDesc = body.description !== undefined ? body.description.trim() : existing.description;
      const newCategory = body.category !== undefined ? body.category.trim() : existing.category;
      const newImageUrl = body.image_url !== undefined ? body.image_url.trim() : existing.image_url;
      const newAuthor = body.author !== undefined ? body.author.trim() : existing.author;
      const newTags = body.tags !== undefined ? body.tags.trim() : (existing.tags || '');
      const newNotes = body.editorial_notes !== undefined ? body.editorial_notes.trim() : (existing.editorial_notes || '');
      const newStatus = body.status && ['incoming', 'review', 'approved', 'published', 'rejected', 'archived'].includes(body.status)
        ? body.status
        : existing.status;

      await env.DB.prepare(`
        UPDATE stories
        SET
          title = ?,
          description = ?,
          category = ?,
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
          newCategory,
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
      const existing = await env.DB.prepare('SELECT id, status FROM stories WHERE id = ?').bind(storyId).first<{ id: string; status: StoryStatus }>();

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
      const existing = await env.DB.prepare('SELECT id, status FROM stories WHERE id = ?').bind(storyId).first<{ id: string; status: StoryStatus }>();

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
      const existing = await env.DB.prepare('SELECT id, status, editorial_notes FROM stories WHERE id = ?').bind(storyId).first<{ id: string; status: StoryStatus; editorial_notes?: string }>();

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
      const existing = await env.DB.prepare('SELECT id, status FROM stories WHERE id = ?').bind(storyId).first<{ id: string; status: StoryStatus }>();

      if (!existing) {
        return jsonResponse({ error: 'बातमी सापडली नाही (Story not found)' }, 404);
      }

      // Check status flow constraint
      if (existing.status === 'incoming') {
        return jsonResponse(
          {
            error: "थेट अप्रमाणित बातमी प्रकाशित करता येत नाही. आधी बातमी तपासून 'मंजूर' (approve) करा. (Story must be reviewed and approved before publishing)",
            code: 'STATUS_FLOW_VIOLATION',
          },
          400
        );
      }

      if (existing.status === 'published') {
        return jsonResponse({ message: 'सदर बातमी आधीच प्रकाशित आहे', data: await getJoinedStoryById(env.DB, storyId) });
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
      const existing = await env.DB.prepare('SELECT id, status FROM stories WHERE id = ?').bind(storyId).first<{ id: string; status: StoryStatus }>();

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
  // PART 3: PROTECTED INGESTION & ADMIN ENDPOINTS (/api/admin/*)
  // =============================================================

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
  // Publishes approved/incoming stories for editorial verification
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

    const updated = await getJoinedStoryById(env.DB, storyId);

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
