import React, { useState } from 'react';
import { ChevronRight, Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare } from 'lucide-react';

interface ContactPageProps {
  onNavigateHome: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigateHome }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    topic: 'बातमी टिप (News Tip)',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-4 font-sans">
            <button onClick={onNavigateHome} className="hover:text-red-700 cursor-pointer">
              मुख्यपृष्ठ
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-stone-800">संपर्क व बातमी पाठवा</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-black text-stone-900 mb-3 tracking-tight">
            संपादकीय संपर्क व कार्यालयीन माहिती
          </h1>
          <p className="text-sm text-stone-600 font-sans leading-relaxed">
            बहुमोल समाज वृत्तसमूहाशी थेट संवाद साधा, जाहिरातींसाठी संपर्क करा किंवा परिसरातील घडामोडींची माहिती पाठवा.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left: Bureau Info & Quick contacts (5 cols) */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded border border-stone-200 shadow-xs">
              <h3 className="text-base font-bold font-serif text-stone-900 mb-4 pb-2 border-b border-stone-200">
                मुख्य कार्यालय (Head Office)
              </h3>
              <div className="space-y-3 text-xs text-stone-700 font-sans">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>बहुमोल समाज भवन,</strong>
                    <br />
                    ५४०, सदाशिव पेठ, कुमठेकर रस्ता,
                    <br />
                    पुणे - ४११०३०, महाराष्ट्र.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-stone-100">
                  <Phone className="w-4 h-4 text-red-700 shrink-0" />
                  <span>+९१ २० २३४५ ६७८९ / ९८७६५ ४३२१०</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-red-700 shrink-0" />
                  <span>contact@bahumolsamaj.com</span>
                </div>
              </div>
            </div>

            {/* Other Bureaus */}
            <div className="bg-white p-6 rounded border border-stone-200 shadow-xs">
              <h3 className="text-base font-bold font-serif text-stone-900 mb-3 pb-2 border-b border-stone-200">
                विभागीय ब्युरो कार्यालये (Regional Bureaus)
              </h3>
              <div className="space-y-3 text-xs text-stone-600 font-sans">
                <div>
                  <strong className="text-stone-900 block">मुंबई ब्युरो:</strong>
                  <span>प्रेस रूम, विधानभवन व नरिमन पॉइंट, मुंबई - ४०००२१</span>
                </div>
                <div>
                  <strong className="text-stone-900 block">नागपूर ब्युरो:</strong>
                  <span>धरमपेठ, सीताबर्डी परिसर, नागपूर - ४४००१०</span>
                </div>
                <div>
                  <strong className="text-stone-900 block">छत्रपती संभाजीनगर:</strong>
                  <span>जालना रोड, क्रांती चौक परिसर, संभाजीनगर - ४३१००१</span>
                </div>
                <div>
                  <strong className="text-stone-900 block">नाशिक ब्युरो:</strong>
                  <span>कॉलेज रोड, गंगापूर परिसर, नाशिक - ४२२००५</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Contact / News tip form (7 cols) */}
          <div className="md:col-span-7">
            <div className="bg-white p-6 sm:p-8 rounded border border-stone-200 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-red-700" />
                <h3 className="text-xl font-bold font-serif text-stone-900">
                  संपादकाला संदेश / बातमी पाठवा
                </h3>
              </div>
              <p className="text-xs text-stone-500 font-sans mb-6">
                आपल्या परिसरातील अन्याय, विकासकामे, यश अथवा इतर मुद्द्यांविषयी थेट संपादकीय विभागाला माहिती कळवा.
              </p>

              {submitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-bold font-serif text-emerald-950">
                    आपला संदेश संपादकीय विभागाला प्राप्त झाला आहे!
                  </h4>
                  <p className="text-xs text-emerald-800 font-sans leading-relaxed">
                    धन्यवाद! आमची बातमीदार चमू आपण दिलेल्या माहितीची पडताळणी करून आवश्यक असल्यास आपल्याशी संपर्क साधेल.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        phone: '',
                        email: '',
                        city: '',
                        topic: 'बातमी टिप (News Tip)',
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
                    <label className="block text-stone-700 font-bold mb-1">आपले नाव *</label>
                    <input
                      type="text"
                      required
                      placeholder="उदा. राहुल देशमुख"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-700 font-bold mb-1">मोबाईल क्रमांक *</label>
                      <input
                        type="tel"
                        required
                        placeholder="९८xxxxxx१०"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-700 font-bold mb-1">शहर / जिल्हा *</label>
                      <input
                        type="text"
                        required
                        placeholder="उदा. सोलापूर, सांगली, पुणे"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">ईमेल (ऐच्छिक)</label>
                    <input
                      type="email"
                      placeholder="yourname@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">संदेशाचा प्रकार</label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                    >
                      <option value="बातमी टिप (News Tip)">बातमी टिप / विशेष वृत्त (News Tip)</option>
                      <option value="जाहिरात चौकशी (Advertisement Inquiry)">जाहिरात चौकशी (Ad Inquiry)</option>
                      <option value="संपादकीय तक्रार (Correction/Grievance)">दुरुस्ती / आक्षेप (Correction)</option>
                      <option value="इतर सूचना (General Feedback)">इतर अभिप्राय (Feedback)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">
                      संदेश / बातमीचा सविस्तर तपशील *
                    </label>
                    <textarea
                      rows={5}
                      required
                      placeholder="घटनेचा दिनांक, ठिकाण आणि सविस्तर माहिती येथे लिहा..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>माहिती पाठवा (Submit Message)</span>
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
