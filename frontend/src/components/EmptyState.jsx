import React from 'react';
import { FileQuestion } from 'lucide-react';

const EmptyState = ({ message = 'No records available.', subtext }) => {
  return (
    <div className="py-8 px-4 text-center rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 my-2">
      <FileQuestion className="w-6 h-6 text-slate-400 dark:text-slate-500 stroke-[1.5]" />
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
        {message}
      </p>
      {subtext && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {subtext}
        </p>
      )}
    </div>
  );
};

export default EmptyState;
