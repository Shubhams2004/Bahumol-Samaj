import { useState, useEffect } from 'react';
import { EditionCity } from '../types/news';

export type FontSizeOption = 'sm' | 'md' | 'lg';

const STORAGE_KEYS = {
  FONT_SIZE: 'bahumol_font_size',
  BOOKMARKS: 'bahumol_bookmarks',
  EDITION: 'bahumol_edition',
};

export const useReadingPreferences = () => {
  const [fontSize, setFontSizeState] = useState<FontSizeOption>('md');
  const [bookmarks, setBookmarksState] = useState<string[]>([]);
  const [edition, setEditionState] = useState<EditionCity>('पुणे');

  useEffect(() => {
    try {
      const savedFontSize = localStorage.getItem(STORAGE_KEYS.FONT_SIZE) as FontSizeOption;
      if (savedFontSize && ['sm', 'md', 'lg'].includes(savedFontSize)) {
        setFontSizeState(savedFontSize);
      }

      const savedBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (savedBookmarks) {
        setBookmarksState(JSON.parse(savedBookmarks));
      }

      const savedEdition = localStorage.getItem(STORAGE_KEYS.EDITION) as EditionCity;
      if (savedEdition) {
        setEditionState(savedEdition);
      }
    } catch {
      // LocalStorage access fallback
    }
  }, []);

  const setFontSize = (size: FontSizeOption) => {
    setFontSizeState(size);
    try {
      localStorage.setItem(STORAGE_KEYS.FONT_SIZE, size);
    } catch {}
  };

  const toggleBookmark = (articleId: string) => {
    setBookmarksState((prev) => {
      const exists = prev.includes(articleId);
      const updated = exists ? prev.filter((id) => id !== articleId) : [...prev, articleId];
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const isBookmarked = (articleId: string): boolean => {
    return bookmarks.includes(articleId);
  };

  const setEdition = (city: EditionCity) => {
    setEditionState(city);
    try {
      localStorage.setItem(STORAGE_KEYS.EDITION, city);
    } catch {}
  };

  return {
    fontSize,
    setFontSize,
    bookmarks,
    toggleBookmark,
    isBookmarked,
    edition,
    setEdition,
  };
};
