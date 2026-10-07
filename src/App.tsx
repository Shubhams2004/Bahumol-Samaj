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

  useEffect(() => {
    if (route.page === 'article') {
      const targetSlugOrId = route.params.slug || route.params.id || '';
      if (!targetSlugOrId) {
        setLiveArticleDetail(null);
        setLoadingArticle(false);
        return;
      }

      setLoadingArticle(true);
      let isMounted = true;

      // 1. Dynamic API fetch first (by ID or slug)
      newsService
        .getArticleById(targetSlugOrId)
        .then((article) => {
          if (!isMounted) return;
          if (article) {
            setLiveArticleDetail(article);
            setLoadingArticle(false);
          } else {
            return newsService.getArticleBySlug(targetSlugOrId);
          }
        })
        .then((bySlugArticle) => {
          if (!isMounted) return;
          if (bySlugArticle) {
            setLiveArticleDetail(bySlugArticle);
            setLoadingArticle(false);
          } else {
            // 2. Fallback to static articles
            const local = getArticleBySlug(targetSlugOrId) || getArticleById(targetSlugOrId);
            setLiveArticleDetail(local || null);
            setLoadingArticle(false);
          }
        })
        .catch(() => {
          if (!isMounted) return;
          const local = getArticleBySlug(targetSlugOrId) || getArticleById(targetSlugOrId);
          setLiveArticleDetail(local || null);
          setLoadingArticle(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setLiveArticleDetail(null);
      setLoadingArticle(false);
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

        if (!article) {
          if (loadingArticle) {
            return (
              <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-stone-500 font-sans">
                <div className="w-8 h-8 border-3 border-red-700 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm font-medium">बातमी उघडत आहे...</p>
              </div>
            );
          }
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

      {/* 2. Breaking Weekly Ticker */}
      <BreakingTicker onSelectArticle={handleSelectArticle} />

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
