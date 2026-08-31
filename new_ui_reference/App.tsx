import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardSelectionPage from "./pages/DashboardSelectionPage";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import HospitalAdminDashboard from "./pages/HospitalAdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import LabDashboard from "./pages/LabDashboard";
import PharmacyDashboard from "./pages/PharmacyDashboard";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import AISuitePage from "./pages/AISuitePage";
import MedicalRecordsPage from "./pages/MedicalRecordsPage";
import NotFoundPage from "./pages/NotFoundPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardSelectionPage /></ProtectedRoute>} />
      <Route path="/patient" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
      <Route path="/doctor" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/hospital" element={<ProtectedRoute><HospitalAdminDashboard /></ProtectedRoute>} />
      <Route path="/superadmin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
      <Route path="/lab" element={<ProtectedRoute><LabDashboard /></ProtectedRoute>} />
      <Route path="/pharmacy" element={<ProtectedRoute><PharmacyDashboard /></ProtectedRoute>} />
      <Route path="/reception" element={<ProtectedRoute><ReceptionistDashboard /></ProtectedRoute>} />
      <Route path="/ai-suite" element={<ProtectedRoute><AISuitePage /></ProtectedRoute>} />
      <Route path="/records" element={<ProtectedRoute><MedicalRecordsPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
