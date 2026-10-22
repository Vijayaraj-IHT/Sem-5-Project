import React, { useState, useEffect } from 'react';
import { Search, X, Scale, Check, ExternalLink, CheckCircle2, AlertCircle, Filter } from 'lucide-react';
import { comparisonApi } from '../../api/comparison';
import { Link } from 'react-router-dom';

export default function PrecedentModal({
  isOpen,
  onClose,
  onSelectPrecedent,
  selectedIds = [],
  targetSlotIndex = null,
}) {
  const [precedents, setPrecedents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadPrecedents('');
    }
  }, [isOpen]);

  const loadPrecedents = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await comparisonApi.getPublishedPrecedents(query);
      setPrecedents(data);
    } catch (err) {
      console.error('Failed to load precedents in modal:', err);
      setError('Unable to load published precedents from repository.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadPrecedents(searchQuery);
  };

  if (!isOpen) return null;

  // Filter logic
  const filtered = precedents.filter((p) => {
    if (filterType === 'madras') {
      return (p.court || '').toLowerCase().includes('madras');
    }
    if (filterType === 'supreme') {
      return (p.court || '').toLowerCase().includes('supreme');
    }
    if (filterType === 'good_law') {
      return p.precedential_status === 'good_law' || p.precedential_status === 'Good Law';
    }
    if (filterType === 'criminal') {
      const tags = [...(p.act_tags || []), ...(p.section_tags || [])].join(' ').toLowerCase();
      return tags.includes('crpc') || tags.includes('ipc') || tags.includes('bnss') || tags.includes('bns');
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Select Published Precedent {targetSlotIndex !== null ? `for Slot #${targetSlotIndex + 1}` : ''}
              </h3>
              <p className="text-xs text-slate-400">
                Choose a verified judgment from Madras High Court or Supreme Court of India repository
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/30 space-y-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by case title, citation, CNR, act, or judge..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-24 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <button
              type="submit"
              className="absolute right-2 top-2 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            {[
              { id: 'all', label: 'All Cases' },
              { id: 'madras', label: 'Madras High Court' },
              { id: 'supreme', label: 'Supreme Court' },
              { id: 'good_law', label: 'Good Law Only' },
              { id: 'criminal', label: 'CrPC / BNSS / IPC' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  filterType === f.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
          {loading && (
            <div className="py-12 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2.5"></div>
              Querying verified judicial database...
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
              {error}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-500">
              No published precedents match your query or filter criteria.
            </div>
          )}

          {!loading &&
            filtered.map((p) => {
              const isAlreadySelected = selectedIds.includes(p.id);
              const isGoodLaw =
                p.precedential_status === 'good_law' || p.precedential_status === 'Good Law';

              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isAlreadySelected
                      ? 'bg-slate-900/40 border-slate-800/80 opacity-60'
                      : 'bg-slate-950/70 border-slate-800/90 hover:border-indigo-500/50 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white">{p.title}</h4>
                      {isGoodLaw ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Good Law
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          <AlertCircle className="w-2.5 h-2.5" />
                          Precedential status not checked
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                        {p.disposition || 'Disposed'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                      <span className="font-mono text-slate-300">{p.citation || p.case_no}</span>
                      <span>&bull;</span>
                      <span>{p.court}</span>
                      <span>&bull;</span>
                      <span>{p.year}</span>
                      {p.judge && (
                        <>
                          <span>&bull;</span>
                          <span className="text-slate-400 italic">Bench: {p.judge}</span>
                        </>
                      )}
                    </div>

                    {/* Statutory Tags */}
                    {p.section_tags && p.section_tags.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                        {p.section_tags.slice(0, 4).map((sec, sidx) => (
                          <span
                            key={sidx}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300 font-mono border border-slate-700/50"
                          >
                            {sec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    <Link
                      to={`/cases/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
                    >
                      Proof
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    {isAlreadySelected ? (
                      <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-400 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        Added
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPrecedent(p, targetSlotIndex);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 text-xs text-slate-400">
          <span>{filtered.length} verified precedents available</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
