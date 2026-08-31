import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const DEMO_USERS = {
  patient: {
    id: "P-10042",
    name: "Rahul Verma",
    fullName: "Rahul Verma",
    email: "patient@uhis.gov.in",
    role: "patient",
    abhaId: "91-4782-3391-6284",
  },
  doctor: {
    id: "DOC-2041",
    name: "Dr. Anita Desai",
    fullName: "Dr. Anita Desai",
    email: "doctor@uhis.gov.in",
    role: "doctor",
    hospital: "AIIMS New Delhi",
    specialty: "Internal Medicine",
  },
  admin: {
    id: "HA-0012",
    name: "Dr. Sandeep Nair",
    fullName: "Dr. Sandeep Nair",
    email: "hospital@uhis.gov.in",
    role: "admin",
    hospital: "AIIMS New Delhi",
  },
  superadmin: {
    id: "SA-0001",
    name: "Vikas Aggarwal",
    fullName: "Vikas Aggarwal",
    email: "admin@uhis.gov.in",
    role: "superadmin",
    organization: "Ministry of Health & Family Welfare",
  },
  lab: {
    id: "LT-8812",
    name: "Meera Krishnan",
    fullName: "Meera Krishnan",
    email: "lab@uhis.gov.in",
    role: "lab",
    labName: "Central Pathology Lab — AIIMS",
  },
  pharmacy: {
    id: "PH-3301",
    name: "Ramesh Chand",
    fullName: "Ramesh Chand",
    email: "pharmacy@uhis.gov.in",
    role: "pharmacy",
    pharmacyName: "Main Hospital Pharmacy — Block B",
  },
  receptionist: {
    id: "REC-1104",
    name: "Pooja Sharma",
    fullName: "Pooja Sharma",
    email: "receptionist@uhis.gov.in",
    role: "receptionist",
    desk: "OPD Desk 1 · Ground Floor",
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('uhis_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('uhis_token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      fetchCurrentUser();
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      if (response.data.success) {
        const u = response.data.user;
        const normalized = {
          ...u,
          name: u.fullName || u.name,
          fullName: u.fullName || u.name,
          role: (u.role || 'patient').toLowerCase(),
        };
        setUser(normalized);
        localStorage.setItem('uhis_user', JSON.stringify(normalized));
      }
    } catch (error) {
      console.error('Failed to fetch user from backend, checking local state');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, role) => {
    try {
      const response = await api.post('/auth/login', { email, password }).catch(() => null);
      if (response && response.data && response.data.success) {
        const { token: authToken, user: userData } = response.data;
        const normalized = {
          ...userData,
          name: userData.fullName || userData.name,
          fullName: userData.fullName || userData.name,
          role: (userData.role || 'patient').toLowerCase(),
        };
        localStorage.setItem('uhis_token', authToken);
        localStorage.setItem('uhis_user', JSON.stringify(normalized));
        setToken(authToken);
        setUser(normalized);
        return normalized;
      }
    } catch (e) {
      console.warn("Backend auth failed, using demo role fallback");
    }

    // Fallback demo authentication if offline
    const matchedRole = role || Object.keys(DEMO_USERS).find((r) => DEMO_USERS[r].email === email) || "patient";
    const demoU = DEMO_USERS[matchedRole] || {
      id: "P-10042",
      name: email.split("@")[0],
      fullName: email.split("@")[0],
      email,
      role: matchedRole,
    };
    setUser(demoU);
    localStorage.setItem('uhis_user', JSON.stringify(demoU));
    localStorage.setItem('uhis_token', 'demo-jwt-token');
    return demoU;
  };

  const logout = () => {
    localStorage.removeItem('uhis_token');
    localStorage.removeItem('uhis_user');
    setToken(null);
    setUser(null);
  };

  const demoLogin = async (roleKeyOrEmail) => {
    const roleKey = Object.keys(DEMO_USERS).find(k => k === roleKeyOrEmail || DEMO_USERS[k].email === roleKeyOrEmail) || 'patient';
    const demoU = DEMO_USERS[roleKey] || DEMO_USERS.patient;
    setUser(demoU);
    localStorage.setItem('uhis_user', JSON.stringify(demoU));
    localStorage.setItem('uhis_token', 'demo-jwt-token');
    return demoU;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      demoLogin,
      fetchCurrentUser,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
