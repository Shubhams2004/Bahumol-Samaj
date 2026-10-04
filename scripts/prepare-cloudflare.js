import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const WRANGLER_CONFIG_PATH = path.resolve(process.cwd(), 'wrangler.jsonc');
const DB_NAME = 'bahumol-samaj-db';
const PLACEHOLDER_ID = '00000000-0000-0000-0000-000000000000';

function getCurrentDatabaseId() {
  if (!fs.existsSync(WRANGLER_CONFIG_PATH)) return null;
  const content = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');
  const match = content.match(/"database_id":\s*"([^"]+)"/);
  return match ? match[1] : null;
}

function ensureDatabaseBinding(databaseId) {
  if (!fs.existsSync(WRANGLER_CONFIG_PATH)) return false;
  let content = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');

  if (content.includes('"d1_databases"')) {
    content = content.replace(/"database_id":\s*"[^"]+"/, `"database_id": "${databaseId}"`);
  } else {
    const d1Block = `  "d1_databases": [\n    {\n      "binding": "DB",\n      "database_name": "${DB_NAME}",\n      "database_id": "${databaseId}",\n      "migrations_dir": "migrations"\n    }\n  ],\n`;
    if (content.includes('"triggers"')) {
      content = content.replace('"triggers"', `${d1Block}  "triggers"`);
    } else {
      content = content.replace(/\n}/, `,\n${d1Block}}`);
    }
  }
  fs.writeFileSync(WRANGLER_CONFIG_PATH, content, 'utf8');
  console.log(`[cloudflare-prep] Configured D1 binding "DB" with database_id: ${databaseId}`);
  return true;
}

function removePlaceholderDatabaseBinding() {
  if (!fs.existsSync(WRANGLER_CONFIG_PATH)) return;
  let content = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');
  if (content.includes(PLACEHOLDER_ID)) {
    console.log('[cloudflare-prep] Detected placeholder database_id "00000000-0000-0000-0000-000000000000".');
    console.log('[cloudflare-prep] Cloudflare API rejects deployments referencing unprovisioned placeholder UUIDs (Code 10181).');
    console.log('[cloudflare-prep] Safely omitting placeholder D1 binding for this build so Cloudflare deployment succeeds.');
    content = content.replace(/\s*"d1_databases":\s*\[\s*\{[\s\S]*?\}\s*\],?/, '');
    fs.writeFileSync(WRANGLER_CONFIG_PATH, content, 'utf8');
    console.log('[cloudflare-prep] All web application assets and Worker routing will deploy successfully.');
    console.log('[cloudflare-prep] To activate live D1 persistence:');
    console.log('[cloudflare-prep]   1. Create database in Cloudflare dashboard: "bahumol-samaj-db"');
    console.log('[cloudflare-prep]   2. Add D1_DATABASE_ID in Cloudflare Settings > Variables');
  }
}

async function prepareCloudflare() {
  console.log('[cloudflare-prep] Checking Cloudflare D1 configuration...');
  const currentId = getCurrentDatabaseId();
  const envDatabaseId = process.env.D1_DATABASE_ID || process.env.CLOUDFLARE_DATABASE_ID;

  // 1. Check if valid D1_DATABASE_ID was provided via environment variable
  if (envDatabaseId && envDatabaseId.trim() && envDatabaseId.trim() !== PLACEHOLDER_ID) {
    console.log(`[cloudflare-prep] Found valid D1_DATABASE_ID in environment: ${envDatabaseId.trim()}`);
    ensureDatabaseBinding(envDatabaseId.trim());
    return;
  }

  // 2. If a valid, non-placeholder UUID is already configured in wrangler.jsonc, keep it
  if (currentId && currentId !== PLACEHOLDER_ID) {
    console.log(`[cloudflare-prep] Valid D1 database_id already configured in wrangler.jsonc: ${currentId}`);
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
      ensureDatabaseBinding(parsed.uuid);
      return;
    }
  } catch {
    // Info check failed (e.g. unauthenticated in build step)
  }

  // 4. Attempt to auto-create database if permitted
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
      ensureDatabaseBinding(created.uuid);
      return;
    }
  } catch {
    // Creation not permitted in current CI token scope
  }

  // 5. Automatic Fallback: Omit placeholder D1 binding to prevent Cloudflare API Code 10181 failure!
  removePlaceholderDatabaseBinding();
}

prepareCloudflare().catch((err) => {
  console.warn('[cloudflare-prep] Warning during Cloudflare preparation:', err.message);
});
