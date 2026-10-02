import React from 'react';
import { Article, CategorySlug } from '../../types/news';
import { getCategoryBySlug } from '../../data/categories';
import { getRelativeTimeMarathi, toMarathiDigits } from '../../utils/dateFormatter';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { ChevronRight, Clock } from 'lucide-react';

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
  const category = getCategoryBySlug(categorySlug);
  if (!category || articles.length === 0) return null;

  const [featured, ...subArticles] = articles;

  return (
    <section className="mb-10 bg-white p-5 rounded border border-stone-200 shadow-xs">
      {/* Category Section Header */}
      <div className="flex items-center justify-between border-b-2 border-stone-900 pb-2 mb-5">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-5 inline-block"
            style={{ backgroundColor: category.accentColor }}
          />
          <h3 className="text-xl font-black font-serif text-stone-950 tracking-tight">
            {category.nameMarathi}
          </h3>
          <span className="text-xs text-stone-400 font-sans hidden sm:inline">
            ({category.nameEnglish})
          </span>
        </div>

        <button
          onClick={() => onSelectCategory(category.slug)}
          className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center gap-0.5 cursor-pointer font-sans"
        >
          <span>सर्व बातम्या</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid: 1 Main Column + 2 Sub Columns */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Column */}
        {featured && (
          <article
            onClick={() => onSelectArticle(featured.id)}
            className="md:col-span-6 group cursor-pointer border-b md:border-b-0 md:border-r border-stone-200 md:pr-6 pb-4 md:pb-0"
          >
            <div className="aspect-16/10 rounded overflow-hidden bg-stone-100 mb-3">
              <ImageWithFallback
                src={featured.image}
                alt={featured.title}
                categoryName={category.nameMarathi}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
              />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-1.5 font-sans">
              <span>{featured.location}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400" />
                {getRelativeTimeMarathi(featured.publishedAt)}
              </span>
            </div>
            <h4 className="text-lg font-bold font-serif text-stone-900 group-hover:text-red-800 transition-colors leading-snug mb-2">
              {featured.title}
            </h4>
            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-sans">
              {featured.excerpt}
            </p>
          </article>
        )}

        {/* Sub Stories Column */}
        <div className="md:col-span-6 divide-y divide-stone-200">
          {subArticles.slice(0, 3).map((story) => (
            <article
              key={story.id}
              onClick={() => onSelectArticle(story.id)}
              className="py-3 first:pt-0 last:pb-0 group cursor-pointer flex gap-3"
            >
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-stone-400 font-sans block mb-0.5">
                  {getRelativeTimeMarathi(story.publishedAt)}
                </span>
                <h5 className="text-xs sm:text-sm font-bold font-serif text-stone-900 group-hover:text-red-800 transition-colors line-clamp-2 leading-snug">
                  {story.title}
                </h5>
              </div>

              <div className="w-20 h-16 shrink-0 rounded overflow-hidden bg-stone-100">
                <ImageWithFallback
                  src={story.image}
                  alt={story.title}
                  categoryName={category.nameMarathi}
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                />
              </div>
            </article>
          ))}

          {subArticles.length === 0 && (
            <div className="text-xs text-stone-500 py-4 italic font-sans">
              या विभागातील पुढील बातम्या लवकरच प्रसिद्ध केल्या जातील.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
