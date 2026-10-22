import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Scale,
  Building2,
  Calendar,
  BookOpen,
  Heart,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  FileText,
  AlertCircle,
  Tag,
  CheckCircle2,
  Gavel,
  ShieldCheck,
  Copy,
  Check,
  Filter,
} from 'lucide-react';
import { searchCases } from '../api/search';
import { getBookmarks, addBookmark, removeBookmark } from '../api/bookmarks';
import { useAuth } from '../context/AuthContext';

const COURT_OPTIONS = [
  'All Courts',
  'Supreme Court',
  'High Court',
  'District Court',
  'Tribunal',
];

const BENCH_OPTIONS = [
  'All Benches',
  'Madras High Court (Principal Seat, Chennai)',
  'Madras High Court (Madurai Bench)',
  'Supreme Court of India',
];

const DISPOSITION_OPTIONS = [
  'All Dispositions',
  'Allowed',
  'Dismissed',
  'Partly Allowed',
  'Quashed',
  'Disposed of',
  'Remanded',
];

const QUICK_SEARCH_CHIPS = [
  { label: 'Anticipatory Bail (BNSS 482)', query: 'anticipatory bail apprehension of arrest BNSS 482' },
  { label: 'S. 482 CrPC FIR Quashing', query: 'quashing FIR abuse of process criminal proceedings' },
  { label: 'S. 138 NI Act Cheque Bounce', query: 'Section 138 Negotiable Instruments Act cheque bounce' },
  { label: 'NDPS Commercial Quantity Bail', query: 'NDPS Act Section 37 commercial quantity twin conditions' },
  { label: 'Madras HC Article 226 Writs', query: 'Article 226 writ petition mandamus judicial review' },
];

const PAGE_SIZE = 10;

/**
 * High-performance highlight function to highlight search tokens in text snippet
 */
