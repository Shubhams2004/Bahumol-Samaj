import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const WRANGLER_CONFIG_PATH = path.resolve(process.cwd(), 'wrangler.jsonc');
const DB_NAME = 'bahumol-samaj-db';

function getCurrentDatabaseId() {
  if (!fs.existsSync(WRANGLER_CONFIG_PATH)) return null;
  const content = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');
  const match = content.match(/"database_id":\s*"([^"]+)"/);
  return match ? match[1] : null;
}

function updateDatabaseId(newId) {
  if (!fs.existsSync(WRANGLER_CONFIG_PATH)) return false;
  let content = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');
  const prevIdMatch = content.match(/"database_id":\s*"([^"]+)"/);
  if (prevIdMatch && prevIdMatch[1] === newId) {
    console.log(`[cloudflare-prep] wrangler.jsonc already configured with database_id: ${newId}`);
    return true;
  }
  if (prevIdMatch) {
    content = content.replace(/"database_id":\s*"[^"]+"/, `"database_id": "${newId}"`);
    fs.writeFileSync(WRANGLER_CONFIG_PATH, content, 'utf8');
    console.log(`[cloudflare-prep] Updated wrangler.jsonc with D1 database_id: ${newId}`);
    return true;
  }
  return false;
}

async function prepareCloudflare() {
  console.log('[cloudflare-prep] Checking Cloudflare D1 configuration...');
  const currentId = getCurrentDatabaseId();
  const envDatabaseId = process.env.D1_DATABASE_ID || process.env.CLOUDFLARE_DATABASE_ID;

  // 1. Check if D1_DATABASE_ID was provided in environment
  if (envDatabaseId && envDatabaseId.trim() && envDatabaseId !== '00000000-0000-0000-0000-000000000000') {
    console.log(`[cloudflare-prep] Found D1_DATABASE_ID in environment: ${envDatabaseId}`);
    updateDatabaseId(envDatabaseId.trim());
    return;
  }

  // 2. If a valid, non-placeholder UUID is already configured, we are ready
  if (currentId && currentId !== '00000000-0000-0000-0000-000000000000') {
    console.log(`[cloudflare-prep] D1 database_id already configured in wrangler.jsonc: ${currentId}`);
    return;
  }

  // 3. Attempt automated discovery via Wrangler API in Cloudflare CI
  try {
    console.log(`[cloudflare-prep] Checking remote D1 database "${DB_NAME}" via Wrangler...`);
    const infoOutput = execSync(`npx wrangler d1 info ${DB_NAME} --json`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    });
    const parsed = JSON.parse(infoOutput);
    if (parsed && parsed.uuid) {
      console.log(`[cloudflare-prep] Discovered existing D1 database UUID: ${parsed.uuid}`);
      updateDatabaseId(parsed.uuid);
      return;
    }
  } catch {
    // Info check failed (e.g. not found or unauthenticated in current step)
  }

  // 4. Attempt to create database if permitted
  try {
    console.log(`[cloudflare-prep] Attempting to auto-create D1 database "${DB_NAME}"...`);
    const createOutput = execSync(`npx wrangler d1 create ${DB_NAME} --json`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15000,
    });
    const created = JSON.parse(createOutput);
    if (created && created.uuid) {
      console.log(`[cloudflare-prep] Successfully created remote D1 database: ${created.uuid}`);
      updateDatabaseId(created.uuid);
      return;
    }
  } catch {
    // Creation not supported in current environment
  }

  // 5. If user enabled fallback deploy without D1
  if (process.env.ALLOW_INITIAL_DEPLOY === 'true' || process.env.SKIP_D1_FALLBACK === 'true') {
    console.log('[cloudflare-prep] ALLOW_INITIAL_DEPLOY enabled: omitting placeholder d1_databases binding to allow deployment...');
    let content = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');
    content = content.replace(/\s*"d1_databases":\s*\[\s*\{[\s\S]*?\}\s*\],?/, '');
    fs.writeFileSync(WRANGLER_CONFIG_PATH, content, 'utf8');
    console.log('[cloudflare-prep] Deployment will proceed with frontend and assets.');
    return;
  }

  // 6. If still using placeholder, log clear instructions for the user
  console.log('[cloudflare-prep] Note: wrangler.jsonc is currently using the initial placeholder database_id.');
  console.log('[cloudflare-prep] If you have created the D1 database, set the D1_DATABASE_ID environment variable');
  console.log('[cloudflare-prep] in your Cloudflare dashboard, or update database_id directly in wrangler.jsonc.');
}

prepareCloudflare().catch((err) => {
  console.warn('[cloudflare-prep] Warning during Cloudflare preparation:', err.message);
});
