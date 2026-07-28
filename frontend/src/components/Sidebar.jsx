import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Cpu,
  CreditCard,
  Stethoscope,
  Building2,
  TestTube,
  Pill,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role;

  const getRoleLinks = () => {
    switch (role) {
      case 'SUPER_ADMIN':
        return [
          { name: 'Super Admin Overview', path: '/admin-dashboard', icon: LayoutDashboard },
          { name: 'Hospital Onboarding', path: '/admin-dashboard', icon: Building2 },
          { name: 'System Audit Logs', path: '/admin-dashboard', icon: ShieldCheck },
          { name: 'AI Health Intelligence', path: '/ai-suite', icon: Cpu },
        ];
      case 'HOSPITAL_ADMIN':
        return [
          { name: 'Hospital Analytics', path: '/hospital-dashboard', icon: LayoutDashboard },
          { name: 'Doctor Management', path: '/hospital-dashboard', icon: Stethoscope },
          { name: 'AI & Data Suite', path: '/ai-suite', icon: Cpu },
        ];
      case 'DOCTOR':
        return [
          { name: 'Doctor OPD Queue', path: '/doctor-dashboard', icon: LayoutDashboard },
          { name: 'Patient History Lookup', path: '/medical-timeline', icon: FileText },
          { name: 'AI Symptom & Risk Engine', path: '/ai-suite', icon: Cpu },
        ];
      case 'PATIENT':
        return [
          { name: 'Patient Portal', path: '/patient-dashboard', icon: LayoutDashboard },
          { name: 'Unified Medical Timeline', path: '/medical-timeline', icon: FileText },
          { name: 'AI Symptom Checker', path: '/ai-suite', icon: Cpu },
        ];
      case 'LABORATORY':
        return [
          { name: 'Diagnostic Lab Desk', path: '/lab-dashboard', icon: LayoutDashboard },
          { name: 'AI Document Classifier', path: '/ai-suite', icon: Cpu },
        ];
      case 'PHARMACY':
        return [
          { name: 'E-Prescription Dispenser', path: '/pharmacy-dashboard', icon: LayoutDashboard },
          { name: 'AI Prescription OCR', path: '/ai-suite', icon: Cpu },
        ];
      case 'RECEPTIONIST':
        return [
          { name: 'Reception Walk-in Desk', path: '/reception-dashboard', icon: LayoutDashboard },
          { name: 'Doctor Availability', path: '/reception-dashboard', icon: UserCheck },
        ];
      default:
        return [
          { name: 'Dashboard', path: '/', icon: LayoutDashboard },
          { name: 'AI Suite', path: '/ai-suite', icon: Cpu },
        ];
    }
  };

  const navLinks = getRoleLinks();

  return (
    <aside className="w-64 glass-card border-r border-slate-800 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Navigation Portal
          </p>
          <nav className="space-y-1">
            {navLinks.map((link, idx) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={idx}
                  to={link.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-cyan-400" />
                  {link.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Global AI Feature Highlight Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-cyan-300">AI & DS Engine Ready</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Symptom checker, risk scorer & prescription OCR parser built-in.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 text-xs text-slate-500">
        <p className="font-medium text-slate-400">UHIS Enterprise Architecture</p>
        <p>ABHA Standard Compatible</p>
      </div>
    </aside>
  );
};

export default Sidebar;
