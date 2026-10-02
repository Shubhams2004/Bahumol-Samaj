import React from 'react';
import { LeadStorySection } from '../components/home/LeadStorySection';
import { CategorySectionBlock } from '../components/home/CategorySectionBlock';
import { LatestNewsFeed } from '../components/home/LatestNewsFeed';
import { SidebarContent } from '../components/home/SidebarContent';
import {
  getLeadArticle,
  getSupportingArticles,
  getLatestArticles,
  getTrendingArticles,
  getArticlesByCategory,
  ARTICLES,
} from '../data/newsArticles';
import { CategorySlug } from '../types/news';

interface HomePageProps {
  onSelectArticle: (articleId: string) => void;
  onSelectCategory: (slug: string) => void;
  onNavigateEpaper: () => void;
  onNavigateContact: () => void;
  isBookmarked: (id: string) => boolean;
  onToggleBookmark: (id: string) => void;
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
  const supportingStories = getSupportingArticles();
  const latestArticles = getLatestArticles(8);
  const trendingArticles = getTrendingArticles();
  const mostReadArticles = ARTICLES.filter((a) => a.viewsCount > 15000);
  const editorialArticle = ARTICLES.find((a) => a.category === 'editorial');

  const sectionsToDisplay: CategorySlug[] = [
    'maharashtra',
    'politics',
    'education',
    'jobs',
    'tech',
    'sports',
    'entertainment',
    'india',
    'world',
  ];

  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      {/* 1. Main Lead Story Grid */}
      <LeadStorySection
        leadStory={leadStory}
        supportingStories={supportingStories}
        onSelectArticle={onSelectArticle}
        onSelectCategory={onSelectCategory}
        isBookmarked={isBookmarked}
        onToggleBookmark={onToggleBookmark}
      />

      {/* 2. Main Content Grid (8 Cols Sections + 4 Cols Sidebar) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main News Columns (8 cols) */}
          <div className="lg:col-span-8">
            {/* Latest Updates Feed */}
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

          {/* Sidebar / Secondary Content (4 cols) */}
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
