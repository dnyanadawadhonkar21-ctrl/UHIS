import React from 'react';

export const SkeletonProfile = () => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
        <div className="space-y-2">
          <div className="w-36 h-4 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="w-24 h-3 rounded bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </div>
      <div className="w-24 h-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
    </div>
    <div className="border-t border-slate-200 dark:border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="w-20 h-3 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="w-32 h-4 rounded bg-slate-200 dark:bg-slate-800"></div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonList = ({ count = 3, title = 'Loading Records...' }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
        <div className="w-40 h-4 rounded bg-slate-200 dark:bg-slate-800"></div>
      </div>
      <div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-800"></div>
    </div>
    <div className="space-y-3 pt-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
            <div className="space-y-1.5">
              <div className="w-32 h-3.5 rounded bg-slate-200 dark:bg-slate-700"></div>
              <div className="w-24 h-2.5 rounded bg-slate-200 dark:bg-slate-700"></div>
            </div>
          </div>
          <div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonTimeline = () => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 animate-pulse">
    <div className="w-36 h-4 rounded bg-slate-200 dark:bg-slate-800 mb-4"></div>
    <div className="space-y-4 relative pl-6 border-l-2 border-slate-200 dark:border-slate-800">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2 relative">
          <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
          <div className="w-48 h-3.5 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="w-32 h-2.5 rounded bg-slate-200 dark:bg-slate-800"></div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonCard = () => (
  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 animate-pulse">
    <div className="w-24 h-3 rounded bg-slate-200 dark:bg-slate-800"></div>
    <div className="w-16 h-6 rounded bg-slate-200 dark:bg-slate-800"></div>
  </div>
);

export const SkeletonTable = ({ rows = 4, cols = 4 }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 animate-pulse overflow-hidden">
    <div className="w-40 h-4 rounded bg-slate-200 dark:bg-slate-800 mb-4"></div>
    <div className="space-y-3">
      {[...Array(rows)].map((_, r) => (
        <div key={r} className="flex gap-4 items-center">
          {[...Array(cols)].map((_, c) => (
            <div key={c} className="flex-1 h-4 rounded bg-slate-200 dark:bg-slate-800"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default { SkeletonProfile, SkeletonList, SkeletonTimeline, SkeletonCard, SkeletonTable };
