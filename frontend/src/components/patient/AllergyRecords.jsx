import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import EmptyState from '../EmptyState';
import { SkeletonList } from '../SkeletonLoader';

const severityConfig = {
  MILD: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
  MODERATE: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
  SEVERE: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
};

const categoryConfig = {
  FOOD: 'Food Allergy',
  DRUG: 'Medication Allergy',
  ENVIRONMENTAL: 'Environmental',
  OTHER: 'Other Allergy',
};

const AllergyRecords = ({ allergies = [], loading = false, isOpen, onToggle }) => {
  const [localOpen, setLocalOpen] = useState(false);
  const sectionOpen = isOpen !== undefined ? isOpen : localOpen;
  const handleToggle = onToggle || (() => setLocalOpen(!localOpen));

  if (loading) return <SkeletonList title="Loading Allergies..." />;

  const severeAllergies = allergies.filter((a) => a.severity === 'SEVERE').length;

  return (
    <div id="section-allergies" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-colors">
      {/* Header */}
      <button
        onClick={handleToggle}
        aria-expanded={sectionOpen}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 relative">
            <ShieldAlert className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            {severeAllergies > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white dark:border-slate-900"></span>
              </span>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Allergy Records</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Recorded allergies & contraindications</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {severeAllergies > 0 && !sectionOpen && (
             <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-200 dark:border-rose-500/20">
               <AlertTriangle className="w-3 h-3" /> {severeAllergies} Severe
             </span>
          )}
          {sectionOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {sectionOpen && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-4">
          {allergies.length === 0 ? (
            <EmptyState message="No allergy records available." subtext="You currently have no recorded allergies or adverse reactions." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allergies.map((allergy) => (
                <div
                  key={allergy.id}
                  className={`p-4 rounded-xl border ${
                    allergy.severity === 'SEVERE'
                      ? 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {allergy.allergen}
                        {allergy.severity === 'SEVERE' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {categoryConfig[allergy.category] || allergy.category}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityConfig[allergy.severity] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {allergy.severity}
                    </span>
                  </div>

                  <div className="space-y-2 mt-3">
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Reactions</p>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {allergy.symptoms?.join(', ') || 'Unknown'}
                      </p>
                    </div>
                    {allergy.precautions && (
                      <div className="space-y-0.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Precautions</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {allergy.precautions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AllergyRecords;
