/**
 * @file backend-tests.ts
 * Verification script for Bahumol Samaj Newsroom Ingestion Pipeline & D1 Backend.
 */

import { parseFeedXml } from '../src/worker/rssParser';
import { classifyArticle } from '../src/worker/classifier';
import { computeContentHash } from '../src/worker/ingestion';

async function runTests() {
  console.log('--- Bahumol Samaj Backend Verification Tests ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Test RSS Parser
  console.log('\n[Test 1: RSS Parser]');
  const sampleRss = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
    <channel>
      <title>PIB Mumbai Marathi</title>
      <link>https://pib.gov.in</link>
      <item>
        <title><![CDATA[महाराष्ट्र अर्थसंकल्प: ग्रामीण सिंचनासाठी ७५ हजार कोटी मंजूर]]></title>
        <link>https://pib.gov.in/PressReleasePage.aspx?PRID=101</link>
        <guid isPermaLink="true">https://pib.gov.in/PressReleasePage.aspx?PRID=101</guid>
        <description><![CDATA[<p>मुंबई: राज्य शासनाच्या अर्थसंकल्पात जलसंधारण व रोजगाराला प्राधान्य देण्यात आले आहे.</p>]]></description>
        <pubDate>Thu, 01 Oct 2026 08:30:00 GMT</pubDate>
        <enclosure url="https://images.unsplash.com/photo-1?w=800" type="image/jpeg" />
        <category>महाराष्ट्र</category>
      </item>
    </channel>
  </rss>`;

  const rssItems = parseFeedXml(sampleRss);
  assert(rssItems.length === 1, 'Parsed 1 RSS item');
  assert(rssItems[0].title === 'महाराष्ट्र अर्थसंकल्प: ग्रामीण सिंचनासाठी ७५ हजार कोटी मंजूर', 'Decoded CDATA title correctly');
  assert(rssItems[0].description === 'मुंबई: राज्य शासनाच्या अर्थसंकल्पात जलसंधारण व रोजगाराला प्राधान्य देण्यात आले आहे.', 'Stripped HTML tags from description');
  assert(rssItems[0].imageUrl === 'https://images.unsplash.com/photo-1?w=800', 'Extracted image from enclosure');

  // 2. Test Atom Parser
  console.log('\n[Test 2: Atom Parser]');
  const sampleAtom = `<?xml version="1.0" encoding="utf-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <title>AIR News Marathi</title>
    <entry>
      <title>इस्रोची ऐतिहासिक भरारी; स्वदेशी उपग्रहाचे यशस्वी प्रक्षेपण</title>
      <link href="https://newsonair.gov.in/news-202" rel="alternate"/>
      <id>tag:newsonair.gov.in,2026:news-202</id>
      <updated>2026-10-01T10:00:00Z</updated>
      <summary>श्रीहरिकोटा येथून पीएसएलव्ही रॉकेटचे अचूक उड्डाण.</summary>
    </entry>
  </feed>`;

  const atomItems = parseFeedXml(sampleAtom);
  assert(atomItems.length === 1, 'Parsed 1 Atom item');
  assert(atomItems[0].guid === 'tag:newsonair.gov.in,2026:news-202', 'Extracted Atom ID');
  assert(atomItems[0].link === 'https://newsonair.gov.in/news-202', 'Extracted Atom Link');

  // 3. Test Deterministic Content Hash
  console.log('\n[Test 3: Content Hashing & Deduplication]');
  const hash1 = await computeContentHash('महाराष्ट्र अर्थसंकल्प|https://pib.gov.in/101');
  const hash2 = await computeContentHash('महाराष्ट्र अर्थसंकल्प|https://pib.gov.in/101');
  const hash3 = await computeContentHash('दुसरे वृत्त|https://pib.gov.in/102');
  assert(hash1 === hash2, 'Hash is deterministic for identical title + link');
  assert(hash1 !== hash3, 'Different content produces distinct hash');

  // 4. Test Deterministic Category Classifier
  console.log('\n[Test 4: Deterministic Marathi Classifier]');
  const cat1 = classifyArticle('वानखेडेवर भारताचा थरारक विजय; कर्णधाराचे नाबाद शतक');
  assert(cat1 === 'क्रीडा', `Classified cricket story as क्रीडा (got: ${cat1})`);

  const cat2 = classifyArticle('इस्रोच्या पीएसएलव्ही रॉकेटने अवकाशात झेप घेतली');
  assert(cat2 === 'विज्ञान-तंत्रज्ञान', `Classified ISRO story as विज्ञान-तंत्रज्ञान (got: ${cat2})`);

  const cat3 = classifyArticle('राज्यभरात हमीभाव खरेदी केंद्र सुरू; सोयाबीन व कापूस उत्पादकांना दिलासा');
  assert(cat3 === 'अर्थव्यवस्था', `Classified MSP/commodity story as अर्थव्यवस्था (got: ${cat3})`);

  const cat4 = classifyArticle('एमपीएससी परीक्षेसाठी मोफत ग्रंथालय सुरू');
  assert(cat4 === 'शिक्षण', `Classified MPSC story as शिक्षण (got: ${cat4})`);

  const cat5 = classifyArticle('बालगंधर्व रंगमंदिरात संगीत नाटकाचे प्रयोग');
  assert(cat5 === 'मनोरंजन', `Classified theatre story as मनोरंजन (got: ${cat5})`);

  // 5. Test Malformed Feed Resilience
  console.log('\n[Test 5: Malformed XML Resilience]');
  const malformedItems = parseFeedXml('<broken><xml><item><title>Bad XML');
  assert(Array.isArray(malformedItems) && malformedItems.length === 0, 'Malformed XML handled without throwing exceptions');

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner failure:', err);
  process.exit(1);
});
