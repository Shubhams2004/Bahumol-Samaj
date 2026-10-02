import React, { useState } from 'react';
import { ALL_CATEGORIES } from '../../data/categories';
import { CURRENT_WEEKLY_EDITION } from '../../data/editionData';
import { toMarathiDigits } from '../../utils/dateFormatter';
import { FontSizeOption } from '../../utils/readingPreferences';
import { ThemeMode } from '../../types/news';
import {
  Search,
  Bookmark,
  FileText,
  Menu,
  X,
  Sun,
  Moon,
  Info,
  PhoneCall,
  Calendar,
  PenTool,
} from 'lucide-react';

interface TopHeaderProps {
  currentCategorySlug?: string;
  onSelectCategory: (slug: string) => void;
  onOpenSearch: () => void;
  onNavigateHome: () => void;
  onNavigateBookmarks: () => void;
  onNavigateEpaper: () => void;
  onNavigateAbout: () => void;
  onNavigateContact: () => void;
  fontSize: FontSizeOption;
  onChangeFontSize: (size: FontSizeOption) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  bookmarksCount: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentCategorySlug,
  onSelectCategory,
  onOpenSearch,
  onNavigateHome,
  onNavigateBookmarks,
  onNavigateEpaper,
  onNavigateAbout,
  onNavigateContact,
  fontSize,
  onChangeFontSize,
  theme,
  onToggleTheme,
  bookmarksCount,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCategoryClick = (slug: string) => {
    onSelectCategory(slug);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="w-full bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-700 sticky top-0 z-40 transition-colors">
      {/* 1. Top Utility Strip (Newspaper Issue & Metadata Bar) */}
      <div className="bg-stone-900 text-stone-200 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1">
          {/* Left: Weekly Edition Details */}
          <div className="flex items-center gap-2 sm:gap-4 font-sans text-[11px] sm:text-xs">
            <span className="font-semibold text-amber-300 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" />
              {CURRENT_WEEKLY_EDITION.fullDateLabel}
            </span>
            <span className="hidden md:inline text-stone-500">|</span>
            <span className="hidden md:inline text-stone-300">
              RNI नोंदणी क्र. {CURRENT_WEEKLY_EDITION.rniRegistration}
            </span>
          </div>

          {/* Right: Chief Editor Byline, Theme Switch, Font Adjuster, e-Paper, Bookmarks */}
          <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-sans">
            {/* Chief Editor Pill / Notice */}
            <span className="hidden lg:inline text-stone-300 font-medium">
              मुख्य संपादक: <strong className="text-white">{CURRENT_WEEKLY_EDITION.editorInChief}</strong>
            </span>

            {/* Dark / Light Mode Switch */}
            <button
              onClick={onToggleTheme}
              className="p-1 rounded text-stone-300 hover:text-white hover:bg-stone-800 cursor-pointer transition-colors"
              title={theme === 'dark' ? 'लाईट मोड सुरू करा' : 'डार्क मोड सुरू करा'}
              aria-label="थीम बदला"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-stone-300" />
              )}
            </button>

            {/* Font Adjuster */}
            <div className="flex items-center gap-0.5 border border-stone-700 rounded px-1 py-0.5 bg-stone-800">
              <span className="text-[10px] text-stone-400 mr-1 hidden sm:inline">फॉन्ट:</span>
              <button
                onClick={() => onChangeFontSize('sm')}
                className={`px-1 rounded text-[11px] font-bold cursor-pointer ${
                  fontSize === 'sm' ? 'bg-red-700 text-white' : 'text-stone-300 hover:text-white'
                }`}
                title="लहान फॉन्ट"
              >
                अ-
              </button>
              <button
                onClick={() => onChangeFontSize('md')}
                className={`px-1 rounded text-[11px] font-bold cursor-pointer ${
                  fontSize === 'md' ? 'bg-red-700 text-white' : 'text-stone-300 hover:text-white'
                }`}
                title="मध्यम फॉन्ट"
              >
                अ
              </button>
              <button
                onClick={() => onChangeFontSize('lg')}
                className={`px-1 rounded text-[11px] font-bold cursor-pointer ${
                  fontSize === 'lg' ? 'bg-red-700 text-white' : 'text-stone-300 hover:text-white'
                }`}
                title="मोठा फॉन्ट"
              >
                अ+
              </button>
            </div>

            {/* e-Paper Link */}
            <button
              onClick={onNavigateEpaper}
              className="flex items-center gap-1 text-amber-300 hover:text-amber-200 font-bold cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ई-पेपर</span>
            </button>

            {/* Bookmarks */}
            <button
              onClick={onNavigateBookmarks}
              className="flex items-center gap-1 text-stone-300 hover:text-white cursor-pointer relative"
              title="जतन केलेल्या बातम्या"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">जतन</span>
              {bookmarksCount > 0 && (
                <span className="bg-red-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {toMarathiDigits(bookmarksCount)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Newspaper Masthead (Authentic Marathi Weekly Broadsheet) */}
      <div className="py-4 sm:py-6 px-4 sm:px-6 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 rounded cursor-pointer"
            aria-label="मेनू उघडा"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Central Newspaper Masthead Title */}
          <div className="text-center flex-1 cursor-pointer" onClick={onNavigateHome}>
            <div className="inline-block">
              {/* Top Sub-masthead line */}
              <div className="flex items-center justify-center gap-3 mb-1">
                <span className="h-px bg-stone-400 dark:bg-stone-600 w-10 sm:w-20 hidden sm:block" />
                <span className="text-[11px] sm:text-xs font-serif font-semibold uppercase tracking-widest text-stone-700 dark:text-stone-300">
                  साप्ताहिक वृत्तपत्र • Weekly Marathi Newspaper
                </span>
                <span className="h-px bg-stone-400 dark:bg-stone-600 w-10 sm:w-20 hidden sm:block" />
              </div>

              {/* Main Masthead Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-headline tracking-tight text-stone-950 dark:text-white hover:text-red-800 dark:hover:text-red-400 transition-colors">
                बहुमोल समाज
              </h1>

              {/* Chief Editor & Credo Bar */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 mt-1.5 text-xs text-stone-600 dark:text-stone-400 font-sans">
                <span className="font-semibold text-red-800 dark:text-red-400 flex items-center gap-1">
                  <PenTool className="w-3 h-3" />
                  मुख्य संपादक: दिलीप सोनाळे
                </span>
                <span className="text-stone-300 dark:text-stone-700">·</span>
                <span className="hidden sm:inline font-medium">
                  {CURRENT_WEEKLY_EDITION.headlineQuote}
                </span>
              </div>
            </div>
          </div>

          {/* Search Trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSearch}
              className="p-2 sm:px-3 sm:py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-md border border-stone-300 dark:border-stone-700 flex items-center gap-2 text-xs font-semibold cursor-pointer transition-colors"
              title="शोध"
            >
              <Search className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              <span className="hidden sm:inline">शोध (Search)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Category Navigation Bar (All 10 Weekly Sections) */}
      <nav className="hidden lg:block bg-stone-100 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <ul className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            <li>
              <button
                onClick={onNavigateHome}
                className={`px-3 py-2 text-sm font-bold font-sans cursor-pointer transition-colors border-b-2 ${
                  !currentCategorySlug
                    ? 'border-red-700 text-red-700 dark:text-red-400 dark:border-red-400'
                    : 'border-transparent text-stone-800 dark:text-stone-200 hover:text-red-700 dark:hover:text-red-400'
                }`}
              >
                मुख्यपृष्ठ
              </button>
            </li>
            {ALL_CATEGORIES.map((cat) => {
              const isActive = currentCategorySlug === cat.slug;
              return (
                <li key={cat.slug}>
                  <button
                    onClick={() => handleCategoryClick(cat.slug)}
                    className={`px-2.5 py-2 text-sm font-bold font-sans cursor-pointer whitespace-nowrap transition-colors border-b-2 ${
                      isActive
                        ? 'border-red-700 text-red-700 dark:text-red-400 dark:border-red-400'
                        : 'border-transparent text-stone-800 dark:text-stone-200 hover:text-red-700 dark:hover:text-red-400'
                    }`}
                  >
                    {cat.nameMarathi}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3 text-xs font-sans text-stone-600 dark:text-stone-400 pl-4 border-l border-stone-300 dark:border-stone-700 shrink-0">
            <button
              onClick={onNavigateAbout}
              className="hover:text-red-700 dark:hover:text-red-400 font-medium cursor-pointer"
            >
              आमच्याबद्दल
            </button>
            <button
              onClick={onNavigateContact}
              className="hover:text-red-700 dark:hover:text-red-400 font-medium cursor-pointer"
            >
              संपर्क
            </button>
          </div>
        </div>
      </nav>

      {/* 4. Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-stone-900 border-b border-stone-300 dark:border-stone-700 px-4 py-4 max-h-[80vh] overflow-y-auto font-sans shadow-xl">
          <div className="mb-4 pb-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              साप्ताहिक विभाग (Sections)
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-stone-500 hover:text-stone-800 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => {
                onNavigateHome();
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-stone-700 text-left rounded font-bold text-sm text-stone-900 dark:text-stone-100 cursor-pointer"
            >
              मुख्यपृष्ठ
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryClick(cat.slug)}
                className="p-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-stone-700 text-left rounded font-bold text-sm text-stone-900 dark:text-stone-100 cursor-pointer"
              >
                {cat.nameMarathi}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <div className="p-2 bg-stone-50 dark:bg-stone-800/60 rounded text-[11px] text-stone-600 dark:text-stone-400 mb-2">
              मुख्य संपादक: <strong className="text-stone-900 dark:text-white">दिलीप सोनाळे</strong>
            </div>
            <button
              onClick={() => {
                onNavigateEpaper();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-left"
            >
              <FileText className="w-4 h-4 text-red-700 dark:text-red-400" />
              <span>साप्ताहिक ई-पेपर आवृत्ती</span>
            </button>
            <button
              onClick={() => {
                onNavigateAbout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-left"
            >
              <Info className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              <span>आमच्याबद्दल व संपादकीय भूमिका</span>
            </button>
            <button
              onClick={() => {
                onNavigateContact();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-left"
            >
              <PhoneCall className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              <span>कार्यालय संपर्क व बातमी पाठवा</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
