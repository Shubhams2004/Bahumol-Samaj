/**
 * @file test_router.ts
 * Rigorous Unit Test Suite for Router Hash and Path Parsing.
 * Verifies unambiguous separation of:
 * - #/editorial (Public Editorial Category Page)
 * - #/editorial-desk (Private Editorial Dashboard & Story Workspace)
 * - Fallbacks & Unknown Routes
 */

import { parseHash } from '../src/utils/router';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, actual?: unknown, expected?: unknown) {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${testName}`);
    console.error(`  Expected:`, expected);
    console.error(`  Actual:  `, actual);
    failed++;
  }
}

console.log('========================================================');
console.log('  BAHUMOL SAMAJ: ROUTER UNIT TEST SUITE');
console.log('========================================================');

// 1. Private Editorial Desk routes
const r1 = parseHash('#/editorial-desk');
assert(r1.page === 'editorial-desk' && r1.params.storyId === undefined, '1. "#/editorial-desk" routes to private editorial-desk', r1);

const r2 = parseHash('#/editorial-desk/');
assert(r2.page === 'editorial-desk', '2. "#/editorial-desk/" routes to private editorial-desk', r2);

const r3 = parseHash('#/editorial-desk/sty_test_123');
assert(r3.page === 'editorial-desk' && r3.params.storyId === 'sty_test_123', '3. "#/editorial-desk/sty_test_123" routes with storyId', r3);

const r4 = parseHash('#/editorial/desk');
assert(r4.page === 'editorial-desk', '4. Alternate alias "#/editorial/desk" routes to private editorial-desk', r4);

const r5 = parseHash('#/editorial/desk/sty_456');
assert(r5.page === 'editorial-desk' && r5.params.storyId === 'sty_456', '5. "#/editorial/desk/sty_456" routes with storyId', r5);

const r6 = parseHash('#/category/editorial-desk');
assert(r6.page === 'editorial-desk', '6. Category alias "#/category/editorial-desk" routes to private editorial-desk', r6);

const r7 = parseHash('/editorial-desk');
assert(r7.page === 'editorial-desk', '7. Pathname fallback "/editorial-desk" routes to private editorial-desk', r7);

// 2. Public संपादकीय (Editorial & Opinion) category routes
const r8 = parseHash('#/editorial');
assert(r8.page === 'editorial', '8. "#/editorial" routes to public संपादकीय category page', r8);

const r9 = parseHash('#/editorial/');
assert(r9.page === 'editorial', '9. "#/editorial/" routes to public संपादकीय category page', r9);

const r10 = parseHash('#/category/editorial');
assert(r10.page === 'editorial', '10. "#/category/editorial" routes to public संपादकीय category page', r10);

const r11 = parseHash('/editorial');
assert(r11.page === 'editorial', '11. Pathname fallback "/editorial" routes to public संपादकीय category page', r11);

// 3. Unambiguous Distinction Test
assert(r1.page !== r8.page, '12. "#/editorial-desk" and "#/editorial" produce distinct pages (desk !== editorial)');

// 4. Other Standard Routes
const r13 = parseHash('#/category/maharashtra');
assert(r13.page === 'category' && r13.params.slug === 'maharashtra', '13. "#/category/maharashtra" routes to category page with slug', r13);

const r14 = parseHash('#/article/art_lead_1');
assert(r14.page === 'article' && r14.params.slug === 'art_lead_1', '14. "#/article/art_lead_1" routes to article page', r14);

const r15 = parseHash('#/timeline');
assert(r15.page === 'timeline', '15. "#/timeline" routes to timeline page', r15);

const r16 = parseHash('#/epaper');
assert(r16.page === 'epaper', '16. "#/epaper" routes to epaper page', r16);

// 5. Unknown routes must NEVER fall back to public editorial
const r17 = parseHash('#/unknown-random-route');
assert(r17.page === 'home', '17. Unknown route "#/unknown-random-route" defaults to home (NOT editorial)', r17);

const r18 = parseHash('#/foobar');
assert(r18.page === 'home', '18. Unknown route "#/foobar" defaults to home (NOT editorial)', r18);

const r19 = parseHash('');
assert(r19.page === 'home', '19. Empty hash defaults to home', r19);

console.log('========================================================');
console.log(`Router Results: ${passed} passed, ${failed} failed`);
console.log('========================================================');

if (failed > 0) {
  process.exit(1);
}
