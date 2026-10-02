import React, { useState, useEffect, useRef } from 'react';
import { searchArticles } from '../../data/newsArticles';
import { Article } from '../../types/news';
import { ALL_CATEGORIES } from '../../data/categories';
import { getRelativeTimeMarathi, toMarathiDigits } from '../../utils/dateFormatter';
import { Search, X, Clock, ChevronRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (articleId: string) => void;
  onViewAllResults: (query: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectArticle,
  onViewAllResults,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const popularTopics = [
    'अर्थसंकल्प',
    'MPSC भरती',
    'पुणे-मुंबई द्रुतगती मार्ग',
    'इस्रो मोहीम',
    'शेती सिंचन',
    'क्रिकेट',
    'संगीत नाटक',
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const found = searchArticles(query);
    setResults(found);
  }, [query]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onViewAllResults(query.trim());
      onClose();
    }
  };

  const handleSelect = (id: string) => {
    onSelectArticle(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-start justify-center pt-12 sm:pt-20 px-4">
      <div className="bg-white rounded-lg shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <form onSubmit={handleSubmit} className="relative flex items-center border-b border-stone-200 p-4">
          <Search className="w-5 h-5 text-stone-400 absolute left-5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="बातमी, विषय, व्यक्ती किंवा शहर शोधा..."
            className="w-full pl-10 pr-10 py-2.5 text-base text-stone-900 placeholder:text-stone-400 focus:outline-none font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-12 text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 ml-2 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        {/* Popular Tags */}
        <div className="bg-stone-50 px-4 py-2.5 border-b border-stone-200 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-stone-500 font-semibold shrink-0 font-sans">लोकप्रिय शोध:</span>
          {popularTopics.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => setQuery(topic)}
              className="px-2.5 py-1 bg-white hover:bg-red-50 text-stone-700 hover:text-red-700 border border-stone-200 rounded-full font-medium shrink-0 cursor-pointer transition-colors"
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
          {query && (
            <div className="text-xs text-stone-500 pb-2 border-b border-stone-100 flex items-center justify-between">
              <span>
                ‘{query}’ साठी {toMarathiDigits(results.length)} निकाल आढळले
              </span>
              {results.length > 0 && (
                <button
                  onClick={handleSubmit}
                  className="text-red-700 font-semibold hover:underline flex items-center gap-0.5"
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
                  onClick={() => handleSelect(article.id)}
                  className="p-3 rounded-md hover:bg-stone-50 cursor-pointer border border-transparent hover:border-stone-200 transition-colors group flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-1">
                      <span className="font-bold text-red-700 uppercase">
                        {cat?.nameMarathi}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {getRelativeTimeMarathi(article.publishedAt)}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold font-serif text-stone-900 group-hover:text-red-800 transition-colors line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-xs text-stone-500 line-clamp-1 mt-1 font-sans">
                      {article.excerpt}
                    </p>
                  </div>
                </div>
              );
            })
          ) : query.trim() ? (
            <div className="text-center py-10 text-stone-500 text-sm">
              ‘{query}’ या शब्दाशी जुळणारी कोणतीही बातमी सापडली नाही.
            </div>
          ) : (
            <div className="text-center py-8 text-stone-400 text-xs font-sans">
              बातमीचे शीर्षक, विभाग किंवा वार्ताहराचे नाव टाइप करा.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
