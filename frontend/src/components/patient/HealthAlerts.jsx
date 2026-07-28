import React from 'react';
import {
  Activity, AlertCircle, Clock, Bell, CalendarClock, Syringe,
  TestTube, ChevronRight
} from 'lucide-react';

const alertConfig = {
  CRITICAL: {
    bg: 'bg-rose-500/10 border-rose-500/40',
    icon: AlertCircle,
    iconColor: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  WARNING: {
    bg: 'bg-amber-500/10 border-amber-500/40',
    icon: Bell,
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  INFO: {
    bg: 'bg-cyan-500/10 border-cyan-500/40',
    icon: Clock,
    iconColor: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
};

const typeIcon = {
  VACCINE_DUE: Syringe,
  ALLERGY_WARNING: AlertCircle,
  FOLLOWUP: CalendarClock,
  REPORT_PENDING: TestTube,
};

const HealthAlerts = ({ alerts = [] }) => {
  if (!alerts.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <Activity className="w-4 h-4 text-rose-400" /> Health Alerts & Reminders
        <span className="ml-auto px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30">
          {alerts.length} Active
        </span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {alerts.map((alert) => {
          const cfg = alertConfig[alert.severity] || alertConfig.INFO;
          const Icon = cfg.icon;
          const TypeIcon = typeIcon[alert.type] || Bell;
          return (
            <div key={alert.id} className={`glass-card p-4 rounded-xl border ${cfg.bg} flex items-start gap-3`}>
              <div className={`p-2 rounded-lg bg-slate-900/60 flex-shrink-0`}>
                <TypeIcon className={`w-4 h-4 ${cfg.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-bold text-white">{alert.title}</p>
                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${cfg.badge}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{alert.message}</p>
                <button className={`text-[11px] font-semibold flex items-center gap-1 mt-1 ${cfg.iconColor} hover:underline`}>
                  {alert.action} <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HealthAlerts;
