/**
 * @file test_error_isolation.ts
 * Verification that a failed source feed never halts or crashes the ingestion cycle.
 */

import { ingestFromSource } from '../src/worker/ingestion';
import { NewsSourceRow } from '../src/worker/types';

async function testErrorIsolation() {
  console.log('--- Error Isolation Test ---');

  const brokenSource: NewsSourceRow = {
    id: 'src_broken',
    name: 'अस्तित्वात नसलेला स्रोत (Nonexistent/Broken Source)',
    feed_url: 'https://nonexistent-broken-domain-12345.org/feed.xml',
    source_url: 'https://nonexistent-broken-domain-12345.org',
    source_type: 'rss',
    language: 'mr',
    default_category: 'महाराष्ट्र',
    active: 1,
    last_fetched_at: null,
    created_at: '2026-10-01',
  };

  // Dummy D1 that records prepared statements
  const dummyDb = {
    prepare: () => ({
      bind: () => ({
        first: async () => null,
        all: async () => ({ results: [] }),
        run: async () => ({ meta: { changes: 0 } }),
      }),
    }),
  };

  const result = await ingestFromSource(brokenSource, dummyDb as never);

  console.log('Result for broken source:', result);

  if (result.error && result.fetchedCount === 0) {
    console.log('✓ PASS: Broken source error was caught gracefully without throwing unhandled exceptions');
    console.log(`✓ Recorded error: ${result.error}`);
  } else {
    console.error('✗ FAIL: Error was not handled as expected');
    process.exit(1);
  }
}

testErrorIsolation().catch((err) => {
  console.error('Unhandled crash in error isolation test:', err);
  process.exit(1);
});
