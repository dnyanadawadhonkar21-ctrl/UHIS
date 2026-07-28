import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UserCheck, UserPlus, Stethoscope, Clock, Activity, CheckCircle2 } from 'lucide-react';

const ReceptionistDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [patientForm, setPatientForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    gender: 'MALE',
    dateOfBirth: '1995-04-12',
  });

  useEffect(() => {
    fetchReceptionData();
  }, []);

  const fetchReceptionData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/receptionist/queue');
      if (res.data.success) {
        setQueue(res.data.doctorsQueue);
      }
    } catch (err) {
      console.error('Failed to load reception queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWalkIn = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/receptionist/walkin-patient', patientForm);
      if (res.data.success) {
        setShowWalkinModal(false);
        alert(`Walk-in patient registered! ABHA Health ID: ${res.data.patient.patient.abhaId}`);
        fetchReceptionData();
      }
    } catch (err) {
      alert('Failed to register walk-in patient.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
        <Activity className="w-6 h-6 text-indigo-400 animate-spin" /> Loading Reception OPD Queue...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-indigo-400" /> OPD Reception & Check-In Desk
          </h2>
          <p className="text-xs text-slate-400">Walk-in Patient Registration, Digital ABHA Issuance & Doctor OPD Queue</p>
        </div>

        <button
          onClick={() => setShowWalkinModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 hover:opacity-90 transition"
        >
          <UserPlus className="w-4 h-4" /> Register Walk-In Patient
        </button>
      </div>

      {/* Doctor Availability Queue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {queue.map((doc) => (
          <div key={doc.id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white text-base">{doc.user?.fullName}</h3>
                <p className="text-xs text-cyan-400 font-medium">{doc.specialization}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{doc.department?.name || 'General OPD'}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                AVAILABLE NOW
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Consultation Fee</span>
              <span className="font-bold text-emerald-400 text-sm">₹{doc.consultationFee}</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Token Queue ({doc.appointments?.length || 0})</p>
              <div className="space-y-1.5">
                {doc.appointments?.map((appt, idx) => (
                  <div key={appt.id} className="p-2 rounded-lg bg-slate-800/60 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Token #{idx + 1}: {appt.patient?.user?.fullName}</span>
                    <span className="font-mono text-cyan-300 text-[11px]">{appt.timeSlot}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Walk-in Registration Modal */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-card p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" /> Walk-In Patient Registration
            </h3>
            <form onSubmit={handleRegisterWalkIn} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Patient Full Name"
                value={patientForm.fullName}
                onChange={(e) => setPatientForm({ ...patientForm, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
              <input
                type="email"
                placeholder="Email Address (Optional)"
                value={patientForm.email}
                onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
              <input
                type="tel"
                required
                placeholder="Phone Number"
                value={patientForm.phoneNumber}
                onChange={(e) => setPatientForm({ ...patientForm, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={patientForm.gender}
                  onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                <input
                  type="date"
                  value={patientForm.dateOfBirth}
                  onChange={(e) => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowWalkinModal(false)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold">Issue ABHA Token</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
