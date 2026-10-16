import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { comparisonApi } from '../../api/comparison';

/**
 * PrecedentSelector Component
 * Allows users to search and select verified published Indian judgments for comparison.
 * Shows verification state, citation, and "View Proof" link to case viewer.
 * Strictly adheres to: "Do not display 'Good Law' unless verified; otherwise 'Precedential status not checked'."
 */
export default function PrecedentSelector({ selectedCase, onSelectCase }) {
  const [precedents, setPrecedents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPrecedents = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await comparisonApi.getPublishedPrecedents(query);
      setPrecedents(data);
      // Auto-select first if none selected
      if (!selectedCase && data.length > 0) {
        onSelectCase(data[0]);
      }
    } catch (err) {
      console.error('Failed to load published precedents:', err);
      setError('Unable to fetch published precedents from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrecedents('');
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPrecedents(searchQuery);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Target Published Precedent
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a published precedent from the verified Indian legal repository
          </p>
        </div>
        {selectedCase && (
          <span className="text-xs px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
            1 Selected
          </span>
        )}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mt-3 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by title, citation, court, section..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-20 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <button
          type="submit"
          className="absolute right-1.5 top-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition-colors"
        >
          Search
        </button>
      </form>

      {/* Precedent List */}
      <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
        {loading && (
          <div className="py-8 text-center text-xs text-slate-400">
            <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading published cases...
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded text-xs text-rose-400">
            {error}
          </div>
        )}

        {!loading && precedents.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-500">
            No published precedents match your query.
          </div>
        )}

        {!loading && precedents.map((p) => {
          const isSelected = selectedCase?.id === p.id;
          const isGoodLaw = p.precedential_status === 'good_law';

          return (
            <div
              key={p.id}
              onClick={() => onSelectCase(p)}
              className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-white leading-snug truncate">
                    {p.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 flex-wrap">
                    <span className="font-mono text-slate-300">{p.citation || 'Unreported'}</span>
                    <span>•</span>
                    <span>{p.court || 'Indian Court'}</span>
                    <span>•</span>
                    <span>{p.year || 'N/A'}</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center">
                  <input
                    type="radio"
                    checked={isSelected}
                    onChange={() => onSelectCase(p)}
                    className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Status Tags */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Precedential status tag */}
                  {isGoodLaw ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Good Law (Verified)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                      Precedential status not checked
                    </span>
                  )}

                  {/* Verification source tag */}
                  {p.source_verification_state === 'verified_official' ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Official Source
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                      Registered
                    </span>
                  )}
                </div>

                {/* View Proof Link */}
                <Link
                  to={`/cases/${p.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
                >
                  View Proof
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
