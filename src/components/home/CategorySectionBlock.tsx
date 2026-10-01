import React from 'react';
import { Article, CategorySlug } from '../../types/news';
import { ALL_CATEGORIES } from '../../data/categories';
import { getRelativeTimeMarathi, toMarathiDigits } from '../../utils/dateFormatter';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface CategorySectionBlockProps {
  categorySlug: CategorySlug;
  articles: Article[];
  onSelectArticle: (articleId: string) => void;
  onSelectCategory: (slug: string) => void;
}

export const CategorySectionBlock: React.FC<CategorySectionBlockProps> = ({
  categorySlug,
  articles,
  onSelectArticle,
  onSelectCategory,
}) => {
  const category = ALL_CATEGORIES.find((c) => c.slug === categorySlug);
  if (!category || articles.length === 0) return null;

  const [mainArticle, ...otherArticles] = articles;

  return (
    <div className="bg-white p-5 rounded border border-stone-200 shadow-xs mb-8">
      {/* Category Section Header */}
      <div className="flex items-center justify-between border-b-2 border-stone-800 pb-2 mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 inline-block"
            style={{ backgroundColor: category.accentColor || '#b91c1c' }}
          />
          <h3 className="text-xl font-bold font-serif text-stone-900 tracking-tight">
            {category.nameMarathi}
          </h3>
          <span className="text-xs text-stone-400 font-sans hidden sm:inline">
            ({category.nameEnglish})
          </span>
        </div>

        <button
          onClick={() => onSelectCategory(category.slug)}
          className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center gap-1 cursor-pointer font-sans"
        >
          <span>सर्व पहा</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Content Layout: 1 Featured Card + Side List */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Main Article in Section */}
        {mainArticle && (
          <div
            onClick={() => onSelectArticle(mainArticle.id)}
            className="md:col-span-6 lg:col-span-7 group cursor-pointer"
          >
            <div className="aspect-16/10 rounded overflow-hidden bg-stone-100 mb-3">
              <ImageWithFallback
                src={mainArticle.image}
                alt={mainArticle.title}
                categoryName={category.nameMarathi}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
              />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-1 font-sans">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-stone-400" />
                {mainArticle.location}
              </span>
              <span>·</span>
              <span>{getRelativeTimeMarathi(mainArticle.publishedAt)}</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold font-serif text-stone-900 group-hover:text-red-800 transition-colors leading-snug mb-1.5">
              {mainArticle.title}
            </h4>
            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-sans">
              {mainArticle.excerpt}
            </p>
          </div>
        )}

        {/* Supporting List in Section */}
        <div className="md:col-span-6 lg:col-span-5 divide-y divide-stone-100 flex flex-col justify-between">
          {otherArticles.slice(0, 3).map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectArticle(item.id)}
              className="py-2.5 first:pt-0 last:pb-0 group cursor-pointer flex gap-3 items-start"
            >
              <div className="w-20 h-16 shrink-0 rounded overflow-hidden bg-stone-100">
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  categoryName={category.nameMarathi}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-stone-400 font-sans block mb-0.5">
                  {getRelativeTimeMarathi(item.publishedAt)}
                </span>
                <h5 className="text-xs sm:text-sm font-semibold font-serif text-stone-900 group-hover:text-red-800 transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h5>
              </div>
            </div>
          ))}

          {/* If there are no other articles, show brief message */}
          {otherArticles.length === 0 && (
            <div className="p-4 bg-stone-50 rounded text-center text-xs text-stone-400">
              या विभागातील अधिक वृत्त लवकरच...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
