import React, { createContext, useContext, useState } from "react";

export type UserRole = "patient" | "doctor" | "admin" | "lab" | "pharmacy" | "receptionist" | "superadmin";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  abhaId?: string;
  avatar?: string;
  facility?: string;
  specialization?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  demoLogin: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const DEMO_USERS: Record<UserRole, User> = {
  patient: {
    id: "P-10042",
    name: "Rahul Verma",
    role: "patient",
    email: "rahul.verma@gmail.com",
    abhaId: "91-4782-3391-6284",
  },
  doctor: {
    id: "D-2031",
    name: "Dr. Priya Sharma",
    role: "doctor",
    email: "priya.sharma@aiims.edu",
    facility: "AIIMS New Delhi",
    specialization: "Internal Medicine",
  },
  admin: {
    id: "A-5501",
    name: "Suresh Menon",
    role: "admin",
    email: "suresh.menon@hospitaladmin.in",
    facility: "Apollo Hospitals Mumbai",
  },
  superadmin: {
    id: "SA-001",
    name: "NHA Admin",
    role: "superadmin",
    email: "admin@nha.gov.in",
  },
  lab: {
    id: "L-3302",
    name: "Meena Pathak",
    role: "lab",
    email: "meena.pathak@labcorp.in",
    facility: "LabCorp Diagnostics",
  },
  pharmacy: {
    id: "PH-4410",
    name: "Arvind Nair",
    role: "pharmacy",
    email: "arvind.nair@medpharm.in",
    facility: "MedPharm Dispensary",
  },
  receptionist: {
    id: "R-6612",
    name: "Anjali Singh",
    role: "receptionist",
    email: "anjali.singh@hospital.in",
    facility: "Fortis Hospital Delhi",
  },
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, _password: string, role: UserRole) => {
    await new Promise((r) => setTimeout(r, 600));
    setUser({ ...DEMO_USERS[role], email });
  };

  const demoLogin = (role: UserRole) => {
    setUser(DEMO_USERS[role]);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, demoLogin, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
