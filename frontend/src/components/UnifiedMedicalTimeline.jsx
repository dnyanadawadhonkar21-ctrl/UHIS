import React, { useState } from 'react';
import {
  FileText,
  Stethoscope,
  TestTube,
  Pill,
  AlertTriangle,
  Calendar,
  User,
  Download,
} from 'lucide-react';
import EmptyState from './EmptyState';
import { SkeletonTimeline } from './SkeletonLoader';

const UnifiedMedicalTimeline = ({ events = [], loading = false }) => {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) return <SkeletonTimeline />;

  const filterOptions = [
    { label: 'All Records', value: 'ALL' },
    { label: 'Prescriptions', value: 'PRESCRIPTION' },
    { label: 'Lab Reports', value: 'LAB_REPORT' },
    { label: 'Consultations', value: 'CONSULTATION' },
    { label: 'Diagnoses', value: 'DIAGNOSIS' },
  ];

  const filteredEvents = events.filter((evt) => {
    const matchesFilter = activeFilter === 'ALL' || evt.category === activeFilter;
    const matchesSearch =
      evt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.doctorName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getEventIcon = (category) => {
    switch (category) {
      case 'PRESCRIPTION':
        return <Pill className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
      case 'LAB_REPORT':
        return <TestTube className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
      case 'DIAGNOSIS':
        return <AlertTriangle className="w-4 h-4 text-purple-500 dark:text-purple-400" />;
      case 'APPOINTMENT':
      case 'CONSULTATION':
        return <Stethoscope className="w-4 h-4 text-brand-600 dark:text-cyan-400" />;
      default:
        return <FileText className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Timeline Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                activeFilter === opt.value
                  ? 'bg-brand-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search health timeline..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 dark:focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          message="No previous hospital visits found."
          subtext="No medical records, prescriptions, or consultations logged matching your query."
        />
      ) : (
        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-6 pl-6">
          {filteredEvents.map((evt, idx) => (
            <div key={idx} className="relative group">
              {/* Event Marker Node */}
              <div className="absolute -left-[35px] top-1.5 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-brand-500 dark:border-cyan-500/40 flex items-center justify-center shadow-sm group-hover:border-brand-600 dark:group-hover:border-cyan-400 transition">
                {getEventIcon(evt.category)}
              </div>

              {/* Event Content Card */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-brand-700 dark:text-cyan-400 border border-slate-200 dark:border-slate-700">
                      {evt.category}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">{evt.title}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-cyan-400" />
                    {new Date(evt.date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{evt.description}</p>

                {/* Prescription Items breakdown if applicable */}
                {evt.items && evt.items.length > 0 && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-400">Prescribed Medications:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {evt.items.map((item, i) => (
                        <div key={i} className="text-xs p-2 rounded bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                          <span className="font-bold text-rose-600 dark:text-rose-300">{item.medicineName}</span> ({item.dosage})
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.frequency} for {item.durationDays} days
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Meta */}
                <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
                  {evt.doctorName && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Attending: {evt.doctorName}
                    </span>
                  )}
                  {evt.labName && <span className="text-slate-500 dark:text-slate-400">Lab: {evt.labName}</span>}
                  {evt.fileUrl && (
                    <a
                      href={evt.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-brand-600 dark:text-cyan-400 hover:underline text-xs font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      View Document
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UnifiedMedicalTimeline;
