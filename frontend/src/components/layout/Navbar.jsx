import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Scale,
  Menu,
  X,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Search,
  LayoutDashboard,
  FileUp,
  Shield,
  Bookmark,
  ShieldCheck,
  GitCompare,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import RoleBadge from '../common/RoleBadge';

const NAV_ITEMS_BY_ROLE = {
  senior_staff: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Acts Explorer', path: '/acts', icon: BookOpen },
    { label: 'Verify', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Upload Case', path: '/upload', icon: FileUp },
    { label: 'Audit Ledger', path: '/admin/audit', icon: Shield },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
  ],
  staff: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Acts Explorer', path: '/acts', icon: BookOpen },
    { label: 'Verify', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Upload Case', path: '/upload', icon: FileUp },
    { label: 'Audit Ledger', path: '/admin/audit', icon: Shield },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
  ],
  court_staff: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Acts Explorer', path: '/acts', icon: BookOpen },
    { label: 'Verify', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Upload Case', path: '/upload', icon: FileUp },
    { label: 'Audit Ledger', path: '/admin/audit', icon: Shield },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
  ],
  junior_staff: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Acts Explorer', path: '/acts', icon: BookOpen },
    { label: 'Verify', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Upload Case', path: '/upload', icon: FileUp },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
  ],
  advocate: [
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Acts & Provisions', path: '/acts', icon: BookOpen },
    { label: 'Verify', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
  ],
  scholar: [
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Acts & Provisions', path: '/acts', icon: BookOpen },
    { label: 'Verify', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
  ],
  public: [
    { label: 'Case Search', path: '/search', icon: Search },
    { label: 'Acts & Provisions', path: '/acts', icon: BookOpen },
    { label: 'Verify Document', path: '/verify', icon: ShieldCheck },
    { label: 'Comparator', path: '/compare', icon: GitCompare },
  ],
};

const Navbar = () => {
  const { user, role, isAuthenticated, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const currentRole = role || user?.role || 'public';
  const navItems = NAV_ITEMS_BY_ROLE[currentRole] || NAV_ITEMS_BY_ROLE.public;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    if (logout) {
      await logout();
    }
    navigate('/login');
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'text-red-800 bg-red-50 shadow-xs font-bold border-b-2 border-red-700'
        : 'text-slate-700 hover:text-red-800 hover:bg-red-50/60'
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
      isActive
        ? 'text-red-800 bg-red-50 font-bold border-l-4 border-red-700'
        : 'text-slate-700 hover:text-red-800 hover:bg-red-50/60'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-rose-900/15 shadow-xs z-50">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-hidden"
          >
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

          {/* Desktop Role-Based Nav Links */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right side: User menu or Auth links */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-red-50/60 transition-colors border border-transparent hover:border-rose-200 text-left focus:outline-hidden focus:ring-2 focus:ring-red-700"
                aria-expanded={userDropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-800 to-rose-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  {userInitial}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-sm font-semibold text-slate-900 leading-tight max-w-[140px] truncate">
                    {user?.name || 'User'}
                  </span>
                  <div className="mt-0.5">
                    <RoleBadge role={currentRole} size="sm" />
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                    userDropdownOpen ? 'rotate-180 text-red-700' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-rose-900/15 rounded-lg shadow-xl py-2 z-50 text-slate-800 divide-y divide-rose-100">
                  <div className="px-4 py-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Signed in as</p>
                    <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{user?.name}</p>
                    {user?.email && (
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    )}
                    <div className="mt-2">
                      <RoleBadge role={currentRole} showDot={true} />
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-800 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-slate-500" />
                      Account Profile
                    </Link>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900 transition-colors text-left font-medium"
                    >
                      <LogOut className="w-4 h-4 text-red-700" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-red-800 rounded-md hover:bg-red-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-sm font-medium text-white bg-red-700 hover:bg-red-800 rounded-md transition-colors shadow-xs font-semibold"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-hidden"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-700 px-4 pt-2 pb-4 space-y-1 shadow-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={mobileLinkClass}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
              </NavLink>
            );
          })}

          {isAuthenticated && (
            <div className="pt-3 mt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs text-slate-400">Current Role</span>
                <RoleBadge role={currentRole} />
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
