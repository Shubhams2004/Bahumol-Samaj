import React from 'react';
import { ALL_CATEGORIES } from '../../data/categories';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  ShieldCheck,
  Award,
  Globe,
  Share2,
} from 'lucide-react';

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
    <footer className="bg-stone-900 text-stone-300 border-t-4 border-red-700 font-sans">
      {/* 1. News Tip / WhatsApp Newsletter Banner */}
      <div className="bg-stone-950 border-b border-stone-800 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-700/20 text-red-500 flex items-center justify-center shrink-0 border border-red-700/40">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-serif">
                तुमच्या परिसरातील बातमी थेट संपादकीय मंडळाला पाठवा
              </h3>
              <p className="text-xs text-stone-400">
                भ्रष्टाचार, नागरी समस्या, यशोगाथा किंवा विशेष वृत्तांत शेअर करण्यासाठी ‘बहुमोल जनसंवाद’
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onNavigateContact}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded transition-colors cursor-pointer shadow-sm"
            >
              बातमी पाठवा (Send News Tip)
            </button>
            <button
              onClick={onNavigateEpaper}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded border border-stone-700 transition-colors cursor-pointer"
            >
              आजचा ई-पेपर
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: About Bahumol Samaj */}
          <div className="space-y-4">
            <div>
              <span
                onClick={onNavigateHome}
                className="text-2xl font-serif font-black text-white tracking-tight cursor-pointer hover:text-red-400 transition-colors"
              >
                बहुमोल समाज
              </span>
              <p className="text-xs text-stone-400 mt-1 font-medium">
                निष्पक्ष, निर्भीक आणि लोककल्याणकारी मराठी डिजिटल दैनिक
              </p>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              महाराष्ट्राच्या मातीतील विचार, सामान्यांचे प्रश्न आणि जागतिक घडामोडींचे अचूक विश्लेषण
              देणारे अग्रगण्य डिजिटल वृत्तपत्र. संविधानाची मूल्ये आणि पत्रकारितेची निष्पक्षता हीच
              आमची ताकद आहे.
            </p>

            <div className="flex items-center gap-2 pt-2 text-stone-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[11px]">प्रेस कौन्सिल ऑफ इंडिया मार्गदर्शक तत्त्वानुसार संचालित</span>
            </div>
          </div>

          {/* Col 2: News Sections */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-serif mb-4 border-b border-stone-800 pb-2">
              वृत्त विभाग (Sections)
            </h4>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => onSelectCategory(cat.slug)}
                  className="text-left text-stone-400 hover:text-white transition-colors cursor-pointer"
                >
                  {cat.nameMarathi}
                </button>
              ))}
            </div>
          </div>

          {/* Col 3: Editorial & Bureau Info */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-serif mb-4 border-b border-stone-800 pb-2">
              संपादकीय मंडळ (Editorial Desk)
            </h4>
            <p className="text-stone-300">
              <span className="font-semibold text-white">मुख्य संपादक:</span> भास्करराव मोहिते
            </p>
            <p className="text-stone-300">
              <span className="font-semibold text-white">निवासी संपादक (पुणे):</span> आनंद जोशी
            </p>
            <p className="text-stone-300">
              <span className="font-semibold text-white">ब्युरो चीफ (मुंबई):</span> संजय कुलकर्णी
            </p>

            <div className="pt-2 border-t border-stone-800 space-y-1.5 text-stone-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                <span>संपादकीय कार्यालय: ५४०, सदाशिव पेठ, कुमठेकर रस्ता, पुणे - ४११०३०</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>+९१ २० २३४५ ६७८९ / ९८७६५ ४३२१०</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>editor@bahumolsamaj.com</span>
              </div>
            </div>
          </div>

          {/* Col 4: Important Links & Social Networks */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-serif mb-4 border-b border-stone-800 pb-2">
              महत्त्वाचे दुवे व धोरणे
            </h4>
            <div className="flex flex-col space-y-2 text-xs text-stone-400">
              <button onClick={onNavigateAbout} className="text-left hover:text-white cursor-pointer">
                आमच्याबद्दल (About Us)
              </button>
              <button onClick={onNavigateContact} className="text-left hover:text-white cursor-pointer">
                संपर्क व जाहिरात दरपत्रक (Contact & Ads)
              </button>
              <button onClick={onNavigateAbout} className="text-left hover:text-white cursor-pointer">
                संपादकीय आचारसंहिता (Editorial Guidelines)
              </button>
              <button onClick={onNavigateAbout} className="text-left hover:text-white cursor-pointer">
                गोपनीयता धोरण (Privacy Policy)
              </button>
              <button onClick={onNavigateAbout} className="text-left hover:text-white cursor-pointer">
                वापरण्याचे नियम व अटी (Terms of Service)
              </button>
            </div>

            {/* Social channels */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-stone-300 block mb-2">आमच्याशी जोडा:</span>
              <div className="flex items-center gap-2 text-xs">
                <a
                  href="https://whatsapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-stone-800 hover:bg-emerald-700 hover:text-white rounded text-stone-300 transition-colors"
                >
                  व्हॉट्सॲप
                </a>
                <a
                  href="https://telegram.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-stone-800 hover:bg-sky-600 hover:text-white rounded text-stone-300 transition-colors"
                >
                  टेलिग्राम
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-stone-800 hover:bg-blue-700 hover:text-white rounded text-stone-300 transition-colors"
                >
                  फेसबुक
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 hover:text-white rounded text-stone-300 transition-colors"
                >
                  X (ट्विटर)
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Copyright Bar */}
      <div className="bg-stone-950 border-t border-stone-800 text-[11px] text-stone-500 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>© २०२६ बहुमोल समाज माध्यम समूह (Bahumol Samaj Media Group). सर्व हक्क सुरक्षित.</p>
          <p>
            वेब डिझाईन व तंत्रज्ञान: <span className="text-stone-400">बहुमोल डिजिटल नेटवर्क</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
