import React, { useState } from 'react';
import { X, Plus, Trash2, Pill, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const PrescriptionBuilderModal = ({ patient, appointment, isOpen, onClose, onSuccess }) => {
  const [diagnosisText, setDiagnosisText] = useState('');
  const [advice, setAdvice] = useState('');
  const [items, setItems] = useState([
    { medicineName: 'Paracetamol', dosage: '650mg', frequency: '1-0-1 after meals', durationDays: '5', instructions: 'Take SOS for fever' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !patient) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      { medicineName: '', dosage: '500mg', frequency: '1-0-1', durationDays: '5', instructions: '' },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/doctors/prescriptions', {
        patientId: patient.id,
        appointmentId: appointment?.id,
        diagnosisText,
        advice,
        items,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to create prescription:', err);
      alert('Failed to generate prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-3xl glass-card rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-white text-lg">Generate Digital E-Prescription</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <p className="text-slate-400">Patient</p>
              <p className="font-bold text-white text-sm">{patient.user?.fullName}</p>
            </div>
            <div>
              <p className="text-slate-400">ABHA Health ID</p>
              <p className="font-mono text-cyan-400">{patient.abhaId}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Diagnosis & Clinical Observation</label>
            <input
              type="text"
              required
              placeholder="e.g. Upper Respiratory Tract Infection / Mild Hypertension"
              value={diagnosisText}
              onChange={(e) => setDiagnosisText(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Medicines List Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Prescribed Medicines</h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
              >
                <Plus className="w-4 h-4" /> Add Medicine
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                <input
                  type="text"
                  placeholder="Medicine Name"
                  required
                  value={item.medicineName}
                  onChange={(e) => handleItemChange(idx, 'medicineName', e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g. 500mg)"
                  value={item.dosage}
                  onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Frequency (1-0-1)"
                  value={item.frequency}
                  onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Days"
                  value={item.durationDays}
                  onChange={(e) => handleItemChange(idx, 'durationDays', e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition justify-self-end"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Doctor Advice & Lifestyle Instructions</label>
            <textarea
              rows="2"
              placeholder="e.g. Avoid cold drinks. Rest for 3 days."
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Issuing...' : 'Issue Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionBuilderModal;
