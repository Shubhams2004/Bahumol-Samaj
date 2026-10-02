import React, { useState } from 'react';
import { ALL_CATEGORIES } from '../../data/categories';
import { getMarathiCurrentDate, toMarathiDigits } from '../../utils/dateFormatter';
import { FontSizeOption } from '../../utils/readingPreferences';
import { EditionCity } from '../../types/news';
import {
  Search,
  Bookmark,
  FileText,
  Menu,
  X,
  Sun,
  MapPin,
  ChevronDown,
  Info,
  PhoneCall,
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
  bookmarksCount,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<EditionCity>('पुणे');
  const { formattedDate, tithiInfo } = getMarathiCurrentDate();

  const cities: EditionCity[] = ['पुणे', 'मुंबई', 'नागपूर', 'नाशिक', 'छत्रपती संभाजीनगर'];

  const handleCategoryClick = (slug: string) => {
    onSelectCategory(slug);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="w-full bg-white border-b-2 border-stone-900 sticky top-0 z-40 shadow-xs">
      {/* 1. Topmost Utility Bar */}
      <div className="bg-stone-900 text-stone-200 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1">
          {/* Left: Date & Panchang */}
          <div className="flex items-center gap-2 sm:gap-4 font-sans text-[11px] sm:text-xs">
            <span className="font-semibold text-white">{formattedDate}</span>
            <span className="hidden md:inline text-stone-400">|</span>
            <span className="hidden md:inline text-amber-300 font-medium">{tithiInfo}</span>
          </div>

          {/* Right: Weather, City Edition, Font Size Adjuster, e-Paper */}
          <div className="flex items-center gap-3 sm:gap-5 text-[11px] sm:text-xs font-sans">
            {/* Live Weather */}
            <div className="hidden lg:flex items-center gap-1.5 text-stone-300">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>{selectedCity} २८° से.</span>
            </div>

            {/* Edition Switcher */}
            <div className="relative flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-500" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value as EditionCity)}
                className="bg-stone-800 text-stone-100 text-[11px] rounded px-1.5 py-0.5 border border-stone-700 cursor-pointer focus:outline-none"
                aria-label="आवृत्ती निवडा"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city} आवृत्ती
                  </option>
                ))}
              </select>
            </div>

            {/* Senior/Reading Font Size Adjuster */}
            <div className="flex items-center gap-0.5 border border-stone-700 rounded px-1 py-0.5 bg-stone-800">
              <span className="text-[10px] text-stone-400 mr-1 hidden sm:inline">फॉन्ट:</span>
              <button
                onClick={() => onChangeFontSize('sm')}
                className={`px-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  fontSize === 'sm' ? 'bg-red-700 text-white' : 'text-stone-300 hover:text-white'
                }`}
                title="लहान फॉन्ट"
              >
                अ-
              </button>
              <button
                onClick={() => onChangeFontSize('md')}
                className={`px-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  fontSize === 'md' ? 'bg-red-700 text-white' : 'text-stone-300 hover:text-white'
                }`}
                title="मध्यम फॉन्ट"
              >
                अ
              </button>
              <button
                onClick={() => onChangeFontSize('lg')}
                className={`px-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
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

            {/* Bookmarks Link */}
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

      {/* 2. Main Newspaper Masthead */}
      <div className="py-4 sm:py-6 px-4 sm:px-6 border-b border-stone-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-stone-800 hover:bg-stone-100 rounded cursor-pointer"
            aria-label="मेनू उघडा"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Central Newspaper Masthead Title */}
          <div className="text-center flex-1 cursor-pointer" onClick={onNavigateHome}>
            <div className="inline-block">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-headline tracking-tight text-stone-950 hover:text-red-800 transition-colors">
                बहुमोल समाज
              </h1>
              <div className="flex items-center justify-center gap-2 mt-1 sm:mt-1.5">
                <span className="h-px bg-stone-300 w-8 sm:w-16 hidden sm:block" />
                <p className="text-[10px] sm:text-xs text-stone-600 font-sans tracking-wide uppercase font-semibold">
                  निष्पक्ष • निर्भीक • जनहितैषी मराठी डिजिटल दैनिक
                </p>
                <span className="h-px bg-stone-300 w-8 sm:w-16 hidden sm:block" />
              </div>
            </div>
          </div>

          {/* Search Trigger (Desktop & Mobile) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSearch}
              className="p-2 sm:px-3 sm:py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md border border-stone-300 flex items-center gap-2 text-xs font-semibold cursor-pointer transition-colors"
              title="शोध"
            >
              <Search className="w-4 h-4 text-stone-600" />
              <span className="hidden sm:inline">शोध (Search)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Category Navigation Bar (Desktop) */}
      <nav className="hidden lg:block bg-stone-50 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <ul className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            <li>
              <button
                onClick={onNavigateHome}
                className={`px-3 py-2 text-sm font-bold font-sans cursor-pointer transition-colors border-b-2 ${
                  !currentCategorySlug
                    ? 'border-red-700 text-red-700'
                    : 'border-transparent text-stone-800 hover:text-red-700'
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
                    className={`px-3 py-2 text-sm font-bold font-sans cursor-pointer whitespace-nowrap transition-colors border-b-2 ${
                      isActive
                        ? 'border-red-700 text-red-700'
                        : 'border-transparent text-stone-800 hover:text-red-700'
                    }`}
                  >
                    {cat.nameMarathi}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3 text-xs font-sans text-stone-600 pl-4 border-l border-stone-200">
            <button
              onClick={onNavigateAbout}
              className="hover:text-red-700 font-medium cursor-pointer"
            >
              आमच्याबद्दल
            </button>
            <button
              onClick={onNavigateContact}
              className="hover:text-red-700 font-medium cursor-pointer"
            >
              संपर्क
            </button>
          </div>
        </div>
      </nav>

      {/* 4. Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-stone-300 px-4 py-4 max-h-[80vh] overflow-y-auto font-sans shadow-lg animate-in fade-in duration-200">
          <div className="mb-4 pb-3 border-b border-stone-200 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              बातम्या विभाग (Categories)
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-stone-500 hover:text-stone-800"
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
              className="p-2.5 bg-stone-50 hover:bg-red-50 text-left rounded font-bold text-sm text-stone-900 cursor-pointer"
            >
              मुख्यपृष्ठ
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryClick(cat.slug)}
                className="p-2.5 bg-stone-50 hover:bg-red-50 text-left rounded font-bold text-sm text-stone-900 cursor-pointer"
              >
                {cat.nameMarathi}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-200 space-y-2 text-xs font-semibold text-stone-700">
            <button
              onClick={() => {
                onNavigateEpaper();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 p-2 hover:bg-stone-100 rounded text-left"
            >
              <FileText className="w-4 h-4 text-red-700" />
              <span>डिजिटल ई-पेपर आवृत्ती</span>
            </button>
            <button
              onClick={() => {
                onNavigateAbout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 p-2 hover:bg-stone-100 rounded text-left"
            >
              <Info className="w-4 h-4 text-stone-600" />
              <span>आमच्याबद्दल व संपादकीय मंडळ</span>
            </button>
            <button
              onClick={() => {
                onNavigateContact();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 p-2 hover:bg-stone-100 rounded text-left"
            >
              <PhoneCall className="w-4 h-4 text-stone-600" />
              <span>कार्यालय संपर्क व बातमी पाठवा</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