function HighlightedText({ text, query }) {
  if (!text) return null;
  if (!query || !query.trim()) return <span>{text}</span>;

  const words = query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (words.length === 0) return <span>{text}</span>;

  const regex = new RegExp(`(${words.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 px-1 py-0.5 rounded font-medium">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

/**
 * Search Page for Lexguard Legal Case Research Platform
 */
const SearchPage = () => {
  const { user, role, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search input state
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);

  // Filters state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    court: searchParams.get('court') || 'All Courts',
    bench: searchParams.get('bench') || 'All Benches',
    year_from: searchParams.get('year_from') || '',
    year_to: searchParams.get('year_to') || '',
    act: searchParams.get('act') || '',
    outcome: searchParams.get('outcome') || 'All',
    disposition: searchParams.get('disposition') || 'All Dispositions',
  });
  const [copiedCitationId, setCopiedCitationId] = useState(null);

  // Results & Pagination state
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [queryUnderstanding, setQueryUnderstanding] = useState(null);

  // Bookmark tracking: Map of caseId -> bookmarkId
  const [bookmarkedMap, setBookmarkedMap] = useState(new Map());
  const [bookmarkLoadingId, setBookmarkLoadingId] = useState(null);

  // User permission: Must be authenticated and role not public
  const canBookmark = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    const currentRole = role || user.role || 'public';
    return currentRole !== 'public';
  }, [isAuthenticated, user, role]);

  // Load existing bookmarks for authenticated non-public user
  const fetchUserBookmarks = useCallback(async () => {
    if (!canBookmark) return;
    try {
      const data = await getBookmarks();
      if (Array.isArray(data)) {
        const map = new Map();
        data.forEach((b) => {
          const caseId = b.case_id || b.case?.id || b.id;
          if (caseId) {
            map.set(String(caseId), b.id || true);
          }
        });
        setBookmarkedMap(map);
      }
    } catch {
      // Fallback: graceful degradation if backend bookmarks endpoint is offline
    }
  }, [canBookmark]);

  useEffect(() => {
    fetchUserBookmarks();
  }, [fetchUserBookmarks]);

  // Execute Search API call with RRF Fusion
  const performSearch = useCallback(
    async (searchQuery, appliedFilters, page = 1) => {
      setLoading(true);
      setErrorMessage(null);
      const offset = (page - 1) * PAGE_SIZE;

      // Prepare filter payload
      const filterPayload = {};
      if (appliedFilters.court && appliedFilters.court !== 'All Courts') {
        filterPayload.court = appliedFilters.court;
      }
      if (appliedFilters.bench && appliedFilters.bench !== 'All Benches') {
        filterPayload.bench = appliedFilters.bench;
      }
      if (appliedFilters.disposition && appliedFilters.disposition !== 'All Dispositions') {
        filterPayload.disposition = appliedFilters.disposition;
      }
      if (appliedFilters.year_from) {
        filterPayload.year_from = parseInt(appliedFilters.year_from, 10);
      }
      if (appliedFilters.year_to) {
        filterPayload.year_to = parseInt(appliedFilters.year_to, 10);
      }
      if (appliedFilters.act && appliedFilters.act.trim()) {
        filterPayload.act = appliedFilters.act.trim();
      }
      if (appliedFilters.outcome && appliedFilters.outcome !== 'All') {
        filterPayload.outcome = appliedFilters.outcome;
      }

      try {
        const response = await searchCases({
          query: searchQuery || '',
          filters: filterPayload,
          limit: PAGE_SIZE,
          offset,
        });

        const items = response.results || [];
        setResults(items);
        setTotalCount(response.total ?? items.length);
        setQueryUnderstanding(response.query_understanding || null);
        setActiveQuery(searchQuery);
        setHasSearched(true);
      } catch (err) {
        console.error('Search failed:', err);
        setErrorMessage(
          err.response?.data?.detail || 'Failed to complete search query. Please try again.'
        );
        setResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Trigger search on mount if initial query exists, or load initial cases
  useEffect(() => {
    performSearch(initialQuery, filters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Form Submit
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setCurrentPage(1);

    // Update query params
    const nextParams = new URLSearchParams();
    if (query.trim()) nextParams.set('q', query.trim());
    if (filters.court && filters.court !== 'All Courts') nextParams.set('court', filters.court);
    if (filters.bench && filters.bench !== 'All Benches') nextParams.set('bench', filters.bench);
    if (filters.disposition && filters.disposition !== 'All Dispositions') nextParams.set('disposition', filters.disposition);
    if (filters.year_from) nextParams.set('year_from', filters.year_from);
    if (filters.year_to) nextParams.set('year_to', filters.year_to);
    if (filters.act) nextParams.set('act', filters.act);
    if (filters.outcome && filters.outcome !== 'All') nextParams.set('outcome', filters.outcome);
    setSearchParams(nextParams);

    performSearch(query.trim(), filters, 1);
  };

  // Handle Pagination
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || loading) return;
    setCurrentPage(newPage);
    performSearch(activeQuery, filters, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset Filters
  const handleResetFilters = () => {
    const defaultFilters = {
      court: 'All Courts',
      bench: 'All Benches',
      year_from: '',
      year_to: '',
      act: '',
      outcome: 'All',
      disposition: 'All Dispositions',
    };
    setFilters(defaultFilters);
    setCurrentPage(1);
    performSearch(query.trim(), defaultFilters, 1);
  };

  // Copy Citation Helper
  const handleCopyCitation = (result, e) => {
    e.preventDefault();
    e.stopPropagation();
    const citation = `${result.title}, ${result.court || 'Court of Record'} (${result.year || 'n.d.'})${
      result.case_no ? ` [${result.case_no}]` : ''
    }`;
    navigator.clipboard.writeText(citation).then(() => {
      setCopiedCitationId(result.id);
      setTimeout(() => {
        setCopiedCitationId((curr) => (curr === result.id ? null : curr));
      }, 2500);
    });
  };

  // Toggle Bookmark handler
  const handleToggleBookmark = async (caseItem, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canBookmark) {
      alert('Bookmarking is available for registered Advocates, Scholars, and Court Staff. Please sign in with an eligible account.');
      return;
    }

    const caseId = String(caseItem.id);
    const isBookmarked = bookmarkedMap.has(caseId);
    setBookmarkLoadingId(caseId);

    try {
      if (isBookmarked) {
        const bookmarkId = bookmarkedMap.get(caseId);
        // Call removeBookmark
        if (bookmarkId && bookmarkId !== true) {
          await removeBookmark(bookmarkId);
        } else {
          await removeBookmark(caseId);
        }
        setBookmarkedMap((prev) => {
          const next = new Map(prev);
          next.delete(caseId);
          return next;
        });
      } else {
        const res = await addBookmark(caseId);
        setBookmarkedMap((prev) => {
          const next = new Map(prev);
          next.set(caseId, res?.id || true);
          return next;
        });
      }
    } catch (err) {
      console.warn('Bookmark sync warning, using local state:', err);
      // Fallback optimistic toggle
      setBookmarkedMap((prev) => {
        const next = new Map(prev);
        if (isBookmarked) {
          next.delete(caseId);
        } else {
          next.set(caseId, true);
        }
        return next;
      });
    } finally {
      setBookmarkLoadingId(null);
    }
  };

  // Relevance Score Badge Renderer
  const renderRelevanceBadge = (score) => {
    const numScore = typeof score === 'number' ? score : parseFloat(score) || 0;
    const percentage = Math.round(numScore * 100);

    if (numScore >= 0.7) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs"
          title={`Relevance score: ${numScore.toFixed(3)}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          High Relevance ({percentage}%)
        </span>
      );
    }
    if (numScore >= 0.4) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs"
          title={`Relevance score: ${numScore.toFixed(3)}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Medium ({percentage}%)
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300 shadow-2xs"
        title={`Relevance score: ${numScore.toFixed(3)}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Low ({percentage}%)
      </span>
    );
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const activeFiltersCount = [
    filters.court !== 'All Courts',
    filters.bench !== 'All Benches',
    filters.disposition !== 'All Dispositions',
    Boolean(filters.year_from),
    Boolean(filters.year_to),
    Boolean(filters.act && filters.act.trim()),
    filters.outcome !== 'All',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      {/* Top Hero / Search Banner */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 border-b border-slate-800 pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header Title */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
                Judicial Precedent & Case Search
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Hybrid AI retrieval fusing Reciprocal Rank Fusion (RRF), Hugging Face vector embeddings, and official judgment text.
              </p>
            </div>
          </div>

          {/* Search Bar Form */}
          <form onSubmit={handleSearchSubmit} className="mt-6">
            <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5 shadow-2xl">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search legal cases, CNR numbers (TNCH... / TNMD...), statutes, or judgments..."
                  className="w-full pl-11 pr-10 py-3.5 bg-slate-800/90 hover:bg-slate-800 focus:bg-slate-800 text-white placeholder-slate-400 rounded-xl border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-base outline-hidden transition-all duration-200"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                    title="Clear query"
                  >
                    <span className="text-sm px-1.5 py-0.5 rounded bg-slate-700/60 hover:bg-slate-700">✕</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-400/10 disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search Cases
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Legal Topic Chips Strip */}
          <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Quick Searches:
            </span>
            {QUICK_SEARCH_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(chip.query);
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.set('q', chip.query);
                  setSearchParams(nextParams);
                  performSearch(chip.query, filters, 1);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-colors shrink-0 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Advanced Filters Toggle & Active Tags */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  filtersOpen || activeFiltersCount > 0
                    ? 'bg-slate-800 border-amber-400/50 text-amber-300 shadow-sm'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>Advanced Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-slate-950 font-bold rounded-full text-[10px]">
                    {activeFiltersCount}
                  </span>
                )}
                {filtersOpen ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
              </button>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
                  title="Clear all filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>

            {/* Quick Helper Suggestion */}
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Supports natural language queries (e.g. &quot;anticipatory bail BNSS 482&quot;)</span>
            </div>
          </div>

          {/* Expandable Filters Panel */}
          {filtersOpen && (
            <div className="mt-4 p-5 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Judicial Bench Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Judicial Bench
                  </label>
                  <select
                    value={filters.bench}
                    onChange={(e) => setFilters({ ...filters, bench: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden"
                  >
                    {BENCH_OPTIONS.map((bench) => (
                      <option key={bench} value={bench}>
                        {bench}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Disposition Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Operative Disposition
                  </label>
                  <select
                    value={filters.disposition}
                    onChange={(e) => setFilters({ ...filters, disposition: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden"
                  >
                    {DISPOSITION_OPTIONS.map((disp) => (
                      <option key={disp} value={disp}>
                        {disp}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Range: From & To */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Year Range (From – To)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="1900"
                      max="2030"
                      placeholder="From"
                      value={filters.year_from}
                      onChange={(e) => setFilters({ ...filters, year_from: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:border-amber-400 outline-hidden"
                    />
                    <input
                      type="number"
                      min="1900"
                      max="2030"
                      placeholder="To"
                      value={filters.year_to}
                      onChange={(e) => setFilters({ ...filters, year_to: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:border-amber-400 outline-hidden"
                    />
                  </div>
                </div>

                {/* Act / Statute Input & Presets */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Act / Statutory Sanhita
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. BNSS, CrPC, BNS, IPC, Negotiable Instruments Act, NDPS"
                      value={filters.act}
                      onChange={(e) => setFilters({ ...filters, act: e.target.value })}
                      className="flex-1 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:border-amber-400 outline-hidden"
                    />
                    {filters.act && (
                      <button
                        type="button"
                        onClick={() => setFilters({ ...filters, act: '' })}
                        className="px-2.5 py-2 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-700 rounded-lg"
                      >
                        Clear Act
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['BNSS', 'CrPC', 'BNS', 'IPC', 'NI Act', 'NDPS', 'Constitution'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFilters({ ...filters, act: preset })}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          filters.act === preset
                            ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Panel Action Buttons */}
              <div className="mt-4 pt-4 border-t border-slate-700/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-md hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-md text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content & Results Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Search query failed</p>
              <p className="text-xs text-rose-300 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* AI Query Understanding Tags (if extracted by local LLM/NER) */}
        {queryUnderstanding && (queryUnderstanding.sections?.length > 0 || queryUnderstanding.acts?.length > 0) && (
          <div className="mb-6 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/80 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-amber-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI Extracted Concepts:
            </span>
            {queryUnderstanding.acts?.map((act, i) => (
              <span key={`act-${i}`} className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-medium">
                {act}
              </span>
            ))}
            {queryUnderstanding.sections?.map((sec, i) => (
              <span key={`sec-${i}`} className="px-2 py-0.5 rounded bg-yellow-950 text-yellow-300 border border-yellow-800 font-mono">
                {sec}
              </span>
            ))}
          </div>
        )}

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white">
              {activeQuery ? (
                <>
                  Found <span className="text-amber-400 font-bold">{totalCount}</span> results for &ldquo;
                  <span className="text-slate-200">{activeQuery}</span>&rdquo;
                </>
              ) : (
                <>
                  Browse All Published Precedents (<span className="text-amber-400 font-bold">{totalCount}</span> records)
                </>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing page {currentPage} of {totalPages} &bull; Ranked by Hugging Face semantic similarity
            </p>
          </div>

          {totalCount > 0 && (
            <div className="text-xs text-slate-400 font-mono">
              Displaying {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalCount)} &ndash;{' '}
              {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
            </div>
          )}
        </div>

        {/* Loading State: Skeleton Cards */}
        {loading && (
          <div className="mt-6 space-y-4">
            {[1, 2, 3, 4].map((sk) => (
              <div
                key={sk}
                className="p-6 rounded-xl bg-slate-800/40 border border-slate-800 animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-slate-700/60 rounded w-2/3" />
                  <div className="h-5 bg-slate-700/60 rounded-full w-24" />
                </div>
                <div className="flex gap-2">
                  <div className="h-4 bg-slate-700/40 rounded w-28" />
                  <div className="h-4 bg-slate-700/40 rounded w-16" />
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 bg-slate-700/30 rounded w-full" />
                  <div className="h-3.5 bg-slate-700/30 rounded w-5/6" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-4 bg-slate-700/40 rounded w-32" />
                  <div className="h-8 bg-slate-700/60 rounded-lg w-28" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && hasSearched && results.length === 0 && (
          <div className="mt-12 text-center py-16 px-4 bg-slate-800/30 border border-slate-800/80 rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-400 shadow-inner">
              <Scale className="w-8 h-8 opacity-80" />
            </div>
            <h3 className="text-xl font-bold text-white font-serif">No precedent results found</h3>
            <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
              We couldn&apos;t find any case judgments matching &ldquo;{activeQuery}&rdquo;.
              Try adjusting your query, widening the year range, or clearing filters.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
              >
                Clear Filters
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  performSearch('', { court: 'All Courts', year_from: '', year_to: '', act: '', outcome: 'All' }, 1);
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg transition-colors"
              >
                View All Published Cases
              </button>
            </div>
          </div>
        )}

        {/* Results List */}
        {!loading && results.length > 0 && (
          <div className="mt-6 space-y-4.5">
            {results.map((result) => {
              const caseId = String(result.id);
              const isBookmarked = bookmarkedMap.has(caseId);
              const isBookmarkBusy = bookmarkLoadingId === caseId;

              // Extract tag arrays safely
              const actTags = Array.isArray(result.act_tags) ? result.act_tags : [];
              const matchedSections = Array.isArray(result.matched_sections) ? result.matched_sections : [];
              const citationCount = result.citation_count ?? result.citations?.length ?? 0;

              return (
                <article
                  key={result.id}
                  className="group relative bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 rounded-xl p-5 sm:p-6 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {/* Top Row: Title & Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <Link
                        to={`/cases/${result.id}`}
                        className="text-lg sm:text-xl font-bold font-serif text-white hover:text-amber-400 transition-colors line-clamp-2 leading-snug"
                      >
                        {result.title}
                      </Link>

                      {/* Case Number & Parties */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                        {result.case_no && (
                          <span className="font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/60 text-slate-300">
                            {result.case_no}
                          </span>
                        )}
                        {result.parties && (
                          <span className="italic truncate max-w-md text-slate-400">
                            {result.parties}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Relevance Score Badge */}
                    <div className="shrink-0">
                      {renderRelevanceBadge(result.relevance_score)}
                    </div>
                  </div>

                  {/* Metadata Row: Court/Bench, Coram Judge, Year, Disposition, Citation Count */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
                    {/* Court & Bench Badge */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      {result.court || 'High Court of Judicature'}
                    </span>

                    {/* Coram / Judge */}
                    {result.judge && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300 font-medium">
                        <Gavel className="w-3.5 h-3.5 text-amber-400" />
                        Hon&apos;ble {result.judge}
                      </span>
                    )}

                    {/* Year Badge */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {result.year || 'N/A'}
                    </span>

                    {/* Operative Disposition Badge */}
                    {(result.disposition || result.outcome) && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold border capitalize ${
                          (result.disposition || result.outcome).toLowerCase().includes('allow')
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : (result.disposition || result.outcome).toLowerCase().includes('dismiss')
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                            : (result.disposition || result.outcome).toLowerCase().includes('quash')
                            ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800'
                        }`}
                      >
                        <Scale className="w-3 h-3" />
                        <span>{result.disposition || result.outcome}</span>
                      </span>
                    )}

                    {/* Citation Count */}
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900/50 border border-slate-700/60 text-slate-400 font-medium"
                      title="Precedent citation mentions"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      {citationCount} {citationCount === 1 ? 'Citation' : 'Citations'}
                    </span>
                  </div>

                  {/* Binding Ratio Decidendi (Illuminated Legal Principle) */}
                  {result.ratio_decidendi && (
                    <div className="mt-3 p-3.5 rounded-xl bg-emerald-950/20 border-l-4 border-emerald-500 text-xs text-emerald-100">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                        <Gavel className="w-3 h-3" />
                        <span>Binding Ratio Decidendi</span>
                      </div>
                      <p className="italic font-serif leading-relaxed">
                        &ldquo;{result.ratio_decidendi}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Matched Sections Highlight */}
                  {matchedSections.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-amber-300 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Matched Sections:
                      </span>
                      {matchedSections.map((sec, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-yellow-400/10 text-yellow-300 border border-yellow-400/30"
                        >
                          {sec}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Official PDF Matched Excerpts */}
                  {Array.isArray(result.matched_snippets) && result.matched_snippets.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {result.matched_snippets.map((snip, sIdx) => (
                        <div key={`snip-${sIdx}`} className="text-xs bg-slate-950/80 border-l-2 border-amber-400 p-2.5 rounded-r-md text-slate-200">
                          <span className="text-amber-400 font-bold mr-1.5 text-[11px] uppercase tracking-wider">Official Judgment Excerpt:</span>
                          <span dangerouslySetInnerHTML={{ __html: snip }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Summary / Snippet with query highlights */}
                  {result.summary && (
                    <div className="mt-3 text-sm text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                      <HighlightedText text={result.summary} query={activeQuery} />
                    </div>
                  )}

                  {/* Act Tags */}
                  {actTags.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {actTags.map((act, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-500 transition-colors"
                        >
                          {act}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Bar: Compare, Cite, Bookmark, View Case */}
                  <div className="mt-4 pt-3.5 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                    {/* Cryptographic Verification Link */}
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <Link
                        to={`/verify?hash=${result.file_hash}`}
                        className="font-mono text-[11px] text-slate-400 hover:text-amber-300 transition-colors"
                        title="Verify SHA-256 seal"
                      >
                        {result.file_hash ? `SHA: ${result.file_hash.substring(0, 12)}...` : 'Verified Record'}
                      </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Copy Citation Button */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyCitation(result, e)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                        title="Copy bluebook legal citation"
                      >
                        {copiedCitationId === result.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Cite</span>
                          </>
                        )}
                      </button>

                      {/* Compare in Precedent Comparator */}
                      <Link
                        to={`/compare?precedentId=${result.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/80 transition-colors"
                        title="Send precedent directly into the Precedent Comparator matrix"
                      >
                        <Scale className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Compare</span>
                      </Link>

                      {/* Bookmark Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleBookmark(result, e)}
                        disabled={isBookmarkBusy}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          isBookmarked
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
                        }`}
                        title={
                          !canBookmark
                            ? 'Sign in as Advocate/Scholar to bookmark'
                            : isBookmarked
                            ? 'Remove bookmark'
                            : 'Save bookmark'
                        }
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isBookmarked ? 'fill-rose-400 text-rose-400' : 'text-slate-400'
                          }`}
                        />
                        <span>{isBookmarked ? 'Saved' : 'Bookmark'}</span>
                      </button>

                      {/* View Case Link Button */}
                      <Link
                        to={`/cases/${result.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-xs"
                      >
                        <span>View Case</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <nav
            aria-label="Search results pagination"
            className="mt-10 flex items-center justify-between border-t border-slate-800 pt-6"
          >
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">
                Page <span className="font-semibold text-white">{currentPage}</span> of{' '}
                <span className="font-semibold text-white">{totalPages}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        )}
      </main>
    </div>
  );
};

export default SearchPage;
