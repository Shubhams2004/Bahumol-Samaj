/**
 * @file StoryWorkspace.tsx
 * Professional Editorial Story Workspace for Bahumol Samaj Weekly Newspaper.
 * - Distinct separation between Immutable Original Wire Metadata and Editable Marathi Content
 * - High-Fidelity Public Newspaper Preview Panel
 * - Full Editorial Status Lifecycle: Draft -> Review -> Approve -> Publish / Reject / Archive
 * - Fully responsive for Mobile/Android and Desktop
 */

import React, { useState, useEffect } from 'react';
import {
  EditorialStory,
  EditorialUpdatePayload,
  newsService,
} from '../../services/newsService';
import { VALID_CATEGORIES } from '../../worker/classifier';
import { getCategoryBySlug } from '../../data/categories';
import {
  ArrowLeft,
  Save,
  Send,
  CheckCircle,
  XCircle,
  Archive,
  ExternalLink,
  Eye,
  FileText,
  Clock,
  Radio,
  Building2,
  Globe,
  Tag,
  PenTool,
  Lock,
  Copy,
  Check,
  AlertTriangle,
  Image as ImageIcon,
  Share2,
  Calendar,
  User,
  Hash,
  Sparkles,
  Columns,
} from 'lucide-react';

interface StoryWorkspaceProps {
  story: EditorialStory;
  onBack: () => void;
  onStoryUpdated: (updated: EditorialStory) => void;
  onStatsUpdated: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

type WorkspaceViewMode = 'editor' | 'preview' | 'wire' | 'split';

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; stepNumber: number; description: string }
> = {
  incoming: {
    label: 'प्राप्त (Incoming Wire)',
    badgeClass: 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-300 border-stone-400',
    stepNumber: 1,
    description: 'नवीन वायर वृत्त. अद्याप पुनरावलोकन किंवा संपादन झालेले नाही.',
  },
  review: {
    label: 'पुनरावलोकन (In Review)',
    badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-400',
    stepNumber: 2,
    description: 'संपादकीय पडताळणी व मजकूर शुद्धीकरणासाठी निवडलेले वृत्त.',
  },
  approved: {
    label: 'मंजूर (Approved for Publishing)',
    badgeClass: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border-blue-400',
    stepNumber: 3,
    description: 'तपासणी पूर्ण होऊन अंतिम प्रकाशनासाठी सज्ज.',
  },
  published: {
    label: 'सार्वजनिक प्रकाशित (Live on Newspaper)',
    badgeClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-500',
    stepNumber: 4,
    description: 'सार्वजनिक वृत्तप्रवाहात थेट उपलब्ध.',
  },
  rejected: {
    label: 'नाकारले (Rejected)',
    badgeClass: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border-rose-400',
    stepNumber: 0,
    description: 'संपादकीय मानकांनुसार नाकारण्यात आलेले वृत्त.',
  },
  archived: {
    label: 'संग्रहित (Archived)',
    badgeClass: 'bg-stone-100 text-stone-600 dark:bg-stone-900 dark:text-stone-400 border-stone-300',
    stepNumber: 0,
    description: 'इतिहास नोंदवहीत संग्रहित.',
  },
};

const SOURCE_GROUP_META: Record<string, { label: string; icon: React.ReactNode }> = {
  'Government Sources': {
    label: 'शासकीय अधिकृत (Government)',
    icon: <Building2 className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />,
  },
  'Indian News': {
    label: 'राष्ट्रीय वृत्तसंस्था (Indian News)',
    icon: <Radio className="w-3.5 h-3.5 text-amber-600 inline mr-1" />,
  },
  'International News': {
    label: 'आंतरराष्ट्रीय वृत्त (International)',
    icon: <Globe className="w-3.5 h-3.5 text-sky-600 inline mr-1" />,
  },
};

const QUICK_TAGS = ['महाराष्ट्र', 'विशेष वृत्त', 'कृषी', 'शासन निर्णय', 'अर्थसंकल्प', 'शिक्षण', 'क्रीडा'];

