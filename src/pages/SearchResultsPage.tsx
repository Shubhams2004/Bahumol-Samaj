import React, { useState } from 'react';
import { searchArticles } from '../data/newsArticles';
import { ALL_CATEGORIES } from '../data/categories';
import { getRelativeTimeMarathi, toMarathiDigits } from '../utils/dateFormatter';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { Search, ChevronRight, MapPin, Clock } from 'lucide-react';

interface SearchResultsPageProps {
  initialQuery: string;
  onSelectArticle: (articleId: string) => void;
  onNavigateHome: () => void;
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  initialQuery,
  onSelectArticle,
  onNavigateHome,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const allFound = searchArticles(query);
  const filtered =
    selectedCategory === 'all'
      ? allFound
      : allFound.filter((a) => a.category === selectedCategory);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 py-6 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-4 font-sans">
            <button onClick={onNavigateHome} className="hover:text-red-700 cursor-pointer">
              मुख्यपृष्ठ
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-stone-800">शोध निकाल</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 mb-4">
            बातमी व विषय शोध (Search Results)
          </h1>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-stone-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="शब्द किंवा विषय शोधा..."
                className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-600 font-sans"
              />
            </div>
          </form>

          {/* Results Summary */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
            <p>
              ‘<span className="font-bold text-stone-900">{query || 'सर्व'}</span>’ साठी एकूण{' '}
              <span className="font-bold text-red-700">{toMarathiDigits(filtered.length)}</span> बातम्या
              आढळल्या.
            </p>

            {/* Filter by Category */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-stone-900 text-white font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                सर्व विभाग
              </button>
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.slug
                      ? 'bg-red-700 text-white font-bold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat.nameMarathi}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 rounded border border-stone-200 text-center">
            <Search className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold font-serif text-stone-800 mb-1">
              कोणतीही बातमी सापडली नाही
            </h3>
            <p className="text-xs text-stone-500 font-sans max-w-sm mx-auto">
              कृपया शब्दलेखन तपासा किंवा अन्य मराठी/इंग्रजी संज्ञा वापरून पुन्हा प्रयत्न करा.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((article) => {
              const cat = ALL_CATEGORIES.find((c) => c.slug === article.category);
              return (
                <div
                  key={article.id}
                  onClick={() => onSelectArticle(article.id)}
                  className="bg-white p-4 sm:p-5 rounded border border-stone-200 shadow-xs hover:shadow-md transition-shadow group cursor-pointer flex flex-col sm:flex-row gap-4"
                >
                  <div className="w-full sm:w-48 h-32 shrink-0 rounded overflow-hidden bg-stone-100">
                    <ImageWithFallback
                      src={article.image}
                      alt={article.title}
                      categoryName={cat?.nameMarathi}
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-1.5 font-sans">
                        <span className="text-red-700 font-semibold">{cat?.nameMarathi}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          {article.location}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {getRelativeTimeMarathi(article.publishedAt)}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold font-serif text-stone-900 group-hover:text-red-800 transition-colors leading-snug mb-2">
                        {article.title}
                      </h3>

                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-sans">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="pt-2 text-xs text-stone-400 font-sans flex items-center justify-between">
                      <span>वार्ताहर: {article.author.name}</span>
                      <span className="text-red-700 font-semibold group-hover:underline">
                        सविस्तर बातमी वाचा &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
