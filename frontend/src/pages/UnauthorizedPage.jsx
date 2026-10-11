import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Search, Scale } from 'lucide-react';

/**
 * UnauthorizedPage Component
 * 
 * Displayed when an authenticated user attempts to access a protected judicial resource
 * or management portal without required role privileges.
 */
const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center space-y-8">
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

        {/* Access Denied Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          {/* ShieldX Icon with red pulse highlight */}
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-5 shadow-inner">
            <ShieldX className="w-9 h-9" />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            Access Denied
          </h1>

          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            You do not have permission to access this page.
          </p>

          <p className="mt-1 text-xs text-slate-400 font-mono">
            Error Code: 403 FORBIDDEN &bull; Insufficient Clearance
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {/* Go Back button */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700/80 text-slate-200 hover:text-white font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>

            {/* Go to Search button */}
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold text-sm transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <Search className="w-4 h-4" />
              <span>Go to Search</span>
            </button>
          </div>
        </div>

        {/* Security advisory */}
        <div className="text-xs text-slate-500 font-mono">
          Cryptographically audited access attempt recorded in judicial audit log.
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
