import React, { useState } from 'react';
import { getCategoryBySlug } from '../data/categories';
import { getArticlesByCategory, ARTICLES } from '../data/newsArticles';
import { getRelativeTimeMarathi, toMarathiDigits } from '../utils/dateFormatter';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { ChevronRight, MapPin, Clock } from 'lucide-react';

interface CategoryPageProps {
  slug: string;
  onSelectArticle: (slugOrId: string) => void;
  onNavigateHome: () => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  slug,
  onSelectArticle,
  onNavigateHome,
}) => {
  const category = getCategoryBySlug(slug);
  const [filterMode, setFilterMode] = useState<'latest' | 'popular'>('latest');

  const rawArticles = category ? getArticlesByCategory(category.slug) : [];
  const displayArticles = rawArticles.length > 0 ? rawArticles : ARTICLES.slice(0, 4);

  const sortedArticles = [...displayArticles].sort((a, b) => {
    if (filterMode === 'popular') {
      return b.viewsCount - a.viewsCount;
    }
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const [leadStory, ...otherStories] = sortedArticles;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-16 transition-colors">
      {/* Category Hero Banner */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-3 font-sans">
            <button onClick={onNavigateHome} className="hover:text-red-700 dark:hover:text-red-400 cursor-pointer">
              मुख्यपृष्ठ
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {category?.nameMarathi || slug}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-5 inline-block"
                  style={{ backgroundColor: category?.accentColor || '#b91c1c' }}
                />
                <h1 className="text-3xl sm:text-4xl font-serif font-black text-stone-900 dark:text-white tracking-tight">
                  {category?.nameMarathi || slug}
                </h1>
                <span className="text-sm text-stone-400 font-sans">
                  ({category?.nameEnglish})
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-2 font-sans max-w-2xl">
                {category?.description || 'या विभागातील महत्त्वाच्या ताज्या बातम्या आणि साप्ताहिक विश्लेषण.'}
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 text-xs">
              <button
                onClick={() => setFilterMode('latest')}
                className={`px-3 py-1 rounded font-medium cursor-pointer transition-colors ${
                  filterMode === 'latest'
                    ? 'bg-white dark:bg-stone-900 text-red-700 dark:text-red-400 shadow-xs font-bold'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                ताज्या बातम्या
              </button>
              <button
                onClick={() => setFilterMode('popular')}
                className={`px-3 py-1 rounded font-medium cursor-pointer transition-colors ${
                  filterMode === 'popular'
                    ? 'bg-white dark:bg-stone-900 text-red-700 dark:text-red-400 shadow-xs font-bold'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                सर्वाधिक वाचलेल्या
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Articles Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* Category Lead Story */}
        {leadStory && (
          <div
            onClick={() => onSelectArticle(leadStory.slug)}
            className="bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800 p-6 shadow-xs mb-8 group cursor-pointer"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-2 font-sans">
                  <span className="text-red-700 dark:text-red-400 font-bold uppercase">{category?.nameMarathi}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    {leadStory.location}
                  </span>
                  <span>·</span>
                  <span>{getRelativeTimeMarathi(leadStory.publishedAt)}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-serif text-stone-950 dark:text-white group-hover:text-red-800 dark:group-hover:text-red-400 transition-colors leading-tight mb-3">
                  {leadStory.title}
                </h2>
                {leadStory.subtitle && (
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3 font-serif border-l-2 border-red-700 dark:border-red-500 pl-3">
                    {leadStory.subtitle}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-sans mb-4">
                  {leadStory.excerpt}
                </p>
                <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                  वार्ताहर: {leadStory.author.name} · वाचनाचा वेळ:{' '}
                  {toMarathiDigits(leadStory.readTimeMinutes)} मिनिटे
                </div>
              </div>

              <div className="lg:col-span-5 aspect-16/10 rounded overflow-hidden bg-stone-100 dark:bg-stone-800">
                <ImageWithFallback
                  src={leadStory.image}
                  alt={leadStory.title}
                  categoryName={category?.nameMarathi}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        )}

        {/* Other Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherStories.map((article) => (
            <article
              key={article.id}
              onClick={() => onSelectArticle(article.slug)}
              className="bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-md transition-shadow group cursor-pointer flex flex-col justify-between p-5"
            >
              <div>
                <div className="aspect-16/10 rounded overflow-hidden bg-stone-100 dark:bg-stone-800 mb-3">
                  <ImageWithFallback
                    src={article.image}
                    alt={article.title}
                    categoryName={category?.nameMarathi}
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                  />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 mb-2 font-sans">
                  <span>{article.location}</span>
                  <span>·</span>
                  <span>{getRelativeTimeMarathi(article.publishedAt)}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-white group-hover:text-red-800 dark:group-hover:text-red-400 transition-colors leading-snug mb-2">
                  {article.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed font-sans">
                  {article.excerpt}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span>{article.author.name}</span>
                <span className="text-red-700 dark:text-red-400 font-semibold group-hover:underline">
                  वाचा &rarr;
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
