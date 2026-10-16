import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  ClipboardCheck,
  ScrollText,
  Shield,
  BarChart3,
  Search,
  FileEdit,
  Bookmark,
  Scale,
  BookOpen,
  ShieldCheck,
  GitCompare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SIDEBAR_ITEMS_BY_ROLE = {
  senior_staff: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Verify Document', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Upload Case', path: '/upload', icon: Upload },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
  ],
  staff: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Verify Document', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Upload Case', path: '/upload', icon: Upload },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
  ],
  court_staff: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Verify Document', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Upload Case', path: '/upload', icon: Upload },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
  ],
  junior_staff: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Verify Document', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Upload Case', path: '/upload', icon: Upload },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
  ],
  advocate: [
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Verify Document', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Draft Analysis', path: '/drafts', icon: FileEdit },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
  ],
  scholar: [
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Verify Document', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
  ],
  public: [
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Verify Document', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
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
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-r-lg text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-700/90 text-amber-400 border-l-4 border-amber-400 font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white border-l-4 border-transparent font-medium'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom section: App version & copyright */}
      <div className="p-4 border-t border-slate-700/60 bg-slate-800/90 text-slate-400 text-xs">
        <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 mb-1">
          <span>LEXGUARD CORE</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-700 text-amber-400 text-[10px] font-bold">
            v1.0.0
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          &copy; {CURRENT_YEAR} Lexguard Judiciary. All rights reserved.
        </p>
      </div>
    </aside>
  );
};

export default React.memo(Sidebar);
