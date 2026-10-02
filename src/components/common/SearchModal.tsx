import React, { useState, useEffect, useRef } from 'react';
import { searchArticles } from '../../data/newsArticles';
import { Article } from '../../types/news';
import { ALL_CATEGORIES } from '../../data/categories';
import { getRelativeTimeMarathi, toMarathiDigits } from '../../utils/dateFormatter';
import { Search, X, Clock, ChevronRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (slugOrId: string) => void;
  onViewAllResults: (query: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectArticle,
  onViewAllResults,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [results, setResults] = useState<Article[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const popularTopics = [
    'अर्थसंकल्प',
    'हमीभाव',
    'स्पर्धा परीक्षा',
    'इस्रो मोहीम',
    'स्थानिक स्वराज्य',
    'क्रिकेट',
    'दिलीप सोनाळे',
    'संगीत नाटक',
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setSelectedCategory('all');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() && selectedCategory === 'all') {
      setResults([]);
      return;
    }
    const found = searchArticles(query, selectedCategory);
    setResults(found);
  }, [query, selectedCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onViewAllResults(query.trim());
      onClose();
    }
  };

  const handleSelect = (slug: string) => {
    onSelectArticle(slug);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-start justify-center pt-12 sm:pt-20 px-4">
      <div className="bg-white dark:bg-stone-900 rounded-lg shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-2xl overflow-hidden">
        {/* Search Input Bar */}
        <form onSubmit={handleSubmit} className="relative flex items-center border-b border-stone-200 dark:border-stone-800 p-4">
          <Search className="w-5 h-5 text-stone-400 absolute left-5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="बातमीचे शीर्षक, विषय, व्यक्ती किंवा गाव शोधा..."
            className="w-full pl-10 pr-10 py-2.5 text-base text-stone-900 dark:text-stone-100 bg-transparent placeholder:text-stone-400 focus:outline-none font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-12 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 ml-2 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        {/* Category filter tabs */}
        <div className="bg-stone-50 dark:bg-stone-950 px-4 py-2 border-b border-stone-200 dark:border-stone-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            सर्व
          </button>
          {ALL_CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                selectedCategory === c.slug
                  ? 'bg-red-700 text-white'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {c.nameMarathi}
            </button>
          ))}
        </div>

        {/* Popular Tags */}
        <div className="bg-white dark:bg-stone-900 px-4 py-2 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-stone-400 shrink-0 font-sans">लोकप्रिय:</span>
          {popularTopics.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => setQuery(topic)}
              className="text-stone-600 dark:text-stone-300 hover:text-red-700 dark:hover:text-red-400 cursor-pointer underline underline-offset-2 shrink-0"
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
          {query && (
            <div className="text-xs text-stone-500 dark:text-stone-400 pb-2 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <span>
                ‘{query}’ साठी {toMarathiDigits(results.length)} निकाल सापडले
              </span>
              {results.length > 0 && (
                <button
                  onClick={handleSubmit}
                  className="text-red-700 dark:text-red-400 font-semibold hover:underline flex items-center gap-0.5"
                >
                  सर्व निकाल पहा <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {results.length > 0 ? (
            results.map((article) => {
              const cat = ALL_CATEGORIES.find((c) => c.slug === article.category);
              return (
                <div
                  key={article.id}
                  onClick={() => handleSelect(article.slug)}
                  className="p-3 rounded-md hover:bg-stone-50 dark:hover:bg-stone-800/60 cursor-pointer border border-transparent hover:border-stone-200 dark:hover:border-stone-700 transition-colors group flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 mb-1">
                      <span className="font-bold text-red-700 dark:text-red-400 uppercase">
                        {cat?.nameMarathi}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {getRelativeTimeMarathi(article.publishedAt)}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100 group-hover:text-red-800 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mt-1 font-sans">
                      {article.excerpt}
                    </p>
                  </div>
                </div>
              );
            })
          ) : query.trim() ? (
            <div className="text-center py-10 text-stone-500 dark:text-stone-400 text-sm">
              ‘{query}’ या शब्दाशी जुळणारी कोणतीही बातमी सापडली नाही.
            </div>
          ) : (
            <div className="text-center py-8 text-stone-400 text-xs font-sans">
              बातमीचे शीर्षक, विभाग किंवा वार्ताहाराचे नाव टाइप करा.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
