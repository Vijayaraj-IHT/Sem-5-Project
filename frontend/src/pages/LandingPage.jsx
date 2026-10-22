import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Scale,
  Search,
  ShieldCheck,
  BookOpen,
  GitCompare,
  FileUp,
  Landmark,
  FileText,
  Clock,
  ArrowRight,
  Shield,
  CheckCircle2,
  Lock,
  Layers,
  Gavel,
  ScrollText,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * LandingPage Component
 * 
 * Official e-Courts Indian Judicial Portal style landing page.
 * Features:
 * - High Court of Judicature at Madras branding & bilingual title.
 * - Quick CNR / Case Number search bar.
 * - 10-tile Government Service Grid matching official e-Court portals.
 * - Repository statistics and cryptographic integrity seal.
 */
const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (!quickSearchQuery.trim()) return;
    const targetUrl = isAuthenticated ? '/search' : '/search/public';
    navigate(`${targetUrl}?q=${encodeURIComponent(quickSearchQuery.trim())}`);
  };

  // 10 Official Service Cards modeled on the Indian e-Courts & High Court dashboard
  const SERVICE_TILES = [
    {
      id: 'case-status',
      title: 'Case Status / CNR',
      subtitle: 'Track status by 16-digit CNR or Case Number',
      icon: Search,
      path: isAuthenticated ? '/search' : '/search/public',
      tag: 'CIS e-Courts',
      color: 'from-amber-600/20 to-amber-700/10 border-amber-500/30 text-amber-400',
    },
    {
      id: 'precedent-search',
      title: 'Judgments & Orders',
      subtitle: 'Full-text precedent search across High Court benches',
      icon: Gavel,
      path: isAuthenticated ? '/search' : '/search/public',
      tag: 'Repository',
      color: 'from-blue-600/20 to-blue-700/10 border-blue-500/30 text-blue-400',
    },
    {
      id: 'acts-explorer',
      title: 'Acts & Sections',
      subtitle: 'Browse cases by Cr.P.C., IPC, NI Act, & Constitution',
      icon: BookOpen,
      path: '/acts',
      tag: 'Statutes',
      color: 'from-emerald-600/20 to-emerald-700/10 border-emerald-500/30 text-emerald-400',
    },
    {
      id: 'document-verify',
      title: 'Tamper-Proof Verification',
      subtitle: 'Verify certified court orders via SHA-256 seal',
      icon: ShieldCheck,
      path: isAuthenticated ? '/verify' : '/verify/public',
      tag: 'Integrity',
      color: 'from-purple-600/20 to-purple-700/10 border-purple-500/30 text-purple-400',
    },
    {
      id: 'precedent-comparator',
      title: 'Precedent Comparator',
      subtitle: 'Side-by-side contrast of up to 3 judicial rulings',
      icon: GitCompare,
      path: isAuthenticated ? '/compare' : '/login',
      tag: 'Analysis',
      color: 'from-indigo-600/20 to-indigo-700/10 border-indigo-500/30 text-indigo-400',
    },
    {
      id: 'landmark-summaries',
      title: 'Landmark Summaries',
      subtitle: 'Concise Ratio Decidendi and headnote briefs',
      icon: ScrollText,
      path: isAuthenticated ? '/search?disposition=Allowed' : '/search/public?disposition=Allowed',
      tag: 'Ratio Decidendi',
      color: 'from-amber-600/20 to-amber-700/10 border-amber-500/30 text-amber-400',
    },
    {
      id: 'cause-list',
      title: 'Daily Cause List',
      subtitle: 'Pronouncements and daily court sitting rosters',
      icon: Clock,
      path: isAuthenticated ? '/search' : '/search/public',
      tag: 'Daily Roster',
      color: 'from-cyan-600/20 to-cyan-700/10 border-cyan-500/30 text-cyan-400',
    },
    {
      id: 'saved-research',
      title: 'Saved Research',
      subtitle: 'Organized legal folders & bookmarked precedents',
      icon: Layers,
      path: isAuthenticated ? '/bookmarks' : '/login',
      tag: 'Advocates',
      color: 'from-rose-600/20 to-rose-700/10 border-rose-500/30 text-rose-400',
    },
    {
      id: 'court-ingestion',
      title: 'Official PDF Ingestion',
      subtitle: 'Court staff ingestion queue with AI fact extraction',
      icon: FileUp,
      path: ['senior_staff', 'court_staff', 'staff', 'junior_staff'].includes(role) ? '/upload' : '/login',
      tag: 'Court Staff',
      color: 'from-teal-600/20 to-teal-700/10 border-teal-500/30 text-teal-400',
    },
    {
      id: 'audit-ledger',
      title: 'Cryptographic Ledger',
      subtitle: 'Immutable SHA-256 blockchain audit chain',
      icon: Shield,
      path: ['senior_staff', 'court_staff', 'staff'].includes(role) ? '/admin/audit' : '/login',
      tag: 'Audit Trail',
      color: 'from-slate-600/20 to-slate-700/10 border-slate-500/30 text-slate-300',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30">
      {/* Top Govt Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400 px-4 py-1.5 flex items-center justify-between font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Landmark className="w-3.5 h-3.5" /> HIGH COURT OF JUDICATURE AT MADRAS
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline">Chennai Principal Seat & Madurai Bench</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            CIS Connected
          </span>
          {isAuthenticated ? (
            <Link
              to={['senior_staff', 'court_staff', 'staff'].includes(role) ? '/dashboard' : '/search'}
              className="text-amber-400 hover:text-amber-300 underline font-medium"
            >
              Session Active ({role})
            </Link>
          ) : (
            <Link to="/login" className="text-amber-400 hover:text-amber-300 underline font-medium">
              Staff / Advocate Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-medium tracking-wide">
            <Scale className="w-3.5 h-3.5" /> Official Legal Case Repository & Verification System
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-serif text-white">
            LEX<span className="text-amber-500">GUARD</span> JUDICIAL REPOSITORY
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
            High Court judgments, orders, and ratio decidendi authenticated with 
            <span className="text-amber-400 font-semibold"> SHA-256 cryptographic seals</span> and AI-assisted factual extraction.
          </p>

          {/* Quick Search Box */}
          <form onSubmit={handleQuickSearch} className="max-w-3xl mx-auto mt-6">
            <div className="relative flex items-center shadow-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5 text-amber-500" />
              </div>
              <input
                type="text"
                value={quickSearchQuery}
                onChange={(e) => setQuickSearchQuery(e.target.value)}
                placeholder="Search by Case No (e.g. Crl.O.P. 12450/2024), 16-Digit CNR, Act, or Judge Name..."
                className="w-full pl-12 pr-32 py-4 rounded-xl bg-slate-900/90 border-2 border-slate-700/80 text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-sans"
              />
              <button
                type="submit"
                className="absolute right-2.5 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-sm tracking-wide shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              <span className="font-mono text-slate-500">Quick Filters:</span>
              <button
                type="button"
                onClick={() => navigate(isAuthenticated ? '/search?q=Section+482+CrPC' : '/search/public?q=Section+482+CrPC')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
              >
                Sec 482 Cr.P.C. Quash
              </button>
              <button
                type="button"
                onClick={() => navigate(isAuthenticated ? '/search?q=Section+138+Negotiable+Instruments' : '/search/public?q=Section+138+Negotiable+Instruments')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
              >
                Sec 138 NI Act
              </button>
              <button
                type="button"
                onClick={() => navigate(isAuthenticated ? '/search?q=Anticipatory+Bail' : '/search/public?q=Anticipatory+Bail')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
              >
                Anticipatory Bail
              </button>
              <button
                type="button"
                onClick={() => navigate('/acts')}
                className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 transition-colors"
              >
                Explore All Acts &rarr;
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Official Government e-Courts Service Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex-1 w-full">
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-500" /> High Court Services & Portals
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an authorized judicial portal service below for research, filing, or verification.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">CIS Version 3.2</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {SERVICE_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.id}
                to={tile.path}
                className={`group flex flex-col items-center text-center p-5 rounded-2xl bg-slate-900/80 border hover:border-amber-500/50 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 relative overflow-hidden backdrop-blur-sm ${tile.color}`}
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-sm text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                  {tile.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tile.subtitle}
                </p>
                <span className="mt-3 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-400 group-hover:border-amber-500/40 group-hover:text-amber-300">
                  {tile.tag}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Repository Trust & Metrics Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
          <div className="pt-2 md:pt-0">
            <div className="text-2xl font-bold font-serif text-white">Madras High Court</div>
            <div className="text-xs text-slate-400 mt-1">Principal Seat & Madurai Bench</div>
          </div>
          <div className="pt-4 md:pt-0">
            <div className="text-2xl font-bold font-serif text-amber-400">SHA-256 Chained</div>
            <div className="text-xs text-slate-400 mt-1">Cryptographic Ledger Integrity</div>
          </div>
          <div className="pt-4 md:pt-0">
            <div className="text-2xl font-bold font-serif text-emerald-400">CIS Standard</div>
            <div className="text-xs text-slate-400 mt-1">16-Digit CNR National Registry</div>
          </div>
          <div className="pt-4 md:pt-0">
            <div className="text-2xl font-bold font-serif text-blue-400">Zero-Tamper</div>
            <div className="text-xs text-slate-400 mt-1">Public Verification Portal</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Scale className="w-4 h-4 text-amber-500" />
            <span>LexGuard Judicial Case Repository • Open Legal Information System</span>
          </div>
          <div>
            Secured with HttpOnly Cryptographic Tokens & Sovereign Audit Logs
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
