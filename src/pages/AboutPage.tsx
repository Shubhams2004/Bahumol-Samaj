import React from 'react';
import { ChevronRight, Award, Shield, CheckCircle, Users, HeartHandshake, BookOpen } from 'lucide-react';

interface AboutPageProps {
  onNavigateHome: () => void;
  onNavigateContact: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigateHome, onNavigateContact }) => {
  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      {/* Header Banner */}
      <div className="bg-white border-b border-stone-200 py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-4 font-sans">
            <button onClick={onNavigateHome} className="hover:text-red-700 cursor-pointer">
              मुख्यपृष्ठ
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-stone-800">आमच्याबद्दल</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-black text-stone-900 mb-3 tracking-tight">
            बहुमोल समाज: विचार, निष्पक्षता आणि सत्यनिष्ठा
          </h1>
          <p className="text-base text-stone-600 font-sans leading-relaxed">
            महाराष्ट्राच्या ज्वलंत समस्या, ग्रामीण व शहरी जनतेचे प्रश्न आणि राष्ट्राच्या प्रगतीचा वेध घेणारे स्वतंत्र डिजिटल वृत्तपत्र.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 space-y-10">
        {/* Section 1: Introduction & Philosophy */}
        <section className="bg-white p-6 sm:p-8 rounded border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-red-700" />
            <h2 className="text-xl font-bold font-serif text-stone-900">
              आमची भूमिका व उद्देश (Our Mission)
            </h2>
          </div>
          <div className="space-y-4 text-stone-700 text-sm sm:text-base leading-relaxed font-sans">
            <p>
              <strong className="text-stone-900 font-serif">‘बहुमोल समाज’</strong> हे केवळ बातम्या देणारे माध्यम नसून,
              समाजातील उपेक्षित, कष्टकरी, शेतकरी आणि नवयुवकांच्या आशा-आकांक्षांना आवाज देणारा बुलंद मंच आहे.
              महाराष्ट्राला संतांची, समाजसुधारकांची आणि शिव-शाहू-फुले-आंबेडकरांच्या पुरोगामी विचारांची महान परंपरा लाभली आहे.
              याच विचारांचे जतन करत निष्पक्ष, निर्भीक आणि सडेतोड पत्रकारिता करणे हे आमचे ध्येय आहे.
            </p>
            <p>
              आजच्या वेगवान डिजिटल युगात अफवा, दिशाभूल आणि पेड न्यूजचे मोठे आव्हान उभे आहे. अशा काळात
              सत्याची कसून पडताळणी करून वाचकांपर्यंत केवळ खात्रीशीर आणि तथ्यपूर्ण माहिती पोहोचवण्यासाठी आमची
              संपादकीय चमू २४ तास कार्यरत आहे.
            </p>
          </div>
        </section>

        {/* Section 2: Core Values Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded border border-stone-200 shadow-xs">
            <div className="w-10 h-10 rounded bg-red-50 text-red-700 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-serif text-stone-900 mb-2">
              १. संपूर्ण निष्पक्षता
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              कोणत्याही राजकीय पक्ष, कॉर्पोरेट दबाव किंवा वैयक्तिक हितसंबंधांपासून अलिप्त राहून केवळ लोकहिताला प्राधान्य.
            </p>
          </div>

          <div className="bg-white p-6 rounded border border-stone-200 shadow-xs">
            <div className="w-10 h-10 rounded bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-serif text-stone-900 mb-2">
              २. सत्यता व पडताळणी
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              कोणतीही सनसनाटी न माजवता माहितीची विश्वासार्हता तपासून अधिकृत पुराव्यांसह बातमी प्रसिद्ध करण्याचा नियम.
            </p>
          </div>

          <div className="bg-white p-6 rounded border border-stone-200 shadow-xs">
            <div className="w-10 h-10 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-serif text-stone-900 mb-2">
              ३. सामाजिक बांधिलकी
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              शिक्षण, रोजगार, शेती आणि सामान्य नागरिकांच्या मूलभूत समस्यांवर उपाय शोधण्यासाठी सातत्यपूर्ण पाठपुरावा.
            </p>
          </div>
        </section>

        {/* Section 3: Editorial Team */}
        <section className="bg-white p-6 sm:p-8 rounded border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-red-700" />
            <h2 className="text-xl font-bold font-serif text-stone-900">
              संपादकीय नेतृत्व (Editorial Board)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 bg-stone-50 rounded border border-stone-200">
              <span className="text-xs font-bold text-red-700 font-sans block mb-1">मुख्य संपादक (Editor-in-Chief)</span>
              <h4 className="text-lg font-bold font-serif text-stone-900">भास्करराव मोहिते</h4>
              <p className="text-xs text-stone-600 mt-1 font-sans">
                मराठी वृत्तपत्र क्षेत्रातील ३० वर्षांचा प्रदीर्घ अनुभव. राजकीय व सामाजिक विश्लेषणाचे गाढे अभ्यासक.
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded border border-stone-200">
              <span className="text-xs font-bold text-red-700 font-sans block mb-1">निवासी संपादक (पुणे ब्युरो)</span>
              <h4 className="text-lg font-bold font-serif text-stone-900">आनंद जोशी</h4>
              <p className="text-xs text-stone-600 mt-1 font-sans">
                प्रशासकीय घडामोडी, शिक्षण व स्पर्धा परीक्षा मार्गदर्शक. डिजिटल मीडिया तज्ज्ञ.
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded border border-stone-200">
              <span className="text-xs font-bold text-red-700 font-sans block mb-1">ब्युरो चीफ (मुंबई व कोकण)</span>
              <h4 className="text-lg font-bold font-serif text-stone-900">संजय कुलकर्णी</h4>
              <p className="text-xs text-stone-600 mt-1 font-sans">
                मंत्रालय व विधानभवन वार्तांकन, पायाभूत सुविधा व आर्थिक धोरणांचे विश्लेषक.
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded border border-stone-200">
              <span className="text-xs font-bold text-red-700 font-sans block mb-1">विशेष प्रतिनिधी (विज्ञान-तंत्रज्ञान)</span>
              <h4 className="text-lg font-bold font-serif text-stone-900">डॉ. अनिता देशपांडे</h4>
              <p className="text-xs text-stone-600 mt-1 font-sans">
                पर्यावरण, ऊर्जा आणि उदयोन्मुख तंत्रज्ञान संशोधनावर नियमित स्तंभलेखन.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-stone-900 text-white p-8 rounded text-center space-y-4">
          <h3 className="text-xl sm:text-2xl font-bold font-serif">
            आपल्याकडेही बातमी किंवा लेख आहे का?
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 max-w-lg mx-auto font-sans">
            स्थानिक समस्या, यशोगाथा किंवा वैचारिक लेख आमच्या संपादकीय मंडळाकडे पाठवा.
          </p>
          <button
            onClick={onNavigateContact}
            className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded cursor-pointer transition-colors font-sans"
          >
            आमच्याशी संपर्क साधा &rarr;
          </button>
        </section>
      </div>
    </div>
  );
};
