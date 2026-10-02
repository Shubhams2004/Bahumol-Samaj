import React from 'react';
import { Article } from '../../types/news';
import { toMarathiDigits } from '../../utils/dateFormatter';
import { CURRENT_WEEKLY_EDITION } from '../../data/editionData';
import { TrendingUp, BookOpen, Send, Calendar, FileText, PenTool } from 'lucide-react';

interface SidebarContentProps {
  trendingArticles: Article[];
  mostReadArticles: Article[];
  editorialArticle?: Article;
  onSelectArticle: (slugOrId: string) => void;
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
      {/* 1. Weekly Editorial Column by Chief Editor Dilip Sonale */}
      {editorialArticle && (
        <div className="bg-amber-50/80 dark:bg-stone-900 p-5 rounded border-l-4 border-amber-600 dark:border-amber-500 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2 text-amber-900 dark:text-amber-400">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider font-sans">
                साप्ताहिक अग्रलेख
              </span>
            </div>
            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
              अंक ४२
            </span>
          </div>

          <h4
            onClick={() => onSelectArticle(editorialArticle.slug)}
            className="text-base font-bold font-serif text-stone-950 dark:text-white hover:text-red-800 dark:hover:text-red-400 transition-colors cursor-pointer leading-snug mb-2"
          >
            {editorialArticle.title}
          </h4>

          <p className="text-xs text-stone-700 dark:text-stone-300 font-sans line-clamp-3 leading-relaxed mb-3">
            {editorialArticle.excerpt}
          </p>

          <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 border-t border-amber-200 dark:border-stone-800 pt-2 font-sans">
            <span className="font-bold text-red-800 dark:text-red-400 flex items-center gap-1">
              <PenTool className="w-3 h-3" />
              {editorialArticle.author.name}
            </span>
            <button
              onClick={() => onSelectArticle(editorialArticle.slug)}
              className="text-stone-800 dark:text-stone-200 font-bold hover:underline cursor-pointer"
            >
              पूर्ण अग्रलेख वाचा &rarr;
            </button>
          </div>
        </div>
      )}

      {/* 2. Trending Weekly Stories (ट्रेंडिंग बातम्या) */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-2 border-b-2 border-red-700 pb-2 mb-4">
          <TrendingUp className="w-5 h-5 text-red-700 dark:text-red-400" />
          <h3 className="font-serif font-black text-stone-900 dark:text-white text-lg uppercase tracking-tight">
            साप्ताहिक सर्वाधिक वाचलेल्या
          </h3>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {trendingArticles.slice(0, 5).map((article, idx) => (
            <div
              key={article.id}
              onClick={() => onSelectArticle(article.slug)}
              className="py-3 first:pt-0 last:pb-0 flex items-start gap-3.5 group cursor-pointer"
            >
              {/* Marathi Numeric Badge */}
              <span className="text-2xl font-black font-serif text-stone-300 dark:text-stone-700 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors w-6 text-center shrink-0">
                {toMarathiDigits(idx + 1)}
              </span>

              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold font-serif text-stone-900 dark:text-stone-100 group-hover:text-red-800 dark:group-hover:text-red-400 transition-colors leading-snug line-clamp-2">
                  {article.title}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-stone-400 dark:text-stone-500 mt-1 font-sans">
                  <span>{article.location}</span>
                  <span>·</span>
                  <span>{toMarathiDigits(article.viewsCount)} वाचक</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Weekly Issue Details (साप्ताहिक अंक माहिती) */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-2 border-b-2 border-stone-900 dark:border-stone-700 pb-2 mb-3">
          <Calendar className="w-4 h-4 text-stone-700 dark:text-stone-300" />
          <h3 className="font-serif font-black text-stone-900 dark:text-white text-base uppercase">
            साप्ताहिक आवृत्ती परिचय
          </h3>
        </div>
        <div className="text-xs text-stone-700 dark:text-stone-300 space-y-1.5 font-sans mb-3">
          <p>
            <strong>नियतकालिक:</strong> बहुमोल समाज (साप्ताहिक)
          </p>
          <p>
            <strong>चालू अंक:</strong> {CURRENT_WEEKLY_EDITION.fullDateLabel}
          </p>
          <p>
            <strong>मुख्य संपादक:</strong> {CURRENT_WEEKLY_EDITION.editorInChief}
          </p>
          <p>
            <strong>मुद्रण व प्रकाशन:</strong> पुणे, महाराष्ट्र
          </p>
        </div>
        <span className="text-[11px] font-bold text-red-700 dark:text-red-400 font-sans block">
          “सत्य, न्याय आणि लोकशाहीचा निर्भीक आवाज”
        </span>
      </div>

      {/* 4. Citizen Journalism: बातमीदार व्हा */}
      <div className="bg-stone-900 text-white p-5 rounded shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-red-500">
          <Send className="w-4 h-4" />
          <h4 className="text-sm font-bold font-serif uppercase tracking-wider text-white">
            साप्ताहिक बातमीदार व्हा
          </h4>
        </div>
        <p className="text-xs text-stone-300 font-sans leading-relaxed">
          आपल्या भागातील दुर्लक्षित प्रश्न, शेतकरी समस्या अथवा विकासकामांची बातमी थेट मुख्य संपादक दिलीप सोनाळे यांच्या संपादकीय कक्षाकडे पाठवा.
        </p>
        <button
          onClick={onNavigateContact}
          className="w-full py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded cursor-pointer transition-colors font-sans"
        >
          बातमी पाठवा (Send Story Tip) &rarr;
        </button>
      </div>

      {/* 5. ePaper Broadsheet Promo */}
      <div
        onClick={onNavigateEpaper}
        className="p-5 bg-gradient-to-br from-red-950 to-stone-950 text-white rounded cursor-pointer shadow-md group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
            या आठवड्याचा अंक
          </span>
          <FileText className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
        </div>
        <h4 className="text-lg font-bold font-serif group-hover:text-amber-200 transition-colors">
          डिजिटल ई-पेपर अंक
        </h4>
        <p className="text-xs text-stone-300 font-sans mt-1">
          {CURRENT_WEEKLY_EDITION.fullDateLabel} — सर्व पाने डिजिटल स्वरूपात वाचा.
        </p>
        <span className="inline-block mt-3 text-xs font-bold text-amber-300 group-hover:underline">
          ई-पेपर उघडा &rarr;
        </span>
      </div>
    </aside>
  );
};
