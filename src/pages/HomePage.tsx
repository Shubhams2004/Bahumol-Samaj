import React, { useState, useEffect } from 'react';
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
import { newsService } from '../services/newsService';
import { Article, CategorySlug } from '../types/news';

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
  const [publishedArticles, setPublishedArticles] = useState<Article[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    newsService
      .fetchPublishedFromApi(undefined, 50)
      .then((live) => {
        if (isMounted) {
          if (live && live.length > 0) {
            setPublishedArticles(live);
          } else {
            setPublishedArticles(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setPublishedArticles(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const hasLive = publishedArticles !== null && publishedArticles.length > 0;

  // Primary source: live published articles from API; Fallback: static mock articles
  const leadStory: Article = hasLive
    ? (publishedArticles.find((a) => a.leadStory) || publishedArticles[0])
    : getLeadArticle();

  const secondaryLeadStories: Article[] = hasLive
    ? publishedArticles.filter((a) => a.id !== leadStory.id).slice(0, 3)
    : getSecondaryLeadArticles();

  const latestArticles: Article[] = hasLive
    ? publishedArticles.slice(0, 8)
    : getLatestArticles(8);

  const trendingArticles: Article[] = hasLive
    ? (() => {
        const trending = publishedArticles.filter((a) => a.trending || a.viewsCount > 10000);
        return trending.length > 0 ? trending : publishedArticles.slice(0, 5);
      })()
    : getTrendingArticles();

  const mostReadArticles: Article[] = hasLive
    ? (() => {
        const popular = publishedArticles.filter((a) => a.mostRead || a.viewsCount > 15000);
        return popular.length > 0 ? popular : publishedArticles.slice(0, 5);
      })()
    : ARTICLES.filter((a) => a.viewsCount > 15000);

  const editorialArticle: Article | undefined = hasLive
    ? publishedArticles.find((a) => a.category === 'editorial')
    : ARTICLES.find((a) => a.category === 'editorial');

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

  const getArticlesForCategory = (catSlug: CategorySlug): Article[] => {
    if (hasLive) {
      return publishedArticles.filter((a) => a.category === catSlug);
    }
    return getArticlesByCategory(catSlug);
  };

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
                const catArticles = getArticlesForCategory(catSlug);
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
