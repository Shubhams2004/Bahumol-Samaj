import React, { useState } from 'react';
import { useRouter, navigateTo } from './utils/router';
import { useReadingPreferences } from './utils/readingPreferences';
import { getArticleById } from './data/newsArticles';
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

export default function App() {
  const { route } = useRouter();
  const {
    fontSize,
    setFontSize,
    bookmarks,
    toggleBookmark,
    isBookmarked,
  } = useReadingPreferences();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Navigation handlers
  const handleSelectArticle = (articleId: string) => {
    navigateTo(`#/article/${articleId}`);
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

  const handleViewAllResults = (query: string) => {
    navigateTo(`#/search?q=${encodeURIComponent(query)}`);
  };

  // Determine current active category slug if on category or article page
  let currentCategorySlug: string | undefined = undefined;
  if (route.page === 'category' && route.params.slug) {
    currentCategorySlug = route.params.slug;
  }

  // Render current view
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
        const article = getArticleById(route.params.id || '');
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
    <div className={`min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900 ${
      fontSize === 'lg' ? 'text-[17px]' : fontSize === 'sm' ? 'text-[14px]' : 'text-[15px]'
    }`}>
      {/* 1. Header with masthead and navigation */}
      <TopHeader
        currentCategorySlug={currentCategorySlug}
        onSelectCategory={handleSelectCategory}
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigateHome={handleNavigateHome}
        onNavigateBookmarks={handleNavigateBookmarks}
        onNavigateEpaper={handleNavigateEpaper}
        onNavigateAbout={handleNavigateAbout}
        onNavigateContact={handleNavigateContact}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        bookmarksCount={bookmarks.length}
      />

      {/* 2. Breaking News Ticker */}
      <BreakingTicker onSelectArticle={handleSelectArticle} />

      {/* 3. Main Dynamic Content */}
      <main className="flex-1">
        {renderCurrentPage()}
      </main>

      {/* 4. Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectArticle={handleSelectArticle}
        onViewAllResults={handleViewAllResults}
      />

      {/* 5. Broadsheet Newspaper Footer */}
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
