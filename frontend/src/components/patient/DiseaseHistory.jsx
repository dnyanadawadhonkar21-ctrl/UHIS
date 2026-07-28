import React, { useState } from 'react';
import { Stethoscope, ChevronDown, ChevronUp, Search } from 'lucide-react';

const statusConfig = {
  ACTIVE: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  CHRONIC: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  RECOVERED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
};

const severityConfig = {
  MILD: 'text-emerald-400',
  MODERATE: 'text-amber-400',
  SEVERE: 'text-rose-400',
  CRITICAL: 'text-rose-600 font-extrabold',
};

const DiseaseHistory = ({ diseases = [] }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState({});
  const [sectionOpen, setSectionOpen] = useState(true);

  const filtered = diseases.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.treatingDoctor.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || d.status === filter;
    return matchSearch && matchFilter;
  });

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setSectionOpen(!sectionOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-800/30 transition"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <Stethoscope className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-white">Medical Conditions & Disease History</h3>
            <p className="text-[11px] text-slate-400">{diseases.length} diagnoses on record</p>
          </div>
        </div>
        {sectionOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {sectionOpen && (
        <div className="border-t border-slate-800 p-5 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search conditions or doctors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center gap-2">
              {['ALL', 'ACTIVE', 'CHRONIC', 'RECOVERED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                    filter === f ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
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
              <p className="text-xs text-slate-500 text-center py-6">No conditions match your search.</p>
            )}
            {filtered.map((d) => (
              <div key={d.id} className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
                <button
                  onClick={() => toggle(d.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-rose-400 font-mono border border-slate-700">
                      {d.icdCode ? d.icdCode.split('.')[0] : '—'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{d.name}</p>
                      <p className="text-[11px] text-slate-400">Diagnosed: {new Date(d.diagnosedDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig[d.status] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                      {d.status}
                    </span>
                    <span className={`text-[11px] font-semibold ${severityConfig[d.severity] || 'text-slate-400'}`}>
                      {d.severity}
                    </span>
                    {expanded[d.id] ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" />}
                  </div>
                </button>

                {expanded[d.id] && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="text-slate-500 font-semibold">Treating Physician</p>
                      <p className="text-cyan-300 font-medium">{d.treatingDoctor}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-slate-500 font-semibold">Hospital</p>
                      <p className="text-slate-200">{d.hospital}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-slate-500 font-semibold">ICD-10 Code</p>
                      <p className="font-mono text-amber-300">{d.icdCode || 'N/A'}</p>
                    </div>
                    <div className="sm:col-span-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800 space-y-0.5">
                      <p className="text-slate-500 font-semibold">Clinical Notes</p>
                      <p className="text-slate-300 leading-relaxed">{d.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiseaseHistory;
