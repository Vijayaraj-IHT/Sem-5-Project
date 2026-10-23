import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  FileQuestion, 
  ArrowLeft, 
  Search, 
  Scale, 
  BookOpen, 
  ShieldCheck, 
  LayoutDashboard,
  CornerDownRight
} from 'lucide-react';

/**
 * NotFoundPage (404) Component
 * 
 * Displayed when a user navigates to an undefined route or when a judicial resource
 * cannot be resolved in the repository.
 */
const NotFoundPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg text-center space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-amber-500 mb-3 shadow-inner">
            <Scale className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-serif flex items-center gap-1">
            LEX<span className="text-amber-500">GUARD</span>
          </span>
          <span className="text-[10px] tracking-widest text-slate-400 uppercase font-mono mt-0.5">
            Judicial Integrity Portal
          </span>
        </div>

        {/* 404 Error Card */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-left">
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-700/60">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <FileQuestion className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono mb-1">
                HTTP 404 &bull; RECORD NOT FOUND
              </div>
              <h1 className="text-xl font-bold text-white font-serif tracking-tight">
                Judicial Docket or Page Not Found
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            The requested judgment dossier, citation record, or portal page could not be located in the repository.
          </p>

          {/* Attempted URI block */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-400 mb-5 flex items-center gap-2 overflow-x-auto">
            <CornerDownRight className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-500">Attempted Route:</span>
            <span className="text-amber-300 font-semibold">{location.pathname}</span>
          </div>

          {/* Quick Search Input */}
          <form onSubmit={handleSearchSubmit} className="mb-6">
            <label htmlFor="notfound-search" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Search Across All 208 Repository Precedents:</span>
            </label>
            <div className="flex gap-2">
              <input
                id="notfound-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search case name, citation, CNR, or section..."
                className="flex-1 bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm transition-colors shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Navigation Links Grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            <Link
              to="/search"
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-xs"
            >
              <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <div className="font-medium">Hybrid Search</div>
            </Link>

            <Link
              to="/acts"
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-xs"
            >
              <div className="w-7 h-7 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="font-medium">Statutory Explorer</div>
            </Link>

            <Link
              to="/verify"
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-xs"
            >
              <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="font-medium">Document Verifier</div>
            </Link>

            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-xs"
            >
              <div className="w-7 h-7 rounded-md bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div className="font-medium">Staff Dashboard</div>
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700/80 text-slate-200 hover:text-white font-medium text-sm transition-colors focus:outline-none"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-colors focus:outline-none"
            >
              <span>Return to Portal</span>
            </button>
          </div>
        </div>

        {/* Footer Audit Note */}
        <div className="text-xs text-slate-500 font-mono">
          LexGuard Judicial Precedent Repository &bull; Madras High Court &bull; 208 Records
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;