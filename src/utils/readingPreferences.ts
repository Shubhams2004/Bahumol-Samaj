import { useState, useEffect } from 'react';

export type FontSizeOption = 'sm' | 'md' | 'lg';

const FONT_SIZE_KEY = 'bahumol_font_size';
const BOOKMARKS_KEY = 'bahumol_bookmarks';

export const getSavedFontSize = (): FontSizeOption => {
  try {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    if (saved === 'sm' || saved === 'md' || saved === 'lg') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'md';
};

export const setSavedFontSize = (size: FontSizeOption) => {
  try {
    localStorage.setItem(FONT_SIZE_KEY, size);
  } catch {
    // ignore
  }
};

export const getSavedBookmarks = (): string[] => {
  try {
    const saved = localStorage.getItem(BOOKMARKS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const toggleBookmarkInStorage = (articleId: string): boolean => {
  try {
    const current = getSavedBookmarks();
    const exists = current.includes(articleId);
    const updated = exists ? current.filter((id) => id !== articleId) : [...current, articleId];
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    return !exists;
  } catch {
    return false;
  }
};

export const useReadingPreferences = () => {
  const [fontSize, setFontSizeState] = useState<FontSizeOption>(getSavedFontSize);
  const [bookmarks, setBookmarks] = useState<string[]>(getSavedBookmarks);

  const setFontSize = (size: FontSizeOption) => {
    setFontSizeState(size);
    setSavedFontSize(size);
  };

  const toggleBookmark = (id: string) => {
    const isNowBookmarked = toggleBookmarkInStorage(id);
    setBookmarks(getSavedBookmarks());
    return isNowBookmarked;
  };

  const isBookmarked = (id: string) => bookmarks.includes(id);

  return {
    fontSize,
    setFontSize,
    bookmarks,
    toggleBookmark,
    isBookmarked,
  };
};
