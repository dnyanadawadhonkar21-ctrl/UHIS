import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { Building2, Stethoscope, Users, ShieldAlert, Plus, ShieldCheck, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const SuperAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddHospital, setShowAddHospital] = useState(false);
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    contactNo: '',
    email: '',
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHospital = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/hospitals', hospitalForm);
      setShowAddHospital(false);
      fetchStats();
    } catch (err) {
      alert('Failed to onboard hospital.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
        <Activity className="w-6 h-6 text-cyan-400 animate-spin" /> Loading Super Admin Intelligence...
      </div>
    );
  }

  const chartData = [
    { month: 'Jan', appointments: 120, auditEvents: 450 },
    { month: 'Feb', appointments: 210, auditEvents: 720 },
    { month: 'Mar', appointments: 340, auditEvents: 980 },
    { month: 'Apr', appointments: 480, auditEvents: 1400 },
    { month: 'May', appointments: 610, auditEvents: 1850 },
    { month: 'Jun', appointments: 790, auditEvents: 2300 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-purple-400" /> Super Admin Control Portal
          </h2>
          <p className="text-xs text-slate-400">Global System Metrics, Security Audit Logs & Healthcare Onboarding</p>
        </div>

        <button
          onClick={() => setShowAddHospital(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-500/20 hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Onboard New Hospital
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Onboarded Hospitals" value={data?.stats?.totalHospitals || 0} icon={Building2} color="purple" subtext="Multi-specialty centers" />
        <StatCard title="Total Registered Doctors" value={data?.stats?.totalDoctors || 0} icon={Stethoscope} color="cyan" subtext="Verified licensed practitioners" />
        <StatCard title="Total Patients (ABHA Ready)" value={data?.stats?.totalPatients || 0} icon={Users} color="emerald" subtext="Centralized health records" />
        <StatCard title="Security Audit Logs" value={data?.stats?.totalAuditLogs || 0} icon={ShieldAlert} color="amber" subtext="Immutable event traces" />
      </div>

      {/* Analytics Chart & Hospitals List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Platform Growth & Activity Stream</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAudit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="auditEvents" stroke="#a855f7" fillOpacity={1} fill="url(#colorAudit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Onboarded Hospitals */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Registered Hospitals</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
            {data?.hospitals?.map((h) => (
              <div key={h.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <p className="font-semibold text-white text-xs">{h.name}</p>
                <p className="text-[11px] text-slate-400">{h.city}, {h.state} | Code: <span className="font-mono text-cyan-400">{h.code}</span></p>
                <p className="text-[10px] text-slate-500">Doctors: {h._count?.doctors} | Consultations: {h._count?.appointments}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Audit Logs */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-purple-400" /> Platform Audit Trail & Compliance Log
        </h3>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target Resource</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data?.recentAuditLogs?.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition">
                  <td className="p-3 font-mono text-[11px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-3 font-medium text-white">{log.user?.fullName || 'System User'}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">{log.action}</span></td>
                  <td className="p-3 font-mono text-cyan-400">{log.resource}</td>
                  <td className="p-3 text-slate-400 truncate max-w-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Hospital Modal */}
      {showAddHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-card p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="font-bold text-white text-lg">Onboard Healthcare Institute</h3>
            <form onSubmit={handleAddHospital} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Hospital Name (e.g. Manipal Super Specialty)"
                value={hospitalForm.name}
                onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
              <input
                type="text"
                required
                placeholder="Address"
                value={hospitalForm.address}
                onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={hospitalForm.city}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={hospitalForm.state}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, state: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Contact Phone"
                value={hospitalForm.contactNo}
                onChange={(e) => setHospitalForm({ ...hospitalForm, contactNo: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
              <input
                type="email"
                placeholder="Official Email"
                value={hospitalForm.email}
                onChange={(e) => setHospitalForm({ ...hospitalForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddHospital(false)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-purple-600 text-white font-bold">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
