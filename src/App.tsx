import React, { useState, useEffect } from 'react';
import { useRouter, navigateTo } from './utils/router';
import { useReadingPreferences } from './utils/readingPreferences';
import { getArticleBySlug, getArticleById } from './data/newsArticles';
import { newsService } from './services/newsService';
import { Article } from './types/news';
import { TopHeader } from './components/common/TopHeader';
import { BreakingTicker } from './components/common/BreakingTicker';
import { Footer } from './components/common/Footer';
import { SearchModal } from './components/common/SearchModal';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { EpaperPage } from './pages/EpaperPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { NewsTimelinePage } from './pages/NewsTimelinePage';
import { EditorialDashboardPage } from './pages/EditorialDashboardPage';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function App() {
  const { route } = useRouter();
  const {
    theme,
    toggleTheme,
    fontSize,
    setFontSize,
    bookmarks,
    toggleBookmark,
    isBookmarked,
  } = useReadingPreferences();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [liveArticleDetail, setLiveArticleDetail] = useState<Article | null>(null);
  const [loadingArticle, setLoadingArticle] = useState<boolean>(false);
  const [articleNotFound, setArticleNotFound] = useState<boolean>(false);

  useEffect(() => {
    if (route.page === 'article') {
      const targetSlugOrId = route.params.slug || route.params.id || '';
      if (!targetSlugOrId) {
        setLiveArticleDetail(null);
        setLoadingArticle(false);
        setArticleNotFound(true);
        return;
      }

      setLoadingArticle(true);
      setArticleNotFound(false);
      let isMounted = true;

      // 1. Dynamic API fetch first (by ID or slug)
      newsService
        .getArticleById(targetSlugOrId)
        .then((article) => {
          if (!isMounted) return;
          if (article) {
            setLiveArticleDetail(article);
            setLoadingArticle(false);
            setArticleNotFound(false);
          } else {
            return newsService.getArticleBySlug(targetSlugOrId);
          }
        })
        .then((bySlugArticle) => {
          if (!isMounted) return;
          if (bySlugArticle) {
            setLiveArticleDetail(bySlugArticle);
            setLoadingArticle(false);
            setArticleNotFound(false);
          } else {
            // 2. Check static fallback only if matching ID exists
            const local = getArticleBySlug(targetSlugOrId) || getArticleById(targetSlugOrId);
            if (local) {
              setLiveArticleDetail(local);
              setArticleNotFound(false);
            } else {
              setLiveArticleDetail(null);
              setArticleNotFound(true);
            }
            setLoadingArticle(false);
          }
        })
        .catch(() => {
          if (!isMounted) return;
          const local = getArticleBySlug(targetSlugOrId) || getArticleById(targetSlugOrId);
          if (local) {
            setLiveArticleDetail(local);
            setArticleNotFound(false);
          } else {
            setLiveArticleDetail(null);
            setArticleNotFound(true);
          }
          setLoadingArticle(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setLiveArticleDetail(null);
      setLoadingArticle(false);
      setArticleNotFound(false);
    }
  }, [route.page, route.params.slug, route.params.id]);

  // Slug-based article navigation
  const handleSelectArticle = (slugOrId: string) => {
    navigateTo(`#/article/${slugOrId}`);
  };

  const handleSelectCategory = (slug: string) => {
    if (slug === 'editorial') {
      navigateTo('#/editorial');
    } else if (slug === 'editorial-desk' || slug === 'editorial_desk') {
      navigateTo('#/editorial-desk');
    } else {
      navigateTo(`#/category/${slug}`);
    }
  };

  const handleNavigateHome = () => {
    navigateTo('#/');
  };

  const handleNavigateAbout = () => {
    navigateTo('#/about');
  };

  const handleNavigateContact = () => {
    navigateTo('#/contact');
  };

  const handleNavigateEpaper = () => {
    navigateTo('#/epaper');
  };

  const handleNavigateBookmarks = () => {
    navigateTo('#/bookmarks');
  };

  const handleNavigateTimeline = () => {
    navigateTo('#/timeline');
  };

  const handleNavigateEditorial = () => {
    navigateTo('#/editorial');
  };

  const handleNavigateEditorialDesk = () => {
    navigateTo('#/editorial-desk');
  };

  const handleViewAllResults = (query: string) => {
    navigateTo(`#/search?q=${encodeURIComponent(query)}`);
  };

  let currentCategorySlug: string | undefined = undefined;
  if (route.page === 'category' && route.params.slug) {
    currentCategorySlug = route.params.slug;
  } else if (route.page === 'editorial') {
    currentCategorySlug = 'editorial';
  }

  const renderCurrentPage = () => {
    switch (route.page) {
      case 'category':
        if (route.params.slug === 'editorial-desk' || route.params.slug === 'editorial_desk') {
          return (
            <EditorialDashboardPage
              onNavigateHome={handleNavigateHome}
              onNavigateTimeline={handleNavigateTimeline}
              initialStoryId={route.params.storyId}
            />
          );
        }
        return (
          <CategoryPage
            slug={route.params.slug || 'maharashtra'}
            onSelectArticle={handleSelectArticle}
            onNavigateHome={handleNavigateHome}
          />
        );

      case 'article': {
        const targetSlugOrId = route.params.slug || route.params.id || '';
        const article =
          liveArticleDetail ||
          getArticleBySlug(targetSlugOrId) ||
          getArticleById(targetSlugOrId);

        if (loadingArticle && !article) {
          return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-stone-500 font-sans">
              <div className="w-8 h-8 border-3 border-red-700 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium">बातमी उघडत आहे...</p>
            </div>
          );
        }

        if (!article || articleNotFound) {
          return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto font-sans">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-2">
                ही बातमी सध्या उपलब्ध नाही
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
                सदर बातमी काढून टाकण्यात आली असावी किंवा अद्याप प्रसिद्ध झालेली नसावी. (This story is currently unavailable or has not been published.)
              </p>
              <button
                onClick={handleNavigateHome}
                className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded font-medium text-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                मुख्यपृष्ठावर परत जा
              </button>
            </div>
          );
        }

        return (
          <ArticleDetailPage
            article={article}
            onSelectArticle={handleSelectArticle}
            onSelectCategory={handleSelectCategory}
            onNavigateHome={handleNavigateHome}
            isBookmarked={isBookmarked}
            onToggleBookmark={toggleBookmark}
            fontSize={fontSize}
            onChangeFontSize={setFontSize}
          />
        );
      }

      case 'search':
        return (
          <SearchResultsPage
            initialQuery={route.params.query || ''}
            onSelectArticle={handleSelectArticle}
            onNavigateHome={handleNavigateHome}
          />
        );

      case 'about':
        return (
          <AboutPage
            onNavigateHome={handleNavigateHome}
            onNavigateContact={handleNavigateContact}
          />
        );

      case 'contact':
        return <ContactPage onNavigateHome={handleNavigateHome} />;

      case 'epaper':
        return (
          <EpaperPage
            onNavigateHome={handleNavigateHome}
            onSelectArticle={handleSelectArticle}
          />
        );

      case 'bookmarks':
        return (
          <BookmarksPage
            bookmarkedIds={bookmarks}
            onSelectArticle={handleSelectArticle}
            onRemoveBookmark={toggleBookmark}
            onNavigateHome={handleNavigateHome}
          />
        );

      case 'timeline':
        return (
          <NewsTimelinePage
            onNavigateHome={handleNavigateHome}
            onSelectArticle={handleSelectArticle}
          />
        );

      case 'editorial':
        return (
          <CategoryPage
            slug="editorial"
            onSelectArticle={handleSelectArticle}
            onNavigateHome={handleNavigateHome}
          />
        );

      case 'editorial-desk':
        return (
          <EditorialDashboardPage
            onNavigateHome={handleNavigateHome}
            onNavigateTimeline={handleNavigateTimeline}
            initialStoryId={route.params.storyId}
          />
        );

      case 'home':
      default:
        return (
          <HomePage
            onSelectArticle={handleSelectArticle}
            onSelectCategory={handleSelectCategory}
            onNavigateEpaper={handleNavigateEpaper}
            onNavigateContact={handleNavigateContact}
            isBookmarked={isBookmarked}
            onToggleBookmark={toggleBookmark}
          />
        );
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 transition-colors ${
        fontSize === 'lg' ? 'text-[17px]' : fontSize === 'sm' ? 'text-[14px]' : 'text-[15px]'
      }`}
    >
      {/* 1. Broadsheet Newspaper Top Header */}
      <TopHeader
        currentCategorySlug={currentCategorySlug}
        isArticlePage={route.page === 'article'}
        onSelectCategory={handleSelectCategory}
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigateHome={handleNavigateHome}
        onNavigateBookmarks={handleNavigateBookmarks}
        onNavigateTimeline={handleNavigateTimeline}
        onNavigateEditorial={handleNavigateEditorial}
        onNavigateEditorialDesk={handleNavigateEditorialDesk}
        onNavigateEpaper={handleNavigateEpaper}
        onNavigateAbout={handleNavigateAbout}
        onNavigateContact={handleNavigateContact}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        theme={theme}
        onToggleTheme={toggleTheme}
        bookmarksCount={bookmarks.length}
      />

      {/* 2. Breaking Weekly Ticker (Hidden while reading an article for maximal screen space) */}
      {route.page !== 'article' && <BreakingTicker onSelectArticle={handleSelectArticle} />}

      {/* 3. Main Content View */}
      <main className="flex-1">{renderCurrentPage()}</main>

      {/* 4. Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectArticle={handleSelectArticle}
        onViewAllResults={handleViewAllResults}
      />

      {/* 5. Newspaper Footer */}
      <Footer
        onSelectCategory={handleSelectCategory}
        onNavigateHome={handleNavigateHome}
        onNavigateAbout={handleNavigateAbout}
        onNavigateContact={handleNavigateContact}
        onNavigateEpaper={handleNavigateEpaper}
      />
    </div>
  );
}
