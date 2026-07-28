import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DigitalABHACardModal from '../components/DigitalABHACardModal';
import UnifiedMedicalTimeline from '../components/UnifiedMedicalTimeline';
import { User, QrCode, Calendar, Plus, Heart, ShieldAlert, Activity, Stethoscope } from 'lucide-react';

const PatientDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAbhaModal, setShowAbhaModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    doctorId: '',
    appointmentDate: '2026-07-28',
    timeSlot: '10:30 AM',
    reason: 'Routine consultation & health checkup',
  });
  const [doctorsList, setDoctorsList] = useState([]);

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const [profRes, timeRes, metricsRes] = await Promise.all([
        api.get('/patients/profile'),
        api.get('/patients/timeline'),
        api.get('/hospitals/metrics'),
      ]);

      if (profRes.data.success) setProfile(profRes.data.patient);
      if (timeRes.data.success) setTimeline(timeRes.data.timeline);
      if (metricsRes.data.doctors) {
        setDoctorsList(metricsRes.data.doctors);
        if (metricsRes.data.doctors.length > 0) {
          setBookingForm((prev) => ({ ...prev, doctorId: metricsRes.data.doctors[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load patient profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      const selectedDoc = doctorsList.find((d) => d.id === bookingForm.doctorId);
      await api.post('/patients/appointments', {
        ...bookingForm,
        hospitalId: selectedDoc?.hospitalId || 'default-hospital',
      });
      setShowBookModal(false);
      fetchPatientData();
      alert('Appointment booked successfully!');
    } catch (err) {
      alert('Failed to book appointment.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
        <Activity className="w-6 h-6 text-cyan-400 animate-spin" /> Loading Patient Health Records...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ABHA Header Banner */}
      <div className="glass-card p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-extrabold uppercase tracking-widest border border-cyan-500/30">
              NATIONAL DIGITAL HEALTH IDENTITY
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">{profile?.user?.fullName || 'Patient Portal'}</h2>
          <p className="text-xs text-slate-400">
            ABHA Health Number: <span className="font-mono text-cyan-300 font-bold text-sm">{profile?.abhaId || '91-4820-3941-8890'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAbhaModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold border border-slate-700 transition"
          >
            <QrCode className="w-4 h-4" /> Digital ABHA Card
          </button>

          <button
            onClick={() => setShowBookModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
          >
            <Calendar className="w-4 h-4" /> Book Doctor OPD
          </button>
        </div>
      </div>

      {/* Patient Health Overview Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400">Blood Group</p>
            <p className="text-lg font-bold text-rose-400">{profile?.bloodGroup || 'O+'}</p>
          </div>
          <Heart className="w-6 h-6 text-rose-500" />
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400">Known Allergies</p>
            <p className="text-xs font-semibold text-amber-300">{profile?.allergies || 'Penicillin, Dust'}</p>
          </div>
          <ShieldAlert className="w-6 h-6 text-amber-500" />
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400">Emergency Phone</p>
            <p className="text-xs font-mono font-bold text-cyan-300">{profile?.emergencyPhone || profile?.user?.phoneNumber || '+91 98765 00000'}</p>
          </div>
          <User className="w-6 h-6 text-cyan-500" />
        </div>
      </div>

      {/* Unified Medical Timeline */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
          Centralized Medical Record Timeline
        </h3>
        <UnifiedMedicalTimeline events={timeline} />
      </div>

      {/* Digital ABHA Card Modal */}
      <DigitalABHACardModal patient={profile} isOpen={showAbhaModal} onClose={() => setShowAbhaModal(false)} />

      {/* Book Doctor OPD Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-card p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-cyan-400" /> Book OPD Consultation
            </h3>
            <form onSubmit={handleBookAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Doctor</label>
                <select
                  value={bookingForm.doctorId}
                  onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                >
                  {doctorsList.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.user?.fullName} ({doc.specialization} - ₹{doc.consultationFee})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Preferred Date</label>
                <input
                  type="date"
                  required
                  value={bookingForm.appointmentDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, appointmentDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Time Slot</label>
                <select
                  value={bookingForm.timeSlot}
                  onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason for Visit</label>
                <input
                  type="text"
                  placeholder="e.g. Routine checkup / Chest tightness"
                  value={bookingForm.reason}
                  onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowBookModal(false)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold">Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
