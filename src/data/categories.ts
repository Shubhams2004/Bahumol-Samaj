import { Category } from '../types/news';

export const ALL_CATEGORIES: Category[] = [
  {
    slug: 'maharashtra',
    nameMarathi: 'महाराष्ट्र',
    nameEnglish: 'Maharashtra',
    description: 'राज्यातील प्रमुख शहरे, ग्रामीण भाग आणि प्रशासकीय घडामोडींचे ताज्या बातम्या',
    accentColor: '#b91c1c', // Deep Crimson Red
  },
  {
    slug: 'india',
    nameMarathi: 'भारत',
    nameEnglish: 'India',
    description: 'देशातील राष्ट्रीय घडामोडी, संसद, सर्वोच्च न्यायालय आणि केंद्र सरकारचे निर्णय',
    accentColor: '#c2410c', // Saffron Amber
  },
  {
    slug: 'world',
    nameMarathi: 'जग',
    nameEnglish: 'World',
    description: 'आंतरराष्ट्रीय घडामोडी, जागतिक राजकारण आणि परदेशी घडामोडी',
    accentColor: '#1d4ed8', // Editorial Blue
  },
  {
    slug: 'politics',
    nameMarathi: 'राजकारण',
    nameEnglish: 'Politics',
    description: 'सत्तासंघर्ष, निवडणुका, पक्षीय घडामोडी आणि राजकीय विश्लेषण',
    accentColor: '#991b1b', // Dark Red
  },
  {
    slug: 'education',
    nameMarathi: 'शिक्षण',
    nameEnglish: 'Education',
    description: 'शाळा, महाविद्यालये, विद्यापीठे, प्रवेश परीक्षा आणि शैक्षणिक धोरणे',
    accentColor: '#0f766e', // Deep Teal
  },
  {
    slug: 'jobs',
    nameMarathi: 'रोजगार',
    nameEnglish: 'Jobs & Careers',
    description: 'शासकीय भरती, खाजगी क्षेत्रातील संधी, एमपीएससी व युपीएससी जाहिराती',
    accentColor: '#047857', // Forest Emerald
  },
  {
    slug: 'tech',
    nameMarathi: 'विज्ञान-तंत्रज्ञान',
    nameEnglish: 'Science & Tech',
    description: 'इस्रो, सायबर सुरक्षा, कृत्रिम बुद्धिमत्ता, मोबाईल व ऑटोमोबाईल अपडेट्स',
    accentColor: '#4338ca', // Indigo
  },
  {
    slug: 'sports',
    nameMarathi: 'क्रीडा',
    nameEnglish: 'Sports',
    description: 'क्रिकेट, कबड्डी, कुस्ती, ऑलम्पिक आणि स्थानिक क्रीडा स्पर्धा',
    accentColor: '#b45309', // Amber Bronze
  },
  {
    slug: 'entertainment',
    nameMarathi: 'मनोरंजन',
    nameEnglish: 'Entertainment',
    description: 'मराठी चित्रपट, नाटक, मालिका, संगीत आणि सांस्कृतिक उत्सव',
    accentColor: '#be185d', // Rose Wine
  },
  {
    slug: 'editorial',
    nameMarathi: 'संपादकीय',
    nameEnglish: 'Editorial & Opinion',
    description: 'बहुमोल विचार, अग्रलेख, विश्लेषण आणि तज्ज्ञांचे विचारमंथन',
    accentColor: '#334155', // Slate Grey
  },
];

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return ALL_CATEGORIES.find((cat) => cat.slug === slug);
};
