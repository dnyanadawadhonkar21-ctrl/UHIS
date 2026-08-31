import React, { useState } from 'react';
import { Stethoscope, ChevronDown, ChevronUp, Search } from 'lucide-react';
import EmptyState from '../EmptyState';
import { SkeletonList } from '../SkeletonLoader';

const statusConfig = {
  ACTIVE: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  CHRONIC: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  RECOVERED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
};

const severityConfig = {
  MILD: 'text-emerald-600 dark:text-emerald-400 font-semibold',
  MODERATE: 'text-amber-600 dark:text-amber-400 font-semibold',
  SEVERE: 'text-rose-600 dark:text-rose-400 font-bold',
  CRITICAL: 'text-rose-700 dark:text-rose-500 font-extrabold',
};

const DiseaseHistory = ({ diseases = [], loading = false, isOpen, onToggle }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState({});
  const [localOpen, setLocalOpen] = useState(false);

  const sectionOpen = isOpen !== undefined ? isOpen : localOpen;
  const handleToggle = onToggle || (() => setLocalOpen(!localOpen));

  if (loading) return <SkeletonList title="Loading Disease History..." />;

  const filtered = diseases.filter((d) => {
    const matchSearch =
      (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.treatingDoctor || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || d.status === filter;
    return matchSearch && matchFilter;
  });

  const toggleItem = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div id="section-conditions" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-colors">
      {/* Header */}
      <button
        onClick={handleToggle}
        aria-expanded={sectionOpen}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30">
            <Stethoscope className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Medical Conditions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Your diagnosed conditions and medical history ({diseases.length})</p>
          </div>
        </div>
        {sectionOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {sectionOpen && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-4">
          {diseases.length === 0 ? (
            <EmptyState message="No disease history available." subtext="No active or past chronic medical conditions diagnosed." />
          ) : (
            <>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search conditions or doctors..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['ALL', 'ACTIVE', 'CHRONIC', 'RECOVERED'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        filter === f
                          ? 'bg-teal-600 dark:bg-teal-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disease Cards */}
              <div className="space-y-3">
                {filtered.length === 0 && (
                  <EmptyState message="No disease records match your search." />
                )}
                {filtered.map((d) => (
                  <div key={d.id} className="rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <button
                      onClick={() => toggleItem(d.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-rose-600 dark:text-rose-400 font-mono border border-slate-200 dark:border-slate-700">
                          {d.icdCode ? d.icdCode.split('.')[0] : '—'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{d.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Diagnosed: {new Date(d.diagnosedDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig[d.status] || 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                          {d.status}
                        </span>
                        <span className={`text-xs ${severityConfig[d.severity] || 'text-slate-500'}`}>
                          {d.severity}
                        </span>
                        {expanded[d.id] ? <ChevronUp className="w-4 h-4 text-slate-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />}
                      </div>
                    </button>

                    {expanded[d.id] && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="space-y-0.5">
                          <p className="text-slate-500 dark:text-slate-400 font-semibold">Treating Physician</p>
                          <p className="text-teal-600 dark:text-teal-400 font-bold">{d.treatingDoctor || 'General Physician'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-slate-500 dark:text-slate-400 font-semibold">Hospital</p>
                          <p className="text-slate-800 dark:text-slate-200 font-medium">{d.hospital || 'UHIS Medical Network'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-slate-500 dark:text-slate-400 font-semibold">ICD-10 Code</p>
                          <p className="font-mono text-amber-600 dark:text-amber-300 font-bold">{d.icdCode || 'N/A'}</p>
                        </div>
                        {d.notes && (
                          <div className="sm:col-span-3 p-3 rounded-lg bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-0.5">
                            <p className="text-slate-500 dark:text-slate-400 font-semibold">Clinical Notes</p>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">{d.notes}</p>
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

export default DiseaseHistory;
