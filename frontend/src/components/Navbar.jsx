import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Activity,
  LogOut,
  RefreshCw,
  Sun,
  Moon,
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  ShieldCheck,
} from 'lucide-react';

const Navbar = ({ onOpenRoleSwitcher, onToggleSidebar, isSidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Keyboard shortcut listener for Ctrl / or Cmd / to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '/' || e.key === 'k')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'PT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const patientInitials = getInitials(user?.fullName);
  const patientName = user?.fullName || 'Patient Portal';
  const roleDisplay = user?.role === 'PATIENT' ? 'Patient' : user?.role || 'User';

  const mockNotifications = [
    { id: 1, title: 'Lab Report Ready', time: '10m ago', unread: true },
    { id: 2, title: 'OPD Appointment Confirmed', time: '1h ago', unread: true },
    { id: 3, title: 'Vaccine Reminder', time: '1d ago', unread: false },
  ];

  const unreadCount = mockNotifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-6 py-2.5 flex items-center justify-between transition-colors shadow-sm">
      {/* Left Branding & Sidebar Toggle Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Sidebar"
          title="Toggle Navigation Sidebar"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600 dark:bg-teal-500 flex items-center justify-center shadow-md shadow-teal-500/20">
            <Activity className="w-5 h-5 text-white font-bold" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight flex items-center gap-2">
              UHIS <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30 font-bold">Portal</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-2.5 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for records, reports, doctors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-16 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
          />
          <span className="absolute right-3 top-2 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-mono font-bold pointer-events-none">
            Ctrl /
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Role Switcher */}
        <button
          onClick={onOpenRoleSwitcher}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-400 text-xs font-bold border border-slate-200 dark:border-slate-700 transition"
          title="Switch role demo"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Switch Role</span>
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Notifications Icon + Badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition relative focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Health Alerts & Updates</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 font-bold">
                  {unreadCount} New
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                {mockNotifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{n.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Patient Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="User account menu"
            aria-expanded={showDropdown}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
              {patientInitials}
            </div>
            <div className="text-left hidden md:block leading-tight">
              <p className="text-xs font-bold text-slate-900 dark:text-white">{patientName}</p>
              <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">{roleDisplay}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-400">Signed in as</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.email}</p>
                <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 font-bold mt-1">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
