import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { TestTube, FileUp, CheckCircle2, Clock, Activity, Search } from 'lucide-react';

const LabDashboard = () => {
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [resultForm, setResultForm] = useState({
    resultData: 'Hemoglobin: 14.2 g/dL, WBC: 7,500 /uL, Platelets: 250,000 /uL (All parameters within normal clinical range)',
    remarks: 'Sample processed without hemolysis. Results verified.',
    fileUrl: 'https://uhis.org/reports/lab_report_7741.pdf',
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/lab/orders');
      if (res.data.success) {
        setLabOrders(res.data.labReports);
      }
    } catch (err) {
      console.error('Failed to fetch lab orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResult = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await api.put(`/lab/orders/${selectedOrder.id}/results`, {
        ...resultForm,
        status: 'COMPLETED',
      });
      setSelectedOrder(null);
      fetchOrders();
      alert('Diagnostic lab report uploaded and auto-synced to patient unified timeline!');
    } catch (err) {
      alert('Failed to update lab report.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
        <Activity className="w-6 h-6 text-amber-400 animate-spin" /> Loading Diagnostic Laboratory Desk...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <TestTube className="w-7 h-7 text-amber-400" /> NABL Accredited Diagnostic Laboratory Desk
          </h2>
          <p className="text-xs text-slate-400">Incoming Diagnostic Orders, Parameter Result Entry & Document Syncing</p>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Laboratory Test Order Queue</h3>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3">Patient Name</th>
                <th className="p-3">ABHA Health ID</th>
                <th className="p-3">Test Requested</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {labOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/50 transition">
                  <td className="p-3 font-semibold text-white">{order.patient?.user?.fullName}</td>
                  <td className="p-3 font-mono text-cyan-400">{order.patient?.abhaId}</td>
                  <td className="p-3 text-amber-300 font-medium">{order.testName}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">{order.testCategory}</span></td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      order.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 transition flex items-center gap-1 ml-auto"
                    >
                      <FileUp className="w-3.5 h-3.5" /> Upload Results
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Result Entry Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg glass-card p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <TestTube className="w-5 h-5 text-amber-400" /> Enter Diagnostic Test Findings
            </h3>
            <p className="text-xs text-slate-400">Patient: <span className="text-white font-semibold">{selectedOrder.patient?.user?.fullName}</span> | Test: {selectedOrder.testName}</p>

            <form onSubmit={handleUpdateResult} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Laboratory Findings & Parameters (JSON/Text)</label>
                <textarea
                  rows="3"
                  required
                  value={resultForm.resultData}
                  onChange={(e) => setResultForm({ ...resultForm, resultData: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pathologist Remarks</label>
                <input
                  type="text"
                  value={resultForm.remarks}
                  onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Report PDF Attachment Link</label>
                <input
                  type="url"
                  value={resultForm.fileUrl}
                  onChange={(e) => setResultForm({ ...resultForm, fileUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSelectedOrder(null)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold">Publish Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabDashboard;
