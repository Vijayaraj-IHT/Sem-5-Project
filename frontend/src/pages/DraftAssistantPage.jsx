import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyzeDraft, createSession, getSessions } from '../api/draft';
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
    if (['advocate', 'scholar', 'senior_staff', 'court_staff'].includes(currentRole)) {
      fetchSessions();
    }
  }, [currentRole, fetchSessions]);

  // Handle draggable divider
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

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

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

  const isAdvocateOrAuthorized = ['advocate', 'senior_staff', 'court_staff', 'scholar'].includes(currentRole);

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
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white font-serif">
                AI Analysis & Suggestions
              </h2>
            </div>
            {analysisResult && (
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Grounded
              </span>
            )}
          </div>

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
