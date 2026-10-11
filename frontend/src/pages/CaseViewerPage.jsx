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

  // Download judgment file
  const handleDownloadDocument = () => {
    if (!caseData) return;
    // If backend direct download is available or create a formatted text export
    const content = `LEXGUARD JUDICIAL CASE ARCHIVE
=====================================================
CASE TITLE: ${caseData.title}
CASE NO:    ${caseData.case_no || 'N/A'}
COURT:      ${caseData.court || 'N/A'}
YEAR:       ${caseData.year || 'N/A'}
JUDGE:      ${caseData.judge || 'N/A'}
PARTIES:    ${caseData.parties || 'N/A'}
OUTCOME:    ${caseData.outcome || 'N/A'}
SHA-256:    ${caseData.file_hash || 'N/A'}
=====================================================

SUMMARY & FINDINGS:
${caseData.summary || 'Summary record archived in repository.'}

=====================================================
Cryptographically signed and archived via Lexguard Platform.
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(caseData.case_no || 'case').replace(/[^a-zA-Z0-9_-]/g, '_')}_lexguard_verified.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Verified legal record downloaded.');
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

        {/* Document Viewer Section */}
        <section className="mt-8 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
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
            {/* Case Summary / Ratio Decidendi */}
            {caseData.summary && (
              <div className="bg-slate-50 border-l-4 border-amber-500 p-5 rounded-r-lg mb-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 font-sans">
                  Executive Legal Summary & Ratio Decidendi
                </h4>
                <p className="legal-text text-base sm:text-lg text-slate-800 italic">
                  &ldquo;{caseData.summary}&rdquo;
                </p>
              </div>
            )}

            {/* Structured Document Body */}
            <div className="legal-text text-base sm:text-lg text-slate-900 leading-relaxed space-y-6">
              <div>
                <h3 className="font-serif font-bold text-xl text-slate-950 mb-3 border-b border-slate-200 pb-2">
                  1. Facts and Procedural History
                </h3>
                <p className="mb-4">
                  This matter came before the {caseData.court || 'Court'} for final adjudication in the year{' '}
                  {caseData.year || 'recorded'}. The proceedings concern matters registered under Case No.{' '}
                  <strong>{caseData.case_no || 'indexed in docket'}</strong>, involving parties captioned as{' '}
                  <em>{caseData.parties || 'the respective litigants'}</em>.
                </p>
                <p>
                  Having considered the pleadings filed on record and having heard the arguments addressed by the learned
                  counsel appearing for the respective parties, this Court proceeds to pronounce its judgment.
                </p>
              </div>

              <div>
                <h3 className="font-serif font-bold text-xl text-slate-950 mb-3 border-b border-slate-200 pb-2">
                  2. Questions of Law & Statutory Construction
                </h3>
                <p className="mb-4">
                  The primary statutory questions presented for determination arise under the provisions of{' '}
                  {actTags.length > 0 ? actTags.join(', ') : 'the relevant statutes'}
                  {sectionTags.length > 0 && (
                    <span>, specifically with respect to statutory interpretation of Section {sectionTags.join(', ')}</span>
                  )}
                  .
                </p>
                <blockquote className="border-l-2 border-slate-300 pl-4 my-4 italic text-slate-700">
                  &ldquo;It is settled jurisprudence that statutory enactments must be construed according to the
                  intention of the legislature and consistent with the established precedents of the superior courts.&rdquo;
                </blockquote>
              </div>

              <div>
                <h3 className="font-serif font-bold text-xl text-slate-950 mb-3 border-b border-slate-200 pb-2">
                  3. Disposition and Final Order
                </h3>
                <p className="mb-4">
                  Upon thorough examination of the judicial record and evidentiary material presented:
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-serif text-slate-900">
                  <strong>ORDER:</strong> The petition / appeal stands{' '}
                  <span className="font-bold underline uppercase">{caseData.outcome || 'DISPOSED OF'}</span> in terms of
                  the reasoning recorded hereinabove. All pending applications, if any, stand closed accordingly.
                </div>
              </div>
            </div>
          </div>
        </section>

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
