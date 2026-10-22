import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  Search,
  Bookmark,
  ShieldCheck,
  GitCompare,
  BookOpen,
  Shield,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SIDEBAR_ITEMS_BY_ROLE = {
  senior_staff: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Acts & Provisions', path: '/acts', icon: BookOpen },
    { label: 'Verify Document', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Upload Case', path: '/upload', icon: Upload },
    { label: 'Audit Ledger', path: '/admin/audit', icon: Shield },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { label: 'Account Profile', path: '/profile', icon: User },
  ],
  staff: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Acts & Provisions', path: '/acts', icon: BookOpen },
    { label: 'Verify Document', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Upload Case', path: '/upload', icon: Upload },
    { label: 'Audit Ledger', path: '/admin/audit', icon: Shield },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { label: 'Account Profile', path: '/profile', icon: User },
  ],
  court_staff: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Acts & Provisions', path: '/acts', icon: BookOpen },
    { label: 'Verify Document', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Upload Case', path: '/upload', icon: Upload },
    { label: 'Audit Ledger', path: '/admin/audit', icon: Shield },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { label: 'Account Profile', path: '/profile', icon: User },
  ],
  junior_staff: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Acts & Provisions', path: '/acts', icon: BookOpen },
    { label: 'Verify Document', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Upload Case', path: '/upload', icon: Upload },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { label: 'Account Profile', path: '/profile', icon: User },
  ],
  advocate: [
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Acts & Provisions', path: '/acts', icon: BookOpen },
    { label: 'Verify Document', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { label: 'Account Profile', path: '/profile', icon: User },
  ],
  scholar: [
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Acts & Provisions', path: '/acts', icon: BookOpen },
    { label: 'Verify Document', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { label: 'Account Profile', path: '/profile', icon: User },
  ],
  public: [
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Acts & Provisions', path: '/acts', icon: BookOpen },
    { label: 'Verify Document', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Account Profile', path: '/profile', icon: User },
  ],
};

const CURRENT_YEAR = new Date().getFullYear();

const Sidebar = () => {
  const { role, user } = useAuth();
  const currentRole = role || user?.role || 'public';
  const menuItems = SIDEBAR_ITEMS_BY_ROLE[currentRole] || SIDEBAR_ITEMS_BY_ROLE.public;

  return (
    <aside
      className="w-64 bg-slate-800 border-r border-slate-700/80 fixed left-0 top-16 bottom-0 z-40 flex flex-col justify-between overflow-y-auto select-none"
      aria-label="Dashboard Navigation Sidebar"
    >
      {/* Top section: role header and navigation */}
      <div className="py-5">
        <div className="px-5 mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </span>
        </div>

        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 font-semibold border-l-4 border-amber-500'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status Badge */}
      <div className="p-4 border-t border-slate-700/60 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2 text-emerald-400 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>CIS v3.2 Ledger Online</span>
        </div>
        <div className="text-[10px] text-slate-500">
          Madras HC • {CURRENT_YEAR}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
