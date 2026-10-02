import React from 'react';
import { Article } from '../../types/news';
import { ALL_CATEGORIES } from '../../data/categories';
import { getRelativeTimeMarathi, toMarathiDigits } from '../../utils/dateFormatter';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Clock, MapPin, Bookmark } from 'lucide-react';

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
    <section className="bg-white border-b border-stone-300 py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Dominant Lead Story (8 cols) */}
          <div className="lg:col-span-8 lg:border-r lg:border-stone-200 lg:pr-8">
            <article className="group cursor-pointer">
              {/* Category & Location Header */}
              <div className="flex items-center justify-between text-xs font-sans mb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCategory(leadStory.category);
                    }}
                    className="font-bold text-red-700 uppercase tracking-wider hover:underline"
                  >
                    {leadCat?.nameMarathi || leadStory.category}
                  </span>
                  <span className="text-stone-300">·</span>
                  <span className="text-stone-500 flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    {leadStory.location}
                  </span>
                  <span className="text-stone-300">·</span>
                  <span className="text-stone-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-400" />
                    {getRelativeTimeMarathi(leadStory.publishedAt)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(leadStory.id);
                  }}
                  className={`p-1.5 rounded hover:bg-stone-100 transition-colors ${
                    isBookmarked(leadStory.id) ? 'text-red-700' : 'text-stone-400'
                  }`}
                  title={isBookmarked(leadStory.id) ? 'जतन केले' : 'जतन करा'}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>

              {/* Dominant Headline */}
              <h2
                onClick={() => onSelectArticle(leadStory.id)}
                className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif text-stone-950 group-hover:text-red-800 transition-colors leading-[1.2] mb-3 [text-wrap:balance]"
              >
                {leadStory.title}
              </h2>

              {/* Subtitle Deck */}
              {leadStory.subtitle && (
                <p className="text-sm sm:text-base font-medium text-stone-700 font-serif leading-relaxed mb-4 border-l-2 border-red-700 pl-3">
                  {leadStory.subtitle}
                </p>
              )}

              {/* Hero Image */}
              <div
                onClick={() => onSelectArticle(leadStory.id)}
                className="relative aspect-16/9 rounded-md overflow-hidden bg-stone-100 mb-4 shadow-xs"
              >
                <ImageWithFallback
                  src={leadStory.image}
                  alt={leadStory.title}
                  categoryName={leadCat?.nameMarathi}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
              </div>

              {leadStory.imageCaption && (
                <p className="text-[11px] text-stone-500 italic mb-3 font-sans">
                  {leadStory.imageCaption}
                </p>
              )}

              {/* Lead Excerpt */}
              <p
                onClick={() => onSelectArticle(leadStory.id)}
                className="text-sm text-stone-700 leading-relaxed font-sans line-clamp-3 mb-4"
              >
                {leadStory.excerpt}
              </p>

              {/* Byline & Read time */}
              <div className="flex items-center justify-between text-xs text-stone-500 font-sans pt-3 border-t border-stone-100">
                <span className="font-semibold text-stone-700">
                  विशेष वृत्त: {leadStory.author.name} ({leadStory.author.location})
                </span>
                <span className="text-red-700 font-bold hover:underline">
                  सविस्तर बातमी वाचा &rarr;
                </span>
              </div>
            </article>
          </div>

          {/* Supporting Featured Stories Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="border-b-2 border-stone-900 pb-2 mb-4 flex items-center justify-between">
              <h3 className="font-serif font-black text-stone-900 text-lg uppercase tracking-tight">
                महत्त्वाच्या घडामोडी
              </h3>
              <span className="text-xs font-bold text-red-700 font-sans">विशेष वार्ता</span>
            </div>

            <div className="divide-y divide-stone-200 space-y-5">
              {supportingStories.map((story) => {
                const storyCat = ALL_CATEGORIES.find((c) => c.slug === story.category);
                return (
                  <article
                    key={story.id}
                    onClick={() => onSelectArticle(story.id)}
                    className="pt-5 first:pt-0 group cursor-pointer"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-1 font-sans">
                          <span className="text-red-700 font-bold uppercase">
                            {storyCat?.nameMarathi}
                          </span>
                          <span>·</span>
                          <span>{story.location}</span>
                        </div>
                        <h4 className="text-base font-bold font-serif text-stone-900 group-hover:text-red-800 transition-colors leading-snug line-clamp-2 mb-1.5">
                          {story.title}
                        </h4>
                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-sans">
                          {story.excerpt}
                        </p>
                      </div>

                      <div className="w-24 h-20 shrink-0 rounded overflow-hidden bg-stone-100">
                        <ImageWithFallback
                          src={story.image}
                          alt={story.title}
                          categoryName={storyCat?.nameMarathi}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2 font-sans">
                      <span>{getRelativeTimeMarathi(story.publishedAt)}</span>
                      <span>वाचन वेळ: {toMarathiDigits(story.readTimeMinutes)} मिनिटे</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
