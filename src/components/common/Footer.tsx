import React from 'react';
import { ALL_CATEGORIES } from '../../data/categories';
import { CURRENT_WEEKLY_EDITION, EDITORIAL_TEAM } from '../../data/editionData';
import { Mail, Phone, MapPin, PenTool } from 'lucide-react';

interface FooterProps {
  onSelectCategory: (slug: string) => void;
  onNavigateHome: () => void;
  onNavigateAbout: () => void;
  onNavigateContact: () => void;
  onNavigateEpaper: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onNavigateHome,
  onNavigateAbout,
  onNavigateContact,
  onNavigateEpaper,
}) => {
  return (
    <footer className="bg-stone-950 text-stone-300 font-sans border-t-4 border-red-700">
      {/* 1. Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1 & 2: Masthead, Weekly Identity & Chief Editor */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2
                onClick={onNavigateHome}
                className="text-3xl font-black font-headline text-white hover:text-red-400 cursor-pointer transition-colors"
              >
                बहुमोल समाज
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-amber-300 font-serif">
                <span>साप्ताहिक वृत्तपत्र (Weekly Newspaper)</span>
                <span>·</span>
                <span>स्थापना {CURRENT_WEEKLY_EDITION.establishedYear}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-sm">
              ‘बहुमोल समाज’ हे महाराष्ट्रातील जनतेचा निर्भीक आणि सडेतोड साप्ताहिक आवाज आहे.
              सत्यशोधक परंपरा, लोकशाही मूल्यांचे रक्षण आणि सामाजिक न्यायासाठी निरंतर कटिबद्ध.
            </p>

            <div className="p-3 bg-stone-900 rounded border border-stone-800 text-xs space-y-1">
              <div className="flex items-center gap-2 text-stone-200 font-bold">
                <PenTool className="w-3.5 h-3.5 text-red-500" />
                <span>मुख्य संपादक: {CURRENT_WEEKLY_EDITION.editorInChief}</span>
              </div>
              <p className="text-stone-400 text-[11px]">
                RNI नोंदणी क्र. {CURRENT_WEEKLY_EDITION.rniRegistration}
              </p>
            </div>

            <div className="pt-1 text-xs text-stone-400 space-y-1.5">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <span>{EDITORIAL_TEAM.headOffice.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{EDITORIAL_TEAM.headOffice.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{EDITORIAL_TEAM.headOffice.email}</span>
              </div>
            </div>
          </div>

          {/* Col 3: Sections (1-5) */}
          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4 border-b border-stone-800 pb-2 font-serif">
              साप्ताहिक विभाग (१)
            </h3>
            <ul className="space-y-2 text-xs">
              {ALL_CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.slug}>
                  <button
                    onClick={() => onSelectCategory(cat.slug)}
                    className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                  >
                    {cat.nameMarathi} ({cat.nameEnglish})
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Sections (6-10) */}
          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4 border-b border-stone-800 pb-2 font-serif">
              साप्ताहिक विभाग (२)
            </h3>
            <ul className="space-y-2 text-xs">
              {ALL_CATEGORIES.slice(5).map((cat) => (
                <li key={cat.slug}>
                  <button
                    onClick={() => onSelectCategory(cat.slug)}
                    className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                  >
                    {cat.nameMarathi} ({cat.nameEnglish})
                  </button>
                </li>
              ))}
              <li className="pt-2">
                <button
                  onClick={onNavigateEpaper}
                  className="text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
                >
                  साप्ताहिक ई-पेपर अंक &rarr;
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Editorial Leadership & Contact Desk */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider border-b border-stone-800 pb-2 font-serif">
              संपादकीय मंडळ
            </h3>
            <div className="text-xs space-y-2 text-stone-400">
              <p>
                <strong className="text-stone-200 block">मुख्य संपादक:</strong>
                दिलीप सोनाळे
              </p>
              <p>
                <strong className="text-stone-200 block">निवासी संपादक (पश्चिम महाराष्ट्र):</strong>
                आनंद जोशी
              </p>
              <p>
                <strong className="text-stone-200 block">विशेष प्रतिनिधी (मंत्रालय ब्युरो):</strong>
                संजय कुलकर्णी
              </p>
              <div className="pt-2">
                <button
                  onClick={onNavigateContact}
                  className="w-full py-2 px-3 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-bold text-center transition-colors cursor-pointer"
                >
                  बातमी पाठवा / जाहिरात संपर्क
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bottom Copyright & Legal Strip */}
      <div className="bg-black py-4 px-4 sm:px-6 text-[11px] text-stone-500 border-t border-stone-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p>© २०२६ बहुमोल समाज साप्ताहिक वृत्तपत्र. सर्व हक्क सुरक्षित.</p>
            <p className="text-[10px] text-stone-600 mt-0.5">
              RNI नोंदणी क्र. {CURRENT_WEEKLY_EDITION.rniRegistration} | मुख्य संपादक: {CURRENT_WEEKLY_EDITION.editorInChief}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <button onClick={onNavigateAbout} className="hover:text-stone-300 cursor-pointer">
              आमच्याबद्दल
            </button>
            <span>•</span>
            <button onClick={onNavigateContact} className="hover:text-stone-300 cursor-pointer">
              संपादकीय संपर्क
            </button>
            <span>•</span>
            <button onClick={onNavigateAbout} className="hover:text-stone-300 cursor-pointer">
              गोपनीयता धोरण
            </button>
            <span>•</span>
            <button onClick={onNavigateAbout} className="hover:text-stone-300 cursor-pointer">
              नियम व अटी
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
