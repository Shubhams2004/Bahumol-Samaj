import React, { useState } from 'react';
import { ALL_CATEGORIES } from '../../data/categories';
import { getMarathiCurrentDate } from '../../utils/dateFormatter';
import { FontSizeOption } from '../../utils/readingPreferences';
import { EditionCity } from '../../types/news';
import {
  Search,
  Menu,
  X,
  Bookmark,
  FileText,
  CloudSun,
  ChevronDown,
  Share2,
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

const CITY_WEATHER: Record<EditionCity, { temp: string; condition: string }> = {
  मुंबई: { temp: '३१°C', condition: 'निरभ्र' },
  पुणे: { temp: '२८°C', condition: 'आल्हाददायक' },
  नागपूर: { temp: '३३°C', condition: 'उबदार' },
  नाशिक: { temp: '२७°C', condition: 'थंड हवा' },
  'छत्रपती संभाजीनगर': { temp: '३०°C', condition: 'निरभ्र' },
};

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<EditionCity>('मुंबई');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const { formattedDate, tithiInfo } = getMarathiCurrentDate();
  const weather = CITY_WEATHER[selectedCity];

  return (
    <header className="bg-white border-b border-stone-300 relative z-30 select-none">
      {/* 1. Top Utility Strip */}
      <div className="bg-stone-100 border-b border-stone-200 text-stone-700 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2">
          {/* Date, Panchang & City Weather */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
            <span className="font-medium text-stone-800">{formattedDate}</span>
            <span className="hidden md:inline text-stone-400">|</span>
            <span className="hidden md:inline text-stone-600">{tithiInfo}</span>
            <span className="hidden sm:inline text-stone-400">|</span>

            {/* Edition City Selector */}
            <div className="relative inline-block">
              <button
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center gap-1 text-stone-700 hover:text-red-700 font-medium cursor-pointer"
                title="आवृत्ती बदला"
              >
                <span>आवृत्ती: {selectedCity}</span>
                <ChevronDown className="w-3 h-3 text-stone-500" />
              </button>

              {cityDropdownOpen && (
                <div className="absolute left-0 mt-1 w-44 bg-white border border-stone-200 rounded shadow-lg py-1 z-50">
                  {(Object.keys(CITY_WEATHER) as EditionCity[]).map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setCityDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-stone-100 flex items-center justify-between ${
                        selectedCity === city ? 'font-bold text-red-700 bg-red-50' : 'text-stone-800'
                      }`}
                    >
                      <span>{city}</span>
                      <span className="text-[10px] text-stone-500">{CITY_WEATHER[city].temp}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Live Weather */}
            <div className="hidden lg:flex items-center gap-1 text-stone-600 font-sans">
              <CloudSun className="w-3.5 h-3.5 text-amber-600" />
              <span>{weather.temp}</span>
              <span className="text-stone-400">({weather.condition})</span>
            </div>
          </div>

          {/* Right Utility: Font Sizer, Bookmarks, ePaper */}
          <div className="flex items-center gap-3">
            {/* Font Resizer */}
            <div className="flex items-center gap-1 border border-stone-300 rounded px-1.5 py-0.5 bg-white">
              <span className="text-[11px] text-stone-500 mr-1 hidden sm:inline">फॉन्ट:</span>
              <button
                onClick={() => onChangeFontSize('sm')}
                className={`px-1 rounded text-[11px] font-bold ${fontSize === 'sm' ? 'bg-red-700 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                title="लहान अक्षर"
              >
                अ-
              </button>
              <button
                onClick={() => onChangeFontSize('md')}
                className={`px-1 rounded text-xs font-bold ${fontSize === 'md' ? 'bg-red-700 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                title="मध्यम अक्षर"
              >
                अ
              </button>
              <button
                onClick={() => onChangeFontSize('lg')}
                className={`px-1 rounded text-sm font-bold ${fontSize === 'lg' ? 'bg-red-700 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                title="मोठे अक्षर"
              >
                अ+
              </button>
            </div>

            {/* Saved Articles */}
            <button
              onClick={onNavigateBookmarks}
              className="flex items-center gap-1 text-stone-700 hover:text-red-700 font-medium cursor-pointer"
              title="जतन केलेल्या बातम्या"
            >
              <Bookmark className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">जतन</span>
              {bookmarksCount > 0 && (
                <span className="bg-red-700 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full font-sans">
                  {bookmarksCount}
                </span>
              )}
            </button>

            {/* ePaper link */}
            <button
              onClick={onNavigateEpaper}
              className="flex items-center gap-1 text-red-700 hover:text-red-800 font-bold cursor-pointer border-l border-stone-300 pl-3"
              title="ई-पेपर वाचा"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ई-पेपर</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Newspaper Broadsheet Masthead */}
      <div className="py-4 sm:py-6 px-4 sm:px-6 border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Corner Marker */}
          <div className="hidden md:flex flex-col text-left text-xs text-stone-500 w-1/4">
            <span className="font-semibold text-stone-700">महाराष्ट्र आवृत्ती</span>
            <span>RNI क्र.: MAHMAR/2024/88921</span>
            <span>पुणे • मुंबई • नागपूर • संभाजीनगर</span>
          </div>

          {/* Central Newspaper Masthead Title */}
          <div className="text-center cursor-pointer group flex-1" onClick={onNavigateHome}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-stone-900 group-hover:text-red-800 transition-colors font-serif leading-none">
              बहुमोल समाज
            </h1>
            <p className="mt-2 text-xs sm:text-sm font-medium tracking-wide text-stone-600 font-sans">
              निष्पक्ष • निर्भीक • जनहितैषी मराठी डिजिटल दैनिक
            </p>
          </div>

          {/* Right Corner Information / Digital QR or Motto */}
          <div className="hidden md:flex flex-col items-end text-right text-xs text-stone-500 w-1/4">
            <span className="font-semibold text-stone-800">सत्य, शोध आणि लोकजागर</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="text-emerald-700 font-medium">२४x७ डिजिटल अपडेट्स</span>
            </div>
            <span className="text-[11px] text-stone-400 mt-0.5">वेबसाइट: bahumolsamaj.com</span>
          </div>
        </div>
      </div>

      {/* 3. Main Navigation Bar (Clean top bar contract) */}
      <div className="bg-stone-900 text-stone-100 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-12">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-stone-200 hover:text-white hover:bg-stone-800 rounded focus:outline-none"
            aria-label="मेनू उघडा"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Home Icon/Title for Mobile */}
          <button
            onClick={onNavigateHome}
            className="md:hidden text-lg font-bold font-serif text-white tracking-wide"
          >
            बहुमोल समाज
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={onNavigateHome}
              className={`px-3 py-1.5 text-sm font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
                !currentCategorySlug
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-stone-200 hover:text-white hover:bg-stone-800'
              }`}
            >
              मुख्यपृष्ठ
            </button>

            {ALL_CATEGORIES.map((cat) => {
              const isActive = currentCategorySlug === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => onSelectCategory(cat.slug)}
                  className={`px-2.5 lg:px-3 py-1.5 text-sm font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-red-700 text-white font-semibold shadow-sm'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  {cat.nameMarathi}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons: Search & Share */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-stone-200 hover:text-white hover:bg-stone-800 rounded transition-colors cursor-pointer"
              title="बातमी शोधा"
              aria-label="बातमी शोधा"
            >
              <Search className="w-4 h-4 text-stone-300" />
              <span className="hidden xl:inline text-stone-400">शोधा...</span>
            </button>

            <button
              onClick={onNavigateEpaper}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-stone-950 rounded transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ई-आवृत्ती</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-900/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
              <div>
                <span className="font-serif text-xl font-bold tracking-tight">बहुमोल समाज</span>
                <p className="text-[11px] text-stone-400">मराठी डिजिटल वृत्तपत्र</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded"
                aria-label="मेनू बंद करा"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions in Mobile Drawer */}
            <div className="p-3 bg-stone-100 border-b border-stone-200 grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSearch();
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-stone-300 rounded font-medium text-stone-800"
              >
                <Search className="w-3.5 h-3.5 text-stone-600" />
                <span>बातमी शोधा</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateBookmarks();
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-stone-300 rounded font-medium text-stone-800"
              >
                <Bookmark className="w-3.5 h-3.5 text-stone-600" />
                <span>जतन ({bookmarksCount})</span>
              </button>
            </div>

            {/* Category Navigation Links */}
            <div className="py-2 flex-1">
              <div className="px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wider">
                वृत्त विभाग
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateHome();
                }}
                className={`w-full text-left px-5 py-3 text-sm font-medium border-b border-stone-100 flex items-center justify-between ${
                  !currentCategorySlug ? 'text-red-700 font-bold bg-red-50' : 'text-stone-800'
                }`}
              >
                <span>मुख्यपृष्ठ (Home)</span>
              </button>

              {ALL_CATEGORIES.map((cat) => {
                const isActive = currentCategorySlug === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSelectCategory(cat.slug);
                    }}
                    className={`w-full text-left px-5 py-3 text-sm font-medium border-b border-stone-100 flex items-center justify-between ${
                      isActive ? 'text-red-700 font-bold bg-red-50' : 'text-stone-800'
                    }`}
                  >
                    <span>{cat.nameMarathi}</span>
                    <span className="text-xs text-stone-400 font-sans">{cat.nameEnglish}</span>
                  </button>
                );
              })}
            </div>

            {/* Static pages link & Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 text-xs text-stone-600 space-y-2">
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateAbout();
                  }}
                  className="hover:text-red-700"
                >
                  आमच्याबद्दल
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateContact();
                  }}
                  className="hover:text-red-700"
                >
                  संपर्क व जाहिरात
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateEpaper();
                  }}
                  className="hover:text-red-700"
                >
                  ई-पेपर
                </button>
              </div>
              <p className="text-[11px] text-stone-400 pt-2 border-t border-stone-200">
                © २०२६ बहुमोल समाज. सर्व हक्क सुरक्षित.
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
