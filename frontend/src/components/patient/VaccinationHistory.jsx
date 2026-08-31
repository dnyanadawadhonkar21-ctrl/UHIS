import React, { useState } from 'react';
import { Syringe, ChevronDown, ChevronUp, Search, CalendarCheck, ShieldCheck } from 'lucide-react';
import EmptyState from '../EmptyState';
import { SkeletonList } from '../SkeletonLoader';

const statusConfig = {
  COMPLETED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'DUE SOON': 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  OVERDUE: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
};

const VaccinationHistory = ({ vaccinations = [], loading = false, isOpen, onToggle }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState({});
  const [localOpen, setLocalOpen] = useState(false);

  const sectionOpen = isOpen !== undefined ? isOpen : localOpen;
  const handleToggle = onToggle || (() => setLocalOpen(!localOpen));

  if (loading) return <SkeletonList title="Loading Vaccination History..." />;

  const filtered = vaccinations.filter((v) => {
    const matchSearch = (v.vaccine || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || v.status === filter;
    return matchSearch && matchFilter;
  });

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div id="section-vaccinations" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-colors">
      {/* Header */}
      <button
        onClick={handleToggle}
        aria-expanded={sectionOpen}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30">
            <Syringe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Vaccination History</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Immunization records ({vaccinations.length})</p>
          </div>
        </div>
        {sectionOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {sectionOpen && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-4">
          {vaccinations.length === 0 ? (
            <EmptyState message="No vaccination records available." subtext="Immunization records will appear here once administered." />
          ) : (
            <>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search vaccines..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['ALL', 'COMPLETED', 'DUE SOON', 'OVERDUE'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        filter === f
                          ? 'bg-teal-600 dark:bg-teal-500 text-white font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline / Cards */}
              <div className="space-y-3">
                {filtered.length === 0 && (
                  <EmptyState message="No vaccination records match your search." />
                )}
                <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-4">
                  {filtered.map((v) => (
                     <div key={v.id} className="relative pl-6">
                      <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-purple-500 flex items-center justify-center">
                        {v.status === 'COMPLETED' && <ShieldCheck className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />}
                      </div>

                      <div className="rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <button
                          onClick={() => toggle(v.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition"
                        >
                          <div className="text-left">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{v.vaccine}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {v.dose} • {new Date(v.dateAdministered).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig[v.status] || 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                              {v.status}
                            </span>
                            {expanded[v.id] ? <ChevronUp className="w-4 h-4 text-slate-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />}
                          </div>
                        </button>

                        {expanded[v.id] && (
                          <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-2">
                            <div className="space-y-0.5">
                              <p className="text-slate-500 dark:text-slate-400 font-semibold">Administered At</p>
                              <p className="text-slate-800 dark:text-slate-200 font-medium">{v.hospital || 'UHIS Healthcare Center'}</p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-slate-500 dark:text-slate-400 font-semibold">Batch Number</p>
                              <p className="font-mono text-cyan-600 dark:text-cyan-300 font-bold">{v.batchNumber || 'N/A'}</p>
                            </div>
                            {v.nextDue && (
                              <div className="sm:col-span-2 p-3 rounded-lg bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-0.5 mt-1 flex items-center gap-2">
                                <CalendarCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <div>
                                  <p className="text-slate-500 dark:text-slate-400 font-semibold">Next Dose Due</p>
                                  <p className="text-purple-700 dark:text-purple-300 font-bold">{new Date(v.nextDue).toLocaleDateString('en-IN')}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VaccinationHistory;
