/**
 * @file HomePage.tsx
 * Bahumol Samaj Official Public Homepage (मुख्यपृष्ठ).
 * Powered by Live Timeline (थेट वृत्तप्रवाह) connected directly to Cloudflare D1 published news.
 * Strictly READ-ONLY for public visitors.
 * Features:
 * - Real-time published editorial news feed from Cloudflare D1 (/api/news)
 * - Source group, category, and language filtering
 * - Direct full-article reading on Bahumol Samaj (#/article/:id)
 * - Safe static ARTICLES fallback only if the API is offline
 */

import React, { useState, useEffect, useCallback } from 'react';
import { newsService, TimelineStory } from '../services/newsService';
import { ARTICLES } from '../data/newsArticles';
import { VALID_CATEGORIES } from '../worker/classifier';
import {
  Clock,
  ExternalLink,
  Filter,
  Building2,
  Globe,
  Radio,
  AlertCircle,
  ChevronRight,
  Layers,
  BookOpen,
  Languages,
} from 'lucide-react';

interface HomePageProps {
  onSelectArticle: (slugOrId: string) => void;
  onSelectCategory: (slug: string) => void;
  onNavigateEpaper: () => void;
  onNavigateContact: () => void;
  isBookmarked: (slugOrId: string) => boolean;
  onToggleBookmark: (slugOrId: string) => void;
}

const SOURCE_GROUP_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'Government Sources': {
    label: 'शासकीय अधिकृत',
    color: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    icon: <Building2 className="w-3.5 h-3.5 inline mr-1 text-emerald-600 dark:text-emerald-400" />,
  },
  'Indian News': {
    label: 'राष्ट्रीय वृत्त',
    color: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    icon: <Radio className="w-3.5 h-3.5 inline mr-1 text-amber-600 dark:text-amber-400" />,
  },
  'International News': {
    label: 'आंतरराष्ट्रीय',
    color: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
    icon: <Globe className="w-3.5 h-3.5 inline mr-1 text-sky-600 dark:text-sky-400" />,
  },
};

// Static archive fallback data if API returns empty
const STATIC_FALLBACK_STORIES: TimelineStory[] = ARTICLES.map((a) => ({
  id: a.id,
  source_id: 'editorial_office',
  source_name: a.author.name,
  source_group: 'Government Sources',
  source_url: `#/article/${a.slug}`,
  source_guid: a.slug,
  title: a.title,
  description: a.excerpt,
  content: a.content.join('\n\n'),
  image_url: a.image,
  author: a.author.name,
  published_at: a.publishedAt,
  category: a.category,
  language: a.language || 'mr',
  status: 'published',
  created_at: a.publishedAt,
}));

