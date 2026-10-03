/**
 * @file NewsTimelinePage.tsx
 * Real-time News Timeline consuming the Bahumol Samaj Cloudflare D1 News API.
 * Displays live ingested stories with source attribution, categories, and direct links.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { newsService, TimelineStory, BackendSource } from '../services/newsService';
import { VALID_CATEGORIES } from '../worker/classifier';
import {
  Clock,
  ExternalLink,
  RefreshCw,
  Filter,
  Building2,
  Globe,
  Radio,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';

interface NewsTimelinePageProps {
  onNavigateHome: () => void;
  onSelectArticle?: (slugOrId: string) => void;
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

export const NewsTimelinePage: React.FC<NewsTimelinePageProps> = ({ onNavigateHome }) => {
  const [stories, setStories] = useState<TimelineStory[]>([]);
  const [sources, setSources] = useState<BackendSource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Filters
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Load registered sources
  useEffect(() => {
    newsService.fetchActiveSources().then((res) => {
      if (res && res.length > 0) {
        setSources(res);
      }
    });
  }, []);

  // Fetch timeline stories
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

      setStories(res.stories);
      setTotalPages(res.totalPages);
      setTotalCount(res.total);
      setPage(targetPage);
    } catch (err) {
      setError('बातमी प्रवाह लोड करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedGroup]);

  useEffect(() => {
    loadStories(1);
  }, [loadStories]);

  // Trigger manual refresh & ingest
  const handleTriggerRefresh = async () => {
    setRefreshing(true);
    setStatusMessage('आरएसएस स्रोतांवरून ताज्या बातम्या संकलित होत आहेत...');
    try {
      const res = await newsService.triggerManualIngestion();
      if (res.success) {
        setStatusMessage('बातम्या यशस्वीरीत्या संकलित झाल्या. प्रवाह अद्ययावत केला जात आहे.');
        await loadStories(1);
      } else {
        setStatusMessage(res.message || 'संकलन करताना त्रुटी आली.');
      }
    } catch (e) {
      setStatusMessage('सर्व्हरशी संपर्क होऊ शकला नाही.');
    } finally {
      setRefreshing(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

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
      {/* 1. Header Navigation & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            मुख्य पानाकडे परत
          </button>
          <span className="text-stone-300 dark:text-stone-700">/</span>
          <span className="text-xs sm:text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 animate-pulse text-red-600" />
            लाइव्ह न्यूज टाइमलाइन
          </span>
        </div>

        {/* Manual Ingest / Refresh Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="आरएसएस फीड्समधून ताज्या बातम्या संकलित करा"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'संकलन सुरू आहे...' : 'ताजे वृत्त संकलन करा'}
          </button>
        </div>
      </div>

      {/* 2. Banner & Editorial Notice */}
      <div className="my-6 p-4 sm:p-5 bg-stone-100 dark:bg-stone-900 border-l-4 border-red-700 dark:border-red-500 rounded-r shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-red-700 text-white px-2 py-0.5 rounded">
                बहुमोल समाज • थेट वृत्त
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                साप्ताहिक वृत्तपत्र ब्युरो संकलन (Cloudflare D1)
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
              लाइव्ह न्यूज टाइमलाइन (Live News Wire)
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1">
              शासकीय प्रसिद्धीपत्रके, राष्ट्रीय व आंतरराष्ट्रीय अधिकृत वृत्तसंकेतांवरून आलेला पडताळणी केलेला वृत्तप्रवाह.
            </p>
          </div>

          <div className="text-xs text-stone-500 dark:text-stone-400 font-mono bg-stone-200 dark:bg-stone-800 px-3 py-2 rounded self-start md:self-auto">
            उपलब्ध बातम्या: <strong className="text-stone-900 dark:text-stone-100">{totalCount}</strong> | पृष्ठ {page}/{totalPages}
          </div>
        </div>
      </div>

      {/* Status / Feedback Alert */}
      {statusMessage && (
        <div className="mb-4 p-3 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 3. Source Group & Category Filter Tabs */}
      <div className="space-y-3 mb-6 bg-white dark:bg-stone-900 p-4 border border-stone-200 dark:border-stone-800 rounded">
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
            <Radio className="w-3.5 h-3.5" /> राष्ट्रीय वृत्त (Indian News)
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
      </div>

      {/* 4. Timeline Stream */}
      {loading ? (
        // Loading Skeleton
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
        // Error State
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
        // Empty State
        <div className="p-12 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded">
          <Radio className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-stone-800 dark:text-stone-200 mb-2">
            या वर्गवारीत अथवा गटात अद्याप प्रकाशित बातम्या उपलब्ध नाहीत
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto mb-5">
            Cloudflare D1 डेटाबेसमध्ये फक्त संपादकीय मंजुरी मिळालेल्या (status = published) बातम्या सार्वजनिक दिसतात. ताज्या बातम्या गोळा करण्यासाठी वरील बटनावर क्लिक करा.
          </p>
          <button
            onClick={handleTriggerRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm rounded font-medium cursor-pointer"
          >
            {refreshing ? 'संकलन सुरू आहे...' : 'आताच ताज्या बातम्या संकलित करा'}
          </button>
        </div>
      ) : (
        // Story Cards List
        <div className="space-y-4">
          {stories.map((story) => {
            const groupInfo =
              (story.source_group && SOURCE_GROUP_LABELS[story.source_group]) || {
                label: story.source_group || 'वृत्त',
                color: 'bg-stone-100 text-stone-800 border-stone-300 dark:bg-stone-800 dark:text-stone-300',
                icon: null,
              };

            return (
              <article
                key={story.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 p-5 rounded transition-all shadow-2xs group"
              >
                <div className="flex flex-col md:flex-row gap-5">
                  {/* Optional Image thumbnail when available */}
                  {story.image_url && (
                    <div className="md:w-56 shrink-0 overflow-hidden rounded bg-stone-100 dark:bg-stone-800 aspect-16/10 md:aspect-auto">
                      <img
                        src={story.image_url}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          // Hide image cleanly if failed to load
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Content Column */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Meta Tags: Source Group, Source Name, Category, Timestamp */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {/* Source Group Badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${groupInfo.color} flex items-center`}
                        >
                          {groupInfo.icon}
                          {groupInfo.label}
                        </span>

                        {/* Source Publisher Name */}
                        <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                          {story.source_name || story.author || 'अधिकृत वृत्तसंकेत'}
                        </span>

                        <span className="text-stone-300 dark:text-stone-700">•</span>

                        {/* Category */}
                        <span className="text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded">
                          {story.category}
                        </span>

                        <span className="text-stone-300 dark:text-stone-700">•</span>

                        {/* Relative Timestamp */}
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 font-sans">
                          <Clock className="w-3 h-3" />
                          {formatStoryDate(story.published_at)}
                        </span>
                      </div>

                      {/* Headline */}
                      <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 leading-snug mb-2 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
                        <a
                          href={story.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {story.title}
                        </a>
                      </h2>

                      {/* Excerpt / Description */}
                      {story.description && (
                        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed mb-3">
                          {story.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Attribution & External Link */}
                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex flex-wrap items-center justify-between text-xs text-stone-500 dark:text-stone-400 gap-2">
                      <span className="font-sans text-[11px]">
                        संपादकीय स्रोत: <strong className="text-stone-700 dark:text-stone-300">{story.source_name || story.source_id}</strong>
                      </span>

                      {story.source_url && (
                        <a
                          href={story.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-red-700 dark:text-red-400 hover:text-red-800 font-medium hover:underline text-xs"
                        >
                          मूळ बातमी वाचा
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

      {/* 5. Pagination Controls */}
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

      {/* 6. Active Registered Feeds Summary Card */}
      {sources.length > 0 && (
        <div className="mt-12 p-4 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded">
          <h4 className="font-serif font-bold text-sm text-stone-800 dark:text-stone-200 mb-2">
            पडताळणी केलेले सक्रिय स्रोत (Verified Active News Registry)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {sources.map((s) => (
              <div
                key={s.id}
                className="p-2 bg-white dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700/60 rounded flex items-center justify-between"
              >
                <div className="truncate pr-2">
                  <span className="font-medium text-stone-900 dark:text-stone-100 block truncate">
                    {s.name}
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400">
                    {s.source_group} • {s.default_category}
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="सक्रिय" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
