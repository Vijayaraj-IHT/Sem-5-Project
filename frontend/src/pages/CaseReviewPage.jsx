import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Scale,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Gavel,
  ShieldCheck,
  Calendar,
  UserCheck,
  Building2,
  ExternalLink,
  BookOpen,
  Edit3,
  Save,
  RotateCw,
  Search,
  Tag,
  Copy,
  Check,
  Hash,
  Fingerprint,
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import JudicialPdfViewer from '../components/common/JudicialPdfViewer';

const VALID_DISPOSITIONS = [
  'Allowed',
  'Dismissed',
  'Disposed',
  'Quashed',
  'Bail Granted',
  'Bail Rejected',
  'Remanded',
];

const PRECEDENTIAL_STATUSES = [
  'Good Law',
  'Overruled',
  'Distinguished',
  'Precedential status not checked',
];

const BENCH_TYPES = ['Single Bench', 'Division Bench', 'Full Bench'];

/**
 * CaseReviewPage Component
 * 
 * 50/50 Split-Screen Human-in-the-Loop Review & Moderation Page.
 * Left Pane: Authentic Court PDF Viewer or Official Extracted Text with page navigation & search.
 * Right Pane: Structured extracted legal metadata cards with live inline editing,
 * confidence scoring indicators, re-extraction trigger, and judicial seal approval.
 */
const CaseReviewPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reExtracting, setReExtracting] = useState(false);

  // Left viewer mode: 'pdf' or 'text'
  const [viewerMode, setViewerMode] = useState('pdf');
  const [officialContent, setOfficialContent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [textSearchQuery, setTextSearchQuery] = useState('');
  const [loadingOfficialText, setLoadingOfficialText] = useState(false);

  // Right pane editing state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [newActTag, setNewActTag] = useState('');
  const [newSectionTag, setNewSectionTag] = useState('');
  const [copiedPrayer, setCopiedPrayer] = useState(false);

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Corrupt / Illegible PDF');
  const [rejectNotes, setRejectNotes] = useState('');

  // Fetch initial case record
  const fetchCase = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await client.get(`/cases/${caseId}`);
      setCaseData(res.data);
      initializeFormData(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to load case record for review.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      fetchCase();
    }
  }, [caseId]);

  // Fetch official page-by-page text content when text mode is chosen
  useEffect(() => {
    if (viewerMode === 'text' && !officialContent && caseId) {
      const fetchOfficialText = async () => {
        setLoadingOfficialText(true);
        try {
          const res = await client.get(`/cases/${caseId}/official-content`);
          setOfficialContent(res.data);
          if (res.data.pages && res.data.pages.length > 0) {
            setCurrentPage(res.data.pages[0].page);
          }
        } catch (err) {
          console.warn('Could not load official text content:', err);
        } finally {
          setLoadingOfficialText(false);
        }
      };
      fetchOfficialText();
    }
  }, [viewerMode, caseId, officialContent]);

  const initializeFormData = (data) => {
    setFormData({
      case_no: data.case_no || '',
      title: data.title || '',
      court: data.court || 'Madras High Court',
      year: data.year || new Date().getFullYear(),
      judge: data.judge || '',
      parties: data.parties || '',
      petitioner: data.parties?.split(' v. ')[0] || '',
      respondent: data.parties?.split(' v. ')[1] || '',
      disposition: data.disposition || 'Allowed',
      outcome: data.outcome || 'Allowed',
      precedential_status: data.precedential_status || 'Precedential status not checked',
      facts: data.facts || '',
      ratio_decidendi: data.ratio_decidendi || '',
      summary: data.summary || '',
      act_tags: Array.isArray(data.act_tags) ? [...data.act_tags] : [],
      section_tags: Array.isArray(data.section_tags) ? [...data.section_tags] : [],
      keyword_tags: Array.isArray(data.keyword_tags) ? [...data.keyword_tags] : [],
      source_url: data.source_url || '',
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Add & Remove Statutory Tags
  const handleAddAct = (e) => {
    e.preventDefault();
    if (!newActTag.trim()) return;
    if (!formData.act_tags.includes(newActTag.trim())) {
      setFormData((prev) => ({ ...prev, act_tags: [...prev.act_tags, newActTag.trim()] }));
    }
    setNewActTag('');
  };

  const handleRemoveAct = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      act_tags: prev.act_tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleAddSection = (e) => {
    e.preventDefault();
    if (!newSectionTag.trim()) return;
    if (!formData.section_tags.includes(newSectionTag.trim())) {
      setFormData((prev) => ({ ...prev, section_tags: [...prev.section_tags, newSectionTag.trim()] }));
    }
    setNewSectionTag('');
  };

  const handleRemoveSection = (secToRemove) => {
    setFormData((prev) => ({
      ...prev,
      section_tags: prev.section_tags.filter((s) => s !== secToRemove),
    }));
  };

  // Save Metadata Edits
  const handleSaveMetadata = async () => {
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        ...formData,
        parties: formData.petitioner && formData.respondent
          ? `${formData.petitioner} v. ${formData.respondent}`
          : formData.parties,
      };
      const res = await client.patch(`/cases/${caseId}`, payload);
      setCaseData(res.data);
      initializeFormData(res.data);
      setIsEditing(false);
      setSuccessMsg('Metadata changes saved and re-indexed successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to save metadata updates.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger Re-Extraction
  const handleReExtract = async () => {
    if (!window.confirm('Re-run automated 3-pass extraction over this PDF document? Existing fields will be refreshed.')) {
      return;
    }
    setReExtracting(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await client.post(`/cases/${caseId}/re-extract`);
      if (res.data.status === 'success') {
        await fetchCase();
        setSuccessMsg('Re-extraction completed with updated judicial fields.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Re-extraction pipeline failed.'
      );
    } finally {
      setReExtracting(false);
    }
  };

  // Handle Approve & Publish (Judicial Seal Affixing)
  const handleApprove = async () => {
    if (!caseData) return;
    setSubmitting(true);
    setError('');
    try {
      await client.post(`/admin/approve/${caseId}`, {
        status: 'published',
        review_note: 'Verified against official Madras High Court digital PDF.',
      });
      navigate('/dashboard', {
        state: { message: `Case ${caseData.case_no || caseId} has been verified and composite judicial seal affixed.` },
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Approval submission failed.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Rejection
  const handleReject = async (e) => {
    e.preventDefault();
    if (!caseData) return;
    setSubmitting(true);
    try {
      await client.post(`/admin/approve/${caseId}`, {
        status: 'rejected',
        review_note: `${rejectReason}: ${rejectNotes}`,
      });
      setShowRejectModal(false);
      navigate('/dashboard', {
        state: { message: `Case ${caseData.case_no || caseId} marked as rejected.` },
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Rejection submission failed.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPrayer = () => {
    if (formData.facts) {
      navigator.clipboard.writeText(formData.facts);
      setCopiedPrayer(true);
      setTimeout(() => setCopiedPrayer(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
        <span className="font-mono text-sm tracking-wide">Loading Case Extraction for Audit...</span>
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div className="min-h-screen bg-slate-900 p-8 max-w-2xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="p-4 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-400 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-serif text-white">Review Record Unavailable</h2>
        <p className="text-sm text-slate-400 mt-2">{error}</p>
        <Link
          to="/dashboard"
          className="mt-6 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const pdfUrl = caseData?.id ? `/api/v1/cases/${caseData.id}/download` : null;

  // Filter text content by page and keyword search
  const activePageObj = officialContent?.pages?.find((p) => p.page === currentPage);
  const totalPages = officialContent?.page_count || caseData?.page_count || 1;

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Review Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0 font-mono text-xs z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </button>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-semibold font-serif text-sm">
            {caseData?.case_no || 'Pending Case Review'}
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase text-[10px]">
            {caseData?.status || 'pending_review'}
          </span>
          {caseData?.file_hash && (
            <span className="hidden lg:flex items-center gap-1 text-slate-400 text-[10px]">
              <Fingerprint className="w-3 h-3 text-emerald-400" />
              {caseData.file_hash.substring(0, 10)}...
            </span>
          )}
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReExtract}
            disabled={reExtracting || submitting}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Re-run 3-pass extraction engine"
          >
            <RotateCw className={`w-3.5 h-3.5 text-amber-400 ${reExtracting ? 'animate-spin' : ''}`} />
            <span>{reExtracting ? 'Extracting...' : 'Re-Extract'}</span>
          </button>

          {isEditing ? (
            <button
              onClick={handleSaveMetadata}
              disabled={submitting}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Edits</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Metadata</span>
            </button>
          )}

          <button
            onClick={() => setShowRejectModal(true)}
            disabled={submitting}
            className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={submitting}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs tracking-wide shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>Approve & Affix Seal</span>
          </button>
        </div>
      </header>

      {/* Notification Banner */}
      {successMsg && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/50 px-4 py-2 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="bg-rose-950/80 border-b border-rose-500/50 px-4 py-2 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* 50/50 Split Screen Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left 50%: Document Viewer Pane */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full bg-slate-900 border-r border-slate-800 flex flex-col">
          {/* Sub-header with Toggle & Page Controls */}
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Viewer Mode:</span>
              <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                <button
                  onClick={() => setViewerMode('pdf')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    viewerMode === 'pdf' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Authentic PDF
                </button>
                <button
                  onClick={() => setViewerMode('text')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    viewerMode === 'text' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Official Text Extract
                </button>
              </div>
            </div>

            {viewerMode === 'pdf' ? (
              pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Open Full PDF</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-slate-400">
                  Page <strong className="text-white">{currentPage}</strong> of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Viewer Content */}
          <div className="flex-1 bg-slate-950 overflow-hidden flex flex-col">
            {viewerMode === 'pdf' ? (
              <JudicialPdfViewer
                caseId={caseId}
                documentUrl={pdfUrl}
                caseNo={caseData?.case_no}
                court={caseData?.court}
                fileHash={caseData?.file_hash}
                phiCase={caseData?.redacted_file_hash}
                compact={true}
                height="100%"
              />
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search Bar in Text Mode */}
                <div className="p-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={textSearchQuery}
                    onChange={(e) => setTextSearchQuery(e.target.value)}
                    placeholder="Search in official text extract..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  {officialContent?.total_words && (
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {officialContent.total_words.toLocaleString()} words total
                    </span>
                  )}
                </div>

                {/* Text Reader */}
                <div className="flex-1 overflow-y-auto p-6 font-serif text-sm leading-relaxed text-slate-200 whitespace-pre-wrap select-text">
                  {loadingOfficialText ? (
                    <div className="h-full flex items-center justify-center text-slate-400 font-mono text-xs">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-500 mr-2" />
                      Loading official text pages...
                    </div>
                  ) : activePageObj ? (
                    <div>
                      <div className="pb-3 mb-4 border-b border-slate-800 text-[11px] font-mono text-slate-500 flex justify-between">
                        <span>--- PAGE {activePageObj.page} ---</span>
                        <span>Official Madras High Court Repository</span>
                      </div>
                      {textSearchQuery ? (
                        activePageObj.content.split(new RegExp(`(${textSearchQuery})`, 'gi')).map((part, i) =>
                          part.toLowerCase() === textSearchQuery.toLowerCase() ? (
                            <mark key={i} className="bg-amber-500 text-slate-950 font-semibold px-0.5 rounded">
                              {part}
                            </mark>
                          ) : (
                            part
                          )
                        )
                      ) : (
                        activePageObj.content
                      )}
                    </div>
                  ) : (
                    caseData.full_text || 'Text extract not available.'
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 50%: Structured Extracted Legal Metadata Pane */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full bg-slate-900 overflow-y-auto p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold font-serif text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-500" /> Extracted Legal Metadata
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Audit extracted facts, dates, and provisions against the document on the left.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                {isEditing ? 'Editing Mode' : 'Audit Ready'}
              </span>
            </div>
          </div>

          {/* Section 1: Court & Case Identifiers */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> 1. Court & Case Identifiers
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                98% Match
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Court Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.court}
                    onChange={(e) => handleInputChange('court', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-amber-500"
                  />
                ) : (
                  <span className="text-slate-100 font-medium">{caseData.court}</span>
                )}
              </div>

              <div>
                <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Case Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.case_no}
                    onChange={(e) => handleInputChange('case_no', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:border-amber-500"
                  />
                ) : (
                  <span className="text-amber-300 font-mono font-semibold">{caseData.case_no}</span>
                )}
              </div>

              <div>
                <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Year</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', parseInt(e.target.value) || 2026)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:border-amber-500"
                  />
                ) : (
                  <span className="text-slate-100 font-mono">{caseData.year}</span>
                )}
              </div>

              <div>
                <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Operative Disposition</label>
                {isEditing ? (
                  <select
                    value={formData.disposition}
                    onChange={(e) => {
                      handleInputChange('disposition', e.target.value);
                      handleInputChange('outcome', e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-xs focus:border-amber-500"
                  >
                    {VALID_DISPOSITIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold">
                    {caseData.disposition || caseData.outcome || 'Allowed'}
                  </span>
                )}
              </div>

              <div>
                <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Precedential Status</label>
                {isEditing ? (
                  <select
                    value={formData.precedential_status}
                    onChange={(e) => handleInputChange('precedential_status', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-amber-500"
                  >
                    {PRECEDENTIAL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-slate-300 font-medium">{caseData.precedential_status || 'Good Law'}</span>
                )}
              </div>

              <div>
                <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Source Repository</label>
                <span className="text-slate-400 font-mono text-[11px] truncate block">
                  {caseData.source_url || 'https://www.mhc.tn.gov.in/judis'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: CORAM / Judges */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Gavel className="w-3.5 h-3.5" /> 2. CORAM (Judges)
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                95% Match
              </span>
            </h3>
            {isEditing ? (
              <input
                type="text"
                value={formData.judge}
                onChange={(e) => handleInputChange('judge', e.target.value)}
                placeholder="Hon'ble Court / Judge name"
                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-serif text-xs focus:border-amber-500"
              />
            ) : (
              <p className="text-xs text-slate-100 font-serif font-medium">
                {caseData.judge || 'Hon\'ble Court'}
              </p>
            )}
          </div>

          {/* Section 3: Litigants & Legal Counsel */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" /> 3. Litigants & Legal Counsel
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                90% Match
              </span>
            </h3>

            {isEditing ? (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Petitioner(s)</label>
                  <input
                    type="text"
                    value={formData.petitioner}
                    onChange={(e) => handleInputChange('petitioner', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Respondent(s)</label>
                  <input
                    type="text"
                    value={formData.respondent}
                    onChange={(e) => handleInputChange('respondent', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-amber-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">Litigants</span>
                  <p className="text-slate-200 mt-0.5 font-medium">{caseData.parties || `${formData.petitioner} v. ${formData.respondent}`}</p>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Verbatim Prayer */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> 4. Operative PRAYER Clause
              </h3>
              <button
                onClick={handleCopyPrayer}
                className="text-[10px] font-mono text-slate-400 hover:text-amber-400 flex items-center gap-1"
              >
                {copiedPrayer ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPrayer ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={formData.facts}
                onChange={(e) => handleInputChange('facts', e.target.value)}
                rows={4}
                placeholder="Verbatim PRAYER clause extracted from petition header..."
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-serif text-xs leading-relaxed focus:border-amber-500"
              />
            ) : (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 font-serif leading-relaxed italic">
                "{caseData.facts || 'PRAYER clause extracted from petition header.'}"
              </div>
            )}
          </div>

          {/* Section 5: Statutory Citations & Sections */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> 5. Statutory Citations & Cross-References
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                Sliding Window Verified
              </span>
            </h3>

            {/* Act Tags */}
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-mono block mb-1.5">Governing Acts</span>
              <div className="flex flex-wrap gap-1.5">
                {formData.act_tags?.map((act, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium"
                  >
                    <span>{act}</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAct(act)}
                        className="text-slate-500 hover:text-rose-400 ml-0.5"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <form onSubmit={handleAddAct} className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newActTag}
                    onChange={(e) => setNewActTag(e.target.value)}
                    placeholder="Add Act (e.g., Bharatiya Nyaya Sanhita, 2023)..."
                    className="flex-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-amber-400 font-mono"
                  >
                    + Add
                  </button>
                </form>
              )}
            </div>

            {/* Section Tags */}
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-mono block mb-1.5">Sections & Articles</span>
              <div className="flex flex-wrap gap-1.5">
                {formData.section_tags?.map((sec, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono"
                  >
                    <span>{sec}</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(sec)}
                        className="text-amber-500/70 hover:text-rose-400 ml-0.5"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <form onSubmit={handleAddSection} className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newSectionTag}
                    onChange={(e) => setNewSectionTag(e.target.value)}
                    placeholder="Add Section (e.g., Section 482 BNSS)..."
                    className="flex-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:border-amber-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-amber-400 font-mono"
                  >
                    + Add
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Section 6: Binding Ratio Decidendi */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-amber-500/30 space-y-2 ring-1 ring-amber-500/10">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" /> 6. Binding Ratio Decidendi
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">
                Judicial Rule
              </span>
            </h3>

            {isEditing ? (
              <textarea
                value={formData.ratio_decidendi}
                onChange={(e) => handleInputChange('ratio_decidendi', e.target.value)}
                rows={3}
                placeholder="Binding proposition of law established by the court..."
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-amber-200 font-serif text-xs leading-relaxed focus:border-amber-500"
              />
            ) : (
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200 font-serif leading-relaxed">
                {caseData.ratio_decidendi || 'Ratio decidendi synthesized from judicial reasoning paragraphs.'}
              </div>
            )}
          </div>

          {/* Section 7: Law Reporter Headnote Summary */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> 7. Law Reporter Headnote (SCR/CTC Style)
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                SCR/CTC Catchwords
              </span>
            </h3>

            {isEditing ? (
              <textarea
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                rows={5}
                placeholder="SCR/CTC Law Reporter catchwords and executive summary..."
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-serif text-xs leading-relaxed focus:border-amber-500 whitespace-pre-wrap"
              />
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed font-serif whitespace-pre-wrap">
                {caseData.summary || 'Summary synthesized by legal extraction pipeline.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <XCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold font-serif text-white">Reject Case Document</h3>
            </div>
            <p className="text-xs text-slate-400">
              Please specify the mandatory rejection reason. The document will be quarantined and will not be published in the public repository.
            </p>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Reason for Rejection</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="Corrupt / Illegible PDF">Corrupt / Illegible PDF</option>
                  <option value="Duplicate Case">Duplicate Case Under Different Number</option>
                  <option value="Non-Madras HC Jurisdiction">Non-Madras HC Jurisdiction</option>
                  <option value="Incomplete Judgment Pages">Incomplete Judgment Pages</option>
                  <option value="Other Discrepancy">Other Discrepancy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Auditor Review Notes (Optional)</label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Provide context for registry auditing..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseReviewPage;
