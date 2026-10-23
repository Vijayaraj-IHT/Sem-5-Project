import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Scale } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

/**
 * PublicLayout for unauthenticated/public landing and informational pages.
 * Features a clean header with brand logo and authentication entry links.
 *
 * @param {React.ReactNode} [children] - Content to render. Falls back to <Outlet /> if omitted.
 */
const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header / Nav */}
      <header className="h-16 border-b border-rose-900/15 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-800 to-rose-700 border border-red-900 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-all">
              <Scale className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1 font-serif">
                LEX<span className="text-red-700">GUARD</span>
              </span>
              <span className="text-[10px] tracking-widest text-slate-500 uppercase -mt-1 font-mono">
                Judicial Research
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3" aria-label="Public Actions">
            <Link
              to="/verify/public"
              className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-red-800 rounded-md hover:bg-red-50 transition-colors"
            >
              Verify Document
            </Link>
            <Link
              to="/search/public"
              className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-red-800 rounded-md hover:bg-red-50 transition-colors"
            >
              Public Search
            </Link>
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-red-800 rounded-md hover:bg-red-50 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-1.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-md transition-colors shadow-xs"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6" role="main">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {CURRENT_YEAR} Lexguard Legal Research Platform. All rights reserved.</span>
          <span className="font-mono text-slate-400">Cryptographically Verified Judicial Archives</span>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
