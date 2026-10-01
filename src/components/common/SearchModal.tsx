import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Clock } from 'lucide-react';
import { searchArticles } from '../../data/newsArticles';
import { Article } from '../../types/news';
import { getRelativeTimeMarathi } from '../../utils/dateFormatter';
import { ALL_CATEGORIES } from '../../data/categories';
import { ImageWithFallback } from './ImageWithFallback';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (articleId: string) => void;
  onViewAllResults: (query: string) => void;
}

const SUGGESTED_TAGS = ['अर्थसंकल्प', 'क्रिकेट', 'पुणे', 'महाभरती', 'एमपीएससी', 'विज्ञान', 'सिनेमा'];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectArticle,
  onViewAllResults,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length >= 2) {
      const found = searchArticles(query);
      setResults(found.slice(0, 6));
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onViewAllResults(query.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-stone-300 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Input Header */}
        <form onSubmit={handleSubmit} className="p-4 border-b border-stone-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="बातम्या, विषय किंवा व्यक्तीचे नाव शोधा (उदा. अर्थसंकल्प, क्रिकेट, पुणे)..."
            className="w-full text-base sm:text-lg text-stone-900 placeholder:text-stone-400 focus:outline-none bg-transparent font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-stone-400 hover:text-stone-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-100 rounded border border-stone-200 font-sans"
          >
            बंद
          </button>
        </form>

        {/* Quick Suggestion Tags */}
        <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200 flex items-center flex-wrap gap-1.5 text-xs">
          <span className="text-stone-500 font-medium">लोकप्रिय शोध:</span>
          {SUGGESTED_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setQuery(tag)}
              className="px-2 py-0.5 bg-white border border-stone-200 rounded text-stone-700 hover:border-red-600 hover:text-red-700 transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 divide-y divide-stone-100">
          {query.trim().length >= 2 && results.length === 0 && (
            <div className="py-8 text-center text-stone-500">
              <p className="text-base font-serif">‘{query}’ या शब्दाशी संबंधित बातमी आढळली नाही.</p>
              <p className="text-xs text-stone-400 mt-1">कृपया दुसरा शब्द किंवा मराठी/इंग्रजीमध्ये शोधून पहा.</p>
            </div>
          )}

          {results.map((article) => {
            const cat = ALL_CATEGORIES.find((c) => c.slug === article.category);
            return (
              <div
                key={article.id}
                onClick={() => {
                  onSelectArticle(article.id);
                  onClose();
                }}
                className="py-3 group cursor-pointer flex items-start gap-3 hover:bg-stone-50 px-2 rounded transition-colors"
              >
                <div className="w-20 h-16 shrink-0 rounded overflow-hidden bg-stone-100">
                  <ImageWithFallback
                    src={article.image}
                    alt={article.title}
                    categoryName={cat?.nameMarathi}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-1">
                    <span className="text-red-700 font-semibold">{cat?.nameMarathi}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-sans">
                      <Clock className="w-3 h-3" />
                      {getRelativeTimeMarathi(article.publishedAt)}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 group-hover:text-red-800 transition-colors font-serif line-clamp-2 leading-snug">
                    {article.title}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer if results exist */}
        {results.length > 0 && (
          <div className="p-3 bg-stone-50 border-t border-stone-200 text-center">
            <button
              onClick={() => {
                onViewAllResults(query);
                onClose();
              }}
              className="text-xs font-semibold text-red-700 hover:text-red-800 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>‘{query}’ साठी सर्व निकाल पहा</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
