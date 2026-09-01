import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Building2, Stethoscope, User, TestTube, Pill, UserCheck, X } from 'lucide-react';

const QuickRoleSwitcherModal = ({ isOpen, onClose }) => {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const roles = [
    {
      title: 'Super Admin',
      email: 'admin@uhis.gov.in',
      role: 'SUPER_ADMIN',
      desc: 'System metrics, hospital onboarding & global audit logs',
      icon: Shield,
      color: 'from-purple-600 to-indigo-600',
      redirect: '/superadmin',
    },
    {
      title: 'Hospital Admin',
      email: 'hospital@uhis.gov.in',
      role: 'HOSPITAL_ADMIN',
      desc: 'Doctor allocation, hospital stats & department revenue',
      icon: Building2,
      color: 'from-cyan-600 to-blue-600',
      redirect: '/hospital',
    },
    {
      title: 'Doctor',
      email: 'doctor@uhis.gov.in',
      role: 'DOCTOR',
      desc: 'OPD queue, digital prescriptions & diagnosis logger',
      icon: Stethoscope,
      color: 'from-emerald-600 to-teal-600',
      redirect: '/doctor',
    },
    {
      title: 'Patient',
      email: 'patient@uhis.gov.in',
      role: 'PATIENT',
      desc: 'ABHA Health Card, unified medical timeline & doctor booking',
      icon: User,
      color: 'from-blue-600 to-cyan-600',
      redirect: '/patient',
    },
    {
      title: 'Laboratory',
      email: 'lab@uhis.gov.in',
      role: 'LABORATORY',
      desc: 'Test orders queue, result entry & diagnostic report upload',
      icon: TestTube,
      color: 'from-amber-600 to-orange-600',
      redirect: '/lab',
    },
    {
      title: 'Pharmacy',
      email: 'pharmacy@uhis.gov.in',
      role: 'PHARMACY',
      desc: 'E-Prescription fulfillment, medicine stock & invoicing',
      icon: Pill,
      color: 'from-rose-600 to-pink-600',
      redirect: '/pharmacy',
    },
    {
      title: 'Receptionist',
      email: 'receptionist@uhis.gov.in',
      role: 'RECEPTIONIST',
      desc: 'Walk-in patient registration & OPD doctor availability',
      icon: UserCheck,
      color: 'from-indigo-600 to-purple-600',
      redirect: '/reception',
    },
  ];

  const handleRoleSwitch = async (roleObj) => {
    try {
      await demoLogin(roleObj.email);
      onClose();
      navigate(roleObj.redirect);
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl glass-card rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              UHIS Multi-Role Demo Switcher
            </h2>
            <p className="text-xs text-slate-400">
              Click any role card to instantly switch session and test role-specific dashboards & permissions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r, idx) => {
            const Icon = r.icon;
            return (
              <button
                key={idx}
                onClick={() => handleRoleSwitch(r)}
                className="text-left p-4 rounded-xl glass-card glass-card-hover border border-slate-800 flex flex-col justify-between space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${r.color} flex items-center justify-center text-white shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
                    {r.role}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-cyan-400 transition">{r.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{r.desc}</p>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                  {r.email}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
          All accounts pre-seeded with password: <span className="text-cyan-400 font-mono">password123</span>
        </div>
      </div>
    </div>
  );
};

export default QuickRoleSwitcherModal;
