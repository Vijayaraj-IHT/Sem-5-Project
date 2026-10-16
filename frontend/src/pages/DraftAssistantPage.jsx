import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  Save,
  FolderOpen,
  Plus,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  RotateCw,
  Scale,
  ShieldCheck,
  Info,
  Clock,
  Copy,
  Check,
  Layers,
  Gavel,
  ArrowRight,
  ListChecks,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyzeDraft, createSession, getSessions, compareWithPrecedent } from '../api/draft';
import { getCases } from '../api/cases';
import LoadingSpinner from '../components/common/LoadingSpinner';

const SEVERITY_BADGES = {
  high: { label: 'High Priority Gap', bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  medium: { label: 'Recommended Ground', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  low: { label: 'Procedural Note', bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
};

export default function DraftAssistantPage() {
  const { user, role, loading: authLoading } = useAuth();
  const currentRole = role || user?.role || 'public';

  // Split-pane dragging state
  const [leftWidthPercent, setLeftWidthPercent] = useState(60);
  const isDraggingRef = useRef(false);
  const containerRef = useRef(null);
  const textareaRef = useRef(null);

  // Editor states
  const [sessionTitle, setSessionTitle] = useState('Untitled Petition Draft');
  const [petitionText, setPetitionText] = useState('');
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Sessions list
  const [savedSessions, setSavedSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionSaveStatus, setSessionSaveStatus] = useState(null);

  // Analysis states
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [insertedCitationIds, setInsertedCitationIds] = useState(new Set());

  // Precedent Precision Comparator States
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get('caseId');
  const [activeRightTab, setActiveRightTab] = useState(caseIdParam ? 'precedent_compare' : 'gap_analysis');
  const [targetPrecedentId, setTargetPrecedentId] = useState(caseIdParam || '');
  const [precedentList, setPrecedentList] = useState([]);
  const [loadingPrecedents, setLoadingPrecedents] = useState(false);
  const [comparingPrecedent, setComparingPrecedent] = useState(false);
  const [precedentCompareResult, setPrecedentCompareResult] = useState(null);
  const [compareError, setCompareError] = useState(null);
  const [copiedClauseId, setCopiedClauseId] = useState(null);

  // Sync caseId query param
  useEffect(() => {
    if (caseIdParam) {
      setTargetPrecedentId(caseIdParam);
      setActiveRightTab('precedent_compare');
    }
  }, [caseIdParam]);

  // Load available precedent cases for selection
  useEffect(() => {
    async function loadPrecedents() {
      try {
        setLoadingPrecedents(true);
        const data = await getCases({ limit: 50 });
        if (Array.isArray(data)) {
          setPrecedentList(data);
          if (!targetPrecedentId && data.length > 0 && !caseIdParam) {
            setTargetPrecedentId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load precedent cases:', err);
      } finally {
        setLoadingPrecedents(false);
      }
    }
    loadPrecedents();
  }, [caseIdParam]);

  // Execute 3-Layer Precedent Comparison
  const handleComparePrecedent = async () => {
    if (!petitionText || petitionText.trim().length < 10) {
      setCompareError('Please write at least 10 characters in your petition draft before comparing.');
      return;
    }
    if (!targetPrecedentId) {
      setCompareError('Please select a precedent judgment from the dropdown.');
      return;
    }
    try {
      setComparingPrecedent(true);
      setCompareError(null);
      const res = await compareWithPrecedent(petitionText, targetPrecedentId);
      setPrecedentCompareResult(res);
    } catch (err) {
      console.error('Precedent comparison error:', err);
      setCompareError(err?.response?.data?.detail || 'Failed to execute precedent comparison.');
    } finally {
      setComparingPrecedent(false);
    }
  };

  // 1-Click Insert boilerplate clause into petition text
  const handleInsertBoilerplate = (content) => {
    setPetitionText((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n\n${content}` : content;
    });
  };

  // Copy boilerplate clause to clipboard
  const handleCopyClause = (clauseId, content) => {
    navigator.clipboard.writeText(content);
    setCopiedClauseId(clauseId);
    setTimeout(() => setCopiedClauseId(null), 2500);
  };

  // Fetch saved sessions on load
  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const data = await getSessions();
      if (Array.isArray(data)) {
        setSavedSessions(data);
      }
    } catch (err) {
      console.error('Failed to load draft sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (['advocate', 'scholar', 'staff', 'senior_staff', 'court_staff'].includes(currentRole)) {
      fetchSessions();
    }
  }, [currentRole, fetchSessions]);

  // Handle draggable divider (mouse & touch)
  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Clamp between 30% and 75%
    if (newLeftWidth >= 30 && newLeftWidth <= 75) {
      setLeftWidthPercent(newLeftWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchMove = useCallback((e) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((touch.clientX - containerRect.left) / containerRect.width) * 100;
    if (newLeftWidth >= 30 && newLeftWidth <= 75) {
      setLeftWidthPercent(newLeftWidth);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }, [handleTouchMove]);

  const handleTouchStart = (e) => {
    isDraggingRef.current = true;
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Calculate text metrics
  const charCount = petitionText.length;
  const wordCount = petitionText.trim() ? petitionText.trim().split(/\s+/).length : 0;

  // Handle Draft Analysis
  const handleAnalyze = async () => {
    if (!petitionText.trim() || petitionText.trim().length < 20) {
      setAnalysisError('Please enter at least 20 characters in your petition draft before analyzing.');
      return;
    }

    try {
      setAnalyzing(true);
      setAnalysisError(null);
      const result = await analyzeDraft({
        petition_text: petitionText,
        session_id: activeSessionId,
        title: sessionTitle,
      });
      setAnalysisResult(result);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to analyze petition draft.';
      setAnalysisError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle Saving Session
  const handleSaveSession = async () => {
    if (!petitionText.trim()) {
      setSessionSaveStatus({ type: 'error', message: 'Cannot save an empty petition draft.' });
      return;
    }

    try {
      setSessionSaveStatus({ type: 'saving', message: 'Saving session...' });
      const created = await createSession({
        title: sessionTitle || 'Untitled Petition Draft',
        draft_text: petitionText,
      });
      setActiveSessionId(created.id);
      setSessionSaveStatus({ type: 'success', message: 'Draft session saved successfully!' });
      fetchSessions();
      setTimeout(() => setSessionSaveStatus(null), 3500);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save draft session.';
      setSessionSaveStatus({ type: 'error', message: msg });
      setTimeout(() => setSessionSaveStatus(null), 4000);
    }
  };

  // Handle Loading Session
  const handleSelectSession = (session) => {
    setActiveSessionId(session.id);
    setSessionTitle(session.title || 'Untitled Draft');
    setPetitionText(session.draft_text || '');
    if (session.gap_analysis_result) {
      setAnalysisResult(session.gap_analysis_result);
    }
    setShowSessionModal(false);
  };

  // Insert citation into editor
  const handleInsertCitation = (citation, index) => {
    const caseTitle = citation.case_title || 'Legal Precedent';
    const citationRef = citation.citation || 'Official Record';
    const confirmed = window.confirm(
      `Insert citation into petition draft?\n\n"${caseTitle} (${citationRef})"\n\nPlease verify that this citation matches your legal arguments before submitting to court.`
    );
    if (!confirmed) return;

    const citationText = `\n\n[Precedent Citation: ${citation.case_title} (${citation.citation}) - Re: ${citation.relevant_section}]\n"${citation.quote || citation.reasoning}"\n`;

    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const current = petitionText;
      const newText = current.substring(0, start) + citationText + current.substring(end);
      setPetitionText(newText);
    } else {
      setPetitionText((prev) => prev + citationText);
    }

    setInsertedCitationIds((prev) => new Set([...prev, index]));
  };

  // Access control check
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Validating advocate session credentials..." />
      </div>
    );
  }

  const isAdvocateOrAuthorized = ['advocate', 'staff', 'senior_staff', 'court_staff', 'scholar'].includes(currentRole);

  if (!isAdvocateOrAuthorized) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-slate-900 border border-slate-700 rounded-xl text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white font-serif mb-2">Advocate Workspace Restricted</h2>
        <p className="text-slate-300 mb-6">
          The AI-Powered Petition Draft Assistant is restricted to verified Advocates and Judicial Scholars with drafting privileges.
        </p>
        <Link
          to="/search"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Scale className="w-4 h-4" />
          Go to Case Search
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col -m-6 bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Top Action Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-serif tracking-tight text-white">
                Petition Draft Assistant
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                AI Precedent Grounding
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Draft legal petitions with real-time gap analysis and anti-hallucination precedent verification
            </p>
          </div>
        </div>

        {/* Session Management Actions */}
        <div className="flex items-center gap-2.5">
          {sessionSaveStatus && (
            <span
              className={`text-xs px-2.5 py-1 rounded border animate-fade-in ${
                sessionSaveStatus.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : sessionSaveStatus.type === 'error'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {sessionSaveStatus.message}
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowSessionModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            Load Session
            {savedSessions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] text-amber-300 font-mono">
                {savedSessions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleSaveSession}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            Save Session
          </button>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || !petitionText.trim()}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {analyzing ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                Analyzing Groundings...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Analyze Draft
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split-Pane Body */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
        {/* LEFT PANE: Editor (Default ~60%) */}
        <div
          style={{ width: `${leftWidthPercent}%` }}
          className="h-full flex flex-col bg-slate-950 border-r border-slate-800/80 p-5 overflow-hidden"
        >
          {/* Editor Header & Session Title Input */}
          <div className="flex items-center justify-between gap-4 mb-3 shrink-0">
            <div className="flex-1 flex items-center gap-2">
              <label htmlFor="session-title-input" className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
                Session Title:
              </label>
              <input
                id="session-title-input"
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g. Special Leave Petition - Art 136 Argument"
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-500/60 rounded-md px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden"
              />
            </div>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">
              Grounds Editor (Monospace)
            </span>
          </div>

          {/* Textarea for Petition Draft */}
          <div className="flex-1 relative flex flex-col rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden focus-within:border-amber-500/50 transition-colors">
            <textarea
              ref={textareaRef}
              value={petitionText}
              onChange={(e) => setPetitionText(e.target.value)}
              placeholder="Type or paste your legal petition, grounds of appeal, writ pleadings, or judicial submission here...

Example:
1. The Petitioner approaches this Hon'ble Court challenging the arbitrary impugned order dated...
2. It is submitted that the respondent authorities acted in gross violation of statutory mandates under Section 438 of the Code of Criminal Procedure...
3. There exists no prima facie case establishing criminal breach of trust under Section 406 IPC..."
              className="w-full flex-1 p-4 bg-transparent text-slate-100 placeholder-slate-600 font-mono text-xs md:text-sm leading-relaxed resize-none focus:outline-hidden select-text"
              spellCheck="false"
            />

            {/* Bottom Status & Metrics Bar */}
            <div className="h-8 bg-slate-900/90 border-t border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 shrink-0 font-mono">
              <div className="flex items-center gap-4">
                <span>Words: <strong className="text-slate-200">{wordCount}</strong></span>
                <span>Characters: <strong className="text-slate-200">{charCount}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                {activeSessionId && (
                  <span className="text-amber-400/90 truncate max-w-[150px]">
                    ID: {activeSessionId.substring(0, 8)}...
                  </span>
                )}
                <span className="text-slate-400">Ctrl+Enter to Analyze</span>
              </div>
            </div>
          </div>
        </div>

        {/* DRAGGABLE DIVIDER */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="w-2.5 bg-slate-900 hover:bg-amber-500/40 cursor-col-resize flex items-center justify-center transition-colors group select-none shrink-0 border-x border-slate-800/80 z-20"
          title="Drag to resize panes"
        >
          <div className="w-1 h-8 bg-slate-700 group-hover:bg-amber-400 rounded-full transition-colors" />
        </div>

        {/* RIGHT PANE: AI Analysis & Grounded Suggestions (Default ~40%) */}
        <div
          style={{ width: `${100 - leftWidthPercent}%` }}
          className="h-full flex flex-col bg-slate-900/40 overflow-y-auto p-5"
        >
          {/* Header Tabs: Gap Analysis vs Precedent Precision Comparator */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 shrink-0 gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveRightTab('gap_analysis')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeRightTab === 'gap_analysis'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Gap Analysis</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRightTab('precedent_compare')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeRightTab === 'precedent_compare'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Precedent Comparator</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  3-Layer
                </span>
              </button>
            </div>

            {activeRightTab === 'gap_analysis' && analysisResult && (
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Grounded
              </span>
            )}
            {activeRightTab === 'precedent_compare' && precedentCompareResult && (
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3" /> Audited
              </span>
            )}
          </div>

          {/* TAB 1: AI GAP ANALYSIS */}
          {activeRightTab === 'gap_analysis' && (
            <div className="flex-1 flex flex-col">
              {/* Analysis Error Alert */}
          {analysisError && (
            <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Analysis Notice</p>
                <p className="mt-0.5 leading-relaxed">{analysisError}</p>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {analyzing && (
            <div className="space-y-4 py-4 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-1/3 mb-2" />
              <div className="space-y-2">
                <div className="h-16 bg-slate-800/80 rounded-lg border border-slate-700/50" />
                <div className="h-16 bg-slate-800/80 rounded-lg border border-slate-700/50" />
              </div>

              <div className="h-4 bg-slate-800 rounded w-1/2 pt-4 mb-2" />
              <div className="space-y-3">
                <div className="h-28 bg-slate-800/80 rounded-lg border border-slate-700/50" />
                <div className="h-28 bg-slate-800/80 rounded-lg border border-slate-700/50" />
              </div>
              <p className="text-center text-xs text-amber-400/80 pt-2 font-mono">
                Matching semantic arguments against verified repository precedents...
              </p>
            </div>
          )}

          {/* Empty State */}
          {!analyzing && !analysisResult && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
              <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                <FileText className="w-7 h-7 text-amber-400/80" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">No Active Analysis</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
                Write your petition in the editor and click <strong className="text-amber-400">Analyze Draft</strong> to generate grounded AI suggestions, gap detection, and verified case citations.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero hallucination: only citations from published judgments</span>
              </div>
            </div>
          )}

          {/* Analysis Results Display */}
          {!analyzing && analysisResult && (
            <div className="space-y-6 text-xs select-text">
              {/* Disclaimer */}
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-[11px] flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  {analysisResult.disclaimer ||
                    'Suggestions grounded against repository precedents. Independent verification recommended before filing.'}
                </p>
              </div>

              {/* 1. Gap Analysis Section */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Gap Analysis ({analysisResult.missing_arguments?.length || 0})
                  </h3>
                </div>

                {analysisResult.missing_arguments && analysisResult.missing_arguments.length > 0 ? (
                  <div className="space-y-2">
                    {analysisResult.missing_arguments.map((gap, idx) => {
                      const severity = idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low';
                      const badge = SEVERITY_BADGES[severity];
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Gap #{idx + 1}</span>
                          </div>
                          <p className="text-slate-200 leading-relaxed">{gap}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    No critical argument gaps identified in current draft grounds.
                  </div>
                )}
              </div>

              {/* 2. Identified Grounds & Suggested Statutory Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Grounds */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Identified Grounds
                  </h4>
                  {analysisResult.identified_grounds && analysisResult.identified_grounds.length > 0 ? (
                    <ul className="space-y-1.5">
                      {analysisResult.identified_grounds.map((ground, i) => (
                        <li key={i} className="text-slate-300 text-[11px] leading-tight flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{ground}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 text-[11px]">No specific legal grounds parsed.</p>
                  )}
                </div>

                {/* Suggested Statutory Sections */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-blue-400" />
                    Suggested Sections
                  </h4>
                  {analysisResult.suggested_sections && analysisResult.suggested_sections.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.suggested_sections.map((sec, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-mono"
                        >
                          {sec}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-[11px]">No additional sections suggested.</p>
                  )}
                </div>
              </div>

              {/* 3. Precedent Citation Suggestions */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" />
                    Grounded Precedent Citations ({analysisResult.citation_suggestions?.length || 0})
                  </h3>
                </div>

                {analysisResult.citation_suggestions && analysisResult.citation_suggestions.length > 0 ? (
                  <div className="space-y-3">
                    {analysisResult.citation_suggestions.map((cit, idx) => {
                      const isInserted = insertedCitationIds.has(idx);
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <Link
                                to={`/cases/${cit.case_id}`}
                                className="font-semibold text-white hover:text-amber-400 transition-colors inline-flex items-center gap-1.5 text-xs font-serif"
                              >
                                {cit.case_title}
                                <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  {cit.citation}
                                </span>
                                {cit.relevant_section && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Section: {cit.relevant_section}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleInsertCitation(cit, idx)}
                              className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                                isInserted
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                              }`}
                            >
                              {isInserted ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  Inserted
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" />
                                  Insert
                                </>
                              )}
                            </button>
                          </div>

                          {/* Reasoning */}
                          {cit.reasoning && (
                            <p className="text-slate-300 text-xs mb-2 leading-relaxed">
                              <strong className="text-slate-400 font-normal">Applicability: </strong>
                              {cit.reasoning}
                            </p>
                          )}

                          {/* Quote block */}
                          {cit.quote && (
                            <blockquote className="p-2 rounded bg-slate-950/80 border-l-2 border-amber-500 text-slate-400 italic text-[11px] font-serif">
                              &ldquo;{cit.quote}&rdquo;
                            </blockquote>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                    No relevant matching precedents found in current index.
                  </div>
                )}
              </div>
            </div>
          )}
            </div>
          )}

          {/* TAB 2: 3-LAYER PRECEDENT PRECISION COMPARATOR */}
          {activeRightTab === 'precedent_compare' && (
            <div className="flex-1 flex flex-col space-y-4">
              {/* Precedent Selector Control */}
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-emerald-400" />
                    Target Landmark Precedent
                  </label>
                  {loadingPrecedents && (
                    <span className="text-[10px] text-slate-400 animate-pulse">Loading cases...</span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={targetPrecedentId}
                    onChange={(e) => setTargetPrecedentId(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="">-- Select Target Precedent --</option>
                    {precedentList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.year}) - {c.court}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleComparePrecedent}
                    disabled={comparingPrecedent || !targetPrecedentId}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {comparingPrecedent ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        Auditing...
                      </>
                    ) : (
                      <>
                        <Layers className="w-3.5 h-3.5" />
                        Audit Draft
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {compareError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-rose-200">Precedent Audit Notice</p>
                    <p className="mt-0.5 leading-relaxed">{compareError}</p>
                  </div>
                </div>
              )}

              {/* Loading Skeleton */}
              {comparingPrecedent && (
                <div className="space-y-4 py-6 animate-pulse text-center">
                  <LoadingSpinner size="md" message="Executing 3-Layer Precedent Precision Audit..." />
                  <p className="text-xs text-emerald-400/80 font-mono mt-2">
                    Layer 1: Statutory tests • Layer 2: Ratio alignment • Layer 3: Boilerplate generation
                  </p>
                </div>
              )}

              {/* Initial Empty State */}
              {!comparingPrecedent && !precedentCompareResult && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                  <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                    <Scale className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">
                    3-Layer Precision Precedent Comparator
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
                    Select a binding landmark case (e.g. <em className="text-slate-300">Shreya Singhal</em>, <em className="text-slate-300">Arnesh Kumar</em>) and click <strong className="text-emerald-400">Audit Draft</strong> to run deep statutory and ratio compliance checks.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-md text-left">
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px]">
                      <span className="font-bold text-emerald-400 block mb-0.5">Layer 1</span>
                      <span className="text-slate-400">Statutory test conditions checklist</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px]">
                      <span className="font-bold text-emerald-400 block mb-0.5">Layer 2</span>
                      <span className="text-slate-400">Ratio decidendi doctrine alignment</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px]">
                      <span className="font-bold text-emerald-400 block mb-0.5">Layer 3</span>
                      <span className="text-slate-400">1-click boilerplate paragraphs</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Comparison Results */}
              {!comparingPrecedent && precedentCompareResult && (
                <div className="space-y-5 text-xs select-text">
                  {/* Target Case Info Ribbon */}
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <Link
                        to={`/cases/${precedentCompareResult.case_id}`}
                        className="font-bold text-white hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 text-xs font-serif"
                      >
                        {precedentCompareResult.case_title} ({precedentCompareResult.year})
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {precedentCompareResult.court} &bull; {precedentCompareResult.citation || 'Official Precedent'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Compliance</span>
                      <span className={`text-sm font-bold font-mono ${
                        precedentCompareResult.compliance_percentage >= 70
                          ? 'text-emerald-400'
                          : precedentCompareResult.compliance_percentage >= 40
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}>
                        {precedentCompareResult.compliance_percentage}%
                      </span>
                    </div>
                  </div>

                  {/* LAYER 1: STATUTORY CONDITIONS AUDIT */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                        <ListChecks className="w-3.5 h-3.5" />
                        Layer 1: Precedent Statutory Checklist
                      </h4>
                      <span className="text-[11px] text-slate-300 font-mono">
                        {precedentCompareResult.fulfilled_count} / {precedentCompareResult.total_tests} Satisfied
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${
                          precedentCompareResult.compliance_percentage >= 70
                            ? 'bg-emerald-500'
                            : precedentCompareResult.compliance_percentage >= 40
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${precedentCompareResult.compliance_percentage}%` }}
                      />
                    </div>

                    {/* List of Statutory Tests */}
                    <div className="space-y-2 mt-2">
                      {precedentCompareResult.statutory_audit.map((item, idx) => {
                        const isFulfilled = item.status === 'fulfilled';
                        return (
                          <div
                            key={`test-${idx}`}
                            className={`p-3 rounded-xl border transition-all ${
                              isFulfilled
                                ? 'bg-emerald-950/20 border-emerald-500/30'
                                : 'bg-rose-950/20 border-rose-500/30'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex items-start gap-2">
                                {isFulfilled ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                )}
                                <span className="font-semibold text-slate-200 text-xs">
                                  {item.test}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                                  isFulfilled
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                {isFulfilled ? 'Fulfilled' : 'Omitted'}
                              </span>
                            </div>

                            {/* Excerpt if fulfilled */}
                            {isFulfilled && item.matched_clause && (
                              <p className="text-[11px] text-slate-300 pl-6 italic">
                                &ldquo;{item.matched_clause}&rdquo;
                              </p>
                            )}

                            {/* Recommendation if omitted */}
                            {!isFulfilled && item.recommendation && (
                              <p className="text-[11px] text-rose-200/90 pl-6 mt-1 leading-relaxed">
                                💡 <strong>Action:</strong> {item.recommendation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* LAYER 2: RATIO DECIDENDI ALIGNMENT */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                        <Gavel className="w-3.5 h-3.5" />
                        Layer 2: Binding Ratio Alignment
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          precedentCompareResult.ratio_alignment.alignment_status === 'strong_alignment'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : precedentCompareResult.ratio_alignment.alignment_status === 'partial_alignment'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {precedentCompareResult.ratio_alignment.alignment_status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed">
                      {precedentCompareResult.ratio_alignment.analysis}
                    </p>

                    {/* Binding Principle Highlight */}
                    <div className="p-3 rounded-lg bg-emerald-950/30 border-l-3 border-emerald-500">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                        Binding Holding / Precedent Rule:
                      </span>
                      <p className="text-[11px] text-emerald-100 font-serif italic leading-relaxed">
                        &ldquo;{precedentCompareResult.ratio_alignment.binding_principle}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* LAYER 3: ACTIONABLE BOILERPLATE PARAGRAPHS */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Layer 3: 1-Click Boilerplate Paragraphs
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Ready to inject into draft
                      </span>
                    </div>

                    <div className="space-y-3">
                      {precedentCompareResult.boilerplate_suggestions.map((sug) => {
                        const isCopied = copiedClauseId === sug.id;
                        return (
                          <div
                            key={sug.id}
                            className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase">
                                  {sug.clause_type}
                                </span>
                                <h5 className="font-semibold text-white text-xs">{sug.title}</h5>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopyClause(sug.id, sug.content)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                                  title="Copy clause to clipboard"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      Copy
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleInsertBoilerplate(sug.content)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors shadow-xs cursor-pointer"
                                  title="Append this boilerplate clause directly into petition text"
                                >
                                  <Plus className="w-3 h-3" />
                                  Insert in Draft
                                </button>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-300 font-serif leading-relaxed bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
                              {sug.content}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SESSION MANAGER MODAL */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-serif">Saved Drafting Sessions</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSessionModal(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {loadingSessions ? (
                <div className="py-8 text-center">
                  <LoadingSpinner size="md" message="Loading saved sessions..." />
                </div>
              ) : savedSessions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p>No saved drafting sessions found.</p>
                  <p className="mt-1 text-slate-400">Click &ldquo;Save Session&rdquo; on any draft to store it here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedSessions.map((sess) => (
                    <button
                      key={sess.id}
                      type="button"
                      onClick={() => handleSelectSession(sess)}
                      className="w-full text-left p-3 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex-1 pr-3 truncate">
                        <p className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors truncate">
                          {sess.title || 'Untitled Session'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {sess.draft_text ? sess.draft_text.substring(0, 90) : 'No draft content'}...
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                          Updated: {new Date(sess.updated_at || sess.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-[11px] px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 font-medium group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                        Load
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSessionModal(false)}
                className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
