import React, { useState } from 'react';
import { CURRENT_WEEKLY_EDITION, EDITORIAL_TEAM } from '../data/editionData';
import { ChevronRight, Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, PenTool } from 'lucide-react';

interface ContactPageProps {
  onNavigateHome: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigateHome }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    topic: 'साप्ताहिक बातमी टिप (News Tip)',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-16 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-4 font-sans">
            <button onClick={onNavigateHome} className="hover:text-red-700 dark:hover:text-red-400 cursor-pointer">
              मुख्यपृष्ठ
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-stone-800 dark:text-stone-200">संपादकीय संपर्क</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-black text-stone-900 dark:text-white mb-3 tracking-tight">
            संपादकीय संपर्क व कार्यालयीन माहिती
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
            साप्ताहिक बहुमोल समाजच्या संपादकीय विभागाशी थेट संवाद साधा, जाहिरातींसाठी संपर्क करा अथवा आपल्या भागातील सविस्तर बातमी पाठवा.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left: Bureau Info & Contacts (5 cols) */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white dark:bg-stone-900 p-6 rounded border border-stone-200 dark:border-stone-800 shadow-xs">
              <h3 className="text-base font-bold font-serif text-stone-900 dark:text-white mb-4 pb-2 border-b border-stone-200 dark:border-stone-800">
                मुख्य कार्यालय (Head Office)
              </h3>
              <div className="space-y-3 text-xs text-stone-700 dark:text-stone-300 font-sans">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>{EDITORIAL_TEAM.headOffice.name}</strong>
                    <br />
                    {EDITORIAL_TEAM.headOffice.address}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <Phone className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0" />
                  <span>{EDITORIAL_TEAM.headOffice.phone}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0" />
                  <span>{EDITORIAL_TEAM.headOffice.email}</span>
                </div>
              </div>
            </div>

            {/* Chief Editor Card */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded border border-stone-200 dark:border-stone-800 shadow-xs">
              <div className="flex items-center gap-2 text-stone-900 dark:text-white font-serif font-bold text-sm mb-2">
                <PenTool className="w-4 h-4 text-red-700 dark:text-red-400" />
                <span>मुख्य संपादक: {CURRENT_WEEKLY_EDITION.editorInChief}</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 font-sans leading-relaxed">
                वैचारिक लेख, पुस्तकांची परीक्षणे अथवा विशेष साप्ताहिकासाठीचे शोधनिबंध पाठवण्यासाठी वरील ईमेलवर संपर्क साधू शकता.
              </p>
            </div>
          </div>

          {/* Right: Contact Form (7 cols) */}
          <div className="md:col-span-7">
            <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded border border-stone-200 dark:border-stone-800 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-red-700 dark:text-red-400" />
                <h3 className="text-xl font-bold font-serif text-stone-900 dark:text-white">
                  मुख्य संपादकाला संदेश / बातमी पाठवा
                </h3>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mb-6">
                आपल्या भागातील अन्याय, भ्रष्टाचार, विकासकामे किंवा विशेष यशाविषयी थेट संपादकीय विभागाला माहिती कळवा.
              </p>

              {submitted ? (
                <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <h4 className="text-base font-bold font-serif text-emerald-950 dark:text-emerald-200">
                    आपला संदेश मुख्य संपादकीय विभागाला प्राप्त झाला आहे!
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-sans leading-relaxed">
                    धन्यवाद! आम्ही माहितीची पडताळणी करून पुढील साप्ताहिक अंकात प्रसिद्धीसाठी योग्य दखल घेऊ.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        phone: '',
                        email: '',
                        city: '',
                        topic: 'साप्ताहिक बातमी टिप (News Tip)',
                        message: '',
                      });
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded cursor-pointer"
                  >
                    आणखी एक संदेश पाठवा
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">आपले नाव *</label>
                    <input
                      type="text"
                      required
                      placeholder="उदा. राहुल देशमुख"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">मोबाईल क्रमांक *</label>
                      <input
                        type="tel"
                        required
                        placeholder="९८xxxxxx१०"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">गाव / शहर / जिल्हा *</label>
                      <input
                        type="text"
                        required
                        placeholder="उदा. सोलापूर, सांगली, पुणे"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">ईमेल (ऐच्छिक)</label>
                    <input
                      type="email"
                      placeholder="yourname@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">संदेशाचा प्रकार</label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                    >
                      <option value="साप्ताहिक बातमी टिप (News Tip)">साप्ताहिक बातमी टिप (News Tip)</option>
                      <option value="संपादकीय लेख / प्रतिक्रिया (Letter to Editor)">संपादकीय लेख / पत्र (Letter to Editor)</option>
                      <option value="जाहिरात चौकशी (Advertisement Inquiry)">जाहिरात चौकशी (Ad Inquiry)</option>
                      <option value="इतर अभिप्राय (General Feedback)">इतर अभिप्राय (Feedback)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                      संदेश / बातमीचा सविस्तर तपशील *
                    </label>
                    <textarea
                      rows={5}
                      required
                      placeholder="घटनेचा दिनांक, ठिकाण आणि सविस्तर माहिती येथे लिहा..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:ring-1 focus:ring-red-600 font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>माहिती पाठवा (Submit to Editor)</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
