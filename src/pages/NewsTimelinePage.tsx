/**
 * @file NewsTimelinePage.tsx
 * Public Live Timeline (थेट वृत्तप्रवाह) view for Bahumol Samaj.
 * Fully unified with the official Homepage experience to eliminate competing implementations.
 * Read-only for public visitors (no RSS fetching or manual ingestion controls).
 */

import React from 'react';
import { HomePage } from './HomePage';

interface NewsTimelinePageProps {
  onNavigateHome: () => void;
  onSelectArticle?: (slugOrId: string) => void;
  onSelectCategory?: (slug: string) => void;
}

export const NewsTimelinePage: React.FC<NewsTimelinePageProps> = ({
  onNavigateHome,
  onSelectArticle = () => {},
  onSelectCategory = () => {},
}) => {
  return (
    <HomePage
      onSelectArticle={onSelectArticle}
      onSelectCategory={onSelectCategory}
      onNavigateEpaper={() => {}}
      onNavigateContact={() => {}}
      isBookmarked={() => false}
      onToggleBookmark={() => {}}
    />
  );
};
