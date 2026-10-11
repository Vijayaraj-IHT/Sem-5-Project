import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { getBookmarks, removeBookmark } from '../api/bookmarks';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function BookmarksPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Bookmark className="w-6 h-6 fill-amber-400/20" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-serif text-white tracking-tight flex items-center gap-2">
              My Bookmarks
              {bookmarks.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700 font-mono">
                  {bookmarks.length}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Saved judicial authorities, statutory precedents, and research references.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchBookmarks}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            Refresh
          </button>
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            Search Precedents
          </Link>
        </div>
      </div>

      {/* Action Notification Alert */}
      {feedback && (
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white"
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

      {/* Bookmarks Grid / Empty State */}
      {bookmarks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/80 mx-auto mb-4 flex items-center justify-center text-slate-400 shadow-inner">
            <Bookmark className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-base font-bold text-white font-serif mb-1.5">No bookmarks yet</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            Search for cases and bookmark them for quick access during drafting and legal argumentation.
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Search className="w-4 h-4" />
            Explore Judicial Repository
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bookmark) => {
            const caseData = bookmark.case || bookmark;
            const caseId = bookmark.case_id || caseData.id;
            const title = caseData.title || 'Untitled Judgment Record';
            const court = caseData.court || 'Court Unspecified';
            const year = caseData.year || 'Year N/A';
            const caseNo = caseData.case_no || caseData.citation;
            const status = caseData.status || 'published';
            const summary = caseData.summary;

            return (
              <div
                key={bookmark.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Court & Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700/80 truncate">
                      <Building className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{court}</span>
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

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

                  {/* Summary Snippet */}
                  {summary && (
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
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
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded hover:bg-rose-500/10"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Remove</span>
                  </button>

                  <Link
                    to={`/cases/${caseId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                  >
                    <span>View Case</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
