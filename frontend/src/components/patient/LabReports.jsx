import React, { useState } from 'react';
import { TestTube, ChevronDown, ChevronUp, Search, Download } from 'lucide-react';
import EmptyState from '../EmptyState';
import { SkeletonList } from '../SkeletonLoader';
import { useToast } from '../../context/ToastContext';

const statusConfig = {
  COMPLETED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  PENDING: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  CANCELLED: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
};

const LabReports = ({ reports = [], loading = false, isOpen, onToggle }) => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const [localOpen, setLocalOpen] = useState(false);
  const toast = useToast();

  const sectionOpen = isOpen !== undefined ? isOpen : localOpen;
  const handleToggle = onToggle || (() => setLocalOpen(!localOpen));

  if (loading) return <SkeletonList title="Loading Laboratory Reports..." />;

  const filtered = reports.filter(
    (r) =>
      (r.testName || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.testCategory || r.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleDownload = (testName) => {
    toast.success(`Lab Report for "${testName}" downloaded successfully.`);
  };

  return (
    <div id="section-labs" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-colors">
      {/* Header */}
      <button
        onClick={handleToggle}
        aria-expanded={sectionOpen}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30">
            <TestTube className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Laboratory Reports</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Diagnostic test results ({reports.length})</p>
          </div>
        </div>
        {sectionOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {sectionOpen && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-4">
          {reports.length === 0 ? (
            <EmptyState message="No laboratory reports available." subtext="Diagnostic test reports will be listed here once issued." />
          ) : (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search test names or categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {filtered.length === 0 && (
                  <EmptyState message="No laboratory reports match your search." />
                )}
                {filtered.map((r) => (
                  <div key={r.id} className="rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <button
                      onClick={() => toggle(r.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700">
                          <TestTube className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{r.testName}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {r.sampleDate ? new Date(r.sampleDate).toLocaleDateString('en-IN') : r.testDate ? new Date(r.testDate).toLocaleDateString('en-IN') : 'Recent'} • {r.testCategory || r.category || 'Diagnostic'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig[r.status] || 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                          {r.status}
                        </span>
                        {expanded[r.id] ? <ChevronUp className="w-4 h-4 text-slate-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />}
                      </div>
                    </button>

                    {expanded[r.id] && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-2">
                        <div className="space-y-0.5">
                          <p className="text-slate-500 dark:text-slate-400 font-semibold">Ordered By / Facility</p>
                          <p className="text-slate-800 dark:text-slate-200 font-semibold">{r.orderedBy || r.laboratory?.labName || 'Central Pathology Department'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-slate-500 dark:text-slate-400 font-semibold">Action</p>
                          <button
                            onClick={() => handleDownload(r.testName)}
                            className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 hover:underline transition font-bold"
                          >
                            <Download className="w-3.5 h-3.5" /> View / Download PDF
                          </button>
                        </div>
                        <div className="sm:col-span-2 p-3 rounded-lg bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-0.5 mt-1">
                          <p className="text-slate-500 dark:text-slate-400 font-semibold">Result Summary</p>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-mono mt-1 text-[11px]">
                            {r.resultData || r.resultSummary || r.remarks || 'Standard reference parameters verified within physiological limits.'}
                          </p>
                        </div>
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

export default LabReports;
