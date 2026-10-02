import React, { useState, useEffect } from 'react';
import { BREAKING_NEWS_ITEMS } from '../../data/tickerData';
import { ChevronLeft, ChevronRight, Pause, Play, Zap } from 'lucide-react';

interface BreakingTickerProps {
  onSelectArticle: (slugOrId: string) => void;
}

export const BreakingTicker: React.FC<BreakingTickerProps> = ({ onSelectArticle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BREAKING_NEWS_ITEMS.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused]);

  const currentItem = BREAKING_NEWS_ITEMS[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? BREAKING_NEWS_ITEMS.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % BREAKING_NEWS_ITEMS.length);
  };

  return (
    <div className="w-full bg-stone-900 text-stone-100 border-b border-stone-800 py-1.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        {/* Left Badge */}
        <div className="flex items-center gap-1.5 shrink-0 bg-red-700 text-white font-bold px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
          <span>साप्ताहिक ठळक</span>
        </div>

        {/* Center Animated News Text */}
        <div
          className="flex-1 min-w-0 overflow-hidden cursor-pointer group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onClick={() => currentItem.articleSlug && onSelectArticle(currentItem.articleSlug)}
        >
          <div className="flex items-center gap-3 truncate">
            <span className="text-amber-400 text-[11px] font-mono shrink-0">
              [{currentItem.timestamp}]
            </span>
            <p className="truncate font-medium text-stone-100 group-hover:text-amber-300 transition-colors font-sans text-xs sm:text-sm">
              {currentItem.title}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1 shrink-0 text-stone-400">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 hover:text-white rounded cursor-pointer"
            title={isPaused ? 'सुरू करा' : 'थांबवा'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handlePrev}
            className="p-1 hover:text-white rounded cursor-pointer"
            title="मागील बातमी"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNext}
            className="p-1 hover:text-white rounded cursor-pointer"
            title="पुढील बातमी"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
