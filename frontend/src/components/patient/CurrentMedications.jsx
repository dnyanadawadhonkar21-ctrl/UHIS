import React, { useState } from 'react';
import { Pill, ChevronDown, ChevronUp, Search, CalendarDays } from 'lucide-react';
import EmptyState from '../EmptyState';
import { SkeletonList } from '../SkeletonLoader';

const CurrentMedications = ({ medications = [], loading = false, isOpen, onToggle }) => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const [localOpen, setLocalOpen] = useState(false);

  const sectionOpen = isOpen !== undefined ? isOpen : localOpen;
  const handleToggle = onToggle || (() => setLocalOpen(!localOpen));

  if (loading) return <SkeletonList title="Loading Current Medications..." />;

  const filtered = medications.filter(
    (m) =>
      (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.prescribedBy || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div id="section-medications" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-colors">
      {/* Header */}
      <button
        onClick={handleToggle}
        aria-expanded={sectionOpen}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
            <Pill className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Current Medications</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Active prescriptions & pharmacological therapy ({medications.length})</p>
          </div>
        </div>
        {sectionOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {sectionOpen && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-4">
          {medications.length === 0 ? (
            <EmptyState message="No current medications." subtext="No active pharmacological prescriptions on record." />
          ) : (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search medications or prescribing doctors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {filtered.length === 0 && (
                  <EmptyState message="No medications match your search." />
                )}
                {filtered.map((m) => (
                  <div key={m.id} className="rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <button
                      onClick={() => toggle(m.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono border border-slate-200 dark:border-slate-700">
                          {m.dosage}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{m.name}</p>
                          <p className="text-[11px] text-blue-600 dark:text-blue-300 font-medium">{m.frequency}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30">
                          ACTIVE
                        </span>
                        {expanded[m.id] ? <ChevronUp className="w-4 h-4 text-slate-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />}
                      </div>
                    </button>

                    {expanded[m.id] && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-0.5">
                          <p className="text-slate-500 dark:text-slate-400 font-semibold">Prescribed By</p>
                          <p className="text-slate-800 dark:text-slate-200 font-semibold">{m.prescribedBy || 'General Physician'}</p>
                        </div>
                        <div className="space-y-0.5 flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 font-semibold">Duration</p>
                            <p className="text-slate-700 dark:text-slate-300">
                              {new Date(m.startDate).toLocaleDateString('en-IN')} - {m.endDate}
                            </p>
                          </div>
                        </div>
                        {m.instructions && (
                          <div className="sm:col-span-2 p-3 rounded-lg bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-0.5">
                            <p className="text-slate-500 dark:text-slate-400 font-semibold">Instructions & Dosage Guidance</p>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{m.instructions}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CurrentMedications;
