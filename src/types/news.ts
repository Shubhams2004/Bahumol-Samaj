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
  content: string[]; // Array of paragraphs
}

export interface Category {
  slug: CategorySlug;
  nameMarathi: string;
  nameEnglish: string;
  description: string;
  accentColor: string;
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
  articleId?: string;
}

export type EditionCity = 'पुणे' | 'मुंबई' | 'नागपूर' | 'नाशिक' | 'छत्रपती संभाजीनगर';
