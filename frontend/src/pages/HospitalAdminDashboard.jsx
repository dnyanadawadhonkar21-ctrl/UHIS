import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { Building2, Stethoscope, Users, IndianRupee, Plus, Calendar, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const HospitalAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    fullName: '',
    email: '',
    specialization: 'Cardiology',
    licenseNumber: '',
    qualification: 'MBBS, MD',
    experienceYears: '8',
    consultationFee: '600',
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hospitals/metrics');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch hospital metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hospitals/doctors', doctorForm);
      setShowAddDoctor(false);
      fetchMetrics();
    } catch (err) {
      alert('Failed to register doctor.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
        <Activity className="w-6 h-6 text-cyan-400 animate-spin" /> Loading Hospital Operations...
      </div>
    );
  }

  const revenueData = [
    { day: 'Mon', revenue: 14500 },
    { day: 'Tue', revenue: 22000 },
    { day: 'Wed', revenue: 18500 },
    { day: 'Thu', revenue: 29000 },
    { day: 'Fri', revenue: 24000 },
    { day: 'Sat', revenue: 31000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-cyan-400" /> Hospital Administration & Operations
          </h2>
          <p className="text-xs text-slate-400">Doctor Roster, Department Revenue & OPD Schedule Management</p>
        </div>

        <button
          onClick={() => setShowAddDoctor(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Add Doctor to Roster
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Doctors" value={data?.metrics?.doctors || 0} icon={Stethoscope} color="cyan" subtext="In OPD & Emergency" />
        <StatCard title="Registered Patients" value={data?.metrics?.patients || 0} icon={Users} color="emerald" subtext="Unique patient IDs" />
        <StatCard title="Total Consultations" value={data?.metrics?.appointments || 0} icon={Calendar} color="amber" subtext="Completed & Pending" />
        <StatCard title="Hospital Revenue" value={`₹${data?.metrics?.totalRevenue || 0}`} icon={IndianRupee} color="purple" subtext="Billed consultations & labs" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor Roster */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Medical Staff & Doctor Roster</h3>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Doctor Name</th>
                  <th className="p-3">Specialization</th>
                  <th className="p-3">License No</th>
                  <th className="p-3">Fee</th>
                  <th className="p-3">Schedule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data?.doctors?.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 font-semibold text-white">{doc.user?.fullName}</td>
                    <td className="p-3 text-cyan-400 font-medium">{doc.specialization}</td>
                    <td className="p-3 font-mono text-slate-400">{doc.licenseNumber}</td>
                    <td className="p-3 text-emerald-400 font-bold">₹{doc.consultationFee}</td>
                    <td className="p-3 text-slate-400">{doc.availableDays} ({doc.timeSlot})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue Analytics Chart */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Weekly OPD Revenue (₹)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="revenue" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Add Doctor Modal */}
      {showAddDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-card p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="font-bold text-white text-lg">Register Doctor</h3>
            <form onSubmit={handleAddDoctor} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Doctor Full Name (e.g. Dr. Ramesh Gupta)"
                value={doctorForm.fullName}
                onChange={(e) => setDoctorForm({ ...doctorForm, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={doctorForm.email}
                onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Specialization"
                  value={doctorForm.specialization}
                  onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
                <input
                  type="text"
                  placeholder="License Number"
                  value={doctorForm.licenseNumber}
                  onChange={(e) => setDoctorForm({ ...doctorForm, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Consultation Fee (₹)"
                  value={doctorForm.consultationFee}
                  onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
                <input
                  type="number"
                  placeholder="Experience (Years)"
                  value={doctorForm.experienceYears}
                  onChange={(e) => setDoctorForm({ ...doctorForm, experienceYears: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddDoctor(false)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold">Add Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalAdminDashboard;
