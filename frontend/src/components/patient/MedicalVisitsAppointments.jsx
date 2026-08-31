import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, Stethoscope, Clock, CheckCircle2, User, Building2 } from 'lucide-react';
import EmptyState from '../EmptyState';
import { SkeletonList } from '../SkeletonLoader';

const statusConfig = {
  CONFIRMED: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  PENDING: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  COMPLETED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  CANCELLED: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
};

const MedicalVisitsAppointments = ({ appointments = [], visits = [], loading = false }) => {
  const [sectionOpen, setSectionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('UPCOMING'); // 'UPCOMING' | 'PAST'

  if (loading) return <SkeletonList title="Loading Appointments & Visits..." />;

  const upcomingAppts = appointments.filter((a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED');
  const pastVisits = [
    ...appointments.filter((a) => a.status === 'COMPLETED' || a.status === 'CANCELLED'),
    ...visits,
  ];

  const currentList = activeTab === 'UPCOMING' ? upcomingAppts : pastVisits;

  return (
    <div id="section-visits" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-colors">
      {/* Header */}
      <button
        onClick={() => setSectionOpen(!sectionOpen)}
        aria-expanded={sectionOpen}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30">
            <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Medical Visits & Appointments</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Consultation schedule & hospital visit records</p>
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
          {/* Sub Tab Switcher */}
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('UPCOMING')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'UPCOMING'
                  ? 'bg-teal-600 dark:bg-teal-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Upcoming OPD ({upcomingAppts.length})
            </button>
            <button
              onClick={() => setActiveTab('PAST')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'PAST'
                  ? 'bg-teal-600 dark:bg-teal-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Past Visits ({pastVisits.length})
            </button>
          </div>

          {currentList.length === 0 ? (
            <EmptyState
              message={activeTab === 'UPCOMING' ? 'No upcoming appointments scheduled.' : 'No previous hospital visits found.'}
              subtext={activeTab === 'UPCOMING' ? 'Use the "Book OPD Consultation" button to schedule an appointment.' : 'Completed hospital visit records will appear here.'}
            />
          ) : (
            <div className="space-y-3">
              {currentList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.doctor?.user?.fullName || item.doctorName || 'Dr. Rajesh Sharma'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig[item.status] || 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                      {item.status || 'SCHEDULED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.hospital?.name || item.hospitalName || 'UHIS General Hospital'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.appointmentDate ? new Date(item.appointmentDate).toLocaleDateString('en-IN') : 'Date N/A'} ({item.timeSlot || '10:00 AM'})</span>
                    </div>
                    <div>
                      Reason: <span className="font-semibold text-slate-800 dark:text-slate-200">{item.reason || 'OPD Checkup'}</span>
                    </div>
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

export default MedicalVisitsAppointments;
