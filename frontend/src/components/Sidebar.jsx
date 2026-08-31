import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  LayoutDashboard,
  Clock,
  FileText,
  Pill,
  TestTube,
  Calendar,
  Syringe,
  FileSpreadsheet,
  Cpu,
  Sparkles,
  HelpCircle,
  Headphones,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const Sidebar = ({ isCollapsed, onToggleCollapse, onNavigateSection }) => {
  const { user } = useAuth();
  const role = user?.role || 'PATIENT';

  // Grouped Navigation for Patient Portal
  const navGroups = [
    {
      groupTitle: 'OVERVIEW',
      links: [
        { name: 'Overview', path: '/patient-dashboard', icon: LayoutDashboard, sectionId: 'overview' },
      ],
    },
    {
      groupTitle: 'MY HEALTH',
      links: [
        { name: 'Health Timeline', path: '/patient-dashboard', icon: Clock, sectionId: 'section-timeline' },
        { name: 'Medical Records', path: '/patient-dashboard', icon: FileText, sectionId: 'section-conditions' },
        { name: 'Medications', path: '/patient-dashboard', icon: Pill, sectionId: 'section-medications' },
        { name: 'Lab Reports', path: '/patient-dashboard', icon: TestTube, sectionId: 'section-labs' },
        { name: 'Appointments', path: '/patient-dashboard', icon: Calendar, sectionId: 'section-visits' },
        { name: 'Vaccinations', path: '/patient-dashboard', icon: Syringe, sectionId: 'section-vaccinations' },
        { name: 'Prescriptions', path: '/patient-dashboard', icon: FileSpreadsheet, sectionId: 'section-medications' },
      ],
    },
    {
      groupTitle: 'TOOLS',
      links: [
        { name: 'AI Symptom Checker', path: '/ai-suite', icon: Cpu },
        { name: 'Health Insights', path: '/ai-suite', icon: Sparkles },
      ],
    },
  ];

  const handleLinkClick = (e, link) => {
    if (link.sectionId && onNavigateSection) {
      onNavigateSection(link.sectionId);
    }
  };

  return (
    <aside
      className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-65px)] transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20 p-3' : 'w-64 p-4'
      }`}
    >
      {/* Top Branding & Collapse Button */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-teal-600 dark:bg-teal-500 flex items-center justify-center flex-shrink-0 text-white shadow-md shadow-teal-500/20">
              <Activity className="w-5 h-5 font-bold" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h2 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">UHIS</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Unified Health System</p>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className={`p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              isCollapsed ? 'hidden' : 'block'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-5">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              {!isCollapsed && (
                <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {group.groupTitle}
                </p>
              )}
              <div className="space-y-1">
                {group.links.map((link, lIdx) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={lIdx}
                      to={link.path}
                      onClick={(e) => handleLinkClick(e, link)}
                      title={isCollapsed ? link.name : undefined}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                          isCollapsed ? 'justify-center' : ''
                        } ${
                          isActive && link.path !== '/ai-suite'
                            ? 'bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">{link.name}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Support & Footer */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        {!isCollapsed ? (
          <>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Need Help?</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">24/7 Medical Support Line</p>
              <button
                onClick={() => alert('Contacting UHIS Healthcare Support: 1800-11-2026')}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition"
              >
                <Headphones className="w-3.5 h-3.5" /> Contact Support
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center font-medium">
              © 2026 UHIS Healthcare
            </p>
          </>
        ) : (
          <button
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
            className="w-full flex justify-center p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
