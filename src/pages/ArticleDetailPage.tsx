import React, { useState } from 'react';
import { Article, Comment } from '../types/news';
import { ALL_CATEGORIES } from '../data/categories';
import { formatMarathiDate, toMarathiDigits } from '../utils/dateFormatter';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { FontSizeOption } from '../utils/readingPreferences';
import { ARTICLES } from '../data/newsArticles';
import {
  ChevronRight,
  Clock,
  MapPin,
  Bookmark,
  Share2,
  Printer,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
  Check,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface ArticleDetailPageProps {
  article: Article;
  onSelectArticle: (articleId: string) => void;
  onSelectCategory: (slug: string) => void;
  onNavigateHome: () => void;
  isBookmarked: (id: string) => boolean;
  onToggleBookmark: (id: string) => void;
  fontSize: FontSizeOption;
  onChangeFontSize: (size: FontSizeOption) => void;
}

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({
  article,
  onSelectArticle,
  onSelectCategory,
  onNavigateHome,
  isBookmarked,
  onToggleBookmark,
  fontSize,
  onChangeFontSize,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentName, setCommentName] = useState('');
  const [commentCity, setCommentCity] = useState('');
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'c-1',
      author: 'प्रमोद गायकवाड',
      city: 'पुणे',
      text: 'अत्यंत वस्तुनिष्ठ आणि अभ्यासपूर्ण वृत्त. अशाच निष्पक्ष पत्रकारितेची आज महाराष्ट्राला गरज आहे.',
      timestamp: '२ तासांपूर्वी',
      likes: 8,
    },
    {
      id: 'c-2',
      author: 'सुवर्णा पाटील',
      city: 'नागपूर',
      text: 'शासनाने घेतलेल्या या निर्णयाचा ग्रामीण भागातील जनतेला निश्चितच थेट फायदा होईल.',
      timestamp: '४ तासांपूर्वी',
      likes: 5,
    },
  ]);

  const category = ALL_CATEGORIES.find((c) => c.slug === article.category);

  // Related articles
  const relatedArticles = ARTICLES.filter(
    (a) => a.id !== article.id && (a.category === article.category || a.featured)
  ).slice(0, 3);

  // Previous and next article navigation
  const currentIndex = ARTICLES.findIndex((a) => a.id === article.id);
  const prevArticle = currentIndex > 0 ? ARTICLES[currentIndex - 1] : undefined;
  const nextArticle =
    currentIndex >= 0 && currentIndex < ARTICLES.length - 1 ? ARTICLES[currentIndex + 1] : undefined;

  // Font size multiplier
  const fontSizeClass =
    fontSize === 'lg'
      ? 'text-lg sm:text-xl leading-relaxed'
      : fontSize === 'sm'
      ? 'text-sm leading-normal'
      : 'text-base sm:text-lg leading-relaxed';

  // Audio Speech (TTS)
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('तुमच्या ब्राऊझरमध्ये ऑडिओ वाचन समर्थित नाही.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      const textToRead = `${article.title}. ${article.excerpt}. ${article.content.join(' ')}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'mr-IN';
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      author: commentName.trim() || 'सुजाण वाचक',
      city: commentCity.trim() || 'महाराष्ट्र',
      text: commentText.trim(),
      timestamp: 'आत्ताच',
      likes: 1,
    };

    setComments([newComment, ...comments]);
    setCommentText('');
    setCommentName('');
    setCommentCity('');
  };

  return (
    <article className="min-h-screen bg-stone-50 pb-20">
      {/* Top Breadcrumb & Action Utility */}
      <div className="bg-white border-b border-stone-200 py-3 px-4 sm:px-6 sticky top-12 z-20 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-sans truncate">
            <button onClick={onNavigateHome} className="hover:text-red-700 cursor-pointer shrink-0">
              मुख्यपृष्ठ
            </button>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <button
              onClick={() => onSelectCategory(article.category)}
              className="hover:text-red-700 cursor-pointer font-medium shrink-0"
            >
              {category?.nameMarathi || article.category}
            </button>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
            <span className="text-stone-800 font-medium truncate hidden sm:inline">
              बातमी तपशील
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Audio Read Toggle */}
            <button
              onClick={toggleSpeech}
              className={`p-1.5 rounded flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors ${
                isPlayingAudio ? 'bg-red-700 text-white animate-pulse' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
              title={isPlayingAudio ? 'वाचन थांबवा' : 'बातमी ऐका (Audio)'}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isPlayingAudio ? 'थांबवा' : 'ऐका'}</span>
            </button>

            {/* Font Sizer Controls */}
            <div className="flex items-center gap-1 border border-stone-300 rounded px-1.5 py-0.5 bg-white text-xs">
              <button
                onClick={() => onChangeFontSize('sm')}
                className={`px-1 font-bold ${fontSize === 'sm' ? 'text-red-700' : 'text-stone-600'}`}
              >
                अ-
              </button>
              <button
                onClick={() => onChangeFontSize('lg')}
                className={`px-1 font-bold ${fontSize === 'lg' ? 'text-red-700' : 'text-stone-600'}`}
              >
                अ+
              </button>
            </div>

            {/* Bookmark button */}
            <button
              onClick={() => onToggleBookmark(article.id)}
              className={`p-1.5 rounded hover:bg-stone-100 cursor-pointer ${
                isBookmarked(article.id) ? 'text-red-700' : 'text-stone-500'
              }`}
              title={isBookmarked(article.id) ? 'जतन केले' : 'जतन करा'}
            >
              <Bookmark className="w-4 h-4" />
            </button>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="p-1.5 text-stone-500 hover:bg-stone-100 rounded cursor-pointer hidden sm:inline-block"
              title="प्रिंट करा"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Share / Copy Button */}
            <button
              onClick={handleCopyLink}
              className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded flex items-center gap-1 text-xs cursor-pointer"
              title="बातमीची लिंक कॉपी करा"
            >
              {copyFeedback ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{copyFeedback ? 'कॉपी झाली!' : 'शेअर'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Article Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <div className="bg-white rounded-lg border border-stone-200 p-6 sm:p-10 shadow-xs">
          {/* Category & Location Badge */}
          <div className="flex items-center gap-2 text-xs font-semibold text-red-700 uppercase tracking-wider mb-3 font-sans">
            <button
              onClick={() => onSelectCategory(article.category)}
              className="hover:underline cursor-pointer"
            >
              {category?.nameMarathi}
            </button>
            <span className="text-stone-300">·</span>
            <span className="text-stone-600 flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              {article.location}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif text-stone-950 leading-tight mb-4 [text-wrap:balance]">
            {article.title}
          </h1>

          {/* Subtitle */}
          {article.subtitle && (
            <p className="text-base sm:text-lg font-medium text-stone-700 font-serif leading-relaxed mb-6 border-l-3 border-red-700 pl-4 py-0.5">
              {article.subtitle}
            </p>
          )}

          {/* Author Byline & Published Date */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 py-3 border-y border-stone-200 mb-6 text-xs text-stone-600 font-sans">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-800 text-white font-serif font-bold flex items-center justify-center text-sm shadow-xs">
                {article.author.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-stone-900 text-sm">{article.author.name}</p>
                <p className="text-stone-500 text-[11px]">{article.author.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-stone-500">
              <span>प्रसिद्ध: {formatMarathiDate(article.publishedAt)}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                वाचन वेळ: {toMarathiDigits(article.readTimeMinutes)} मिनिटे
              </span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mb-6">
            <div className="aspect-16/9 rounded overflow-hidden bg-stone-100 shadow-xs">
              <ImageWithFallback
                src={article.image}
                alt={article.title}
                categoryName={category?.nameMarathi}
                className="w-full h-full object-cover"
              />
            </div>
            {article.imageCaption && (
              <p className="text-xs text-stone-500 italic mt-2 font-sans border-b border-stone-100 pb-2">
                {article.imageCaption}
              </p>
            )}
          </div>

          {/* Social Share Bar */}
          <div className="flex items-center justify-between py-2 mb-6 border-b border-stone-100 text-xs text-stone-600 font-sans">
            <span className="font-semibold text-stone-700">बातमी शेअर करा:</span>
            <div className="flex items-center gap-2">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + ' ' + window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors"
              >
                व्हॉट्सॲप
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded font-medium transition-colors"
              >
                X (ट्विटर)
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded font-medium transition-colors"
              >
                फेसबुक
              </a>
            </div>
          </div>

          {/* Article Excerpt */}
          <div className="text-base sm:text-lg font-medium text-stone-800 font-serif leading-relaxed mb-6 bg-stone-50 p-4 rounded border-l-4 border-red-700">
            {article.excerpt}
          </div>

          {/* Article Body Paragraphs */}
          <div className={`space-y-5 text-stone-800 font-sans font-normal ${fontSizeClass}`}>
            {article.content.map((paragraph, index) => (
              <p key={index} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Pull Quotes */}
          {article.quotes && article.quotes.length > 0 && (
            <div className="my-8 space-y-4">
              {article.quotes.map((q, idx) => (
                <blockquote
                  key={idx}
                  className="bg-amber-50/60 border-l-4 border-amber-600 p-4 rounded-r text-stone-900"
                >
                  <p className="text-base sm:text-lg font-serif italic mb-1">
                    “{q.text}”
                  </p>
                  <cite className="text-xs font-bold text-stone-600 font-sans block not-italic">
                    — {q.speaker}
                  </cite>
                </blockquote>
              ))}
            </div>
          )}

          {/* Tags */}
          <div className="mt-8 pt-6 border-t border-stone-200">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2 font-sans">
              संबंधित टॅग्स (Topics):
            </span>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs rounded font-medium cursor-pointer transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Previous & Next Story Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-stone-200">
            {prevArticle ? (
              <button
                type="button"
                onClick={() => onSelectArticle(prevArticle.id)}
                className="p-4 bg-stone-50 hover:bg-stone-100 rounded border border-stone-200 text-left group cursor-pointer transition-colors"
              >
                <span className="text-[11px] font-bold text-red-700 uppercase flex items-center gap-1 mb-1 font-sans">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  मागील बातमी (Previous Story)
                </span>
                <h4 className="text-xs sm:text-sm font-bold font-serif text-stone-900 group-hover:text-red-800 transition-colors line-clamp-2">
                  {prevArticle.title}
                </h4>
              </button>
            ) : (
              <div />
            )}

            {nextArticle ? (
              <button
                type="button"
                onClick={() => onSelectArticle(nextArticle.id)}
                className="p-4 bg-stone-50 hover:bg-stone-100 rounded border border-stone-200 text-right group cursor-pointer transition-colors"
              >
                <span className="text-[11px] font-bold text-red-700 uppercase flex items-center justify-end gap-1 mb-1 font-sans">
                  पुढील बातमी (Next Story)
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <h4 className="text-xs sm:text-sm font-bold font-serif text-stone-900 group-hover:text-red-800 transition-colors line-clamp-2">
                  {nextArticle.title}
                </h4>
              </button>
            ) : (
              <div />
            )}
          </div>

          {/* Reader Feedback & Comments */}
          <div className="mt-12 pt-8 border-t-2 border-stone-200">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-red-700" />
              <h3 className="text-xl font-bold font-serif text-stone-900">
                वाचकांच्या प्रतिक्रिया ({toMarathiDigits(comments.length)})
              </h3>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="bg-stone-50 p-4 rounded border border-stone-200 mb-6">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
                तुमचे मत नोंदवा (Leave your comment)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="आपले संपूर्ण नाव..."
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  className="p-2 text-xs bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                />
                <input
                  type="text"
                  placeholder="शहर / गाव (उदा. पुणे, नाशिक)..."
                  value={commentCity}
                  onChange={(e) => setCommentCity(e.target.value)}
                  className="p-2 text-xs bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>
              <textarea
                rows={3}
                placeholder="या बातमीवर आपली प्रतिक्रिया व्यक्त करा..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
                className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded mb-3 focus:outline-none focus:ring-1 focus:ring-red-600 font-sans"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>प्रतिक्रिया पाठवा</span>
              </button>
            </form>

            {/* Existing Comments */}
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="p-4 bg-white border border-stone-200 rounded">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span className="font-bold text-stone-800">
                      {c.author} ({c.city})
                    </span>
                    <span>{c.timestamp}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 font-sans leading-relaxed">
                    {c.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xl font-bold font-serif text-stone-900 border-b-2 border-stone-800 pb-2 mb-6">
              संबंधित महत्त्वाच्या बातम्या (Related Stories)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => {
                const relCat = ALL_CATEGORIES.find((c) => c.slug === rel.category);
                return (
                  <div
                    key={rel.id}
                    onClick={() => onSelectArticle(rel.id)}
                    className="bg-white p-4 rounded border border-stone-200 shadow-xs hover:shadow-md transition-shadow group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-16/10 rounded overflow-hidden bg-stone-100 mb-2.5">
                        <ImageWithFallback
                          src={rel.image}
                          alt={rel.title}
                          categoryName={relCat?.nameMarathi}
                          className="w-full h-full object-cover group-hover:scale-104 transition-transform"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-red-700 uppercase block mb-1">
                        {relCat?.nameMarathi}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold font-serif text-stone-900 group-hover:text-red-800 transition-colors line-clamp-2 leading-snug">
                        {rel.title}
                      </h4>
                    </div>
                    <span className="text-[11px] text-stone-400 mt-3 pt-2 border-t border-stone-100">
                      {formatMarathiDate(rel.publishedAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
