import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PrescriptionBuilderModal from '../components/PrescriptionBuilderModal';
import UnifiedMedicalTimeline from '../components/UnifiedMedicalTimeline';
import { Stethoscope, Calendar, CheckCircle2, Pill, FileText, Activity, AlertCircle } from 'lucide-react';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [patientTimeline, setPatientTimeline] = useState([]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/doctors/appointments');
      if (res.data.success) {
        setAppointments(res.data.appointments);
      }
    } catch (err) {
      console.error('Failed to load doctor OPD queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (apptId, status) => {
    try {
      await api.put(`/doctors/appointments/${apptId}/status`, { status });
      fetchAppointments();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleOpenPrescription = (patient, appt) => {
    setSelectedPatient(patient);
    setSelectedAppt(appt);
    setShowPrescriptionModal(true);
  };

  const handleViewTimeline = async (patientId) => {
    try {
      const res = await api.get(`/patients/timeline/${patientId}`);
      if (res.data.success) {
        setPatientTimeline(res.data.timeline);
        setShowTimelineModal(true);
      }
    } catch (err) {
      alert('Failed to fetch patient timeline.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
        <Activity className="w-6 h-6 text-emerald-400 animate-spin" /> Loading Doctor OPD Workspace...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-emerald-400" /> Doctor Clinical OPD Console
          </h2>
          <p className="text-xs text-slate-400">Patient OPD Consultation Queue, E-Prescription Builder & Health Timeline Access</p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4" /> OPD Status: ACTIVE (Today Queue)
        </div>
      </div>

      {/* OPD Appointments List */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" /> Scheduled Patient Consultations ({appointments.length})
        </h3>

        {appointments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400 font-medium">No pending consultations in your OPD queue today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="p-4 rounded-xl glass-card border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{appt.patient?.user?.fullName}</span>
                    <span className="text-xs font-mono text-cyan-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      ABHA: {appt.patient?.abhaId}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      appt.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      appt.status === 'CONFIRMED' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Slot: <span className="font-semibold text-white">{appt.timeSlot}</span> | Reason: {appt.reason || 'General Consultation'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Blood Group: <span className="text-rose-400 font-semibold">{appt.patient?.bloodGroup || 'O+'}</span> | Allergies: {appt.patient?.allergies || 'None reported'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleViewTimeline(appt.patient?.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 transition"
                  >
                    <FileText className="w-3.5 h-3.5" /> Medical History
                  </button>

                  <button
                    onClick={() => handleOpenPrescription(appt.patient, appt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 hover:opacity-90 transition"
                  >
                    <Pill className="w-3.5 h-3.5" /> Issue E-Prescription
                  </button>

                  {appt.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleStatusUpdate(appt.id, 'COMPLETED')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-slate-700 transition"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prescription Builder Modal */}
      <PrescriptionBuilderModal
        patient={selectedPatient}
        appointment={selectedAppt}
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        onSuccess={fetchAppointments}
      />

      {/* Medical History Timeline Modal */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-4xl glass-card p-6 rounded-2xl border border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" /> Patient Medical History Timeline
              </h3>
              <button onClick={() => setShowTimelineModal(false)} className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg">Close</button>
            </div>
            <UnifiedMedicalTimeline events={patientTimeline} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
