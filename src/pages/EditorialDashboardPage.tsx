/**
 * @file EditorialDashboardPage.tsx
 * Professional Newsroom Editorial Dashboard for Bahumol Samaj Weekly Newspaper.
 * Production-Safe Authentication:
 * - Newsroom Login Screen
 * - HttpOnly Cookie & Server-Side D1 Session
 * - Logout Button & Session Expiration Handling
 * - Complete status flow: Incoming -> Review -> Edit -> Approve -> Publish / Reject / Archive
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  newsService,
  EditorialStory,
  EditorialStats,
  EditorialUpdatePayload,
} from '../services/newsService';
import { VALID_CATEGORIES } from '../worker/classifier';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Edit3,
  Send,
  Archive,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  Lock,
  LogOut,
  ShieldCheck,
  Check,
  Building2,
  Radio,
  Globe,
  Tag,
  PenTool,
  History,
  FileCheck2,
  AlertTriangle,
  KeyRound,
} from 'lucide-react';
import { StoryWorkspace } from '../components/editorial/StoryWorkspace';

interface EditorialDashboardPageProps {
  onNavigateHome: () => void;
  onNavigateTimeline?: () => void;
  initialStoryId?: string;
}

type TabType = 'incoming' | 'review' | 'approved' | 'published' | 'rejected' | 'archived' | 'all';

const SOURCE_GROUP_META: Record<string, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  'Government Sources': {
    label: 'शासकीय अधिकृत',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    icon: <Building2 className="w-3 h-3 text-emerald-700 dark:text-emerald-400 inline mr-1" />,
  },
  'Indian News': {
    label: 'राष्ट्रीय वृत्त',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    icon: <Radio className="w-3 h-3 text-amber-700 dark:text-amber-400 inline mr-1" />,
  },
  'International News': {
    label: 'आंतरराष्ट्रीय',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
    icon: <Globe className="w-3 h-3 text-sky-700 dark:text-sky-400 inline mr-1" />,
  },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  incoming: { label: 'प्राप्त (Incoming)', color: 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-300' },
  review: { label: 'पुनरावलोकन (Review)', color: 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200' },
  approved: { label: 'मंजूर (Approved)', color: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300' },
  published: { label: 'प्रकाशित (Published)', color: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300' },
  rejected: { label: 'नाकारले (Rejected)', color: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300' },
  archived: { label: 'संग्रहित (Archived)', color: 'bg-stone-100 text-stone-600 dark:bg-stone-900 dark:text-stone-400' },
};

export const EditorialDashboardPage: React.FC<EditorialDashboardPageProps> = ({
  onNavigateHome,
  onNavigateTimeline,
  initialStoryId,
}) => {
  // Authentication State
  const [authState, setAuthState] = useState<{
    checking: boolean;
    authenticated: boolean;
    user?: { role: string; editorInChief: string };
  }>({
    checking: true,
    authenticated: false,
  });

  // Dedicated Story Workspace State
  const [selectedStoryForWorkspace, setSelectedStoryForWorkspace] = useState<EditorialStory | null>(null);

  // Login Form State
  const [loginSecret, setLoginSecret] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard Tab & Stats State
  const [activeTab, setActiveTab] = useState<TabType>('incoming');
  const [stats, setStats] = useState<EditorialStats>({
    all: 0,
    incoming: 0,
    review: 0,
    approved: 0,
    published: 0,
    rejected: 0,
    archived: 0,
  });

  const [stories, setStories] = useState<EditorialStory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Inspection & Editing Modal
  const [inspectingStory, setInspectingStory] = useState<EditorialStory | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<EditorialUpdatePayload>({});

  // Confirmation Modals
  const [confirmPublishStory, setConfirmPublishStory] = useState<EditorialStory | null>(null);
  const [confirmRejectStory, setConfirmRejectStory] = useState<EditorialStory | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Notifications & Busy Actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Initial Check for Authenticated Session
  useEffect(() => {
    let isMounted = true;
    newsService.checkEditorialSession().then((res) => {
      if (isMounted) {
        setAuthState({
          checking: false,
          authenticated: res.authenticated,
          user: res.user,
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load counts
  const loadStats = useCallback(async () => {
    const s = await newsService.fetchEditorialStats();
    setStats(s);
  }, []);

  // Load stories for current active tab and filters
  const loadStories = useCallback(async (targetPage: number = 1) => {
    setLoading(true);
    try {
      const res =
        activeTab === 'incoming'
          ? await newsService.fetchEditorialIncoming({
              page: targetPage,
              limit: 20,
              category: selectedCategory,
              source_group: selectedGroup,
              search: searchQuery,
              sort: sortOrder,
            })
          : await newsService.fetchEditorialStories({
              status: activeTab === 'all' ? undefined : activeTab,
              page: targetPage,
              limit: 20,
              category: selectedCategory,
              source_group: selectedGroup,
              search: searchQuery,
              sort: sortOrder,
            });

      setStories(res.stories);
      setTotalPages(res.totalPages);
      setTotalCount(res.total);
      setPage(targetPage);
    } catch {
      showToast('बातम्या लोड करताना त्रुटी आली', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory, selectedGroup, searchQuery, sortOrder]);

  // Load data when authenticated
  useEffect(() => {
    if (authState.authenticated) {
      loadStats();
      loadStories(1);
    }
  }, [authState.authenticated, loadStats, loadStories]);

  // Open initialStoryId if provided in route
  useEffect(() => {
    if (initialStoryId && authState.authenticated) {
      newsService.fetchEditorialStoryById(initialStoryId).then((story) => {
        if (story) {
          setSelectedStoryForWorkspace(story);
        }
      });
    }
  }, [initialStoryId, authState.authenticated]);

  const handleOpenWorkspace = (story: EditorialStory) => {
    setSelectedStoryForWorkspace(story);
    window.location.hash = `#/editorial-desk/${story.id}`;
  };

  const handleCloseWorkspace = () => {
    setSelectedStoryForWorkspace(null);
    window.location.hash = '#/editorial-desk';
    loadStats();
    loadStories(page);
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginSecret.trim()) {
      setLoginError('कृपया संपादकीय सुरक्षा की प्रविष्ट करा.');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    const res = await newsService.loginEditorial(loginSecret);
    setLoginLoading(false);

    if (res.success) {
      setLoginSecret('');
      setAuthState({
        checking: false,
        authenticated: true,
        user: (res.user as { role: string; editorInChief: string }) || {
          role: 'editor',
          editorInChief: 'दिलीप सोनाळे',
        },
      });
      showToast('संपादकीय नियंत्रण कक्षात आपले स्वागत आहे');
    } else {
      setLoginError(res.message || 'अवैध संपादकीय सुरक्षा की');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    setActionLoading('logout');
    await newsService.logoutEditorial();
    setActionLoading(null);
    setAuthState({
      checking: false,
      authenticated: false,
    });
    setStories([]);
    showToast('सत्र यशस्वीरीत्या समाप्त केले');
  };

  // Open story for inspection/review
  const handleOpenReview = (story: EditorialStory, openInEdit: boolean = false) => {
    setInspectingStory(story);
    setIsEditMode(openInEdit);
    setEditForm({
      title: story.title,
      description: story.description || '',
      content: story.content || story.description || '',
      category: story.category,
      language: story.language || 'mr',
      image_url: story.image_url || '',
      author: story.author || '',
      tags: story.tags || '',
      editorial_notes: story.editorial_notes || '',
    });
  };

  // Save Editorial Changes (PATCH)
  const handleSaveEdit = async () => {
    if (!inspectingStory) return;
    setActionLoading('save');
    const res = await newsService.updateEditorialStory(inspectingStory.id, editForm);
    setActionLoading(null);

    if (res.success && res.data) {
      showToast('संपादकीय बदल यशस्वीरीत्या जतन झाले');
      setInspectingStory(res.data);
      setIsEditMode(false);
      loadStats();
      loadStories(page);
    } else {
      showToast(res.message || 'बदल जतन करण्यात अयशस्वी', 'error');
    }
  };

  // Move to review
  const handleMoveToReview = async (story: EditorialStory) => {
    setActionLoading(story.id);
    const res = await newsService.reviewStory(story.id);
    setActionLoading(null);

    if (res.success) {
      showToast('बातमी पुनरावलोकन विभागात हलवली');
      if (inspectingStory && inspectingStory.id === story.id && res.data) {
        setInspectingStory(res.data);
      }
      loadStats();
      loadStories(page);
    } else {
      showToast(res.message || 'कृती अयशस्वी', 'error');
    }
  };

  // Approve Story
  const handleApprove = async (story: EditorialStory) => {
    setActionLoading(story.id);
    const res = await newsService.approveStory(story.id);
    setActionLoading(null);

    if (res.success) {
      showToast('बातमी प्रकाशनासाठी मंजूर केली');
      if (inspectingStory && inspectingStory.id === story.id && res.data) {
        setInspectingStory(res.data);
      }
      loadStats();
      loadStories(page);
    } else {
      showToast(res.message || 'मंजूर करण्यात अयशस्वी', 'error');
    }
  };

  // Confirm and Publish Story
  const handleExecutePublish = async () => {
    if (!confirmPublishStory) return;
    const storyId = confirmPublishStory.id;
    setActionLoading(storyId);
    const res = await newsService.publishStory(storyId);
    setActionLoading(null);
    setConfirmPublishStory(null);

    if (res.success) {
      showToast('बातमी सार्वजनिक टाइमलाइनवर प्रकाशित झाली!');
      if (inspectingStory && inspectingStory.id === storyId && res.data) {
        setInspectingStory(res.data);
      }
      loadStats();
      loadStories(page);
    } else {
      showToast(res.message || 'प्रकाशित करण्यात अयशस्वी', 'error');
    }
  };

  // Confirm and Reject Story
  const handleExecuteReject = async () => {
    if (!confirmRejectStory) return;
    const storyId = confirmRejectStory.id;
    setActionLoading(storyId);
    const res = await newsService.rejectStory(storyId, rejectReason);
    setActionLoading(null);
    setConfirmRejectStory(null);
    setRejectReason('');

    if (res.success) {
      showToast('बातमी नाकारली');
      if (inspectingStory && inspectingStory.id === storyId && res.data) {
        setInspectingStory(res.data);
      }
      loadStats();
      loadStories(page);
    } else {
      showToast(res.message || 'नाकारण्यात अयशस्वी', 'error');
    }
  };

  // Archive Story
  const handleArchive = async (story: EditorialStory) => {
    setActionLoading(story.id);
    const res = await newsService.archiveStory(story.id);
    setActionLoading(null);

    if (res.success) {
      showToast('बातमी संग्रहित केली');
      if (inspectingStory && inspectingStory.id === story.id && res.data) {
        setInspectingStory(res.data);
      }
      loadStats();
      loadStories(page);
    } else {
      showToast(res.message || 'संग्रहित करण्यात अयशस्वी', 'error');
    }
  };

  // Trigger manual RSS collection
  const handleTriggerIngest = async () => {
    setActionLoading('ingest');
    showToast('आरएसएस स्रोतांवरून ताज्या बातम्या संकलित होत आहेत...');
    const res = await newsService.triggerManualIngestion();
    setActionLoading(null);

    if (res.success) {
      showToast('नवीन वृत्त संकलन पूर्ण झाले');
      loadStats();
      loadStories(1);
    } else {
      showToast(res.message || 'संकलन अयशस्वी', 'error');
    }
  };

  // =============================================================
  // RENDER STATE 1: CHECKING INITIAL SESSION
  // =============================================================
  if (authState.checking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-stone-500 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-red-700 mb-3" />
        <p className="text-sm font-medium">संपादकीय सत्र पडताळणी सुरू आहे...</p>
      </div>
    );
  }

  // =============================================================
  // RENDER STATE 2: AUTHENTICATION LOGIN SCREEN
  // =============================================================
  if (!authState.authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 font-sans">
        {/* Back navigation */}
        <div className="mb-6">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-red-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            मुख्य वर्तमानपत्राकडे परत जा
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-lg p-6 sm:p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-red-100 dark:bg-red-950/60 rounded-full text-red-700 dark:text-red-400 mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <div className="text-xs uppercase tracking-widest font-bold text-red-700 mb-1">
              बहुमोल समाज • अंतर्गत डेस्क
            </div>
            <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
              संपादकीय नियंत्रण कक्ष
            </h1>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
              मुख्य संपादक: <strong className="text-stone-900 dark:text-stone-200">दिलीप सोनाळे</strong>
            </p>
          </div>

          {/* Security Alert / Info Box */}
          <div className="p-3 bg-stone-100 dark:bg-stone-800/60 rounded border border-stone-200 dark:border-stone-700/80 mb-5 text-xs text-stone-600 dark:text-stone-300">
            <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              सुरक्षित प्रमाणीकरण
            </div>
            <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
              हा कक्ष केवळ अधिकृत संपादकांसाठी राखीव आहे. Cloudflare Worker सीक्रेट{' '}
              <code className="font-mono text-stone-800 dark:text-stone-200">ADMIN_API_KEY</code> द्वारे ओळख
              पडताळली जाते.
            </p>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-bold">प्रवेश नाकारला</p>
                <p>{loginError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                संपादकीय सुरक्षा की (Secret Access Key)
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="सुरक्षा की प्रविष्ट करा..."
                  value={loginSecret}
                  onChange={(e) => setLoginSecret(e.target.value)}
                  disabled={loginLoading}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
                  autoFocus
                />
                <KeyRound className="w-4 h-4 absolute right-3 top-2.5 text-stone-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white rounded font-bold text-xs sm:text-sm tracking-wide transition-colors shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  पडताळणी सुरू आहे...
                </>
              ) : (
                'संपादकीय कक्षात प्रवेश करा'
              )}
            </button>
          </form>

          {/* Cloudflare Setup Note */}
          <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 text-center">
            <span className="text-[11px] text-stone-400 font-sans">
              स्थानिक विकासासाठी <code className="font-mono text-stone-500">.dev.vars</code> वापरा.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================
  // RENDER STATE 2.5: DEDICATED STORY WORKSPACE
  // =============================================================
  if (selectedStoryForWorkspace) {
    return (
      <StoryWorkspace
        story={selectedStoryForWorkspace}
        onBack={handleCloseWorkspace}
        onStoryUpdated={(updated) => {
          setSelectedStoryForWorkspace(updated);
          setStories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        }}
        onStatsUpdated={loadStats}
        showToast={showToast}
      />
    );
  }

  // =============================================================
  // RENDER STATE 3: AUTHENTICATED EDITORIAL DASHBOARD
  // =============================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded shadow-lg flex items-center gap-2 text-xs sm:text-sm font-medium animate-fade-in ${
            toast.type === 'error' ? 'bg-rose-900 text-white' : 'bg-emerald-900 text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <XCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Dashboard Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1 text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            मुख्यपृष्ठ
          </button>
          <span className="text-stone-300 dark:text-stone-700">/</span>
          {onNavigateTimeline && (
            <>
              <button
                onClick={onNavigateTimeline}
                className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-red-700 cursor-pointer"
              >
                थेट टाइमलाइन
              </button>
              <span className="text-stone-300 dark:text-stone-700">/</span>
            </>
          )}
          <span className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-1">
            <PenTool className="w-3.5 h-3.5 text-red-600" />
            संपादकीय नियंत्रण कक्ष (Editorial Desk)
          </span>
        </div>

        {/* Action Controls: Active Session Info, Ingest trigger, Logout */}
        <div className="flex items-center gap-2">
          {/* Active Session Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-300 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>सत्र: सक्रिय</span>
          </div>

          {/* RSS Ingest Trigger */}
          <button
            onClick={handleTriggerIngest}
            disabled={actionLoading === 'ingest'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-700 hover:bg-red-800 text-white rounded font-medium cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${actionLoading === 'ingest' ? 'animate-spin' : ''}`} />
            {actionLoading === 'ingest' ? 'संकलन सुरू...' : 'आरएसएस संकलन'}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={actionLoading === 'logout'}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded border border-stone-300 dark:border-stone-700 cursor-pointer transition-colors"
            title="संपादकीय सत्र बंद करा"
          >
            <LogOut className="w-3.5 h-3.5 text-stone-500" />
            <span>लॉगआउट</span>
          </button>
        </div>
      </div>

      {/* 2. Banner & Editorial Persona Strip */}
      <div className="my-6 p-4 sm:p-5 bg-stone-900 text-stone-100 rounded shadow-sm border-l-4 border-red-600 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-red-700 text-white px-2 py-0.5 rounded">
              अंतर्गत प्रणाली • Internal Desk
            </span>
            <span className="text-xs text-stone-400 font-sans">
              मुख्य संपादक:{' '}
              <strong className="text-white">{authState.user?.editorInChief || 'दिलीप सोनाळे'}</strong>
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
            संपादकीय वृत्त पुनरावलोकन व मंजुरी कक्ष
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            शासकीय, राष्ट्रीय व आंतरराष्ट्रीय स्रोतांतून आलेली कच्ची माहिती तपासून, संपादन करून प्रकाशनासाठी
            मंजूर करा.
          </p>
        </div>

        {/* Protection Note */}
        <div className="bg-stone-800/80 p-3 rounded border border-stone-700 text-xs text-stone-300 max-w-xs font-mono">
          <div className="flex items-center gap-1 text-emerald-400 font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" /> सुरक्षित कार्यप्रवाह
          </div>
          <p className="text-[11px] leading-tight text-stone-400">
            कच्ची माहिती थेट प्रकाशित होत नाही. केवळ 'मंजूर' केलेल्या बातम्याच सार्वजनिक टाइमलाइनवर जातात.
          </p>
        </div>
      </div>

      {/* 3. Section Navigation Tabs (Status counters) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-stone-200 dark:border-stone-800 text-xs sm:text-sm font-medium">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t font-serif cursor-pointer transition-colors border-b-2 ${
            activeTab === 'incoming'
              ? 'border-red-700 text-red-700 dark:text-red-400 font-bold bg-white dark:bg-stone-900'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <span>📥 प्राप्त बातम्या (Incoming)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[11px] font-mono bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
            {stats.incoming}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('review')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t font-serif cursor-pointer transition-colors border-b-2 ${
            activeTab === 'review'
              ? 'border-red-700 text-red-700 dark:text-red-400 font-bold bg-white dark:bg-stone-900'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <span>🔍 पुनरावलोकन (Review)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {stats.review}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t font-serif cursor-pointer transition-colors border-b-2 ${
            activeTab === 'approved'
              ? 'border-red-700 text-red-700 dark:text-red-400 font-bold bg-white dark:bg-stone-900'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <span>✅ मंजूर (Approved)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            {stats.approved}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('published')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t font-serif cursor-pointer transition-colors border-b-2 ${
            activeTab === 'published'
              ? 'border-red-700 text-red-700 dark:text-red-400 font-bold bg-white dark:bg-stone-900'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <span>🚀 प्रकाशित (Published)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {stats.published}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t font-serif cursor-pointer transition-colors border-b-2 ${
            activeTab === 'rejected'
              ? 'border-red-700 text-red-700 dark:text-red-400 font-bold bg-white dark:bg-stone-900'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <span>🚫 नाकारलेले (Rejected)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[11px] font-mono bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-400">
            {stats.rejected}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('archived')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t font-serif cursor-pointer transition-colors border-b-2 ${
            activeTab === 'archived'
              ? 'border-red-700 text-red-700 dark:text-red-400 font-bold bg-white dark:bg-stone-900'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <span>📦 संग्रहित (Archived)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[11px] font-mono bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-400">
            {stats.archived}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t font-serif cursor-pointer transition-colors border-b-2 ${
            activeTab === 'all'
              ? 'border-red-700 text-red-700 dark:text-red-400 font-bold bg-white dark:bg-stone-900'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <span>सर्व (All: {stats.all})</span>
        </button>
      </div>

      {/* 4. Filter, Search & Sorting Controls */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3 sm:p-4 rounded my-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search by Headline */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="शीर्षक अथवा बातमीतील शब्दाने शोधा..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded focus:outline-hidden focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded px-2.5 py-1.5 focus:outline-hidden"
            >
              <option value="all">सर्व विभाग (All Categories)</option>
              {VALID_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Source Group Filter */}
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded px-2.5 py-1.5 focus:outline-hidden"
            >
              <option value="all">सर्व स्रोत गट (All Groups)</option>
              <option value="Government Sources">शासकीय अधिकृत (Government)</option>
              <option value="Indian News">राष्ट्रीय वृत्त (Indian News)</option>
              <option value="International News">आंतरराष्ट्रीय (International)</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded px-2.5 py-1.5 focus:outline-hidden"
            >
              <option value="newest">नवीनतम आधी (Newest First)</option>
              <option value="oldest">जुने आधी (Oldest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Stories List Table / Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded animate-pulse"
            >
              <div className="h-4 w-32 bg-stone-200 dark:bg-stone-800 rounded mb-2" />
              <div className="h-6 w-3/4 bg-stone-200 dark:bg-stone-800 rounded mb-2" />
              <div className="h-4 w-1/2 bg-stone-200 dark:bg-stone-800 rounded" />
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded my-4">
          <FileCheck2 className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-200 mb-1">
            या विभागात सध्या कोणतीही बातमी नाही
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-4">
            निवडलेले फिल्टर्स तपासा किंवा वर दिलेल्या 'आरएसएस संकलन' बटनावर क्लिक करून ताज्या बातम्या गोळा करा.
          </p>
          <button
            onClick={handleTriggerIngest}
            className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs rounded font-medium cursor-pointer"
          >
            ताज्या बातम्या संकलित करा
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => {
            const groupMeta =
              (story.source_group && SOURCE_GROUP_META[story.source_group]) || {
                label: story.source_group || 'वृत्त',
                badgeClass:
                  'bg-stone-100 text-stone-800 border-stone-300 dark:bg-stone-800 dark:text-stone-300',
                icon: null,
              };

            const statusMeta = STATUS_LABELS[story.status] || {
              label: story.status,
              color: 'bg-stone-200 text-stone-800',
            };

            return (
              <div
                key={story.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 p-4 sm:p-5 rounded transition-all shadow-2xs"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Thumbnail if available */}
                  {story.image_url && (
                    <div className="md:w-44 shrink-0 rounded overflow-hidden bg-stone-100 dark:bg-stone-800 aspect-16/10 md:aspect-auto">
                      <img
                        src={story.image_url}
                        alt={story.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Details & Actions */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Meta Tags Row */}
                      <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                        {/* Status Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>

                        {/* Source Group Badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${groupMeta.badgeClass}`}
                        >
                          {groupMeta.icon}
                          {groupMeta.label}
                        </span>

                        {/* Source Name */}
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          {story.source_name || story.source_id}
                        </span>

                        <span className="text-stone-300 dark:text-stone-700">•</span>

                        {/* Category */}
                        <span className="text-red-700 dark:text-red-400 font-medium">{story.category}</span>

                        <span className="text-stone-300 dark:text-stone-700">•</span>

                        {/* Publication Date */}
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          {new Date(story.published_at).toLocaleString('mr-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>

                        {story.is_edited ? (
                          <span className="text-[10px] font-semibold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 rounded border border-purple-300">
                            संपादित (Edited)
                          </span>
                        ) : null}
                      </div>

                      {/* Headline */}
                      <h3
                        onClick={() => handleOpenWorkspace(story)}
                        className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug hover:text-red-700 dark:hover:text-red-400 cursor-pointer mb-2"
                      >
                        {story.title}
                      </h3>

                      {/* Description / Excerpt */}
                      {story.description && (
                        <p
                          onClick={() => handleOpenWorkspace(story)}
                          className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed mb-3 cursor-pointer hover:text-stone-900 dark:hover:text-stone-200"
                        >
                          {story.description}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons Row */}
                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Open Story Workspace Button */}
                        <button
                          onClick={() => handleOpenWorkspace(story)}
                          className="px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded border border-stone-300 dark:border-stone-700 cursor-pointer flex items-center gap-1"
                        >
                          <PenTool className="w-3 h-3 text-red-600" />
                          <span>कार्यकक्ष (Workspace)</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenWorkspace(story)}
                          className="px-2.5 py-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 rounded border border-amber-300 dark:border-amber-800 cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          संपादन (Edit)
                        </button>

                        {/* Original Source Link */}
                        {story.source_url && (
                          <a
                            href={story.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs inline-flex items-center gap-1 ml-2"
                          >
                            मूळ दुवा <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Status Transition Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {/* If incoming -> Move to Review */}
                        {story.status === 'incoming' && (
                          <button
                            onClick={() => handleMoveToReview(story)}
                            disabled={actionLoading === story.id}
                            className="px-2.5 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded cursor-pointer"
                          >
                            पुनरावलोकनास द्या
                          </button>
                        )}

                        {/* If incoming or review -> Approve */}
                        {(story.status === 'incoming' || story.status === 'review') && (
                          <button
                            onClick={() => handleApprove(story)}
                            disabled={actionLoading === story.id}
                            className="px-2.5 py-1 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            मंजूर करा (Approve)
                          </button>
                        )}

                        {/* If approved -> Publish Button */}
                        {story.status === 'approved' && (
                          <button
                            onClick={() => setConfirmPublishStory(story)}
                            disabled={actionLoading === story.id}
                            className="px-3 py-1 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <Send className="w-3 h-3" />
                            प्रकाशित करा (Publish)
                          </button>
                        )}

                        {/* Reject Button (allowed on incoming, review, approved) */}
                        {['incoming', 'review', 'approved'].includes(story.status) && (
                          <button
                            onClick={() => setConfirmRejectStory(story)}
                            disabled={actionLoading === story.id}
                            className="px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer"
                          >
                            नाकारा (Reject)
                          </button>
                        )}

                        {/* Archive Button (allowed on published or rejected) */}
                        {['published', 'rejected'].includes(story.status) && (
                          <button
                            onClick={() => handleArchive(story)}
                            disabled={actionLoading === story.id}
                            className="px-2.5 py-1 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded cursor-pointer flex items-center gap-1"
                          >
                            <Archive className="w-3 h-3" />
                            संग्रहित करा
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => loadStories(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded text-xs sm:text-sm font-medium disabled:opacity-40 cursor-pointer"
          >
            मागील
          </button>
          <span className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-400">
            पृष्ठ {page} / {totalPages} (एकूण {totalCount})
          </span>
          <button
            onClick={() => loadStories(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded text-xs sm:text-sm font-medium disabled:opacity-40 cursor-pointer"
          >
            पुढील
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. INSPECTION & EDITING MODAL / DRAWER */}
      {/* ========================================================= */}
      {inspectingStory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-stone-100 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  {isEditMode ? 'संपादकीय संपादन (Edit Story)' : 'बातमी पुनरावलोकन व तपशील (Inspect Story)'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    STATUS_LABELS[inspectingStory.status]?.color || 'bg-stone-200'
                  }`}
                >
                  {STATUS_LABELS[inspectingStory.status]?.label || inspectingStory.status}
                </span>
              </div>
              <button
                onClick={() => setInspectingStory(null)}
                className="p-1 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
              {/* Toggle View Mode */}
              <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-800/50 p-2.5 rounded border border-stone-200 dark:border-stone-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-600 dark:text-stone-400">कार्यपद्धती:</span>
                  <button
                    onClick={() => setIsEditMode(false)}
                    className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                      !isEditMode
                        ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    पडताळणी (Inspect)
                  </button>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                      isEditMode
                        ? 'bg-red-700 text-white'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    संपादन करा (Edit)
                  </button>
                </div>

                <div className="text-[11px] text-stone-500 font-mono">ID: {inspectingStory.id}</div>
              </div>

              {/* Original Source Wire Metadata Box */}
              <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded border border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                    <History className="w-3 h-3" /> मूळ स्रोत माहिती (Original Wire Attribution - Immutable)
                  </span>
                  <a
                    href={inspectingStory.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-700 dark:text-red-400 text-xs font-medium inline-flex items-center gap-1 hover:underline"
                  >
                    मूळ संकेतस्थळावर उघडा <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-stone-500">स्रोत संस्था:</span>{' '}
                    <strong className="text-stone-800 dark:text-stone-200">
                      {inspectingStory.source_name || inspectingStory.source_id}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-500">स्रोत गट:</span>{' '}
                    <strong className="text-stone-800 dark:text-stone-200">
                      {inspectingStory.source_group}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-500">प्रकाशन तारीख:</span>{' '}
                    <span>{new Date(inspectingStory.published_at).toLocaleString('mr-IN')}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">कंटेंट हॅश (D1 SHA-256):</span>{' '}
                    <span className="font-mono text-[10px] text-stone-600 dark:text-stone-400 truncate inline-block max-w-[200px]">
                      {inspectingStory.content_hash}
                    </span>
                  </div>
                </div>

                {/* If story was edited, display original source headline vs edited headline */}
                {inspectingStory.original_title && (
                  <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-700/80 text-xs">
                    <span className="text-stone-500">मूळ आलेले शीर्षक:</span>
                    <p className="italic text-stone-600 dark:text-stone-400">
                      {inspectingStory.original_title}
                    </p>
                  </div>
                )}
              </div>

              {/* Edit Mode Form vs Inspection View */}
              {isEditMode ? (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      संपादकीय शीर्षक (Headline) *
                    </label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full p-2.5 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded font-serif font-bold focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      संपादकीय सारांश / वर्णन (Description / Excerpt)
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded leading-relaxed focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      संपूर्ण बातमी मजकूर (Full Article Content / Body)
                    </label>
                    <textarea
                      rows={7}
                      placeholder="सविस्तर बातमी मजकूर आणि परिच्छेद..."
                      value={editForm.content !== undefined ? editForm.content : editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      className="w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded leading-relaxed focus:ring-1 focus:ring-red-600 font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        विभाग / वर्गवारी (Category)
                      </label>
                      <select
                        value={editForm.category || 'महाराष्ट्र'}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="w-full p-2 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded"
                      >
                        {VALID_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        भाषा (Language)
                      </label>
                      <select
                        value={editForm.language || 'mr'}
                        onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                        className="w-full p-2 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded"
                      >
                        <option value="mr">मराठी (mr)</option>
                        <option value="hi">हिंदी (hi)</option>
                        <option value="en">English (en)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        लेखक / वार्ताहर (Author)
                      </label>
                      <input
                        type="text"
                        value={editForm.author || ''}
                        onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                        className="w-full p-2 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      प्रतिमा दुवा (Image URL)
                    </label>
                    <input
                      type="text"
                      value={editForm.image_url || ''}
                      onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                      className="w-full p-2 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        टॅग्ज (Tags, स्वल्पविरामाने वेगळे करा)
                      </label>
                      <input
                        type="text"
                        placeholder="महाराष्ट्र, शेती, सिंचन..."
                        value={editForm.tags || ''}
                        onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                        className="w-full p-2 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        संपादकीय अंतर्गत टिप्पणी (Editorial Internal Notes)
                      </label>
                      <input
                        type="text"
                        placeholder="संदर्भ पडताळणी पूर्ण झाली..."
                        value={editForm.editorial_notes || ''}
                        onChange={(e) => setEditForm({ ...editForm, editorial_notes: e.target.value })}
                        className="w-full p-2 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {inspectingStory.image_url && (
                    <div className="w-full max-h-60 overflow-hidden rounded bg-stone-100 dark:bg-stone-800">
                      <img
                        src={inspectingStory.image_url}
                        alt={inspectingStory.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
                      {inspectingStory.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-3">
                      <span>
                        लेखक: <strong>{inspectingStory.author || 'संपादकीय विभाग'}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        विभाग: <strong className="text-red-700">{inspectingStory.category}</strong>
                      </span>
                      {inspectingStory.tags && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-stone-400" />
                            {inspectingStory.tags}
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line bg-stone-50 dark:bg-stone-800/40 p-4 rounded border border-stone-200 dark:border-stone-700">
                      {inspectingStory.description || 'वर्णन उपलब्ध नाही.'}
                    </p>

                    {inspectingStory.editorial_notes && (
                      <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded border border-amber-200 text-xs text-amber-900 dark:text-amber-200">
                        <strong>संपादकीय टिप्पणी:</strong> {inspectingStory.editorial_notes}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-stone-100 dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 flex flex-wrap items-center justify-between gap-3">
              <div>
                {isEditMode ? (
                  <button
                    onClick={handleSaveEdit}
                    disabled={actionLoading === 'save'}
                    className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-bold cursor-pointer"
                  >
                    {actionLoading === 'save' ? 'जतन करत आहे...' : 'बदल जतन करा (Save Changes)'}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="px-3 py-1.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 text-stone-800 dark:text-stone-200 rounded text-xs font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    संपादन करा
                  </button>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2">
                {inspectingStory.status === 'incoming' && (
                  <button
                    onClick={() => handleMoveToReview(inspectingStory)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold cursor-pointer"
                  >
                    पुनरावलोकनास द्या
                  </button>
                )}

                {['incoming', 'review'].includes(inspectingStory.status) && (
                  <button
                    onClick={() => handleApprove(inspectingStory)}
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    मंजूर करा (Approve)
                  </button>
                )}

                {inspectingStory.status === 'approved' && (
                  <button
                    onClick={() => setConfirmPublishStory(inspectingStory)}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    थेट प्रकाशित करा (Publish)
                  </button>
                )}

                {['incoming', 'review', 'approved'].includes(inspectingStory.status) && (
                  <button
                    onClick={() => setConfirmRejectStory(inspectingStory)}
                    className="px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-100 rounded cursor-pointer font-semibold"
                  >
                    नाकारा
                  </button>
                )}

                {['published', 'rejected'].includes(inspectingStory.status) && (
                  <button
                    onClick={() => handleArchive(inspectingStory)}
                    className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-200 rounded cursor-pointer flex items-center gap-1"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    संग्रहित करा
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. CONFIRM PUBLISH MODAL */}
      {/* ========================================================= */}
      {confirmPublishStory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg max-w-md w-full p-5 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" />
              बातमी प्रकाशनाची खात्री करा
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-4">
              सदर बातमी सार्वजनिक वृत्तप्रवाहात त्वरित सर्वांसाठी खुली होईल:
            </p>
            <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded text-xs font-serif font-bold text-stone-800 dark:text-stone-200 mb-4 line-clamp-3">
              "{confirmPublishStory.title}"
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmPublishStory(null)}
                className="px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded text-xs font-semibold cursor-pointer"
              >
                रद्द करा
              </button>
              <button
                onClick={handleExecutePublish}
                disabled={actionLoading === confirmPublishStory.id}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold cursor-pointer"
              >
                होय, प्रकाशित करा (Publish Now)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. CONFIRM REJECT MODAL */}
      {/* ========================================================= */}
      {confirmRejectStory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg max-w-md w-full p-5 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              बातमी नाकारण्याची पुष्टी करा
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">
              ही बातमी संपादकीय प्रवाहातून काढून नाकारलेल्या विभागात ठेवली जाईल:
            </p>
            <p className="font-serif text-xs font-bold text-stone-800 dark:text-stone-200 mb-3 line-clamp-2">
              "{confirmRejectStory.title}"
            </p>
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                नाकारण्याचे कारण (पर्यायी):
              </label>
              <input
                type="text"
                placeholder="उदा. अपुरी माहिती, संदर्भ त्रुटी, अनधिकृत स्रोत..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmRejectStory(null)}
                className="px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded text-xs font-semibold cursor-pointer"
              >
                रद्द करा
              </button>
              <button
                onClick={handleExecuteReject}
                disabled={actionLoading === confirmRejectStory.id}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-bold cursor-pointer"
              >
                होय, नाकारा (Reject)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
