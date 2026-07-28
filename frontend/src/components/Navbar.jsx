import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Bell, User, LogOut, RefreshCw, Cpu, Activity } from 'lucide-react';

const Navbar = ({ onOpenRoleSwitcher }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'HOSPITAL_ADMIN': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'DOCTOR': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PATIENT': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'LABORATORY': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'PHARMACY': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'RECEPTIONIST': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <header className="sticky top-0 z-30 glass-card border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              UHIS <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">v1.0 StartUp Edition</span>
            </h1>
            <p className="text-xs text-slate-400">Unified Healthcare Interface System</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Role Switcher Button */}
        <button
          onClick={onOpenRoleSwitcher}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 transition"
          title="Switch role instantly to test other dashboards"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Switch Role Demo
        </button>

        {/* User Role Badge */}
        {user && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
            {user.role}
          </span>
        )}

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition"
          >
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-cyan-400 font-semibold border border-slate-600">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <span className="text-sm font-medium hidden md:block">{user?.fullName || 'User'}</span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl glass-card border border-slate-700 shadow-2xl py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-800">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-slate-800/50 transition text-left"
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
