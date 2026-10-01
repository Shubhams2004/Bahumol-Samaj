import React from 'react';
import { ARTICLES } from '../data/newsArticles';
import { ALL_CATEGORIES } from '../data/categories';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { formatMarathiDate, toMarathiDigits } from '../utils/dateFormatter';
import { Bookmark, ChevronRight, Trash2, BookOpen } from 'lucide-react';

interface BookmarksPageProps {
  bookmarkedIds: string[];
  onSelectArticle: (articleId: string) => void;
  onRemoveBookmark: (articleId: string) => void;
  onNavigateHome: () => void;
}

export const BookmarksPage: React.FC<BookmarksPageProps> = ({
  bookmarkedIds,
  onSelectArticle,
  onRemoveBookmark,
  onNavigateHome,
}) => {
  const savedArticles = ARTICLES.filter((a) => bookmarkedIds.includes(a.id));

  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-4 font-sans">
            <button onClick={onNavigateHome} className="hover:text-red-700 cursor-pointer">
              मुख्यपृष्ठ
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-stone-800">जतन केलेल्या बातम्या</span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Bookmark className="w-6 h-6 text-red-700" />
            <h1 className="text-3xl font-serif font-black text-stone-900 tracking-tight">
              जतन केलेल्या बातम्या (Saved Reading List)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 font-sans">
            आपण नंतर वाचण्यासाठी सुरक्षित ठेवलेल्या बातम्या ({toMarathiDigits(savedArticles.length)})
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {savedArticles.length === 0 ? (
          <div className="bg-white p-12 rounded border border-stone-200 text-center space-y-4">
            <BookOpen className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="text-lg font-bold font-serif text-stone-800">
              अद्याप कोणतीही बातमी जतन केलेली नाही
            </h3>
            <p className="text-xs text-stone-500 font-sans max-w-sm mx-auto">
              कोणतीही बातमी वाचताना वर दिलेल्या बुकमार्क (Bookmark) चिन्हावर क्लिक करून आपण ती येथे जतन करू शकता.
            </p>
            <button
              onClick={onNavigateHome}
              className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded cursor-pointer transition-colors font-sans"
            >
              ताज्या बातम्या पहा &rarr;
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {savedArticles.map((article) => {
              const cat = ALL_CATEGORIES.find((c) => c.slug === article.category);
              return (
                <div
                  key={article.id}
                  className="bg-white p-4 sm:p-5 rounded border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-4 items-start justify-between group"
                >
                  <div
                    onClick={() => onSelectArticle(article.id)}
                    className="flex flex-col sm:flex-row gap-4 flex-1 cursor-pointer"
                  >
                    <div className="w-full sm:w-40 h-28 shrink-0 rounded overflow-hidden bg-stone-100">
                      <ImageWithFallback
                        src={article.image}
                        alt={article.title}
                        categoryName={cat?.nameMarathi}
                        className="w-full h-full object-cover group-hover:scale-104 transition-transform"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-[11px] font-bold text-red-700 uppercase font-sans block mb-1">
                        {cat?.nameMarathi}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold font-serif text-stone-900 group-hover:text-red-800 transition-colors leading-snug mb-1">
                        {article.title}
                      </h3>
                      <p className="text-xs text-stone-600 line-clamp-2 font-sans mb-2">
                        {article.excerpt}
                      </p>
                      <span className="text-[11px] text-stone-400 font-sans">
                        प्रसिद्ध: {formatMarathiDate(article.publishedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="self-end sm:self-center">
                    <button
                      onClick={() => onRemoveBookmark(article.id)}
                      className="p-2 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title="यादीतून काढा"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
