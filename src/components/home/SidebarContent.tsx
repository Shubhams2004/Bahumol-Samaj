import React from 'react';
import { Article } from '../../types/news';
import { toMarathiDigits } from '../../utils/dateFormatter';
import { TrendingUp, BookOpen, Send, Calendar, FileText } from 'lucide-react';

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
  editorialArticle,
  onSelectArticle,
  onNavigateEpaper,
  onNavigateContact,
}) => {
  return (
    <aside className="space-y-8">
      {/* 1. Trending News (ट्रेंडिंग बातम्या) */}
      <div className="bg-white p-5 rounded border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 border-b-2 border-red-700 pb-2 mb-4">
          <TrendingUp className="w-5 h-5 text-red-700" />
          <h3 className="font-serif font-black text-stone-900 text-lg uppercase tracking-tight">
            ट्रेंडिंग बातम्या (Top 5)
          </h3>
        </div>

        <div className="divide-y divide-stone-100">
          {trendingArticles.slice(0, 5).map((article, idx) => (
            <div
              key={article.id}
              onClick={() => onSelectArticle(article.id)}
              className="py-3 first:pt-0 last:pb-0 flex items-start gap-3.5 group cursor-pointer"
            >
              {/* Marathi Numeric Badge */}
              <span className="text-2xl font-black font-serif text-stone-300 group-hover:text-red-700 transition-colors w-6 text-center shrink-0">
                {toMarathiDigits(idx + 1)}
              </span>

              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold font-serif text-stone-900 group-hover:text-red-800 transition-colors leading-snug line-clamp-2">
                  {article.title}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-1 font-sans">
                  <span>{article.location}</span>
                  <span>·</span>
                  <span>{toMarathiDigits(article.viewsCount)} वाचक</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Editorial Column: बहुमोल विचार */}
      {editorialArticle && (
        <div className="bg-amber-50/60 p-5 rounded border-l-4 border-amber-600 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-amber-900">
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-bold uppercase tracking-wider font-sans">
              संपादकीय स्तंभ
            </span>
          </div>

          <h4
            onClick={() => onSelectArticle(editorialArticle.id)}
            className="text-base font-bold font-serif text-stone-950 hover:text-red-800 transition-colors cursor-pointer leading-snug mb-2"
          >
            {editorialArticle.title}
          </h4>

          <p className="text-xs text-stone-700 font-sans line-clamp-3 leading-relaxed mb-3">
            {editorialArticle.excerpt}
          </p>

          <div className="flex items-center justify-between text-xs text-stone-600 border-t border-amber-200/60 pt-2 font-sans">
            <span className="font-semibold">{editorialArticle.author.name}</span>
            <button
              onClick={() => onSelectArticle(editorialArticle.id)}
              className="text-red-800 font-bold hover:underline cursor-pointer"
            >
              पूर्ण अग्रलेख वाचा &rarr;
            </button>
          </div>
        </div>
      )}

      {/* 3. Dinvishesh (दिनविशेष - Today in History) */}
      <div className="bg-white p-5 rounded border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 border-b-2 border-stone-900 pb-2 mb-3">
          <Calendar className="w-4 h-4 text-stone-700" />
          <h3 className="font-serif font-black text-stone-900 text-base uppercase">
            आजचा दिनविशेष (History)
          </h3>
        </div>
        <p className="text-xs text-stone-700 leading-relaxed font-sans mb-2">
          महाराष्ट्रातील थोर विचारवंत, समाजसुधारक व क्रांतीकारकांच्या स्मृतींचे स्मरण.
          सत्यशोधक समाज आणि पुरोगामी चळवळींच्या ऐतिहासिक ठरावांची पार्श्वभूमी.
        </p>
        <span className="text-[11px] font-bold text-red-700 font-sans block">
          “ज्ञान हेच माणसाचे खरे भूषण आहे.”
        </span>
      </div>

      {/* 4. Citizen Journalism: बातमीदार व्हा */}
      <div className="bg-stone-900 text-white p-5 rounded shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-red-500">
          <Send className="w-4 h-4" />
          <h4 className="text-sm font-bold font-serif uppercase tracking-wider text-white">
            नागरिक बातमीदार
          </h4>
        </div>
        <p className="text-xs text-stone-300 font-sans leading-relaxed">
          आपल्या परिसरातील समस्या, महत्त्वाच्या घटना अथवा विकासकामांची बातमी थेट आमच्या संपादकीय विभागाकडे पाठवा.
        </p>
        <button
          onClick={onNavigateContact}
          className="w-full py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded cursor-pointer transition-colors font-sans"
        >
          बातमी पाठवा (Send News Tip) &rarr;
        </button>
      </div>

      {/* 5. ePaper Broadsheet Promo */}
      <div
        onClick={onNavigateEpaper}
        className="p-5 bg-gradient-to-br from-red-900 to-stone-900 text-white rounded cursor-pointer shadow-md group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
            आजचा अंक
          </span>
          <FileText className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
        </div>
        <h4 className="text-lg font-bold font-serif group-hover:text-amber-200 transition-colors">
          डिजिटल ई-पेपर आवृत्ती
        </h4>
        <p className="text-xs text-stone-300 font-sans mt-1">
          पुणे, मुंबई व नाशिक आवृत्त्यांचे पान-दर-पान संपूर्ण वृत्तपत्र वाचा.
        </p>
        <span className="inline-block mt-3 text-xs font-bold text-amber-300 group-hover:underline">
          ई-पेपर उघडा &rarr;
        </span>
      </div>
    </aside>
  );
};
