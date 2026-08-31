import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { DashboardPreferenceProvider } from './context/DashboardPreferenceContext';

import LandingPage from './pages/LandingPage';
import DashboardSelectionPage from './pages/DashboardSelectionPage';
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

// Protected route wrapper — new pages include AppLayout internally
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-surface, #F8FAFC)",
        fontFamily: "'Inter', sans-serif",
        fontSize: "0.875rem",
        color: "#64748b",
        gap: "0.5rem",
      }}>
        <span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid #2563EB", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        Initializing UHIS...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DashboardPreferenceProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Dashboard Selection */}
                <Route path="/dashboard-selection" element={<ProtectedRoute><DashboardSelectionPage /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardSelectionPage /></ProtectedRoute>} />

                {/* Patient */}
                <Route path="/patient-dashboard" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
                <Route path="/patient" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />

                {/* Doctor */}
                <Route path="/doctor-dashboard" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
                <Route path="/doctor" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />

                {/* Hospital Admin */}
                <Route path="/hospital-dashboard" element={<ProtectedRoute><HospitalAdminDashboard /></ProtectedRoute>} />
                <Route path="/hospital" element={<ProtectedRoute><HospitalAdminDashboard /></ProtectedRoute>} />

                {/* Super Admin */}
                <Route path="/admin-dashboard" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
                <Route path="/superadmin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
                <Route path="/super-admin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />

                {/* Lab */}
                <Route path="/lab-dashboard" element={<ProtectedRoute><LabDashboard /></ProtectedRoute>} />
                <Route path="/lab" element={<ProtectedRoute><LabDashboard /></ProtectedRoute>} />

                {/* Pharmacy */}
                <Route path="/pharmacy-dashboard" element={<ProtectedRoute><PharmacyDashboard /></ProtectedRoute>} />
                <Route path="/pharmacy" element={<ProtectedRoute><PharmacyDashboard /></ProtectedRoute>} />

                {/* Receptionist */}
                <Route path="/reception-dashboard" element={<ProtectedRoute><ReceptionistDashboard /></ProtectedRoute>} />
                <Route path="/reception" element={<ProtectedRoute><ReceptionistDashboard /></ProtectedRoute>} />
                <Route path="/receptionist" element={<ProtectedRoute><ReceptionistDashboard /></ProtectedRoute>} />

                {/* Shared Features */}
                <Route path="/ai-suite" element={<ProtectedRoute><AISuiteView /></ProtectedRoute>} />
                <Route path="/ai" element={<ProtectedRoute><AISuiteView /></ProtectedRoute>} />
                <Route path="/medical-timeline" element={<ProtectedRoute><MedicalRecordsView /></ProtectedRoute>} />
                <Route path="/records" element={<ProtectedRoute><MedicalRecordsView /></ProtectedRoute>} />
                <Route path="/medical-records" element={<ProtectedRoute><MedicalRecordsView /></ProtectedRoute>} />

                {/* 404 Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </DashboardPreferenceProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
