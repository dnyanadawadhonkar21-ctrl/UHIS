import React from 'react';

const StatCard = ({ title, value, icon: Icon, change, subtext, color = 'cyan' }) => {
  const getColorClasses = (c) => {
    switch (c) {
      case 'emerald': return 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30';
      case 'rose': return 'from-rose-500/20 to-pink-500/10 text-rose-400 border-rose-500/30';
      case 'amber': return 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30';
      case 'purple': return 'from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30';
      default: return 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <div className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 flex items-start justify-between relative overflow-hidden">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400 tracking-wide">{title}</p>
        <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
        {subtext && <p className="text-[11px] text-slate-500">{subtext}</p>}
      </div>

      <div className={`p-3 rounded-xl bg-gradient-to-br ${getColorClasses(color)} border shadow-lg`}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
    </div>
  );
};

export default StatCard;
