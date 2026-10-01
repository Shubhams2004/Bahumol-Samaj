import React from 'react';
import { Article } from '../../types/news';
import { ALL_CATEGORIES } from '../../data/categories';
import { toMarathiDigits, getRelativeTimeMarathi } from '../../utils/dateFormatter';
import { TrendingUp, BookOpen, Calendar, FileText, Send, Eye } from 'lucide-react';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface SidebarContentProps {
  trendingArticles: Article[];
  mostReadArticles: Article[];
  editorialArticle?: Article;
  onSelectArticle: (articleId: string) => void;
  onSelectCategory: (slug: string) => void;
  onNavigateEpaper: () => void;
  onNavigateContact: () => void;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  trendingArticles,
  mostReadArticles,
  editorialArticle,
  onSelectArticle,
  onSelectCategory,
  onNavigateEpaper,
  onNavigateContact,
}) => {
  return (
    <aside className="space-y-6">
      {/* 1. Trending Stories (ट्रेंडिंग / सर्वाधिक वाचलेल्या) */}
      <div className="bg-white p-5 rounded border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 border-b-2 border-red-700 pb-2 mb-4">
          <TrendingUp className="w-4 h-4 text-red-700" />
          <h3 className="text-base font-bold font-serif text-stone-900 uppercase tracking-wide">
            ट्रेंडिंग बातम्या (Trending)
          </h3>
        </div>

        <div className="divide-y divide-stone-100">
          {trendingArticles.slice(0, 5).map((article, index) => {
            const cat = ALL_CATEGORIES.find((c) => c.slug === article.category);
            return (
              <div
                key={article.id}
                onClick={() => onSelectArticle(article.id)}
                className="py-3 first:pt-0 last:pb-0 flex items-start gap-3 group cursor-pointer"
              >
                {/* Number Badge (1, 2, 3...) in Marathi typography */}
                <span className="shrink-0 w-6 h-6 rounded-full bg-stone-100 text-stone-800 text-xs font-bold flex items-center justify-center font-serif group-hover:bg-red-700 group-hover:text-white transition-colors">
                  {toMarathiDigits(index + 1)}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-sans mb-1">
                    <span className="text-red-700 font-semibold">{cat?.nameMarathi}</span>
                    <span>·</span>
                    <span>{getRelativeTimeMarathi(article.publishedAt)}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold font-serif text-stone-900 group-hover:text-red-800 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Editorial Highlight (बहुमोल विचार / अग्रलेख) */}
      {editorialArticle && (
        <div className="bg-stone-900 text-stone-100 p-5 rounded border border-stone-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-stone-700 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-serif">
                बहुमोल विचार • अग्रलेख
              </span>
            </div>
            <span className="text-[10px] text-stone-400 font-sans">मुख्य संपादक</span>
          </div>

          <h4
            onClick={() => onSelectArticle(editorialArticle.id)}
            className="text-sm sm:text-base font-bold font-serif text-white hover:text-amber-300 transition-colors cursor-pointer leading-snug mb-2"
          >
            {editorialArticle.title}
          </h4>

          <p className="text-xs text-stone-300 line-clamp-3 leading-relaxed mb-4 font-sans">
            {editorialArticle.excerpt}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs text-stone-400">
            <span>{editorialArticle.author.name}</span>
            <button
              onClick={() => onSelectArticle(editorialArticle.id)}
              className="text-amber-400 hover:text-white font-medium cursor-pointer"
            >
              पूर्ण अग्रलेख वाचा &rarr;
            </button>
          </div>
        </div>
      )}

      {/* 3. e-Paper Preview Box */}
      <div className="bg-stone-50 border border-stone-200 rounded p-4 text-center">
        <FileText className="w-8 h-8 text-red-700 mx-auto mb-2" />
        <h4 className="text-sm font-bold font-serif text-stone-900 mb-1">
          बहुमोल समाज डिजिटल ई-पेपर
        </h4>
        <p className="text-xs text-stone-500 mb-3 font-sans">
          आजचा संपूर्ण वृत्तपत्र डिजिटल स्वरूपात वाचा व मोफत पीडीएफ डाऊनलोड करा.
        </p>
        <button
          onClick={onNavigateEpaper}
          className="w-full py-2 bg-stone-900 hover:bg-red-800 text-white text-xs font-bold rounded transition-colors cursor-pointer"
        >
          ई-पेपर आवृत्ती उघडा
        </button>
      </div>

      {/* 4. Dinvishesh (दिनविशेष - On this day) */}
      <div className="bg-white p-5 rounded border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 border-b border-stone-200 pb-2 mb-3">
          <Calendar className="w-4 h-4 text-stone-700" />
          <h4 className="text-sm font-bold font-serif text-stone-900">
            दिनविशेष (आजचा इतिहास)
          </h4>
        </div>
        <div className="space-y-2.5 text-xs text-stone-700 font-sans">
          <p className="leading-relaxed">
            <span className="font-bold text-red-700">१ ऑक्टोबर:</span> आंतरराष्ट्रीय ज्येष्ठ नागरिक दिन आणि राष्ट्रीय रक्तदान दिन.
          </p>
          <p className="leading-relaxed text-stone-600">
            महाराष्ट्रातील समाजसुधारक आणि थोर विचारवंतांच्या विचारांचा वारसा जपत लोककल्याणाचा संकल्प.
          </p>
        </div>
      </div>

      {/* 5. Citizen Reporter / Tip Submission Widget */}
      <div className="bg-amber-50/80 border border-amber-200 p-4 rounded text-xs space-y-2">
        <div className="flex items-center gap-2 text-amber-900 font-bold font-serif">
          <Send className="w-3.5 h-3.5 text-red-700" />
          <span>बातमीदार व्हा (Citizen Reporter)</span>
        </div>
        <p className="text-stone-600 leading-relaxed font-sans">
          आपल्या गावातील, शहरातील किंवा परिसरातील समस्या अथवा महत्त्वाच्या घडामोडींचे फोटो व माहिती पाठवा.
        </p>
        <button
          onClick={onNavigateContact}
          className="text-red-700 font-bold hover:underline cursor-pointer block"
        >
          संपादकीय विभागाला माहिती पाठवा &rarr;
        </button>
      </div>
    </aside>
  );
};
