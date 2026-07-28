import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import QuickRoleSwitcherModal from './components/QuickRoleSwitcherModal';

import Login from './pages/Login';
import Register from './pages/Register';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import HospitalAdminDashboard from './pages/HospitalAdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import LabDashboard from './pages/LabDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import AISuiteView from './pages/AISuiteView';
import MedicalRecordsView from './pages/MedicalRecordsView';
import NotFound from './pages/NotFound';
import { Activity } from 'lucide-react';

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 text-sm font-semibold gap-2">
        <Activity className="w-6 h-6 animate-spin" /> Initializing UHIS Application...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar onOpenRoleSwitcher={() => setShowRoleSwitcher(true)} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full custom-scrollbar overflow-y-auto">
          {children}
        </main>
      </div>
      <QuickRoleSwitcherModal isOpen={showRoleSwitcher} onClose={() => setShowRoleSwitcher(false)} />
    </div>
  );
};

const RoleBasedDefaultRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'SUPER_ADMIN': return <Navigate to="/admin-dashboard" replace />;
    case 'HOSPITAL_ADMIN': return <Navigate to="/hospital-dashboard" replace />;
    case 'DOCTOR': return <Navigate to="/doctor-dashboard" replace />;
    case 'PATIENT': return <Navigate to="/patient-dashboard" replace />;
    case 'LABORATORY': return <Navigate to="/lab-dashboard" replace />;
    case 'PHARMACY': return <Navigate to="/pharmacy-dashboard" replace />;
    case 'RECEPTIONIST': return <Navigate to="/reception-dashboard" replace />;
    default: return <Navigate to="/patient-dashboard" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Role Protected Portal Routes */}
          <Route path="/" element={<ProtectedLayout><RoleBasedDefaultRedirect /></ProtectedLayout>} />
          <Route path="/admin-dashboard" element={<ProtectedLayout><SuperAdminDashboard /></ProtectedLayout>} />
          <Route path="/hospital-dashboard" element={<ProtectedLayout><HospitalAdminDashboard /></ProtectedLayout>} />
          <Route path="/doctor-dashboard" element={<ProtectedLayout><DoctorDashboard /></ProtectedLayout>} />
          <Route path="/patient-dashboard" element={<ProtectedLayout><PatientDashboard /></ProtectedLayout>} />
          <Route path="/lab-dashboard" element={<ProtectedLayout><LabDashboard /></ProtectedLayout>} />
          <Route path="/pharmacy-dashboard" element={<ProtectedLayout><PharmacyDashboard /></ProtectedLayout>} />
          <Route path="/reception-dashboard" element={<ProtectedLayout><ReceptionistDashboard /></ProtectedLayout>} />
          
          {/* Shared Features */}
          <Route path="/ai-suite" element={<ProtectedLayout><AISuiteView /></ProtectedLayout>} />
          <Route path="/medical-timeline" element={<ProtectedLayout><MedicalRecordsView /></ProtectedLayout>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
