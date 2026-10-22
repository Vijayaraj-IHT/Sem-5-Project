import React from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  Award,
  Mail,
  Calendar,
  Lock,
  Scale,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RoleBadge from '../components/common/RoleBadge';
import { Link } from 'react-router-dom';

/**
 * ProfilePage Component
 * 
 * Secure User Profile & Credential Status Management (/profile).
 * Displays user identity, Bar Council credential verification state,
 * assigned judicial permissions, and active session security.
 */
const ProfilePage = () => {
  const { user, role } = useAuth();

  const isVerified = user?.status === 'active';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-wider mb-1">
          <UserIcon className="w-4 h-4" /> Identity & Access Control
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-white">
          User Profile & Credentials
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review your judicial credentials, role authorization, and security session parameters.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-700/70">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif text-2xl font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-serif">{user?.name || 'Authorized User'}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>
            </div>
          </div>
          <div>
            <RoleBadge role={role || user?.role || 'public'} />
          </div>
        </div>

        {/* Verification Status Banner */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
            isVerified
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {isVerified ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div className="text-xs">
              <span className="font-semibold block text-sm">
                {isVerified ? 'Credential Verified & Active' : 'Pending Verification'}
              </span>
              <span className="opacity-90">
                {isVerified
                  ? 'Your identity is authorized for judicial research and official repository actions.'
                  : 'Your Bar Council or institutional credential is being audited by court staff.'}
              </span>
            </div>
          </div>
          <span className="text-xs font-mono uppercase font-bold px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700">
            {user?.status || 'Active'}
          </span>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Bar Council / Credential ID</span>
            <span className="font-mono text-sm text-amber-400 font-semibold">
              {user?.credential_id || 'Not Assigned (Public Account)'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Assigned Role Tier</span>
            <span className="font-mono text-sm text-slate-100 uppercase">
              {role || user?.role || 'public'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Session Token Expiry</span>
            <span className="font-mono text-sm text-slate-200">
              60 Minutes (Silent Background Refresh Active)
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">CSRF Protection</span>
            <span className="font-mono text-sm text-emerald-400">
              Double-Submit Cookie Pattern Enforced
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Link
              to="/bookmarks"
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>Saved Bookmarks</span>
            </Link>
            <Link
              to="/search"
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Search Judgments</span>
            </Link>
          </div>

          <span className="text-[11px] font-mono text-slate-500">
            Account ID: {user?.id ? `${user.id.substring(0, 18)}...` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
