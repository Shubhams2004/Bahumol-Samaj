import { Category, CategorySlug } from '../types/news';

export const ALL_CATEGORIES: Category[] = [
  {
    slug: 'maharashtra',
    nameMarathi: 'महाराष्ट्र',
    nameEnglish: 'Maharashtra',
    description: 'राज्यातील प्रमुख शहरे, ग्रामीण भाग, जलसंधारण आणि प्रशासकीय घडामोडींचे साप्ताहिक समालोचन',
    accentColor: '#b91c1c', // Crimson
  },
  {
    slug: 'desh',
    nameMarathi: 'देश',
    nameEnglish: 'National',
    description: 'संसद, सर्वोच्च न्यायालय, राष्ट्रीय धोरणे आणि केंद्र शासनाच्या महत्त्वाच्या निर्णयांचा आढावा',
    accentColor: '#c2410c', // Amber Saffron
  },
  {
    slug: 'world',
    nameMarathi: 'जग',
    nameEnglish: 'International',
    description: 'जागतिक भू-राजकारण, आंतरराष्ट्रीय करार, जागतिक पर्यावरण व परदेशातील घडामोडी',
    accentColor: '#1d4ed8', // Editorial Blue
  },
  {
    slug: 'politics',
    nameMarathi: 'राजकारण',
    nameEnglish: 'Politics',
    description: 'राजकीय समीकरणे, पक्षीय धोरणे, आगामी निवडणुका आणि सखोल राजकीय विश्लेषण',
    accentColor: '#991b1b', // Deep Red
  },
  {
    slug: 'economy',
    nameMarathi: 'अर्थव्यवस्था',
    nameEnglish: 'Economy & Business',
    description: 'कृषी बाजारभाव, महागाई, उद्योग, बँकिंग, स्टार्टअप्स आणि महाराष्ट्राची अर्थव्यवस्था',
    accentColor: '#0f766e', // Deep Teal
  },
  {
    slug: 'education',
    nameMarathi: 'शिक्षण',
    nameEnglish: 'Education',
    description: 'शालेय व उच्च शिक्षण, एमपीएससी-युपीएससी परीक्षा, कौशल्य विकास व शैक्षणिक धोरणे',
    accentColor: '#047857', // Emerald
  },
  {
    slug: 'tech',
    nameMarathi: 'विज्ञान-तंत्रज्ञान',
    nameEnglish: 'Science & Tech',
    description: 'इस्रो, सायबर सुरक्षा, कृत्रिम बुद्धिमत्ता, सौर ऊर्जा, कृषी तंत्रज्ञान व डिजिटल क्रांती',
    accentColor: '#4338ca', // Indigo
  },
  {
    slug: 'sports',
    nameMarathi: 'क्रीडा',
    nameEnglish: 'Sports',
    description: 'क्रिकेट, कबड्डी, कुस्ती, राष्ट्रीय क्रीडा स्पर्धा आणि महाराष्ट्रातील उदयोन्मुख खेळाडू',
    accentColor: '#b45309', // Warm Bronze
  },
  {
    slug: 'entertainment',
    nameMarathi: 'मनोरंजन',
    nameEnglish: 'Arts & Culture',
    description: 'मराठी रंगभूमी, साहित्य, चित्रपट, लोककला, संगीत आणि सांस्कृतिक उत्सव',
    accentColor: '#be185d', // Wine Rose
  },
  {
    slug: 'editorial',
    nameMarathi: 'संपादकीय',
    nameEnglish: 'Editorial & Opinion',
    description: 'साप्ताहिक बहुमोल दृष्टिकोन, अभ्यासपूर्ण अग्रलेख, तज्ज्ञ विश्लेषक व वाचकांचे विचारमंथन',
    accentColor: '#334155', // Editorial Slate
  },
];

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return ALL_CATEGORIES.find((cat) => cat.slug === slug);
};