export const StoryWorkspace: React.FC<StoryWorkspaceProps> = ({
  story,
  onBack,
  onStoryUpdated,
  onStatsUpdated,
  showToast,
}) => {
  // Current active story state
  const [currentStory, setCurrentStory] = useState<EditorialStory>(story);

  // Edit form state
  const [formData, setFormData] = useState<EditorialUpdatePayload>({
    title: story.title || '',
    description: story.description || '',
    category: story.category || 'महाराष्ट्र',
    image_url: story.image_url || '',
    author: story.author || 'विशेष वार्ताहर / बहुमोल न्यूज डेस्क',
    tags: story.tags || '',
    editorial_notes: story.editorial_notes || '',
  });

  // Track if changes are unsaved
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Workspace tab mode
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('editor');

  // Confirmation Modals State
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showArchiveModal, setShowArchiveModal] = useState<boolean>(false);

  // Action loading states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync when prop changes
  useEffect(() => {
    setCurrentStory(story);
    setFormData({
      title: story.title || '',
      description: story.description || '',
      category: story.category || 'महाराष्ट्र',
      image_url: story.image_url || '',
      author: story.author || 'विशेष वार्ताहर / बहुमोल न्यूज डेस्क',
      tags: story.tags || '',
      editorial_notes: story.editorial_notes || '',
    });
    setIsDirty(false);
  }, [story]);

  const handleFieldChange = (field: keyof EditorialUpdatePayload, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  };

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyWireToEditor = () => {
    const origTitle = currentStory.original_title || currentStory.title;
    const origDesc = currentStory.original_description || currentStory.description || '';
    setFormData((prev) => ({
      ...prev,
      title: origTitle,
      description: origDesc,
    }));
    setIsDirty(true);
    showToast('मूळ मजकूर संपादकीय फॉर्ममध्ये कॉपी केला');
  };

  // 1. SAVE DRAFT ACTION
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const res = await newsService.updateEditorialStory(currentStory.id, formData);
      if (res.success && res.data) {
        setCurrentStory(res.data);
        onStoryUpdated(res.data);
        setIsDirty(false);
        onStatsUpdated();
        showToast('संपादकीय मसुदा यशस्वीरीत्या जतन केला (Draft Saved)');
      } else {
        showToast(res.message || 'मसुदा जतन करताना त्रुटी आली', 'error');
      }
    } catch {
      showToast('सर्व्हरशी संपर्क होऊ शकला नाही', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. SEND TO REVIEW
  const handleExecuteReview = async () => {
    setIsActionLoading('review');
    try {
      if (isDirty) {
        await newsService.updateEditorialStory(currentStory.id, formData);
      }
      const res = await newsService.reviewStory(currentStory.id);
      if (res.success && res.data) {
        setCurrentStory(res.data);
        onStoryUpdated(res.data);
        setIsDirty(false);
        onStatsUpdated();
        setShowReviewModal(false);
        showToast('बातमी पुनरावलोकन विभागात पाठवली (Sent to Review)');
      } else {
        showToast(res.message || 'कृती अयशस्वी', 'error');
      }
    } catch {
      showToast('त्रुटी आली', 'error');
    } finally {
      setIsActionLoading(null);
    }
  };

  // 3. APPROVE STORY
  const handleExecuteApprove = async () => {
    setIsActionLoading('approve');
    try {
      if (isDirty) {
        await newsService.updateEditorialStory(currentStory.id, formData);
      }
      const res = await newsService.approveStory(currentStory.id);
      if (res.success && res.data) {
        setCurrentStory(res.data);
        onStoryUpdated(res.data);
        setIsDirty(false);
        onStatsUpdated();
        setShowApproveModal(false);
        showToast('बातमी प्रकाशनासाठी मंजूर केली (Approved)');
      } else {
        showToast(res.message || 'मंजूर करण्यात अयशस्वी', 'error');
      }
    } catch {
      showToast('त्रुटी आली', 'error');
    } finally {
      setIsActionLoading(null);
    }
  };

  // 4. REJECT STORY
  const handleExecuteReject = async () => {
    setIsActionLoading('reject');
    try {
      const res = await newsService.rejectStory(currentStory.id, rejectReason.trim());
      if (res.success && res.data) {
        setCurrentStory(res.data);
        onStoryUpdated(res.data);
        setShowRejectModal(false);
        setRejectReason('');
        onStatsUpdated();
        showToast('बातमी नाकारली (Rejected)');
      } else {
        showToast(res.message || 'नाकारण्यात अयशस्वी', 'error');
      }
    } catch {
      showToast('त्रुटी आली', 'error');
    } finally {
      setIsActionLoading(null);
    }
  };

  // 5. PUBLISH STORY
  const handleExecutePublish = async () => {
    setIsActionLoading('publish');
    try {
      if (isDirty) {
        await newsService.updateEditorialStory(currentStory.id, formData);
      }
      const res = await newsService.publishStory(currentStory.id);
      if (res.success && res.data) {
        setCurrentStory(res.data);
        onStoryUpdated(res.data);
        setIsDirty(false);
        onStatsUpdated();
        setShowPublishModal(false);
        showToast('बातमी सार्वजनिक वृत्तपत्रावर यशस्वीरीत्या प्रकाशित झाली! (Live Published)');
      } else {
        showToast(res.message || 'प्रकाशित करण्यात अयशस्वी', 'error');
      }
    } catch {
      showToast('त्रुटी आली', 'error');
    } finally {
      setIsActionLoading(null);
    }
  };

  // 6. ARCHIVE STORY
  const handleExecuteArchive = async () => {
    setIsActionLoading('archive');
    try {
      const res = await newsService.archiveStory(currentStory.id);
      if (res.success && res.data) {
        setCurrentStory(res.data);
        onStoryUpdated(res.data);
        setShowArchiveModal(false);
        onStatsUpdated();
        showToast('बातमी संग्रहित केली (Archived)');
      } else {
        showToast(res.message || 'संग्रहित करण्यात अयशस्वी', 'error');
      }
    } catch {
      showToast('त्रुटी आली', 'error');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Immutable source attributes
  const originalHeadline = currentStory.original_title || currentStory.title;
  const originalDescription = currentStory.original_description || currentStory.description || '';
  const sourceName = currentStory.source_name || currentStory.source_id;
  const sourceGroup = currentStory.source_group || 'Indian News';
  const publishedDateFormatted = new Date(currentStory.published_at).toLocaleString('mr-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const currentCategoryData = getCategoryBySlug(formData.category || 'maharashtra');

  return (
    <div className="bg-stone-50 dark:bg-stone-950 min-h-screen text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors pb-24">
      {/* ========================================================= */}
      {/* 1. TOP APP BAR & WORKFLOW HEADER */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-3 sm:px-6 py-2.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Back & Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition-colors cursor-pointer border border-stone-300 dark:border-stone-700"
              title="डॅशबोर्डवर परत जा"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>डॅशबोर्ड</span>
            </button>

            <span className="text-stone-300 dark:text-stone-700">|</span>

            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <span className="hidden sm:inline">संपादकीय संपादन कक्ष</span>
              <span className="hidden sm:inline">/</span>
              <span className="font-mono text-[11px] text-stone-600 dark:text-stone-400">
                {currentStory.id}
              </span>
            </div>

            {/* Workflow Status Badge */}
            <div
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                STATUS_CONFIG[currentStory.status]?.badgeClass || 'bg-stone-200'
              }`}
            >
              {STATUS_CONFIG[currentStory.status]?.label || currentStory.status}
            </div>

            {isDirty && (
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                ● बदल जतन बाकी
              </span>
            )}
          </div>

          {/* Right: Primary Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Save Draft */}
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isDirty
                  ? 'bg-red-700 hover:bg-red-800 text-white'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
              }`}
              title="बदल जतन करा"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'जतन होत आहे...' : 'मसुदा जतन करा'}</span>
            </button>

            {/* Send to Review */}
            {currentStory.status === 'incoming' && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>पुनरावलोकन</span>
              </button>
            )}

            {/* Approve Button */}
            {['incoming', 'review'].includes(currentStory.status) && (
              <button
                onClick={() => setShowApproveModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>मंजूर करा</span>
              </button>
            )}

            {/* Publish Button */}
            {currentStory.status === 'approved' && (
              <button
                onClick={() => setShowPublishModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>प्रकाशित करा (Publish)</span>
              </button>
            )}

            {/* Reject Button */}
            {['incoming', 'review', 'approved'].includes(currentStory.status) && (
              <button
                onClick={() => setShowRejectModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-rose-300 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold cursor-pointer transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>नाकारा</span>
              </button>
            )}

            {/* Archive Button */}
            {['published', 'rejected'].includes(currentStory.status) && (
              <button
                onClick={() => setShowArchiveModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 text-xs font-semibold cursor-pointer transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>संग्रहित</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. CHIEF EDITOR BANNER & VIEW MODE SWITCHER */}
      {/* ========================================================= */}
      <section className="bg-stone-100 dark:bg-stone-900/60 border-b border-stone-200 dark:border-stone-800 px-3 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Chief Editor Notice */}
          <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
            <span className="font-serif font-bold text-red-700 dark:text-red-400 uppercase tracking-wider text-[11px]">
              दैनिक बहुमोल समाज
            </span>
            <span>•</span>
            <span>
              मुख्य संपादक: <strong className="text-stone-900 dark:text-stone-200">दिलीप सोनाळे</strong>
            </span>
          </div>

          {/* Tab View Switcher */}
          <div className="flex items-center bg-stone-200 dark:bg-stone-800 p-0.5 rounded border border-stone-300 dark:border-stone-700 text-xs">
            <button
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1 rounded font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                viewMode === 'editor'
                  ? 'bg-white dark:bg-stone-900 text-red-700 dark:text-red-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>संपादकीय संपादन (Editor)</span>
            </button>

            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 rounded font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>वृत्तपत्र पूर्वावलोकन (Preview)</span>
            </button>

            <button
              onClick={() => setViewMode('wire')}
              className={`px-3 py-1 rounded font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                viewMode === 'wire'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>मूळ वायर (Wire)</span>
            </button>

            <button
              onClick={() => setViewMode('split')}
              className={`hidden lg:flex px-3 py-1 rounded font-bold cursor-pointer transition-colors items-center gap-1.5 ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-stone-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
              title="संपादक आणि पूर्वावलोकन एकत्र पहा"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>दोन बाजू (Split View)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. MAIN WORKSPACE CONTAINER */}
      {/* ========================================================= */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-5 flex-1">
        {/* VIEW 1: EDITOR MODE (Side-by-side on desktop: Original Wire Left, Editor Right) */}
        {viewMode === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Original Source Wire (Read-Only) */}
            <div className="lg:col-span-5 space-y-4">
              <OriginalWireBox
                headline={originalHeadline}
                description={originalDescription}
                sourceName={sourceName}
                sourceGroup={sourceGroup}
                sourceUrl={currentStory.source_url}
                publishedDate={publishedDateFormatted}
                contentHash={currentStory.content_hash}
                copiedField={copiedField}
                onCopyText={handleCopyText}
                onCopyToEditor={handleCopyWireToEditor}
              />
            </div>

            {/* Right: Editorial Form (Editable Marathi Content) */}
            <div className="lg:col-span-7 space-y-4">
              <EditorialForm
                formData={formData}
                onFieldChange={handleFieldChange}
                categoryAccentColor={currentCategoryData?.accentColor}
                onSaveDraft={handleSaveDraft}
                isSaving={isSaving}
                isDirty={isDirty}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: PUBLIC NEWSPAPER PREVIEW */}
        {viewMode === 'preview' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  सार्वजनिक वृत्तपत्र पूर्वावलोकन (Live Public Newspaper Preview)
                </h2>
                <p className="text-xs text-stone-500">
                  ही बातमी सार्वजनिक संकेतस्थळावर वाचकांना अशी दिसेल:
                </p>
              </div>
              <button
                onClick={() => setViewMode('editor')}
                className="px-3 py-1.5 rounded bg-stone-200 dark:bg-stone-800 text-xs font-semibold cursor-pointer hover:bg-stone-300"
              >
                ← संपादनात परत जा
              </button>
            </div>

            <PublicArticlePreview
              headline={formData.title || originalHeadline}
              summary={formData.description || originalDescription}
              category={formData.category || 'महाराष्ट्र'}
              imageUrl={formData.image_url || ''}
              author={formData.author || 'विशेष वार्ताहर'}
              sourceName={sourceName}
              sourceUrl={currentStory.source_url}
              publishedDate={publishedDateFormatted}
              tags={formData.tags || ''}
            />
          </div>
        )}

        {/* VIEW 3: WIRE VIEW ONLY */}
        {viewMode === 'wire' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <OriginalWireBox
              headline={originalHeadline}
              description={originalDescription}
              sourceName={sourceName}
              sourceGroup={sourceGroup}
              sourceUrl={currentStory.source_url}
              publishedDate={publishedDateFormatted}
              contentHash={currentStory.content_hash}
              copiedField={copiedField}
              onCopyText={handleCopyText}
              onCopyToEditor={handleCopyWireToEditor}
              expanded
            />
          </div>
        )}

        {/* VIEW 4: SPLIT VIEW (Editor Left + Live Preview Right) */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Column 1: Editorial Form with Wire Collapsible */}
            <div className="space-y-4">
              <div className="bg-stone-100 dark:bg-stone-900 p-3 rounded border border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">
                  <span>मूळ स्रोत: {sourceName}</span>
                  <a
                    href={currentStory.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-700 dark:text-red-400 inline-flex items-center gap-1 hover:underline"
                  >
                    संकेतस्थळ <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-300 font-serif line-clamp-2">
                  {originalHeadline}
                </p>
              </div>

              <EditorialForm
                formData={formData}
                onFieldChange={handleFieldChange}
                categoryAccentColor={currentCategoryData?.accentColor}
                onSaveDraft={handleSaveDraft}
                isSaving={isSaving}
                isDirty={isDirty}
              />
            </div>

            {/* Column 2: Live Public Preview */}
            <div className="sticky top-20 max-h-[85vh] overflow-y-auto space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 p-2.5 rounded border border-emerald-300 dark:border-emerald-800">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  थेट पूर्वावलोकन (Live Preview)
                </span>
                <span className="text-[11px] font-normal text-emerald-700 dark:text-emerald-300">
                  बदल करताच त्वरित अपडेट
                </span>
              </div>

              <PublicArticlePreview
                headline={formData.title || originalHeadline}
                summary={formData.description || originalDescription}
                category={formData.category || 'महाराष्ट्र'}
                imageUrl={formData.image_url || ''}
                author={formData.author || 'विशेष वार्ताहर'}
                sourceName={sourceName}
                sourceUrl={currentStory.source_url}
                publishedDate={publishedDateFormatted}
                tags={formData.tags || ''}
                compact
              />
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 4. MODALS FOR STATUS ACTIONS */}
      {/* ========================================================= */}

      {/* A. CONFIRM REVIEW MODAL */}
      {showReviewModal && (
        <ConfirmationModal
          title="पुनरावलोकन विभागात हलवा"
          confirmLabel="होय, पुनरावलोकनास द्या"
          confirmClass="bg-amber-600 hover:bg-amber-700"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          loading={isActionLoading === 'review'}
          onCancel={() => setShowReviewModal(false)}
          onConfirm={handleExecuteReview}
        >
          <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
            सदर बातमी <strong>पुनरावलोकन (Review)</strong> स्थितीत हलवली जाईल. आपण यातील मसुदा बदल व
            तथ्य पडताळणी सुरू करू शकता:
          </p>
          <p className="font-serif font-bold text-xs p-2.5 bg-stone-100 dark:bg-stone-800 rounded">
            "{formData.title || originalHeadline}"
          </p>
        </ConfirmationModal>
      )}

      {/* B. CONFIRM APPROVE MODAL */}
      {showApproveModal && (
        <ConfirmationModal
          title="बातमी प्रकाशनासाठी मंजूर करा"
          confirmLabel="होय, मंजूर करा (Approve)"
          confirmClass="bg-blue-700 hover:bg-blue-800"
          icon={<CheckCircle className="w-5 h-5 text-blue-600" />}
          loading={isActionLoading === 'approve'}
          onCancel={() => setShowApproveModal(false)}
          onConfirm={handleExecuteApprove}
        >
          <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
            सदर बातमी <strong>मंजूर (Approved)</strong> स्थितीत जाईल आणि अंतिम प्रकाशनासाठी सज्ज
            होईल:
          </p>
          <p className="font-serif font-bold text-xs p-2.5 bg-stone-100 dark:bg-stone-800 rounded">
            "{formData.title || originalHeadline}"
          </p>
        </ConfirmationModal>
      )}

      {/* C. CONFIRM PUBLISH MODAL */}
      {showPublishModal && (
        <ConfirmationModal
          title="सार्वजनिक वृत्तपत्रावर थेट प्रकाशित करा"
          confirmLabel="होय, थेट प्रकाशित करा (Live Publish)"
          confirmClass="bg-emerald-700 hover:bg-emerald-800"
          icon={<Send className="w-5 h-5 text-emerald-600" />}
          loading={isActionLoading === 'publish'}
          onCancel={() => setShowPublishModal(false)}
          onConfirm={handleExecutePublish}
        >
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 mb-3">
            <strong>महत्त्वाची नोंद:</strong> ही बातमी सार्वजनिक संकेतस्थळावर सर्व वाचकांसाठी त्वरित
            उपलब्ध होईल.
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
            खालील संपादकीय शीर्षक प्रकाशित केले जाईल:
          </p>
          <p className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 p-2.5 bg-stone-100 dark:bg-stone-800 rounded mb-2">
            "{formData.title || originalHeadline}"
          </p>
          <div className="text-[11px] text-stone-500">
            विभाग: <strong>{formData.category}</strong> • लेखक: <strong>{formData.author}</strong>
          </div>
        </ConfirmationModal>
      )}

      {/* D. CONFIRM REJECT MODAL */}
      {showRejectModal && (
        <ConfirmationModal
          title="बातमी नाकारा (Reject Story)"
          confirmLabel="होय, नाकारा (Reject)"
          confirmClass="bg-rose-700 hover:bg-rose-800"
          icon={<XCircle className="w-5 h-5 text-rose-600" />}
          loading={isActionLoading === 'reject'}
          onCancel={() => setShowRejectModal(false)}
          onConfirm={handleExecuteReject}
        >
          <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
            ही बातमी संपादकीय प्रवाहातून काढून <strong>नाकारलेल्या (Rejected)</strong> विभागात ठेवली
            जाईल:
          </p>
          <p className="font-serif font-bold text-xs p-2.5 bg-stone-100 dark:bg-stone-800 rounded mb-3">
            "{formData.title || originalHeadline}"
          </p>
          <div>
            <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
              नाकारण्याचे कारण (संपादकीय शेऱ्यामध्ये नोंदवले जाईल):
            </label>
            <input
              type="text"
              placeholder="उदा. अपुरी माहिती, संदर्भ त्रुटी, संशयास्पद स्रोत..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </ConfirmationModal>
      )}

      {/* E. CONFIRM ARCHIVE MODAL */}
      {showArchiveModal && (
        <ConfirmationModal
          title="बातमी संग्रहित करा (Archive)"
          confirmLabel="होय, संग्रहित करा"
          confirmClass="bg-stone-700 hover:bg-stone-800 text-white"
          icon={<Archive className="w-5 h-5 text-stone-600" />}
          loading={isActionLoading === 'archive'}
          onCancel={() => setShowArchiveModal(false)}
          onConfirm={handleExecuteArchive}
        >
          <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
            सदर बातमी संग्रहित (Archived) विभागात हलवली जाईल:
          </p>
          <p className="font-serif font-bold text-xs p-2.5 bg-stone-100 dark:bg-stone-800 rounded">
            "{formData.title || originalHeadline}"
          </p>
        </ConfirmationModal>
      )}
    </div>
  );
};

// ====================================================================
// SUB-COMPONENT: ORIGINAL SOURCE WIRE (IMMUTABLE READ-ONLY BOX)
// ====================================================================
interface OriginalWireBoxProps {
  headline: string;
  description: string;
  sourceName: string;
  sourceGroup: string;
  sourceUrl: string;
  publishedDate: string;
  contentHash: string;
  copiedField: string | null;
  onCopyText: (text: string, fieldName: string) => void;
  onCopyToEditor: () => void;
  expanded?: boolean;
}

const OriginalWireBox: React.FC<OriginalWireBoxProps> = ({
  headline,
  description,
  sourceName,
  sourceGroup,
  sourceUrl,
  publishedDate,
  contentHash,
  copiedField,
  onCopyText,
  onCopyToEditor,
  expanded = false,
}) => {
  return (
    <div className="bg-stone-100/80 dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
      {/* Box Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            <Lock className="w-3.5 h-3.5" />
          </span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              मूळ स्रोत वायर माहिती (Original Wire Attribution)
            </h3>
            <span className="text-[10px] text-stone-500">
              अपरिवर्तनीय मूळ डेटा • Immutable Source Wire Record
            </span>
          </div>
        </div>

        <button
          onClick={onCopyToEditor}
          className="text-xs text-red-700 dark:text-red-400 hover:text-red-800 font-semibold cursor-pointer inline-flex items-center gap-1 bg-white dark:bg-stone-800 px-2.5 py-1 rounded border border-stone-300 dark:border-stone-700 hover:border-red-400"
          title="मूळ शीर्षक आणि वर्णन संपादकीय फॉर्ममध्ये भरा"
        >
          <Copy className="w-3 h-3" />
          <span>फॉर्ममध्ये कॉपी करा</span>
        </button>
      </div>

      {/* Metadata Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-white dark:bg-stone-800/60 rounded border border-stone-200 dark:border-stone-800">
          <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
            स्रोत संस्था (Wire Provider)
          </span>
          <strong className="text-stone-900 dark:text-stone-100">{sourceName}</strong>
        </div>

        <div className="p-2 bg-white dark:bg-stone-800/60 rounded border border-stone-200 dark:border-stone-800">
          <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
            स्रोत गट (Source Group)
          </span>
          <span className="font-semibold text-stone-800 dark:text-stone-200">
            {SOURCE_GROUP_META[sourceGroup]?.icon}
            {SOURCE_GROUP_META[sourceGroup]?.label || sourceGroup}
          </span>
        </div>

        <div className="p-2 bg-white dark:bg-stone-800/60 rounded border border-stone-200 dark:border-stone-800">
          <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
            प्रकाशन तारीख (Wire Timestamp)
          </span>
          <span className="text-stone-700 dark:text-stone-300">{publishedDate}</span>
        </div>

        <div className="p-2 bg-white dark:bg-stone-800/60 rounded border border-stone-200 dark:border-stone-800">
          <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
            मूळ दुवा (Original Source URL)
          </span>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-700 dark:text-red-400 hover:underline font-medium inline-flex items-center gap-1 truncate max-w-full"
            title={sourceUrl}
          >
            <span>मूळ संकेतस्थळावर उघडा</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
      </div>

      {/* Original Headline */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
          <span>मूळ शीर्षक (Original Source Headline):</span>
          <button
            onClick={() => onCopyText(headline, 'origTitle')}
            className="text-[10px] text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 inline-flex items-center gap-1 cursor-pointer"
          >
            {copiedField === 'origTitle' ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span>{copiedField === 'origTitle' ? 'कॉपी झाले!' : 'कॉपी करा'}</span>
          </button>
        </div>
        <div className="p-3 bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 text-sm font-serif font-bold text-stone-900 dark:text-stone-100 select-all leading-snug">
          {headline}
        </div>
      </div>

      {/* Original Description */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
          <span>मूळ वर्णन / बातमी (Original Source Description):</span>
          <button
            onClick={() => onCopyText(description, 'origDesc')}
            className="text-[10px] text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 inline-flex items-center gap-1 cursor-pointer"
          >
            {copiedField === 'origDesc' ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span>{copiedField === 'origDesc' ? 'कॉपी झाले!' : 'कॉपी करा'}</span>
          </button>
        </div>
        <div
          className={`p-3 bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans whitespace-pre-line select-all ${
            expanded ? '' : 'max-h-60 overflow-y-auto'
          }`}
        >
          {description || '(कोणतेही अतिरिक्त वर्णन उपलब्ध नाही)'}
        </div>
      </div>

      {/* D1 SHA-256 Content Hash */}
      <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[10px] text-stone-400 font-mono">
        <span className="flex items-center gap-1">
          <Hash className="w-3 h-3" />
          D1 SHA-256 Hash:
        </span>
        <span className="truncate max-w-[220px]" title={contentHash}>
          {contentHash}
        </span>
      </div>
    </div>
  );
};

// ====================================================================
// SUB-COMPONENT: EDITORIAL FORM (EDITABLE CONTENT)
// ====================================================================
interface EditorialFormProps {
  formData: EditorialUpdatePayload;
  onFieldChange: (field: keyof EditorialUpdatePayload, value: string) => void;
  categoryAccentColor?: string;
  onSaveDraft: () => void;
  isSaving: boolean;
  isDirty: boolean;
}

const EditorialForm: React.FC<EditorialFormProps> = ({
  formData,
  onFieldChange,
  categoryAccentColor = '#b91c1c',
  onSaveDraft,
  isSaving,
  isDirty,
}) => {
  const headlineLength = (formData.title || '').length;
  const wordCount = (formData.description || '').trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-lg p-4 sm:p-6 shadow-xs space-y-5">
      {/* Form Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">
            <PenTool className="w-3.5 h-3.5" />
          </span>
          <div>
            <h3 className="text-sm font-serif font-bold text-stone-900 dark:text-stone-100">
              संपादकीय संपादन (Editorial Content)
            </h3>
            <span className="text-[11px] text-stone-500">
              येथे केले जाणारे बदल वृत्तपत्रावर दिसतील • Edit Marathi Headline & Copy
            </span>
          </div>
        </div>

        <button
          onClick={onSaveDraft}
          disabled={isSaving}
          className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5 ${
            isDirty
              ? 'bg-red-700 hover:bg-red-800 text-white'
              : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'जतन...' : 'मसुदा जतन'}</span>
        </button>
      </div>

      {/* Field 1: Marathi Headline */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
          <label htmlFor="ed-title" className="flex items-center gap-1">
            <span>संपादकीय मराठी शीर्षक (Marathi Headline) *</span>
          </label>
          <span
            className={`text-[11px] font-mono ${
              headlineLength > 100
                ? 'text-amber-600 font-bold'
                : 'text-stone-500'
            }`}
          >
            {headlineLength} / १०० वर्ण
          </span>
        </div>
        <input
          id="ed-title"
          type="text"
          value={formData.title || ''}
          onChange={(e) => onFieldChange('title', e.target.value)}
          placeholder="वाचकांचे लक्ष वेधून घेणारे स्पष्ट मराठी शीर्षक प्रविष्ट करा..."
          className="w-full p-3 text-base sm:text-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md font-serif font-bold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:outline-hidden leading-snug"
        />
        <p className="text-[11px] text-stone-500 dark:text-stone-400">
          वृत्तपत्राच्या शैलीनुसार निर्भीड, वस्तुनिष्ठ आणि वाचनीय मराठी शीर्षक द्या.
        </p>
      </div>

      {/* Field 2: Article / Summary Text */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
          <label htmlFor="ed-desc">संपादकीय बातमी / सारांश मजकूर (Article Copy / Summary) *</label>
          <span className="text-[11px] font-mono text-stone-500">
            {wordCount} शब्द
          </span>
        </div>
        <textarea
          id="ed-desc"
          rows={7}
          value={formData.description || ''}
          onChange={(e) => onFieldChange('description', e.target.value)}
          placeholder="बातम्याचा संपूर्ण तपशील किंवा वाचनीय सारांश येथे लिहा..."
          className="w-full p-3 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 leading-relaxed font-sans focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:outline-hidden"
        />
        <p className="text-[11px] text-stone-500 dark:text-stone-400">
          पॅराग्राफ वेगळे करण्यासाठी Enter दाबा. वृत्तपत्राच्या पानावर हे परिच्छेद सुवाच्य पद्धतीने दिसतील.
        </p>
      </div>

      {/* Row 3: Category & Author Attribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category */}
        <div className="space-y-1.5">
          <label htmlFor="ed-cat" className="block text-xs font-bold text-stone-700 dark:text-stone-300">
            विभाग / वर्गवारी (Category) *
          </label>
          <div className="relative">
            <select
              id="ed-cat"
              value={formData.category || 'महाराष्ट्र'}
              onChange={(e) => onFieldChange('category', e.target.value)}
              className="w-full p-2.5 text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md font-semibold text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-red-600"
            >
              {VALID_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <span
              className="absolute right-3 top-3 w-3 h-3 rounded-full pointer-events-none"
              style={{ backgroundColor: categoryAccentColor }}
              title={`विभाग रंग: ${categoryAccentColor}`}
            />
          </div>
        </div>

        {/* Author Attribution */}
        <div className="space-y-1.5">
          <label htmlFor="ed-author" className="block text-xs font-bold text-stone-700 dark:text-stone-300">
            लेखक / वार्ताहर (Author Attribution)
          </label>
          <input
            id="ed-author"
            type="text"
            value={formData.author || ''}
            onChange={(e) => onFieldChange('author', e.target.value)}
            placeholder="विशेष वार्ताहर / बहुमोल न्यूज डेस्क"
            className="w-full p-2.5 text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-red-600"
          />
        </div>
      </div>

      {/* Field 4: Image URL & Preview */}
      <div className="space-y-2">
        <label htmlFor="ed-img" className="block text-xs font-bold text-stone-700 dark:text-stone-300">
          प्रतिमा दुवा (Image / Thumbnail URL)
        </label>
        <div className="flex gap-2">
          <input
            id="ed-img"
            type="text"
            value={formData.image_url || ''}
            onChange={(e) => onFieldChange('image_url', e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="flex-1 p-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md font-mono text-stone-700 dark:text-stone-300"
          />
          {formData.image_url && (
            <button
              onClick={() => onFieldChange('image_url', '')}
              className="px-2.5 py-1 text-xs text-stone-500 hover:text-rose-600 rounded border border-stone-300 dark:border-stone-700 cursor-pointer"
            >
              काढून टाका
            </button>
          )}
        </div>

        {/* Image Preview Box */}
        {formData.image_url && (
          <div className="mt-2 relative rounded overflow-hidden max-h-48 border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800">
            <img
              src={formData.image_url}
              alt="बातमी प्रतिमा पूर्वावलोकन"
              onError={(e) => {
                // Image failed to load
                (e.target as HTMLElement).style.display = 'none';
              }}
              className="w-full h-40 object-cover"
            />
            <span className="absolute bottom-1 right-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded">
              प्रतिमा पूर्वावलोकन
            </span>
          </div>
        )}
      </div>

      {/* Field 5: Tags Editor */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
          <label htmlFor="ed-tags">टॅग्ज (Tags, स्वल्पविरामाने वेगळे करा)</label>
          <span className="text-[11px] text-stone-500">उदा. महाराष्ट्र, शेती, बजेट</span>
        </div>
        <input
          id="ed-tags"
          type="text"
          value={formData.tags || ''}
          onChange={(e) => onFieldChange('tags', e.target.value)}
          placeholder="महाराष्ट्र, प्रशासन, दुष्काळ, जलसंधारण..."
          className="w-full p-2.5 text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-red-600"
        />

        {/* Quick Tag Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] text-stone-400">द्रुत टॅग्ज:</span>
          {QUICK_TAGS.map((tag) => {
            const currentTags = (formData.tags || '').split(',').map((t) => t.trim());
            const hasTag = currentTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  if (hasTag) {
                    const next = currentTags.filter((t) => t !== tag).join(', ');
                    onFieldChange('tags', next);
                  } else {
                    const next = formData.tags?.trim() ? `${formData.tags.trim()}, ${tag}` : tag;
                    onFieldChange('tags', next);
                  }
                }}
                className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  hasTag
                    ? 'bg-red-700 text-white font-bold'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                }`}
              >
                {hasTag ? `✓ ${tag}` : `+ ${tag}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Field 6: Editorial Notes */}
      <div className="space-y-1.5 pt-2 border-t border-stone-200 dark:border-stone-800">
        <label htmlFor="ed-notes" className="block text-xs font-bold text-stone-700 dark:text-stone-300">
          संपादकीय अंतर्गत शेरा / पडताळणी नोंद (Editorial Internal Notes)
        </label>
        <textarea
          id="ed-notes"
          rows={2}
          value={formData.editorial_notes || ''}
          onChange={(e) => onFieldChange('editorial_notes', e.target.value)}
          placeholder="तथ्य पडताळणी पूर्ण झाली; अधिकृत सरकारी गॅझेटशी जुळवून पाहिले..."
          className="w-full p-2.5 text-xs bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-md text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:ring-1 focus:ring-amber-600"
        />
        <p className="text-[10px] text-stone-500">
          हा शेरा केवळ अंतर्गत वृत्तकक्ष टीमला दिसतो. वाचकांना संकेतस्थळावर कधीही दाखवला जात नाही.
        </p>
      </div>
    </div>
  );
};

// ====================================================================
// SUB-COMPONENT: PUBLIC ARTICLE PREVIEW (REPRODUCING WEBSITE LAYOUT)
// ====================================================================
interface PublicArticlePreviewProps {
  headline: string;
  summary: string;
  category: string;
  imageUrl?: string;
  author: string;
  sourceName: string;
  sourceUrl: string;
  publishedDate: string;
  tags?: string;
  compact?: boolean;
}

const PublicArticlePreview: React.FC<PublicArticlePreviewProps> = ({
  headline,
  summary,
  category,
  imageUrl,
  author,
  sourceName,
  sourceUrl,
  publishedDate,
  tags,
  compact = false,
}) => {
  const cat = getCategoryBySlug(category);
  const accentColor = cat?.accentColor || '#b91c1c';
  const tagList = tags
    ? tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <article className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-lg overflow-hidden shadow-md font-sans">
      {/* Newspaper Masthead Bar */}
      <div className="bg-stone-900 text-stone-100 px-4 py-2 border-b border-stone-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-serif font-black uppercase tracking-wider text-red-500">
            दैनिक बहुमोल समाज
          </span>
          <span className="text-stone-500">|</span>
          <span className="text-stone-400 text-[11px]">साप्ताहिक समालोचन</span>
        </div>
        <span className="text-[10px] text-stone-400 font-mono">वाचक दृश्य पूर्वावलोकन</span>
      </div>

      {/* Accent Ribbon */}
      <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }} />

      <div className="p-4 sm:p-6 space-y-4">
        {/* Category & Date Line */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-stone-500 border-b border-stone-200 dark:border-stone-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-[11px] font-bold text-white uppercase tracking-wider"
              style={{ backgroundColor: accentColor }}
            >
              {category}
            </span>
            <span>•</span>
            <span>{publishedDate}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
            <Clock className="w-3 h-3" />
            <span>३ मिनिटे वाचन वेळ</span>
          </div>
        </div>

        {/* Marathi Newspaper Headline */}
        <h1
          className={`font-serif font-black text-stone-900 dark:text-stone-100 leading-snug tracking-tight ${
            compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl lg:text-4xl'
          }`}
        >
          {headline || 'मराठी शीर्षक येथे दिसेल...'}
        </h1>

        {/* Byline / Attribution */}
        <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded border border-stone-200 dark:border-stone-800 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-700 font-bold text-xs">
              {author.slice(0, 1) || 'व'}
            </div>
            <div>
              <div className="font-bold text-stone-900 dark:text-stone-200">{author}</div>
              <div className="text-[10px] text-stone-500">
                मूळ स्रोत: <strong className="text-stone-700 dark:text-stone-300">{sourceName}</strong>
              </div>
            </div>
          </div>

          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-700 dark:text-red-400 hover:underline text-[11px] font-semibold inline-flex items-center gap-1"
          >
            अधिकृत स्रोत दुवा <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Featured Image */}
        {imageUrl ? (
          <div className="rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800 max-h-96">
            <img
              src={imageUrl}
              alt={headline}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="p-6 rounded-lg bg-stone-100 dark:bg-stone-800/40 border border-dashed border-stone-300 dark:border-stone-700 text-center text-xs text-stone-400">
            (या बातमीसाठी प्रतिमा जोडलेली नाही - मजकूर थेट प्रसारित होईल)
          </div>
        )}

        {/* Formatted Article Body */}
        <div className="space-y-3 pt-2 text-stone-800 dark:text-stone-200 font-sans text-sm sm:text-base leading-relaxed">
          {summary ? (
            summary.split('\n\n').map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))
          ) : (
            <p className="text-stone-400 italic">बातमीचा मजकूर येथे दिसेल...</p>
          )}
        </div>

        {/* Tags Line */}
        {tagList.length > 0 && (
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-stone-500 font-bold flex items-center gap-1">
              <Tag className="w-3 h-3" /> टॅग्ज:
            </span>
            {tagList.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

// ====================================================================
// SUB-COMPONENT: REUSABLE CONFIRMATION MODAL
// ====================================================================
interface ConfirmationModalProps {
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  confirmClass?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  children,
  confirmLabel,
  confirmClass = 'bg-red-700 hover:bg-red-800',
  icon,
  loading = false,
  onCancel,
  onConfirm,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
          {icon}
          <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
            {title}
          </h3>
        </div>

        <div className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 space-y-2">
          {children}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-3.5 py-1.5 border border-stone-300 dark:border-stone-700 rounded text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition-colors"
          >
            रद्द करा
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-1.5 rounded text-xs font-bold text-white transition-all cursor-pointer shadow-xs ${confirmClass}`}
          >
            {loading ? 'प्रक्रिया सुरू आहे...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
