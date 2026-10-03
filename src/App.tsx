import React, { useState } from 'react';
import { useRouter, navigateTo } from './utils/router';
import { useReadingPreferences } from './utils/readingPreferences';
import { getArticleBySlug, getArticleById } from './data/newsArticles';
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

  // Slug-based article navigation
  const handleSelectArticle = (slugOrId: string) => {
    navigateTo(`#/article/${slugOrId}`);
  };

  const handleSelectCategory = (slug: string) => {
    navigateTo(`#/category/${slug}`);
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

  const handleViewAllResults = (query: string) => {
    navigateTo(`#/search?q=${encodeURIComponent(query)}`);
  };

  let currentCategorySlug: string | undefined = undefined;
  if (route.page === 'category' && route.params.slug) {
    currentCategorySlug = route.params.slug;
  }

  const renderCurrentPage = () => {
    switch (route.page) {
      case 'category':
        return (
          <CategoryPage
            slug={route.params.slug || 'maharashtra'}
            onSelectArticle={handleSelectArticle}
            onNavigateHome={handleNavigateHome}
          />
        );

      case 'article': {
        const targetSlugOrId = route.params.slug || route.params.id || '';
        const article = getArticleBySlug(targetSlugOrId) || getArticleById(targetSlugOrId);
        if (!article) {
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
