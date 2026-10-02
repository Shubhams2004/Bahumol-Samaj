import React, { useState } from 'react';
import { ChevronRight, Download, ZoomIn, ZoomOut, ChevronLeft } from 'lucide-react';
import { getMarathiCurrentDate, toMarathiDigits } from '../utils/dateFormatter';
import { EditionCity } from '../types/news';

interface EpaperPageProps {
  onNavigateHome: () => void;
  onSelectArticle: (articleId: string) => void;
}

export const EpaperPage: React.FC<EpaperPageProps> = ({ onNavigateHome }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedEdition, setSelectedEdition] = useState<EditionCity>('पुणे');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const { formattedDate } = getMarathiCurrentDate();
  const totalPages = 8;

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-16">
      {/* Top Controller Bar */}
      <div className="bg-stone-900 text-white py-3 px-4 sm:px-6 shadow-md sticky top-12 z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left Title & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button onClick={onNavigateHome} className="text-xs text-stone-400 hover:text-white cursor-pointer">
              मुख्यपृष्ठ
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-stone-600" />
            <span className="font-serif font-bold text-sm sm:text-base text-amber-400">
              ई-पेपर (ePaper Edition)
            </span>
            <span className="text-xs text-stone-400 hidden md:inline">· {formattedDate}</span>
          </div>

          {/* Center Edition & Page Selector */}
          <div className="flex items-center gap-2 text-xs">
            {/* Edition */}
            <select
              value={selectedEdition}
              onChange={(e) => setSelectedEdition(e.target.value as EditionCity)}
              className="bg-stone-800 text-white border border-stone-700 rounded px-2.5 py-1 focus:outline-none"
            >
              <option value="पुणे">पुणे आवृत्ती</option>
              <option value="मुंबई">मुंबई आवृत्ती</option>
              <option value="नागपूर">नागपूर आवृत्ती</option>
              <option value="नाशिक">नाशिक आवृत्ती</option>
              <option value="छत्रपती संभाजीनगर">संभाजीनगर आवृत्ती</option>
            </select>

            {/* Page Nav */}
            <div className="flex items-center gap-1 bg-stone-800 border border-stone-700 rounded px-1.5 py-0.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-white cursor-pointer"
                title="मागील पान"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-bold">
                पान {toMarathiDigits(currentPage)} / {toMarathiDigits(totalPages)}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-white cursor-pointer"
                title="पुढील पान"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Zoom & Download */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
              className="p-1.5 bg-stone-800 hover:bg-stone-700 rounded cursor-pointer"
              title="झूम कमी करा"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-stone-300 font-mono text-[11px] w-12 text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
              className="p-1.5 bg-stone-800 hover:bg-stone-700 rounded cursor-pointer"
              title="झूम वाढवा"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownload}
              className="ml-2 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">पीडीएफ डाऊनलोड</span>
            </button>
          </div>
        </div>
      </div>

      {downloadSuccess && (
        <div className="max-w-xl mx-auto mt-4 p-3 bg-emerald-700 text-white text-xs rounded text-center shadow-lg font-sans">
          ✓ ‘बहुमोल समाज - {selectedEdition} आवृत्ती’ चा डिजिटल ई-पेपर डाऊनलोड सुरू झाला आहे!
        </div>
      )}

      {/* Main Newspaper BroadSheet Canvas */}
      <div className="max-w-5xl mx-auto px-4 py-8 overflow-auto flex justify-center">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="w-full max-w-[850px] bg-white border-2 border-stone-300 shadow-2xl p-6 sm:p-8 transition-transform duration-200"
        >
          {/* Broadsheet Page Header */}
          <div className="border-b-4 border-stone-900 pb-3 mb-4 text-center">
            <div className="flex items-center justify-between text-xs text-stone-600 font-sans border-b border-stone-200 pb-1 mb-2">
              <span>{selectedEdition} आवृत्ती</span>
              <span>{formattedDate}</span>
              <span>पान क्रमांक: {toMarathiDigits(currentPage)}</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black font-serif tracking-tight text-stone-900">
              बहुमोल समाज
            </h2>
            <p className="text-xs text-stone-600 mt-1 font-sans">
              पुणे • मुंबई • नागपूर • छत्रपती संभाजीनगर • नाशिक
            </p>
          </div>

          {/* Newspaper Layout Grid Preview */}
          <div className="grid grid-cols-12 gap-4 border-b border-stone-200 pb-6 mb-6">
            {/* Lead Story in ePaper Page */}
            <div className="col-span-8 border-r border-stone-200 pr-4">
              <span className="text-[11px] font-bold text-red-700 font-sans uppercase">
                विशेष बातमी • पान {toMarathiDigits(currentPage)}
              </span>
              <h3 className="text-2xl font-bold font-serif text-stone-900 mt-1 mb-2 leading-tight">
                {currentPage === 1
                  ? 'महाराष्ट्र विधिमंडळ अर्थसंकल्प: ग्रामीण सिंचन व रोजगार प्रकल्पांसाठी ७५ हजार कोटींची तरतूद'
                  : currentPage === 2
                  ? 'पुणे-मुंबई दळणवळण क्रांती: नव्या द्रुतगती मार्ग प्रकल्पाची आखणी पूर्ण'
                  : 'राज्यातील तरुणांसाठी महाभरती मोहीम; विविध विभागांत १५ हजार पदे'}
              </h3>
              <p className="text-xs text-stone-700 leading-relaxed font-sans mb-3">
                मुंबई: राज्य शासनाने सादर केलेल्या पुरवणी मागण्यांमध्ये ग्रामीण भागातील रस्ते जोडणी, शेती सिंचन आणि नव्या ऊर्जा प्रकल्पांना विक्रमी निधी वितरित करण्याचे निश्चित केले आहे. विदर्भ आणि मराठवाड्यातील प्रलंबित सिंचन योजनांना गती देण्याचा निर्णय घेतला गेला आहे.
              </p>
              <div className="bg-stone-100 p-3 rounded text-xs text-stone-600 border border-stone-200 font-sans">
                <strong>संपादकीय टिप:</strong> डिजिटल ई-पेपरवर क्लिक करून आपण मूळ वृत्त सविस्तरपणे वाचू शकता.
              </div>
            </div>

            {/* Sidebar Columns in ePaper */}
            <div className="col-span-4 space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-[10px] font-bold text-stone-400 font-sans uppercase">
                  संक्षिप्त वृत्त
                </span>
                <h4 className="text-xs font-bold font-serif text-stone-900 mt-1">
                  वानखेडेवर भारताचा थरारक विजय; कर्णधाराचे नाबाद शतक
                </h4>
                <p className="text-[11px] text-stone-600 font-sans line-clamp-3 mt-1">
                  शेवटच्या षटकात विजयासाठी आवश्यक १२ धावा भारतीय फलंदाजांनी यशस्वीरीत्या पूर्ण केल्या.
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-stone-400 font-sans uppercase">
                  तंत्रज्ञान
                </span>
                <h4 className="text-xs font-bold font-serif text-stone-900 mt-1">
                  पुण्यात स्वदेशी इलेक्ट्रिक बॅटरी संशोधन
                </h4>
                <p className="text-[11px] text-stone-600 font-sans line-clamp-3 mt-1">
                  केवळ १५ मिनिटांत ८०% चार्जिंग देणाऱ्या सोडियम आयन बॅटरीचे यशस्वी पेटंट दाखल.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Columns */}
          <div className="grid grid-cols-3 gap-4 text-xs font-sans text-stone-700">
            <div className="border-r border-stone-200 pr-3">
              <h5 className="font-bold font-serif text-stone-900 mb-1">शेती व हवामान</h5>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                राज्यात पुढील ३ दिवस कोरड्या हवामानाचा अंदाज, रब्बी पेरण्यांना गती देण्याचे कृषी विभागाचे आवाहन.
              </p>
            </div>
            <div className="border-r border-stone-200 pr-3">
              <h5 className="font-bold font-serif text-stone-900 mb-1">बाजारभाव व व्यापार</h5>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                सोयाबीन व कापूस बाजारात सुधारणा; मुंबई शेअर बाजारात सेन्सेक्समध्ये ३०० अंकांची वाढ.
              </p>
            </div>
            <div>
              <h5 className="font-bold font-serif text-stone-900 mb-1">मनोरंजन व संस्कृती</h5>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                राष्ट्रीय पुरस्कार विजेत्या मराठी चित्रपटांचे राज्यभरात विशेष प्रदर्शन सुरू.
              </p>
            </div>
          </div>

          {/* Footer of the ePaper Sheet */}
          <div className="border-t border-stone-300 mt-6 pt-3 text-[10px] text-stone-500 font-sans flex justify-between items-center">
            <span>बहुमोल समाज माध्यम समूह © २०२६</span>
            <span>RNI क्र. MAHMAR/2024/88921</span>
            <span>पान {toMarathiDigits(currentPage)} समाप्ती</span>
          </div>
        </div>
      </div>
    </div>
  );
};
