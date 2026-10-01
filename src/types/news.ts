export type CategorySlug =
  | 'maharashtra'
  | 'india'
  | 'world'
  | 'politics'
  | 'education'
  | 'jobs'
  | 'tech'
  | 'sports'
  | 'entertainment'
  | 'editorial';

export interface Category {
  slug: CategorySlug;
  nameMarathi: string;
  nameEnglish: string;
  description: string;
  accentColor: string;
}

export interface Author {
  name: string;
  role: string;
  location?: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  category: CategorySlug;
  image: string;
  imageCaption?: string;
  author: Author;
  location: string;
  publishedAt: string; // ISO 8601 string
  readTimeMinutes: number;
  featured?: boolean;
  leadStory?: boolean;
  trending?: boolean;
  mostRead?: boolean;
  breaking?: boolean;
  content: string[]; // Paragraphs
  quotes?: { text: string; speaker: string }[];
  tags: string[];
  viewsCount: number;
  sharesCount: number;
}

export interface BreakingItem {
  id: string;
  title: string;
  category: CategorySlug;
  publishedAt: string;
  articleId?: string;
}

export interface Comment {
  id: string;
  author: string;
  city: string;
  text: string;
  timestamp: string;
  likes: number;
}

export type EditionCity = 'मुंबई' | 'पुणे' | 'नागपूर' | 'नाशिक' | 'छत्रपती संभाजीनगर';
