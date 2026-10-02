import { useState, useEffect } from 'react';
import { EditionCity, ThemeMode } from '../types/news';

export type FontSizeOption = 'sm' | 'md' | 'lg';

const STORAGE_KEYS = {
  FONT_SIZE: 'bahumol_font_size',
  BOOKMARKS: 'bahumol_bookmarks',
  EDITION: 'bahumol_edition',
  THEME: 'bahumol_theme',
};

export const useReadingPreferences = () => {
  const [fontSize, setFontSizeState] = useState<FontSizeOption>('md');
  const [bookmarks, setBookmarksState] = useState<string[]>([]);
  const [edition, setEditionState] = useState<EditionCity>('पुणे');
  const [theme, setThemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode;
      if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
        setThemeState(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          setThemeState('dark');
          document.documentElement.classList.add('dark');
        }
      }

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

  const toggleTheme = () => {
    const newTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  };

  const setFontSize = (size: FontSizeOption) => {
    setFontSizeState(size);
    try {
      localStorage.setItem(STORAGE_KEYS.FONT_SIZE, size);
    } catch {}
  };

  const toggleBookmark = (articleIdOrSlug: string) => {
    setBookmarksState((prev) => {
      const exists = prev.includes(articleIdOrSlug);
      const updated = exists
        ? prev.filter((id) => id !== articleIdOrSlug)
        : [...prev, articleIdOrSlug];
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const isBookmarked = (articleIdOrSlug: string): boolean => {
    return bookmarks.includes(articleIdOrSlug);
  };

  const setEdition = (city: EditionCity) => {
    setEditionState(city);
    try {
      localStorage.setItem(STORAGE_KEYS.EDITION, city);
    } catch {}
  };

  return {
    theme,
    toggleTheme,
    fontSize,
    setFontSize,
    bookmarks,
    toggleBookmark,
    isBookmarked,
    edition,
    setEdition,
  };
};
