import React from 'react';
import { CURRENT_WEEKLY_EDITION, EDITORIAL_TEAM } from '../data/editionData';
import { ChevronRight, Shield, CheckCircle, HeartHandshake, Users, BookOpen, PenTool } from 'lucide-react';

interface AboutPageProps {
  onNavigateHome: () => void;
  onNavigateContact: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigateHome, onNavigateContact }) => {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-16 transition-colors">
      {/* Header Banner */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-4 font-sans">
            <button onClick={onNavigateHome} className="hover:text-red-700 dark:hover:text-red-400 cursor-pointer">
              मुख्यपृष्ठ
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-stone-800 dark:text-stone-200">आमच्याबद्दल</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-widest font-serif mb-2">
            <span>साप्ताहिक वृत्तपत्र • मुख्य संपादक: {CURRENT_WEEKLY_EDITION.editorInChief}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black text-stone-900 dark:text-white mb-3 tracking-tight">
            बहुमोल समाज: निष्पक्ष, निर्भीक आणि सडेतोड साप्ताहिक
          </h1>
          <p className="text-base text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
            महाराष्ट्रातील उपेक्षित, शेतकरी, कामगार आणि सुशिक्षित तरुणांच्या न्याय्य हक्कांसाठी निरंतर लढणारा वैचारिक मंच.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 space-y-10">
        {/* Section 1: Introduction & Philosophy */}
        <section className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-red-700 dark:text-red-400" />
            <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-white">
              साप्ताहिक भूमिका व संपादकीय मूल्ये (Our Editorial Vision)
            </h2>
          </div>
          <div className="space-y-4 text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed font-sans">
            <p>
              <strong className="text-stone-900 dark:text-white font-serif">‘बहुमोल समाज’</strong> हे केवळ बातम्यांचे संकलन नसून,
              समाजातील ज्वलंत समस्या, शासकीय धोरणे आणि सामान्य जनतेच्या रोजच्या जगण्यावर प्रकाश टाकणारे
              अग्रगण्य मराठी साप्ताहिक वृत्तपत्र आहे.
            </p>
            <p>
              मुख्य संपादक <strong className="text-stone-900 dark:text-white">दिलीप सोनाळे</strong> यांच्या नेतृत्वाखालील
              संपादकीय चमू कोणत्याही सत्ताधारी, कॉर्पोरेट अथवा वैयक्तिक दबावाला बळी न पडता वस्तुनिष्ठ विश्लेषणावर ठाम राहते.
              छत्रपती शिवाजी महाराज, महात्मा जोतीराव फुले, राजर्षी छत्रपती शाहू महाराज आणि भारतरत्न डॉ. बाबासाहेब आंबेडकर
              यांच्या पुरोगामी सामाजिक विचारांची मशाल तेवत ठेवणे हाच आमचा ध्यास आहे.
            </p>
          </div>
        </section>

        {/* Section 2: Core Values Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="w-10 h-10 rounded bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-serif text-stone-900 dark:text-white mb-2">
              १. निर्भीक निष्पक्षता
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
              कोणत्याही राजकीय पक्षाचे मुखपत्र न बनता केवळ लोकहित आणि जनसामान्यांच्या बाजूने सडेतोड मांडणी.
            </p>
          </div>

          <div className="bg-white dark:bg-stone-900 p-6 rounded border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="w-10 h-10 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-serif text-stone-900 dark:text-white mb-2">
              २. सत्यता व सखोलता
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
              साप्ताहिक स्वरूपाचा लाभ घेत प्रत्येक घडामोडीच्या मुळाशी जाऊन तथ्यपूर्ण, अभ्यासपूर्ण माहिती देणे.
            </p>
          </div>

          <div className="bg-white dark:bg-stone-900 p-6 rounded border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="w-10 h-10 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-serif text-stone-900 dark:text-white mb-2">
              ३. सामाजिक बांधिलकी
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
              शेतकरी आत्महत्या, बेरोजगारी, पाणी टंचाई, शिक्षण आणि आरोग्याच्या प्रश्नांवर निरंतर पाठपुरावा.
            </p>
          </div>
        </section>

        {/* Section 3: Editorial Team */}
        <section className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-red-700 dark:text-red-400" />
            <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-white">
              संपादकीय मंडळ (Editorial Leadership)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded border border-stone-200 dark:border-stone-700">
              <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400 font-sans mb-1">
                <PenTool className="w-3.5 h-3.5" />
                <span>{EDITORIAL_TEAM.editorInChief.role}</span>
              </div>
              <h4 className="text-lg font-bold font-serif text-stone-900 dark:text-white">
                {EDITORIAL_TEAM.editorInChief.name}
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 font-sans">
                {EDITORIAL_TEAM.editorInChief.experience}. महाराष्ट्राच्या पुरोगामी चळवळींचे अभ्यासक आणि स्वतंत्र पत्रकार.
              </p>
            </div>

            {EDITORIAL_TEAM.residentEditors.map((ed) => (
              <div key={ed.name} className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded border border-stone-200 dark:border-stone-700">
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400 font-sans block mb-1">
                  {ed.role} ({ed.location})
                </span>
                <h4 className="text-base font-bold font-serif text-stone-900 dark:text-white">
                  {ed.name}
                </h4>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-stone-900 dark:bg-stone-900 text-white p-8 rounded text-center space-y-4 border border-stone-800">
          <h3 className="text-xl sm:text-2xl font-bold font-serif">
            आपल्याकडेही बातमी किंवा संशोधन लेख आहे का?
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 max-w-lg mx-auto font-sans">
            स्थानिक समस्या, यशोगाथा किंवा वैचारिक लेख थेट मुख्य संपादक दिलीप सोनाळे यांच्याकडे पाठवा.
          </p>
          <button
            onClick={onNavigateContact}
            className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded cursor-pointer transition-colors font-sans"
          >
            संपादकीय संपर्क &rarr;
          </button>
        </section>
      </div>
    </div>
  );
};
