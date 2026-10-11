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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Header / Nav */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 group-hover:border-amber-400/50 transition-colors shadow-inner">
              <Scale className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1 font-serif">
                LEX<span className="text-amber-400">GUARD</span>
              </span>
              <span className="text-[10px] tracking-widest text-slate-400 uppercase -mt-1 font-mono">
                Judicial Research
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3" aria-label="Public Actions">
            <Link
              to="/search"
              className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              Public Search
            </Link>
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-1.5 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors shadow-xs"
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
