/**
 * @file classifier.ts
 * Deterministic Marathi news category classifier.
 * Rules-based keyword matching without external AI or network calls.
 */

export const VALID_CATEGORIES = [
  'महाराष्ट्र',
  'देश',
  'जग',
  'राजकारण',
  'अर्थव्यवस्था',
  'शिक्षण',
  'विज्ञान-तंत्रज्ञान',
  'क्रीडा',
  'मनोरंजन',
  'संपादकीय',
] as const;

export type MarathiCategory = typeof VALID_CATEGORIES[number];

// Keyword mappings for deterministic categorization
const CATEGORY_KEYWORDS: Record<MarathiCategory, string[]> = {
  क्रीडा: [
    'क्रिकेट', 'सामना', 'खेळाडू', 'कुस्ती', 'कबड्डी', 'फुटबॉल', 'ऑलिम्पिक', 'पदक',
    'गोल', 'फलंदाज', 'गोलंदाज', 'विजय', 'पराभव', 'स्पर्धा', 'आयपीएल', 'वानखेडे',
    'धोनी', 'रोहित', 'विराट', 'कसोटी', 'एकदिवसीय', 'शर्यत', 'sports'
  ],
  मनोरंजन: [
    'सिनेमा', 'चित्रपट', 'नाटक', 'रंगभूमी', 'बालगंधर्व', 'अभिनेता', 'अभिनेत्री',
    'दिग्दर्शक', 'गीत', 'संगीत', 'कलाकार', 'गायक', 'मालिका', 'नाट्य', 'कला',
    'बॉक्स ऑफिस', 'मनोरंजन', 'entertainment'
  ],
  शिक्षण: [
    'शाळा', 'महाविद्यालय', 'कॉलेज', 'विद्यापीठ', 'परीक्षा', 'एमपीएससी', 'युपीएससी',
    'MPSC', 'UPSC', 'विद्यार्थी', 'शिक्षक', 'अभ्यासक्रम', 'निकाल', 'प्रवेश',
    'शिष्यवृत्ती', 'शिक्षण', 'education'
  ],
  'विज्ञान-तंत्रज्ञान': [
    'इस्रो', 'ISRO', 'उपग्रह', 'अंतराळ', 'सायबर', 'तंत्रज्ञान', 'सौर ऊर्जा',
    'रॉकेट', 'एआय', 'AI', 'इंटरनेट', 'डिजिटल', 'वैज्ञानिक', 'संशोधन', 'tech',
    'science'
  ],
  अर्थव्यवस्था: [
    'अर्थव्यवस्था', 'अर्थसंकल्प', 'बाजारभाव', 'हमीभाव', 'सोयाबीन', 'कापूस',
    'महागाई', 'बँक', 'बँकिंग', 'सेन्सेक्स', 'निफ्टी', 'उद्योग', 'जीएसटी',
    'रुपया', 'शेअर बाजार', 'शेतकरी', 'नाफेड', 'दिलासा', 'कृषी बाजार', 'economy'
  ],
  राजकारण: [
    'निवडणूक', 'मतदान', 'विधानसभा', 'विधानपरिषद', 'लोकसभा', 'आमदार', 'खासदार',
    'मंत्रिमंडळ', 'युती', 'आघाडी', 'पक्ष', 'राजीनामा', 'प्रचार', 'मेळावा',
    'महापालिका', 'जिल्हा परिषद', 'राजकारण', 'politics'
  ],
  संपादकीय: [
    'अग्रलेख', 'संपादकीय', 'भाष्य', 'चिंतन', 'विचारमंथन', 'दृष्टिकोन', 'सडेतोड',
    'editorial', 'opinion'
  ],
  जग: [
    'अमेरिका', 'रशिया', 'चीन', 'युक्रेन', 'इस्रायल', 'ब्रिटन', 'परराष्ट्र',
    'संयुक्त राष्ट्र', 'यूएन', 'जागतिक', 'आंतरराष्ट्रीय', 'world', 'global'
  ],
  देश: [
    'संसद', 'पंतप्रधान', 'राष्ट्रपती', 'नवी दिल्ली', 'सर्वोच्च न्यायालय',
    'केंद्रीय', 'महामार्ग', 'रेल्वे', 'सीबीआय', 'ईडी', 'भारत', 'national', 'india'
  ],
  महाराष्ट्र: [
    'महाराष्ट्र', 'मुंबई', 'पुणे', 'ठाणे', 'नागपूर', 'नाशिक', 'छत्रपती संभाजीनगर',
    'मराठवाडा', 'विदर्भ', 'कोकण', 'पश्चिम महाराष्ट्र', 'सह्याद्री', 'विधिमंडळ',
    'मंत्रालय', 'राज्य शासन', 'उपमुख्यमंत्री', 'मुख्यमंत्री'
  ],
};

/**
 * Classify article into one of the 10 Marathi categories deterministically
 */
export function classifyArticle(
  title: string,
  description?: string,
  categoryCandidate?: string,
  defaultCategory?: string
): MarathiCategory {
  // 1. Direct match on category candidate if provided by feed
  if (categoryCandidate) {
    const candidateLower = categoryCandidate.toLowerCase();
    for (const cat of VALID_CATEGORIES) {
      if (candidateLower.includes(cat.toLowerCase()) || cat.toLowerCase().includes(candidateLower)) {
        return cat;
      }
    }
  }

  // 2. Scan title and description against deterministic keyword dictionary
  const fullText = `${title} ${description || ''}`.toLowerCase();

  // Check specific categories first before broad categories like 'महाराष्ट्र' or 'देश'
  const priorityOrder: MarathiCategory[] = [
    'संपादकीय',
    'क्रीडा',
    'मनोरंजन',
    'विज्ञान-तंत्रज्ञान',
    'शिक्षण',
    'अर्थव्यवस्था',
    'राजकारण',
    'जग',
    'देश',
    'महाराष्ट्र',
  ];

  for (const cat of priorityOrder) {
    const keywords = CATEGORY_KEYWORDS[cat];
    for (const kw of keywords) {
      if (fullText.includes(kw.toLowerCase())) {
        return cat;
      }
    }
  }

  // 3. Fallback to source default_category if valid
  if (defaultCategory && (VALID_CATEGORIES as readonly string[]).includes(defaultCategory)) {
    return defaultCategory as MarathiCategory;
  }

  return 'महाराष्ट्र';
}
