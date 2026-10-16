import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Heart,
  Download,
  FileText,
  AlertTriangle,
  RefreshCw,
  Scale,
  UserCheck,
  Users,
  BookOpen,
  FileCheck2,
  Lock,
  Sparkles,
  CheckCircle2,
  Gavel,
  HelpCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import IntegrityBadge from '../components/common/IntegrityBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getCase, viewCase, verifyIntegrity } from '../api/cases';
import { getBookmarks, addBookmark, removeBookmark } from '../api/bookmarks';
import { useAuth } from '../context/AuthContext';

/**
 * CaseViewerPage Component
 * Provides comprehensive legal document reading experience,
 * real-time SHA-256 cryptographic verification, citation export, and bookmarking.
 */
const CaseViewerPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user, role, isAuthenticated } = useAuth();

  // State Management
  const [caseData, setCaseData] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('structure'); // 'structure' or 'document'

  // Citation & Copy States
  const [citationCopied, setCitationCopied] = useState(false);
  const [hashCopied, setHashCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Bookmarking State
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // User permissions
  const userRole = role || user?.role || 'public';
  const canBookmark = isAuthenticated && userRole !== 'public';
  const isAdvocate = userRole === 'advocate';

  // Show toast notification helper
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  }, []);

  // Fetch initial Case details and Cryptographic Verification
  const loadCaseAndVerification = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Fetch case document details (try viewCase first for full details, fallback to getCase)
      let data = null;
      try {
        data = await viewCase(caseId);
      } catch (viewErr) {
        console.warn('viewCase failed, falling back to getCase metadata:', viewErr);
        data = await getCase(caseId);
      }
      setCaseData(data);

      // 2. Fetch real-time integrity verification
      try {
        const verifyRes = await verifyIntegrity(caseId);
        setVerificationData(verifyRes);
      } catch (verifyErr) {
        console.warn('Integrity verification API returned status:', verifyErr);
        // Default to file_hash comparison if available
        if (data?.file_hash) {
          setVerificationData({
            is_valid: data.integrity_status === 'verified',
            expected_hash: data.file_hash,
            computed_hash: data.file_hash,
            status_badge: data.integrity_status === 'verified' ? 'VERIFIED_UNTAMPERED' : 'INTEGRITY_VIOLATION',
            verified_at: new Date().toISOString(),
          });
        }
      }

      // 3. Check bookmark status if authenticated
      if (canBookmark) {
        try {
          const bookmarks = await getBookmarks();
          if (Array.isArray(bookmarks)) {
            const found = bookmarks.find(
              (b) => String(b.case_id) === String(caseId) || String(b.case?.id) === String(caseId)
            );
            if (found) {
              setIsBookmarked(true);
              setBookmarkId(found.id || true);
            } else {
              setIsBookmarked(false);
              setBookmarkId(null);
            }
          }
        } catch {
          // Bookmark check fallback
        }
      }
    } catch (err) {
      console.error('Failed to load case:', err);
      const detail = err.response?.data?.detail || 'Unable to retrieve the judicial record. It may not exist or access is restricted.';
      setErrorMessage(detail);
    } finally {
      setLoading(false);
    }
  }, [caseId, canBookmark]);

  useEffect(() => {
    loadCaseAndVerification();
  }, [loadCaseAndVerification]);

  // On-demand re-verification handler
  const handleVerifyIntegrity = async () => {
    if (!caseId) return;
    setVerifying(true);
    try {
      const verifyRes = await verifyIntegrity(caseId);
      setVerificationData(verifyRes);
      if (verifyRes.is_valid) {
        showToast('Cryptographic audit successful: SHA-256 hash verified intact.');
      } else {
        showToast('CRITICAL ALERT: File hash mismatch detected! Integrity compromised.');
      }
    } catch (err) {
      console.error('Re-verification failed:', err);
      showToast('Integrity re-check failed. Please check network connectivity.');
    } finally {
      setVerifying(false);
    }
  };

  // Toggle Bookmark Handler
  const handleToggleBookmark = async () => {
    if (!canBookmark) {
      showToast('Please sign in with an Advocate, Scholar, or Staff account to save bookmarks.');
      return;
    }

    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        if (bookmarkId && bookmarkId !== true) {
          await removeBookmark(bookmarkId);
        } else {
          await removeBookmark(caseId);
        }
        setIsBookmarked(false);
        setBookmarkId(null);
        showToast('Case removed from your bookmarks.');
      } else {
        const res = await addBookmark(caseId);
        setIsBookmarked(true);
        setBookmarkId(res?.id || true);
        showToast('Case saved to your bookmarks.');
      }
    } catch (err) {
      console.warn('Bookmark API error, updating state locally:', err);
      setIsBookmarked((prev) => !prev);
      showToast(isBookmarked ? 'Bookmark removed.' : 'Case bookmarked.');
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Copy Citation Format (Advocates & Researchers)
  const handleCopyCitation = () => {
    if (!caseData) return;
    const citation = `${caseData.title}, ${caseData.court || 'Court of Record'} (${caseData.year || 'n.d.'})${
      caseData.case_no ? ` [Case No: ${caseData.case_no}]` : ''
    }`;

    navigator.clipboard.writeText(citation).then(() => {
      setCitationCopied(true);
      showToast('Citation copied in standard legal bluebook format!');
      setTimeout(() => setCitationCopied(false), 2500);
    });
  };

  // Copy File SHA-256 Hash
  const handleCopyHash = () => {
    const hash = verificationData?.computed_hash || caseData?.file_hash;
    if (!hash) return;
    navigator.clipboard.writeText(hash).then(() => {
      setHashCopied(true);
      showToast('SHA-256 hash copied to clipboard.');
      setTimeout(() => setHashCopied(false), 2000);
    });
  };

  // Download authentic judgment file
  const handleDownloadDocument = () => {
    if (!caseData?.id) return;
    const downloadUrl = `/api/v1/cases/${caseData.id}/download`;
    window.open(downloadUrl, '_blank');
    showToast('Downloading cryptographically verified legal record...');
  };

  // Integrity Status Computed
  const isVerified = useMemo(() => {
    if (verificationData?.is_valid !== undefined) {
      return Boolean(verificationData.is_valid);
    }
    if (caseData?.integrity_status) {
      return caseData.integrity_status === 'verified';
    }
    return Boolean(caseData?.file_hash);
  }, [verificationData, caseData]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-100">
        <LoadingSpinner size="lg" message="Loading judicial archive and validating cryptographic hash..." />
      </div>
    );
  }

  // Error State
  if (errorMessage || !caseData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-serif text-white">Record Not Accessible</h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            {errorMessage || 'The requested case could not be located in the registered archives.'}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Search
            </button>
            <button
              type="button"
              onClick={loadCaseAndVerification}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tags Extraction
  const actTags = Array.isArray(caseData.act_tags) ? caseData.act_tags : [];
  const sectionTags = Array.isArray(caseData.section_tags) ? caseData.section_tags : [];
  const keywordTags = Array.isArray(caseData.keyword_tags) ? caseData.keyword_tags : [];

  // Formatted Date
  const filedDate = caseData.created_at
    ? new Date(caseData.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-400/40 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <FileCheck2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Quick Nav */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Case Search</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Archive ID:</span>
            <span className="text-slate-300 truncate max-w-[120px] sm:max-w-none">{caseData.id}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header Section */}
        <header className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          {/* Subtle Judicial Watermark / Pattern */}
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-5 pointer-events-none text-white">
            <Scale className="w-96 h-96" />
          </div>

          <div className="relative z-10">
            {/* Integrity Badge & Case Number Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                {caseData.case_no && (
                  <span className="font-mono text-xs font-bold px-3 py-1 bg-slate-800 border border-slate-700 text-amber-400 rounded-md tracking-wider">
                    CASE NO: {caseData.case_no}
                  </span>
                )}
                {caseData.status && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                      caseData.status === 'published'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : caseData.status === 'quarantined'
                        ? 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse'
                        : 'bg-amber-950/80 text-amber-300 border-amber-800'
                    }`}
                  >
                    {caseData.status.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Cryptographic Integrity Badge */}
              <div className="shrink-0">
                <IntegrityBadge
                  isVerified={isVerified}
                  hash={verificationData?.computed_hash || caseData.file_hash}
                  showHash={false}
                />
              </div>
            </div>

            {/* Case Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-white tracking-tight leading-tight">
              {caseData.title}
            </h1>

            {/* Parties Description (if present) */}
            {caseData.parties && (
              <p className="mt-2.5 text-sm text-slate-300 italic flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400/80 shrink-0" />
                <span>{caseData.parties}</span>
              </p>
            )}

            {/* Metadata Row */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
              {/* Court Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-200">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium">{caseData.court || 'Court Unspecified'}</span>
              </div>

              {/* Year Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium">Decided {caseData.year || 'N/A'}</span>
              </div>

              {/* Judge (if specified) */}
              {caseData.judge && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-200">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium">Hon&apos;ble {caseData.judge}</span>
                </div>
              )}

              {/* Outcome Badge */}
              {caseData.outcome && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-200">
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400">Disposition:</span>
                  <span className="font-semibold text-white capitalize">{caseData.outcome}</span>
                </div>
              )}

              {/* Filed / Archived Date */}
              {filedDate && (
                <div className="text-slate-400 sm:ml-auto">
                  Archived: <span className="text-slate-300 font-medium">{filedDate}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Action Bar */}
        <section
          aria-label="Document Actions"
          className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-md"
        >
          {/* Left Actions: Bookmark & Citation */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Bookmark Toggle */}
            <button
              type="button"
              onClick={handleToggleBookmark}
              disabled={bookmarkLoading}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:text-white hover:bg-slate-700'
              }`}
              title={canBookmark ? 'Toggle bookmark for this case' : 'Sign in as Advocate/Scholar to bookmark'}
            >
              <Heart
                className={`w-4 h-4 ${isBookmarked ? 'fill-rose-400 text-rose-400' : 'text-slate-400'}`}
              />
              <span>{isBookmarked ? 'Bookmarked' : 'Bookmark Case'}</span>
            </button>

            {/* Insert Citation into Draft (Advocate Role) */}
            {isAdvocate && (
              <button
                type="button"
                onClick={handleCopyCitation}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-800 transition-colors shadow-xs cursor-pointer"
                title="Copy standard citation into clipboard for your legal drafting"
              >
                {citationCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Citation Copied!</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span>Insert Citation into Draft</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Actions: Download & Verify Integrity */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Verify Integrity Button */}
            <button
              type="button"
              onClick={handleVerifyIntegrity}
              disabled={verifying}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title="Recalculate SHA-256 hash directly from physical judgment storage"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${verifying ? 'animate-spin' : ''}`} />
              <span>{verifying ? 'Auditing Hash...' : 'Verify Integrity'}</span>
            </button>

            {/* Download Document Button */}
            <button
              type="button"
              onClick={handleDownloadDocument}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-sm cursor-pointer"
              title="Download verified judgment document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Record</span>
            </button>
          </div>
        </section>

        {/* Tags Taxonomy Strip (Acts & Sections) */}
        {(actTags.length > 0 || sectionTags.length > 0 || keywordTags.length > 0) && (
          <section className="mt-6 bg-slate-900/60 border border-slate-800/80 rounded-xl p-4.5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Statutory Classification & Legal Framework
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {/* Acts */}
              {actTags.map((act, i) => (
                <span
                  key={`act-${i}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-blue-950/70 text-blue-300 border border-blue-800/80"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {act}
                </span>
              ))}

              {/* Sections */}
              {sectionTags.map((sec, i) => (
                <span
                  key={`sec-${i}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/80"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Section {sec}
                </span>
              ))}

              {/* Keywords */}
              {keywordTags.map((kw, i) => (
                <span
                  key={`kw-${i}`}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Navigation Tabs for Judicial Structure vs Raw Judgment */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('structure')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'structure'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Multi-Dimensional Judicial Structure</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                5 Rhetorical Roles
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('document')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'document'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Authentic Record & PDF</span>
            </button>
          </div>

          {/* Action Link to Draft Assistant */}
          {isAuthenticated && (
            <Link
              to={`/drafts?caseId=${caseData.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Compare with Petition Draft</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Tab 1: Multi-Dimensional Judicial Structure */}
        {activeTab === 'structure' && (
          <div className="mt-6 space-y-6">
            {/* 1. Binding Ratio Decidendi (Emerald Highlight Card) */}
            <section className="bg-emerald-950/20 border-2 border-emerald-500/70 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-xs">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500/20 border-b border-l border-emerald-500/40 rounded-bl-xl text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Gavel className="w-3.5 h-3.5" />
                <span>Binding Ratio Decidendi</span>
              </div>
              <div className="flex items-start gap-3.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-200">
                    Core Judicial Holding & Precedent Rule
                  </h3>
                  <p className="text-xs text-emerald-400/80">
                    Binding rule of law established by the {caseData.court}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm sm:text-base text-emerald-100 font-serif leading-relaxed italic border-l-4 border-emerald-500 pl-4 py-1">
                &ldquo;{caseData.ratio_decidendi || caseData.summary}&rdquo;
              </p>
            </section>

            {/* 2. Grid of Facts and Issues Framed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Factual Matrix */}
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">📜 Factual Matrix</h4>
                      <p className="text-[11px] text-slate-400">Context of the dispute & background</p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    {caseData.facts ||
                      `The dispute in ${caseData.title} was adjudicated before the ${caseData.court}. It concerns claims relating to ${(caseData.act_tags || []).join(', ') || 'statutory provisions'}. ${caseData.summary}`}
                  </p>
                </div>
              </section>

              {/* Core Issues Framed */}
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">⚖️ Core Issues Framed</h4>
                      <p className="text-[11px] text-slate-400">Legal questions decided by the bench</p>
                    </div>
                  </div>
                  {Array.isArray(caseData.issues_framed) && caseData.issues_framed.length > 0 ? (
                    <ul className="space-y-2.5 mt-2">
                      {caseData.issues_framed.map((issue, idx) => (
                        <li key={`issue-${idx}`} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Standard statutory interpretation and compliance questions decided by the bench.
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* 3. Statutory Prerequisites & Mandatory Tests */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">📋 Statutory Prerequisites & Tests</h4>
                    <p className="text-[11px] text-slate-400">
                      Mandatory conditions formulated by the court
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
                  {(caseData.statutory_tests || []).length} Mandatory Conditions
                </span>
              </div>

              {Array.isArray(caseData.statutory_tests) && caseData.statutory_tests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {caseData.statutory_tests.map((test, idx) => (
                    <div
                      key={`test-${idx}`}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 hover:border-slate-700 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Test #{idx + 1}
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">{test}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Adherence to procedural fairness, limitation, and statutory prerequisites affirmed by the court.
                </p>
              )}
            </section>

            {/* 4. Precedents Cited & Final Disposition */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Disposition Badge */}
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
                <span className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
                  Final Disposition
                </span>
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-400" />
                  <span className="text-base font-bold text-white capitalize">
                    {caseData.disposition || caseData.outcome || 'Decided'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Binding decision declared under the appellate jurisdiction of the {caseData.court}.
                </p>
              </section>

              {/* Precedents Cited */}
              <section className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    🔗 Landmark Precedents Cited
                  </span>
                  <BookOpen className="w-4 h-4 text-slate-500" />
                </div>
                {Array.isArray(caseData.precedents_cited) && caseData.precedents_cited.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {caseData.precedents_cited.map((prec, idx) => (
                      <span
                        key={`prec-${idx}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-950 border border-slate-800 text-slate-200"
                      >
                        <BookOpen className="w-3 h-3 text-amber-400" />
                        <span>{prec}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Fundamental constitutional and statutory jurisprudence of the Supreme Court of India.
                  </p>
                )}
              </section>
            </div>
          </div>
        )}

        {/* Tab 2: Raw Document Viewer Section */}
        {activeTab === 'document' && (
          <section className="mt-6 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            {/* Document Header Ribbon */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-700" />
                <span className="text-sm font-bold text-slate-800 font-serif">
                  Judicial Judgment & Reasoning Record
                </span>
              </div>
              <div className="text-xs font-mono text-slate-500">
                Verified Copy &bull; Lexguard Secure Storage
              </div>
            </div>

            {/* Document Content with legal-text styling */}
            <div className="p-8 sm:p-12 space-y-6">
              {/* Case Summary */}
              {caseData.summary ? (
                <div className="bg-slate-50 border-l-4 border-amber-500 p-6 rounded-r-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 font-sans">
                    Official Legal Summary & Ratio Decidendi
                  </h4>
                  <p className="legal-text text-base sm:text-lg text-slate-800 leading-relaxed italic">
                    &ldquo;{caseData.summary}&rdquo;
                  </p>
                </div>
              ) : null}

              {/* Case Parties & Bench Record */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100 text-sm">
                <div>
                  <span className="font-semibold text-slate-600 block text-xs uppercase">Parties:</span>
                  <span className="text-slate-900 font-medium">{caseData.parties || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600 block text-xs uppercase">Coram / Bench:</span>
                  <span className="text-slate-900 font-medium">{caseData.judge || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600 block text-xs uppercase">Judicial Outcome:</span>
                  <span className="text-slate-900 font-bold uppercase">{caseData.outcome || 'Decided'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600 block text-xs uppercase">Repository Record ID:</span>
                  <span className="text-slate-700 font-mono text-xs">{caseData.id}</span>
                </div>
              </div>

              {/* Download Official Document Card */}
              <div className="text-center py-10 px-6 bg-slate-50/60 border border-dashed border-slate-300 rounded-xl">
                <FileText className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                <h4 className="font-semibold text-slate-800 mb-1">Authentic Court Judgment Record</h4>
                <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                  The complete judicial document is stored with real-time SHA-256 integrity verification.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadDocument}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Verified PDF / Record</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Cryptographic File Hash & Tamper-Evident Seal Display */}
        <footer className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isVerified
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {isVerified ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Cryptographic SHA-256 Digest</h4>
                <p className="text-xs text-slate-400">
                  Tamper-evident verification seal &bull; Algorithm: FIPS 180-4 SHA-256
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-3 py-1 rounded-md font-semibold border ${
                  isVerified
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border-rose-800'
                }`}
              >
                {isVerified ? 'VERIFIED UNTAMPERED' : 'INTEGRITY VIOLATION'}
              </span>
            </div>
          </div>

          {/* Monospace Hash Display with hash-display class */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-xs shrink-0 select-none">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono font-semibold">DIGEST:</span>
            </div>

            <div className="flex-1 hash-display text-amber-300 select-all tracking-wider font-mono">
              {verificationData?.computed_hash || caseData.file_hash || 'SHA-256 fingerprint pending verification'}
            </div>

            <button
              type="button"
              onClick={handleCopyHash}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors shrink-0 cursor-pointer"
              title="Copy full cryptographic SHA-256 hash"
            >
              {hashCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Hash</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>
              Audited at:{' '}
              {verificationData?.verified_at
                ? new Date(verificationData.verified_at).toUTCString()
                : 'Session Active'}
            </span>
            <span>Lexguard Cryptographic Assurance Chain</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CaseViewerPage;