export const HomePage: React.FC<HomePageProps> = ({
  onSelectArticle,
  onSelectCategory,
}) => {
  const [stories, setStories] = useState<TimelineStory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Load published stories from Cloudflare D1 API
  const loadStories = useCallback(async (targetPage: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await newsService.fetchTimelineStories({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        source_group: selectedGroup !== 'all' ? selectedGroup : undefined,
        page: targetPage,
        limit: 15,
      });

      if (res && res.stories && res.stories.length > 0) {
        let filtered = res.stories;
        if (selectedLanguage !== 'all') {
          filtered = filtered.filter((s) => (s.language || 'mr').toLowerCase() === selectedLanguage.toLowerCase());
        }
        setStories(filtered);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || filtered.length);
        setPage(targetPage);
      } else {
        // Fallback to static articles if API returned empty
        let fallback = STATIC_FALLBACK_STORIES;
        if (selectedCategory !== 'all') {
          fallback = fallback.filter((s) => s.category === selectedCategory);
        }
        if (selectedLanguage !== 'all') {
          fallback = fallback.filter((s) => (s.language || 'mr').toLowerCase() === selectedLanguage.toLowerCase());
        }
        setStories(fallback);
        setTotalPages(1);
        setTotalCount(fallback.length);
        setPage(1);
      }
    } catch {
      // Fallback on network failure
      setStories(STATIC_FALLBACK_STORIES);
      setTotalPages(1);
      setTotalCount(STATIC_FALLBACK_STORIES.length);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedGroup, selectedLanguage]);

  useEffect(() => {
    loadStories(1);
  }, [loadStories]);

  // Format date helper in Marathi
  const formatStoryDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return isoStr;

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor(diffMs / (1000 * 60));

      if (diffMins < 60 && diffMins >= 0) {
        return `${diffMins || 1} मिनिटांपूर्वी`;
      }
      if (diffHrs < 24 && diffHrs >= 0) {
        return `${diffHrs} तासांपूर्वी`;
      }

      return date.toLocaleDateString('mr-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
      {/* 1. Authentic Newspaper Masthead Banner */}
      <div className="mb-6 p-4 sm:p-5 bg-white dark:bg-stone-900 border-l-4 border-red-700 dark:border-red-500 rounded-r border-y border-r border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-red-700 text-white px-2 py-0.5 rounded">
                थेट वृत्तप्रवाह • मुख्यपृष्ठ
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                साप्ताहिक वृत्तपत्र (Cloudflare D1)
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-950 dark:text-white">
              थेट वृत्तप्रवाह (Live Timeline)
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1">
              संपादकीय पडताळणी केलेले अधिकृत, निर्भीक व विश्‍वासार्ह ताज्या घडामोडींचे थेट वार्तांकन.
            </p>
          </div>

          <div className="text-xs text-stone-600 dark:text-stone-300 font-mono bg-stone-100 dark:bg-stone-800 px-3 py-2 rounded self-start md:self-auto border border-stone-200 dark:border-stone-700">
            प्रसिद्ध बातम्या: <strong className="text-stone-950 dark:text-white">{totalCount}</strong> | पृष्ठ {page}/{totalPages}
          </div>
        </div>
      </div>

      {/* 2. Source Group, Category & Language Filter Bar */}
      <div className="space-y-3 mb-6 bg-white dark:bg-stone-900 p-4 border border-stone-200 dark:border-stone-800 rounded shadow-2xs">
        {/* Source Group Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 mr-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> स्रोत गट:
          </span>

          <button
            onClick={() => setSelectedGroup('all')}
            className={`text-xs px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
              selectedGroup === 'all'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            सर्व स्रोत (All)
          </button>

          <button
            onClick={() => setSelectedGroup('Government Sources')}
            className={`text-xs px-3 py-1.5 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              selectedGroup === 'Government Sources'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> शासकीय स्रोत (PIB, शासन)
          </button>

          <button
            onClick={() => setSelectedGroup('Indian News')}
            className={`text-xs px-3 py-1.5 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              selectedGroup === 'Indian News'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> राष्ट्रीय वृत्त (National)
          </button>

          <button
            onClick={() => setSelectedGroup('International News')}
            className={`text-xs px-3 py-1.5 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              selectedGroup === 'International News'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> आंतरराष्ट्रीय (International)
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100 dark:border-stone-800">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> वर्गवारी:
          </span>

          <button
            onClick={() => setSelectedCategory('all')}
            className={`text-[11px] px-2.5 py-1 rounded transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 font-semibold'
                : 'bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
            }`}
          >
            सर्व वर्ग
          </button>

          {VALID_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-[11px] px-2.5 py-1 rounded transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 font-semibold'
                  : 'bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Language Filter */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100 dark:border-stone-800">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 mr-2 flex items-center gap-1">
            <Languages className="w-3.5 h-3.5" /> भाषा (Language):
          </span>

          <button
            onClick={() => setSelectedLanguage('all')}
            className={`text-[11px] px-2.5 py-1 rounded transition-colors cursor-pointer ${
              selectedLanguage === 'all'
                ? 'bg-red-700 text-white font-semibold'
                : 'bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
            }`}
          >
            सर्व भाषा (All)
          </button>

          <button
            onClick={() => setSelectedLanguage('mr')}
            className={`text-[11px] px-2.5 py-1 rounded transition-colors cursor-pointer ${
              selectedLanguage === 'mr'
                ? 'bg-red-700 text-white font-semibold'
                : 'bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
            }`}
          >
            मराठी (mr)
          </button>

          <button
            onClick={() => setSelectedLanguage('hi')}
            className={`text-[11px] px-2.5 py-1 rounded transition-colors cursor-pointer ${
              selectedLanguage === 'hi'
                ? 'bg-red-700 text-white font-semibold'
                : 'bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
            }`}
          >
            हिंदी (hi)
          </button>

          <button
            onClick={() => setSelectedLanguage('en')}
            className={`text-[11px] px-2.5 py-1 rounded transition-colors cursor-pointer ${
              selectedLanguage === 'en'
                ? 'bg-red-700 text-white font-semibold'
                : 'bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
            }`}
          >
            English (en)
          </button>
        </div>
      </div>

      {/* 3. Published Stories Stream */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded animate-pulse"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-4 w-24 bg-stone-200 dark:bg-stone-800 rounded"></div>
                <div className="h-4 w-32 bg-stone-200 dark:bg-stone-800 rounded"></div>
              </div>
              <div className="h-6 w-3/4 bg-stone-200 dark:bg-stone-800 rounded mb-2"></div>
              <div className="h-4 w-full bg-stone-200 dark:bg-stone-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white dark:bg-stone-900 border border-red-200 dark:border-red-900/40 rounded">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
            डेटा लोड करताना त्रुटी आली
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mb-4">{error}</p>
          <button
            onClick={() => loadStories(1)}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm rounded font-medium cursor-pointer"
          >
            पुन्हा प्रयत्न करा
          </button>
        </div>
      ) : stories.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded">
          <Radio className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-stone-800 dark:text-stone-200 mb-2">
            या वर्गवारीत अथवा गटात अद्याप प्रकाशित बातम्या उपलब्ध नाहीत
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto mb-5">
            केवळ संपादकीय मंजुरी मिळालेल्या (status = published) बातम्या सार्वजनिक प्रदर्शित केल्या जातात.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedGroup('all');
              setSelectedLanguage('all');
            }}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs sm:text-sm rounded font-medium cursor-pointer"
          >
            सर्व बातम्या पहा
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((story) => {
            const groupInfo =
              (story.source_group && SOURCE_GROUP_LABELS[story.source_group]) || {
                label: story.source_group || 'वृत्त',
                color: 'bg-stone-100 text-stone-800 border-stone-300 dark:bg-stone-800 dark:text-stone-300',
                icon: null,
              };

            const langBadge = (story.language || 'mr').toUpperCase();

            return (
              <article
                key={story.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-red-600/50 dark:hover:border-red-500/50 p-5 rounded transition-all shadow-2xs group"
              >
                <div className="flex flex-col md:flex-row gap-5">
                  {/* Image thumbnail when available */}
                  {story.image_url && (
                    <div
                      onClick={() => onSelectArticle(story.id)}
                      className="md:w-56 shrink-0 overflow-hidden rounded bg-stone-100 dark:bg-stone-800 aspect-16/10 md:aspect-auto cursor-pointer"
                    >
                      <img
                        src={story.image_url}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Meta Tags */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {/* Source Group Badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${groupInfo.color} flex items-center`}
                        >
                          {groupInfo.icon}
                          {groupInfo.label}
                        </span>

                        {/* Publisher Name */}
                        <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                          {story.source_name || story.author || 'बहुमोल समाज विशेष वार्ता'}
                        </span>

                        <span className="text-stone-300 dark:text-stone-700">•</span>

                        {/* Category */}
                        <span
                          onClick={() => onSelectCategory(story.category)}
                          className="text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 px-2 py-0.5 rounded cursor-pointer"
                        >
                          {story.category}
                        </span>

                        {/* Language Tag */}
                        {langBadge !== 'MR' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded">
                            {langBadge}
                          </span>
                        )}

                        <span className="text-stone-300 dark:text-stone-700">•</span>

                        {/* Timestamp */}
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 font-sans">
                          <Clock className="w-3 h-3" />
                          {formatStoryDate(story.published_at)}
                        </span>
                      </div>

                      {/* Headline (Opens full article reader on Bahumol Samaj) */}
                      <h2
                        onClick={() => onSelectArticle(story.id)}
                        className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 leading-snug mb-2 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors cursor-pointer"
                      >
                        {story.title}
                      </h2>

                      {/* Excerpt */}
                      {story.description && (
                        <p
                          onClick={() => onSelectArticle(story.id)}
                          className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed mb-3 cursor-pointer"
                        >
                          {story.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex flex-wrap items-center justify-between text-xs text-stone-500 dark:text-stone-400 gap-2">
                      <button
                        onClick={() => onSelectArticle(story.id)}
                        className="inline-flex items-center gap-1.5 font-bold text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        संपूर्ण बातमी वाचा (Read Full Article)
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {story.source_url && story.source_url.startsWith('http') && (
                        <a
                          href={story.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-[11px]"
                          title="मूळ बाह्य स्रोत पहा"
                        >
                          मूळ स्रोत
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 4. Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => loadStories(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded text-xs sm:text-sm font-medium disabled:opacity-40 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            मागील पृष्ठ
          </button>

          <span className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-400">
            पृष्ठ {page} / {totalPages}
          </span>

          <button
            onClick={() => loadStories(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded text-xs sm:text-sm font-medium disabled:opacity-40 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1"
          >
            पुढील पृष्ठ
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
