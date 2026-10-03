/**
 * @file rssParser.ts
 * Lightweight, resilient RSS 2.0 and Atom feed parser for Cloudflare Workers.
 * Zero external dependencies. Strips HTML markup to store only metadata and clean excerpts.
 */

import { ParsedFeedItem } from './types';

/**
 * Decode common XML/HTML entities
 */
function decodeXmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

/**
 * Strip all HTML tags from raw content to extract clean text excerpt
 */
function stripHtml(html: string): string {
  if (!html) return '';
  const decoded = decodeXmlEntities(html);
  return decoded
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract image URL from XML element or enclosure or HTML tag
 */
function extractImage(itemXml: string): string | undefined {
  // 1. Check enclosure url
  const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i);
  if (enclosureMatch && enclosureMatch[1] && /^https?:\/\//i.test(enclosureMatch[1])) {
    return enclosureMatch[1];
  }

  // 2. Check media:content or media:thumbnail url
  const mediaMatch = itemXml.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["'][^>]*>/i);
  if (mediaMatch && mediaMatch[1] && /^https?:\/\//i.test(mediaMatch[1])) {
    return mediaMatch[1];
  }

  // 3. Check <img> tag inside description or content
  const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (imgMatch && imgMatch[1] && /^https?:\/\//i.test(imgMatch[1])) {
    return imgMatch[1];
  }

  return undefined;
}

/**
 * Parse date string to ISO format, fallback to now if invalid
 */
function parseDateToIso(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr.trim());
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {}
  return new Date().toISOString();
}

/**
 * Extract tag value with CDATA support
 */
function getTagContent(xml: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  if (match && match[1]) {
    return decodeXmlEntities(match[1].trim());
  }
  return undefined;
}

/**
 * Parses RSS 2.0 / RSS 1.0 or Atom XML content into normalized ParsedFeedItem array
 */
export function parseFeedXml(xmlContent: string): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];
  if (!xmlContent || typeof xmlContent !== 'string') {
    return items;
  }

  const isAtom = /<feed[^>]*xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom["']/i.test(xmlContent) ||
                 /<entry[^>]*>/i.test(xmlContent);

  if (isAtom) {
    // Atom parsing (<entry> ... </entry>)
    const entryMatches = xmlContent.match(/<entry[\s\S]*?<\/entry>/gi) || [];
    for (const entryXml of entryMatches) {
      const rawTitle = getTagContent(entryXml, 'title') || '';
      const title = stripHtml(rawTitle);
      if (!title) continue;

      // Link: <link href="..." rel="alternate" /> or <link href="..." />
      let link = '';
      const linkMatch = entryXml.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
      if (linkMatch && linkMatch[1]) {
        link = linkMatch[1].trim();
      }

      // Guid / ID
      const guid = getTagContent(entryXml, 'id') || link;

      // Summary or content
      const rawDesc = getTagContent(entryXml, 'summary') || getTagContent(entryXml, 'content') || '';
      const description = stripHtml(rawDesc).slice(0, 500);

      // Published / Updated
      const dateStr = getTagContent(entryXml, 'published') || getTagContent(entryXml, 'updated');
      const publishedAt = parseDateToIso(dateStr);

      // Author
      let author = getTagContent(entryXml, 'author');
      if (author && /<name>/i.test(author)) {
        author = getTagContent(author, 'name');
      }
      author = author ? stripHtml(author) : undefined;

      // Image
      const imageUrl = extractImage(entryXml);

      // Category
      const catMatch = entryXml.match(/<category[^>]+term=["']([^"']+)["'][^>]*>/i);
      const categoryCandidate = catMatch ? catMatch[1] : getTagContent(entryXml, 'category');

      if (link && /^https?:\/\//i.test(link)) {
        items.push({
          guid,
          title,
          link,
          description: description || undefined,
          imageUrl,
          author,
          publishedAt,
          categoryCandidate,
        });
      }
    }
  } else {
    // RSS 2.0 / RSS 1.0 parsing (<item> ... </item>)
    const itemMatches = xmlContent.match(/<item[\s\S]*?<\/item>/gi) || [];
    for (const itemXml of itemMatches) {
      const rawTitle = getTagContent(itemXml, 'title') || '';
      const title = stripHtml(rawTitle);
      if (!title) continue;

      // Link: <link>...</link> or guid permaLink
      let link = getTagContent(itemXml, 'link') || '';
      if (!link) {
        const guidMatch = itemXml.match(/<guid[^>]*isPermaLink=["']true["'][^>]*>([^<]+)<\/guid>/i);
        if (guidMatch && guidMatch[1]) {
          link = guidMatch[1].trim();
        }
      }

      // Guid
      const guid = getTagContent(itemXml, 'guid') || link;

      // Description / Content
      const rawDesc = getTagContent(itemXml, 'content:encoded') || getTagContent(itemXml, 'description') || '';
      const description = stripHtml(rawDesc).slice(0, 500);

      // Published date
      const dateStr = getTagContent(itemXml, 'pubDate') || getTagContent(itemXml, 'dc:date');
      const publishedAt = parseDateToIso(dateStr);

      // Author
      const author = getTagContent(itemXml, 'dc:creator') || getTagContent(itemXml, 'author');

      // Image
      const imageUrl = extractImage(itemXml);

      // Category
      const categoryCandidate = getTagContent(itemXml, 'category');

      if (link && /^https?:\/\//i.test(link)) {
        items.push({
          guid,
          title,
          link,
          description: description || undefined,
          imageUrl,
          author: author ? stripHtml(author) : undefined,
          publishedAt,
          categoryCandidate,
        });
      }
    }
  }

  return items;
}
