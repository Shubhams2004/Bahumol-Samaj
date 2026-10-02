import React from 'react';
import { ALL_CATEGORIES } from '../../data/categories';
import { Mail, Phone, MapPin, Shield, Award, ExternalLink, Heart } from 'lucide-react';

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
          {/* Col 1 & 2: Branding & Editorial Credo */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2
                onClick={onNavigateHome}
                className="text-3xl font-black font-headline text-white hover:text-red-500 cursor-pointer transition-colors"
              >
                बहुमोल समाज
              </h2>
              <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider font-semibold">
                अग्रगण्य मराठी डिजिटल दैनिक वृत्तपत्र
              </p>
            </div>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-sm">
              ‘बहुमोल समाज’ हे महाराष्ट्रातील जनतेचा निर्भीक आवाज आहे. निष्पक्ष पत्रकारिता, संविधानाची चौकट,
              सत्यशोधन आणि लोकशाही मूल्यांचे रक्षण हेच आमचे मूळ ध्येय आहे.
            </p>

            <div className="pt-2 text-xs text-stone-400 space-y-1.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>मुख्य कार्यालय: ५४०, सदाशिव पेठ, पुणे - ४११०३०</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>+९१ २० २३४५ ६७८९ / ९८७६५ ४३२१०</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>contact@bahumolsamaj.com</span>
              </div>
            </div>
          </div>

          {/* Col 3: News Categories */}
          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4 border-b border-stone-800 pb-2 font-serif">
              बातम्या विभाग
            </h3>
            <ul className="space-y-2 text-xs">
              {ALL_CATEGORIES.slice(0, 6).map((cat) => (
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

          {/* Col 4: More Categories & Features */}
          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4 border-b border-stone-800 pb-2 font-serif">
              विशेष दालने
            </h3>
            <ul className="space-y-2 text-xs">
              {ALL_CATEGORIES.slice(6).map((cat) => (
                <li key={cat.slug}>
                  <button
                    onClick={() => onSelectCategory(cat.slug)}
                    className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                  >
                    {cat.nameMarathi} ({cat.nameEnglish})
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={onNavigateEpaper}
                  className="text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
                >
                  डिजिटल ई-पेपर आवृत्ती
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Editorial Governance & Trust */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider border-b border-stone-800 pb-2 font-serif">
              संपादकीय मंडळ
            </h3>
            <div className="text-xs space-y-2 text-stone-400">
              <p>
                <strong className="text-stone-200 block">मुख्य संपादक:</strong>
                भास्करराव मोहिते
              </p>
              <p>
                <strong className="text-stone-200 block">निवासी संपादक (पुणे):</strong>
                आनंद जोशी
              </p>
              <p>
                <strong className="text-stone-200 block">ब्युरो चीफ (मुंबई):</strong>
                संजय कुलकर्णी
              </p>
              <div className="pt-2">
                <button
                  onClick={onNavigateContact}
                  className="w-full py-2 px-3 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-bold text-center transition-colors cursor-pointer"
                >
                  बातमी पाठवा / संपर्क
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
            <p>© २०२६ बहुमोल समाज माध्यम समूह (Bahumol Samaj Media Group). सर्व हक्क सुरक्षित.</p>
            <p className="text-[10px] text-stone-600 mt-0.5">
              RNI नोंदणी क्र. MAHMAR/2024/88921 | डिजिटल न्यूज पब्लिशर
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <button onClick={onNavigateAbout} className="hover:text-stone-300">
              आमच्याबद्दल
            </button>
            <span>•</span>
            <button onClick={onNavigateContact} className="hover:text-stone-300">
              संपादकीय संपर्क
            </button>
            <span>•</span>
            <button onClick={onNavigateAbout} className="hover:text-stone-300">
              गोपनीयता धोरण (Privacy)
            </button>
            <span>•</span>
            <button onClick={onNavigateAbout} className="hover:text-stone-300">
              नियम व अटी (Terms)
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
