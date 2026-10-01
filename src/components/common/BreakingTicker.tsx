import React, { useState, useEffect } from 'react';
import { BREAKING_NEWS_ITEMS } from '../../data/tickerData';
import { getRelativeTimeMarathi } from '../../utils/dateFormatter';
import { ChevronLeft, ChevronRight, Pause, Play, Flame } from 'lucide-react';

interface BreakingTickerProps {
  onSelectArticle: (articleId: string) => void;
}

export const BreakingTicker: React.FC<BreakingTickerProps> = ({ onSelectArticle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying || BREAKING_NEWS_ITEMS.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BREAKING_NEWS_ITEMS.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const currentItem = BREAKING_NEWS_ITEMS[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + BREAKING_NEWS_ITEMS.length) % BREAKING_NEWS_ITEMS.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % BREAKING_NEWS_ITEMS.length);
  };

  if (!currentItem) return null;

  return (
    <div className="bg-stone-900 text-stone-100 border-y border-stone-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between min-h-[42px] py-1 gap-3">
        {/* Label Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
          <span className="inline-flex items-center gap-1 bg-red-700 text-white font-bold text-xs uppercase px-2.5 py-1 rounded tracking-wider font-sans whitespace-nowrap">
            <Flame className="w-3.5 h-3.5" />
            ठळक घडामोडी
          </span>
        </div>

        {/* Ticker Content */}
        <div className="flex-1 overflow-hidden min-w-0">
          <button
            onClick={() => {
              if (currentItem.articleId) {
                onSelectArticle(currentItem.articleId);
              }
            }}
            className="text-left w-full truncate group cursor-pointer focus:outline-none focus:ring-1 focus:ring-red-400 py-0.5"
          >
            <span className="text-xs sm:text-sm text-stone-200 group-hover:text-amber-400 transition-colors font-medium">
              {currentItem.title}
            </span>
            <span className="ml-2 text-xs text-stone-400 hidden sm:inline-block font-sans">
              · {getRelativeTimeMarathi(currentItem.publishedAt)}
            </span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0 text-stone-400">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? 'थांबवा' : 'सुरू करा'}
            className="p-1 hover:text-white rounded hover:bg-stone-800 transition-colors cursor-pointer"
            title={isPlaying ? 'थांबवा' : 'सुरू करा'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handlePrev}
            aria-label="मागील बातमी"
            className="p-1 hover:text-white rounded hover:bg-stone-800 transition-colors cursor-pointer"
            title="मागील बातमी"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="पुढील बातमी"
            className="p-1 hover:text-white rounded hover:bg-stone-800 transition-colors cursor-pointer"
            title="पुढील बातमी"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
