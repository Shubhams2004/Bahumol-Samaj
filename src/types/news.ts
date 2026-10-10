export type CategorySlug =
  | 'maharashtra'
  | 'desh'
  | 'world'
  | 'politics'
  | 'economy'
  | 'education'
  | 'tech'
  | 'sports'
  | 'entertainment'
  | 'editorial';

export type LanguageCode = 'mr' | 'hi' | 'en';

export interface Author {
  name: string;
  role: string;
  location: string;
  avatar?: string;
}

export interface Quote {
  text: string;
  speaker: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  category: CategorySlug;
  image: string;
  imageCaption?: string;
  author: Author;
  location: string;
  publishedAt: string; // ISO String
  readTimeMinutes: number;
  leadStory?: boolean;
  featured?: boolean;
  trending?: boolean;
  mostRead?: boolean;
  viewsCount: number;
  sharesCount: number;
  tags: string[];
  quotes?: Quote[];
  content: string[]; // Array of authentic Marathi editorial paragraphs
  language?: LanguageCode;
}

export interface Category {
  slug: CategorySlug;
  nameMarathi: string;
  nameEnglish: string;
  description: string;
  accentColor: string;
}

export interface WeeklyEdition {
  id: string;
  volume: number; // वर्ष (Volume)
  issue: number; // अंक (Issue)
  dateRange: string; // '१ ते ७ ऑक्टोबर २०२६'
  fullDateLabel: string;
  editorInChief: string; // 'दिलीप सोनाळे'
  rniRegistration: string;
  establishedYear: number;
  headlineQuote: string;
}

export interface Comment {
  id: string;
  author: string;
  city: string;
  text: string;
  timestamp: string;
  likes: number;
}

export interface BreakingItem {
  id: string;
  title: string;
  timestamp: string;
  category: CategorySlug;
  articleSlug: string;
}

export type EditionCity = 'पुणे' | 'मुंबई' | 'नागपूर' | 'नाशिक' | 'छत्रपती संभाजीनगर';
export type ThemeMode = 'light' | 'dark';
