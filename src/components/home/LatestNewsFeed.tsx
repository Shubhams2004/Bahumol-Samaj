import React from 'react';
import { Article } from '../../types/news';
import { ALL_CATEGORIES } from '../../data/categories';
import { getRelativeTimeMarathi } from '../../utils/dateFormatter';
import { Clock } from 'lucide-react';

interface LatestNewsFeedProps {
  articles: Article[];
  onSelectArticle: (slugOrId: string) => void;
  onSelectCategory: (slug: string) => void;
}

export const LatestNewsFeed: React.FC<LatestNewsFeedProps> = ({
  articles,
  onSelectArticle,
  onSelectCategory,
}) => {
  return (
    <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded p-4 mb-8">
      {/* Feed Header */}
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-red-700 dark:text-red-400" />
          <h3 className="font-serif font-black text-stone-900 dark:text-white text-base uppercase">
            साप्ताहिक ताज्या घडामोडी (Weekly News Feed)
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 font-sans">
          या आठवड्यातील घडामोडी
        </span>
      </div>

      {/* Ticker Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        {articles.map((item) => {
          const cat = ALL_CATEGORIES.find((c) => c.slug === item.category);
          return (
            <div
              key={item.id}
              onClick={() => onSelectArticle(item.slug)}
              className="group cursor-pointer flex items-baseline gap-2 py-1.5 border-b border-stone-200/60 dark:border-stone-800/80 last:border-b-0"
            >
              <span className="text-[11px] font-mono text-stone-400 shrink-0">
                {getRelativeTimeMarathi(item.publishedAt)}
              </span>
              <span className="text-stone-300 dark:text-stone-700">·</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCategory(item.category);
                }}
                className="text-[11px] font-bold text-red-700 dark:text-red-400 shrink-0 hover:underline uppercase"
              >
                {cat?.nameMarathi}
              </span>
              <p className="text-xs text-stone-800 dark:text-stone-200 group-hover:text-red-800 dark:group-hover:text-red-400 transition-colors font-sans truncate font-medium flex-1">
                {item.title}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
