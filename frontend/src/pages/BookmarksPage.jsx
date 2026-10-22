import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Trash2,
  ExternalLink,
  Scale,
  Calendar,
  Building,
  AlertCircle,
  Search,
  CheckCircle2,
  RotateCw,
  FileText,
  ShieldCheck,
  Folder,
  Tag,
  Filter,
} from 'lucide-react';
import { getBookmarks, removeBookmark } from '../api/bookmarks';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PRESET_FOLDERS = [
  'All',
  'Bail & Pre-Arrest Grounds',
  'Section 482 Quashing / Inherent Powers',
  'Cheque Dishonour (S.138 NI Act)',
  'Constitutional Writs (Art. 226)',
  'NDPS Commercial Quantity Standards',
  'General Legal Precedents',
];

export default function BookmarksPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState('All');

  const fetchBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBookmarks();
      if (Array.isArray(data)) {
        setBookmarks(data);
      } else {
        setBookmarks([]);
      }
    } catch (err) {
      console.error('Failed to retrieve bookmarks:', err);
      const msg = err.response?.data?.detail || 'Unable to retrieve your bookmarked legal precedents.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookmarks();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, fetchBookmarks]);

  const handleRemove = async (bookmarkId, e) => {
    if (e) e.stopPropagation();
    try {
      setRemovingId(bookmarkId);
      await removeBookmark(bookmarkId);
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      setFeedback('Bookmark removed successfully.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to remove bookmark.';
      setFeedback(`Error: ${msg}`);
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setRemovingId(null);
    }
  };

  // Filter bookmarks by search and folder
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((b) => {
      const caseData = b.case || b;
      const title = (caseData.title || '').toLowerCase();
      const caseNo = (caseData.case_no || caseData.citation || '').toLowerCase();
      const court = (caseData.court || '').toLowerCase();
      const notes = (b.notes || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || title.includes(q) || caseNo.includes(q) || court.includes(q) || notes.includes(q);

      if (!matchesSearch) return false;

      if (activeFolder === 'All') return true;

      return (b.notes || '').includes(`[${activeFolder}]`);
    });
  }, [bookmarks, searchQuery, activeFolder]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading your bookmarked precedents..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Bookmark className="w-6 h-6 fill-amber-400/20" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-serif text-white tracking-tight flex items-center gap-2">
              Legal Research Bookmarks
              {bookmarks.length > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700 font-mono">
                  {bookmarks.length} Precedents
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Organized repository of saved authorities, statutory precedents, and advocate research folders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchBookmarks}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            Refresh
          </button>
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            Explore Precedents
          </Link>
        </div>
      </div>

      {/* Action Notification Alert */}
      {feedback && (
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Folder Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within your saved bookmarks by title, citation, court, or research notes..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        </div>

        {/* Research Folder Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-slate-400 flex items-center gap-1 font-semibold text-[11px] mr-1">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            Folders:
          </span>
          {PRESET_FOLDERS.map((folder) => (
            <button
              key={folder}
              type="button"
              onClick={() => setActiveFolder(folder)}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                activeFolder === folder
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {folder}
            </button>
          ))}
        </div>
      </div>

      {/* Bookmarks Grid / Empty State */}
      {filteredBookmarks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 mx-auto mb-4 flex items-center justify-center text-slate-400 shadow-inner">
            <Bookmark className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-base font-bold text-white font-serif mb-1.5">No bookmarks found</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            {searchQuery || activeFolder !== 'All'
              ? 'No bookmarked cases match your current search query or folder filter.'
              : 'Save authorities from the Case Viewer into your personal research folders for quick access during drafting.'}
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            <Search className="w-4 h-4" />
            Explore Judicial Repository
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookmarks.map((bookmark) => {
            const caseData = bookmark.case || bookmark;
            const caseId = bookmark.case_id || caseData.id;
            const title = caseData.title || 'Untitled Judgment Record';
            const court = caseData.court || 'Court Unspecified';
            const year = caseData.year || 'Year N/A';
            const caseNo = caseData.case_no || caseData.citation;
            const disposition = caseData.disposition || caseData.outcome || 'Allowed';
            const summary = caseData.summary;

            // Extract folder tag from notes if present
            let folderTag = null;
            let noteContent = bookmark.notes || '';
            const folderMatch = noteContent.match(/^\[(.*?)\]\s*(.*)$/);
            if (folderMatch) {
              folderTag = folderMatch[1];
              noteContent = folderMatch[2];
            }

            return (
              <div
                key={bookmark.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all hover:shadow-xl flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Court & Disposition Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-slate-950 text-slate-300 border border-slate-800 truncate">
                      <Building className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{court}</span>
                    </span>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {disposition}
                    </span>
                  </div>

                  {/* Research Folder Tag */}
                  {folderTag && (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <Folder className="w-3 h-3" />
                        {folderTag}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="font-serif font-bold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug mb-2">
                    {title}
                  </h3>

                  {/* Case No & Year */}
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mb-3">
                    {caseNo && (
                      <span className="text-amber-400/90 font-medium truncate max-w-[170px]">
                        {caseNo}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {year}
                    </span>
                  </div>

                  {/* Advocate Note if present */}
                  {noteContent && (
                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 italic mb-3 flex items-start gap-1.5">
                      <Tag className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{noteContent}</span>
                    </div>
                  )}

                  {/* Summary Snippet */}
                  {summary && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {summary}
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2 mt-2">
                  <button
                    type="button"
                    disabled={removingId === bookmark.id}
                    onClick={(e) => handleRemove(bookmark.id, e)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Remove</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/compare`}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
                    >
                      <Scale className="w-3.5 h-3.5 text-indigo-400" />
                      Compare
                    </Link>

                    <Link
                      to={`/cases/${caseId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/30 transition-colors"
                    >
                      <span>View Case</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
