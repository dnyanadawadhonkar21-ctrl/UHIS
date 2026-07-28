import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Pill, CheckCircle2, Package, Plus, IndianRupee, Activity } from 'lucide-react';

const PharmacyDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMed, setShowAddMed] = useState(false);
  const [medForm, setMedForm] = useState({
    name: 'Metformin 500mg',
    genericName: 'Metformin Hydrochloride',
    brand: 'Glycomet',
    category: 'ANTIDIABETIC',
    unitPrice: '6.5',
    stockQuantity: '400',
  });

  useEffect(() => {
    fetchPharmacyData();
  }, []);

  const fetchPharmacyData = async () => {
    try {
      setLoading(true);
      const [qRes, invRes] = await Promise.all([
        api.get('/pharmacy/prescriptions-queue'),
        api.get('/pharmacy/inventory'),
      ]);

      if (qRes.data.success) setQueue(qRes.data.prescriptions);
      if (invRes.data.success) setInventory(invRes.data.medicines);
    } catch (err) {
      console.error('Failed to load pharmacy console:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async (prescription) => {
    try {
      await api.post('/pharmacy/dispense', {
        prescriptionId: prescription.id,
        patientId: prescription.patientId,
        totalCost: 350,
      });
      fetchPharmacyData();
      alert('Medicines dispensed & invoice generated successfully!');
    } catch (err) {
      alert('Failed to dispense medicines.');
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pharmacy/inventory', medForm);
      setShowAddMed(false);
      fetchPharmacyData();
    } catch (err) {
      alert('Failed to add medicine.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
        <Activity className="w-6 h-6 text-rose-400 animate-spin" /> Loading CityMed E-Pharmacy Console...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Pill className="w-7 h-7 text-rose-400" /> CityMed 24x7 E-Pharmacy & Inventory
          </h2>
          <p className="text-xs text-slate-400">Digital E-Prescription Queue, Drug Stock Manager & Auto-Invoicing</p>
        </div>

        <button
          onClick={() => setShowAddMed(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-lg shadow-rose-500/20 hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Add Drug Stock
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* E-Prescription Dispensing Queue */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Pill className="w-4 h-4 text-rose-400" /> Incoming E-Prescription Queue
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {queue.map((presc) => (
              <div key={presc.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{presc.patient?.user?.fullName}</h4>
                    <p className="text-xs font-mono text-cyan-400">ABHA: {presc.patient?.abhaId}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Dr. {presc.doctor?.user?.fullName}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-800 text-xs space-y-1">
                  <p className="text-slate-400 font-semibold text-[11px]">Prescribed Drugs:</p>
                  {presc.items?.map((item, i) => (
                    <p key={i} className="text-rose-300 font-medium">
                      • {item.medicineName} ({item.dosage}) - {item.frequency} [{item.durationDays} days]
                    </p>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-emerald-400">Est. Invoice: ₹350.00</span>
                  <button
                    onClick={() => handleDispense(presc)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Dispense & Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medicine Inventory */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-rose-400" /> Drug Stock & Inventory
          </h3>
          <div className="overflow-x-auto custom-scrollbar max-h-96">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Medicine Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">In Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {inventory.map((med) => (
                  <tr key={med.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 font-semibold text-white">
                      {med.name}
                      <p className="text-[10px] text-slate-400">{med.brand || med.genericName}</p>
                    </td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">{med.category}</span></td>
                    <td className="p-3 text-emerald-400 font-bold">₹{med.unitPrice}</td>
                    <td className="p-3 font-bold text-cyan-300">{med.stockQuantity} units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-card p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="font-bold text-white text-lg">Add Drug Inventory</h3>
            <form onSubmit={handleAddMedicine} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Medicine Name (e.g. Metformin 500mg)"
                value={medForm.name}
                onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Generic Name"
                  value={medForm.genericName}
                  onChange={(e) => setMedForm({ ...medForm, genericName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={medForm.category}
                  onChange={(e) => setMedForm({ ...medForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Unit Price (₹)"
                  value={medForm.unitPrice}
                  onChange={(e) => setMedForm({ ...medForm, unitPrice: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
                <input
                  type="number"
                  placeholder="Stock Quantity"
                  value={medForm.stockQuantity}
                  onChange={(e) => setMedForm({ ...medForm, stockQuantity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddMed(false)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-rose-500 text-white font-bold">Add to Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyDashboard;
