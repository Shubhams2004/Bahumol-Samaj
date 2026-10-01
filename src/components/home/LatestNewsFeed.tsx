import React from 'react';
import { Article } from '../../types/news';
import { ALL_CATEGORIES } from '../../data/categories';
import { getRelativeTimeMarathi, toMarathiDigits } from '../../utils/dateFormatter';
import { Clock, Flame, ChevronRight } from 'lucide-react';

interface LatestNewsFeedProps {
  articles: Article[];
  onSelectArticle: (articleId: string) => void;
  onSelectCategory: (slug: string) => void;
}

export const LatestNewsFeed: React.FC<LatestNewsFeedProps> = ({
  articles,
  onSelectArticle,
  onSelectCategory,
}) => {
  return (
    <div className="bg-white p-5 rounded border border-stone-200 shadow-xs mb-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-stone-800 pb-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
          <h3 className="text-xl font-bold font-serif text-stone-900 tracking-tight">
            ताज्या घडामोडी (Latest News Feed)
          </h3>
        </div>
        <span className="text-xs text-stone-500 font-sans hidden sm:inline">
          मिनिटागणिक अपडेट्स
        </span>
      </div>

      {/* Feed list */}
      <div className="divide-y divide-stone-100">
        {articles.map((item, index) => {
          const cat = ALL_CATEGORIES.find((c) => c.slug === item.category);
          return (
            <div
              key={item.id}
              onClick={() => onSelectArticle(item.id)}
              className="py-3 group cursor-pointer flex items-baseline gap-3 hover:bg-stone-50 px-2 rounded transition-colors"
            >
              {/* Bullet / Time */}
              <div className="shrink-0 flex items-center gap-1.5 w-24 text-[11px] text-stone-500 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-red-700"></span>
                <span>{getRelativeTimeMarathi(item.publishedAt)}</span>
              </div>

              {/* Title & Category */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCategory(item.category);
                    }}
                    className="text-[11px] font-semibold text-red-700 hover:underline uppercase tracking-wider font-sans"
                  >
                    {cat?.nameMarathi || item.category}
                  </button>
                  <span className="text-stone-300">·</span>
                  <span className="text-[11px] text-stone-400 font-sans">{item.location}</span>
                </div>
                <h4 className="text-sm font-semibold font-serif text-stone-900 group-hover:text-red-800 transition-colors leading-snug">
                  {item.title}
                </h4>
              </div>

              {/* Action chevron */}
              <div className="shrink-0 self-center text-stone-400 group-hover:text-red-700 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
