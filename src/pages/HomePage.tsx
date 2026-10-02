import React from 'react';
import { LeadStorySection } from '../components/home/LeadStorySection';
import { CategorySectionBlock } from '../components/home/CategorySectionBlock';
import { LatestNewsFeed } from '../components/home/LatestNewsFeed';
import { SidebarContent } from '../components/home/SidebarContent';
import {
  getLeadArticle,
  getSecondaryLeadArticles,
  getLatestArticles,
  getTrendingArticles,
  getArticlesByCategory,
  ARTICLES,
} from '../data/newsArticles';
import { CategorySlug } from '../types/news';

interface HomePageProps {
  onSelectArticle: (slugOrId: string) => void;
  onSelectCategory: (slug: string) => void;
  onNavigateEpaper: () => void;
  onNavigateContact: () => void;
  isBookmarked: (slugOrId: string) => boolean;
  onToggleBookmark: (slugOrId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectArticle,
  onSelectCategory,
  onNavigateEpaper,
  onNavigateContact,
  isBookmarked,
  onToggleBookmark,
}) => {
  const leadStory = getLeadArticle();
  const secondaryLeadStories = getSecondaryLeadArticles();
  const latestArticles = getLatestArticles(8);
  const trendingArticles = getTrendingArticles();
  const mostReadArticles = ARTICLES.filter((a) => a.viewsCount > 15000);
  const editorialArticle = ARTICLES.find((a) => a.category === 'editorial');

  // All weekly sections to showcase on homepage
  const sectionsToDisplay: CategorySlug[] = [
    'maharashtra',
    'politics',
    'economy',
    'education',
    'tech',
    'desh',
    'sports',
    'entertainment',
    'world',
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-16 transition-colors">
      {/* 1. Main Lead Story & Secondary Headline Grid */}
      <LeadStorySection
        leadStory={leadStory}
        supportingStories={secondaryLeadStories}
        onSelectArticle={onSelectArticle}
        onSelectCategory={onSelectCategory}
        isBookmarked={isBookmarked}
        onToggleBookmark={onToggleBookmark}
      />

      {/* 2. Main Body Grid: 8 Cols Sections + 4 Cols Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main News Columns (8 cols) */}
          <div className="lg:col-span-8">
            {/* Weekly News Feed */}
            <LatestNewsFeed
              articles={latestArticles}
              onSelectArticle={onSelectArticle}
              onSelectCategory={onSelectCategory}
            />

            {/* Department / Category Sections */}
            <div className="space-y-6">
              {sectionsToDisplay.map((catSlug) => {
                const catArticles = getArticlesByCategory(catSlug);
                if (catArticles.length === 0) return null;
                return (
                  <CategorySectionBlock
                    key={catSlug}
                    categorySlug={catSlug}
                    articles={catArticles}
                    onSelectArticle={onSelectArticle}
                    onSelectCategory={onSelectCategory}
                  />
                );
              })}
            </div>
          </div>

          {/* Sidebar Content (4 cols) */}
          <div className="lg:col-span-4">
            <SidebarContent
              trendingArticles={trendingArticles}
              mostReadArticles={mostReadArticles}
              editorialArticle={editorialArticle}
              onSelectArticle={onSelectArticle}
              onSelectCategory={onSelectCategory}
              onNavigateEpaper={onNavigateEpaper}
              onNavigateContact={onNavigateContact}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
