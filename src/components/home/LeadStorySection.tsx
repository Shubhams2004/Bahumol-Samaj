import React from 'react';
import { Article } from '../../types/news';
import { ALL_CATEGORIES } from '../../data/categories';
import { getRelativeTimeMarathi, toMarathiDigits } from '../../utils/dateFormatter';
import { Clock, MapPin, Share2, Bookmark } from 'lucide-react';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface LeadStorySectionProps {
  leadStory: Article;
  supportingStories: Article[];
  onSelectArticle: (articleId: string) => void;
  onSelectCategory: (slug: string) => void;
  isBookmarked: (id: string) => boolean;
  onToggleBookmark: (id: string) => void;
}

export const LeadStorySection: React.FC<LeadStorySectionProps> = ({
  leadStory,
  supportingStories,
  onSelectArticle,
  onSelectCategory,
  isBookmarked,
  onToggleBookmark,
}) => {
  const leadCat = ALL_CATEGORIES.find((c) => c.slug === leadStory.category);

  return (
    <section className="bg-white border-b border-stone-200 py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Ribbon */}
        <div className="flex items-center justify-between border-b-2 border-stone-900 pb-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-700"></span>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-900 tracking-tight">
              आजची मोठी बातमी (Lead Story)
            </h2>
          </div>
          <span className="text-xs text-stone-500 font-sans hidden sm:inline">
            विशेष वार्ताहर व ब्युरो वृत्तांत
          </span>
        </div>

        {/* 2-Column Newspaper Lead Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Lead Story (Left 8 Cols) */}
          <article className="lg:col-span-8 group">
            {/* Category & Location Kicker */}
            <div className="flex items-center gap-2 text-xs font-semibold text-red-700 uppercase tracking-wider mb-2 font-sans">
              <button
                onClick={() => onSelectCategory(leadStory.category)}
                className="hover:underline cursor-pointer"
              >
                {leadCat?.nameMarathi || leadStory.category}
              </button>
              <span className="text-stone-300">·</span>
              <span className="text-stone-600 font-medium flex items-center gap-0.5">
                <MapPin className="w-3 h-3 text-stone-400" />
                {leadStory.location}
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-stone-500 font-normal">
                {getRelativeTimeMarathi(leadStory.publishedAt)}
              </span>
            </div>

            {/* Dominant Headline */}
            <h1
              onClick={() => onSelectArticle(leadStory.id)}
              className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif text-stone-950 group-hover:text-red-800 transition-colors cursor-pointer leading-tight mb-3 [text-wrap:balance]"
            >
              {leadStory.title}
            </h1>

            {/* Subtitle / Deck */}
            {leadStory.subtitle && (
              <p className="text-sm sm:text-base font-medium text-stone-700 font-serif leading-relaxed mb-4 border-l-2 border-red-700 pl-3">
                {leadStory.subtitle}
              </p>
            )}

            {/* Hero Image */}
            <div
              onClick={() => onSelectArticle(leadStory.id)}
              className="relative aspect-16/9 rounded overflow-hidden bg-stone-100 cursor-pointer mb-3 shadow-xs"
            >
              <ImageWithFallback
                src={leadStory.image}
                alt={leadStory.title}
                categoryName={leadCat?.nameMarathi}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 bg-red-700 text-white text-[11px] font-bold px-2 py-0.5 uppercase tracking-wider rounded font-sans">
                विशेष वृत्तांत
              </div>
            </div>

            {/* Image Caption */}
            {leadStory.imageCaption && (
              <p className="text-xs text-stone-500 italic mb-4 font-sans border-b border-stone-100 pb-2">
                {leadStory.imageCaption}
              </p>
            )}

            {/* Lead Story Excerpt */}
            <p className="text-sm sm:text-base text-stone-700 leading-relaxed font-sans mb-4">
              {leadStory.excerpt}
            </p>

            {/* Metadata Footer */}
            <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-200">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-800">{leadStory.author.name}</span>
                <span>·</span>
                <span>{leadStory.author.role}</span>
                <span>·</span>
                <span className="flex items-center gap-1 font-sans">
                  <Clock className="w-3 h-3" />
                  वाचनाचा वेळ: {toMarathiDigits(leadStory.readTimeMinutes)} मिनिटे
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleBookmark(leadStory.id)}
                  className={`p-1.5 rounded hover:bg-stone-100 transition-colors cursor-pointer ${
                    isBookmarked(leadStory.id) ? 'text-red-700' : 'text-stone-400'
                  }`}
                  title={isBookmarked(leadStory.id) ? 'जतन केले' : 'जतन करा'}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSelectArticle(leadStory.id)}
                  className="px-3 py-1 bg-stone-900 hover:bg-red-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  सविस्तर वाचा &rarr;
                </button>
              </div>
            </div>
          </article>

          {/* Supporting Stories Column (Right 4 Cols) */}
          <div className="lg:col-span-4 space-y-6 lg:border-l lg:border-stone-200 lg:pl-8">
            <div className="border-b border-stone-200 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 font-sans">
                महत्त्वाचे सहवृत्तांत (Highlights)
              </span>
            </div>

            {supportingStories.map((story, idx) => {
              const cat = ALL_CATEGORIES.find((c) => c.slug === story.category);
              return (
                <article
                  key={story.id}
                  className="group cursor-pointer pb-6 border-b border-stone-200 last:border-b-0 last:pb-0"
                >
                  {/* Category & Time */}
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-1.5 font-sans">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCategory(story.category);
                      }}
                      className="text-red-700 font-semibold hover:underline"
                    >
                      {cat?.nameMarathi || story.category}
                    </button>
                    <span>·</span>
                    <span>{getRelativeTimeMarathi(story.publishedAt)}</span>
                  </div>

                  {/* Supporting Headline */}
                  <h3
                    onClick={() => onSelectArticle(story.id)}
                    className="text-base sm:text-lg font-bold font-serif text-stone-900 group-hover:text-red-800 transition-colors leading-snug mb-2"
                  >
                    {story.title}
                  </h3>

                  {/* Thumbnail & Excerpt snippet */}
                  <div className="flex gap-3">
                    <div
                      onClick={() => onSelectArticle(story.id)}
                      className="w-24 h-18 shrink-0 rounded overflow-hidden bg-stone-100"
                    >
                      <ImageWithFallback
                        src={story.image}
                        alt={story.title}
                        categoryName={cat?.nameMarathi}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p
                      onClick={() => onSelectArticle(story.id)}
                      className="text-xs text-stone-600 line-clamp-3 leading-relaxed flex-1 font-sans"
                    >
                      {story.excerpt}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
