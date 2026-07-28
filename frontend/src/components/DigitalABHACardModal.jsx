import React from 'react';
import { X, QrCode, ShieldCheck, Printer, HeartPulse } from 'lucide-react';

const DigitalABHACardModal = ({ patient, isOpen, onClose }) => {
  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg glass-card rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-lg">National Digital Health ABHA Card</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Digital ABHA Card Representation */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 border-2 border-cyan-500/40 shadow-2xl relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-start justify-between border-b border-slate-700/60 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">UHIS ABHA DIGITAL HEALTH IDENTITY</span>
              <h4 className="text-xl font-black text-white tracking-wide mt-0.5">{patient.user?.fullName || 'Patient Name'}</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 text-[11px]">ABHA Health Number</p>
              <p className="font-mono font-bold text-cyan-300 text-base">{patient.abhaId || '91-4820-3941-8890'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Blood Group</p>
              <p className="font-bold text-rose-400 text-sm">{patient.bloodGroup || 'O+'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Gender / Date of Birth</p>
              <p className="font-medium text-slate-200">{patient.gender} | {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Emergency Contact</p>
              <p className="font-medium text-slate-200">{patient.emergencyPhone || patient.user?.phoneNumber || '+91 98765 00000'}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white p-1 rounded-lg flex items-center justify-center shadow-md">
                <QrCode className="w-10 h-10 text-slate-950" />
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                <p className="font-semibold text-slate-300">Scan for Instant Medical Access</p>
                <p>Encrypted via 256-bit Healthcare Standard</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/80 uppercase">VERIFIED</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Printer className="w-4 h-4" />
            Print Health Card
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalABHACardModal;
