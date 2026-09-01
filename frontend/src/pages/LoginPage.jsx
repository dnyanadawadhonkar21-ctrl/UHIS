import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, Eye, EyeOff, ArrowRight, Shield, Clock, Activity } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Button from "../components/ui/Button";
import PrecisionInput from "../components/ui/PrecisionInput";

const ROLES = [
  { id: "patient", label: "Patient", color: "#16A34A" },
  { id: "doctor", label: "Clinician", color: "#2563EB" },
  { id: "admin", label: "Hospital Admin", color: "#D97706" },
  { id: "superadmin", label: "System Admin", color: "#7C3AED" },
  { id: "lab", label: "Diagnostic Lab", color: "#0EA5E9" },
  { id: "pharmacy", label: "Pharmacy", color: "#DC2626" },
  { id: "receptionist", label: "Reception", color: "#0F766E" },
];

const ROLE_DASHBOARDS = {
  patient: "/patient",
  doctor: "/doctor",
  admin: "/hospital",
  superadmin: "/superadmin",
  lab: "/lab",
  pharmacy: "/pharmacy",
  receptionist: "/reception",
};

const SECURITY_INFO = [
  { icon: Shield, label: "AES-256 + TLS 1.3 encryption" },
  { icon: Clock, label: "30 min session timeout" },
  { icon: Activity, label: "Full audit logging" },
];

const DEMO_CREDENTIALS = {
  patient: { email: "patient@uhis.gov.in", password: "password123" },
  doctor: { email: "doctor@uhis.gov.in", password: "password123" },
  admin: { email: "hospital@uhis.gov.in", password: "password123" },
  superadmin: { email: "admin@uhis.gov.in", password: "password123" },
  lab: { email: "lab@uhis.gov.in", password: "password123" },
  pharmacy: { email: "pharmacy@uhis.gov.in", password: "password123" },
  receptionist: { email: "receptionist@uhis.gov.in", password: "password123" },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();
  const toast = useToast();
  const [role, setRole] = useState("patient");
  const [email, setEmail] = useState("patient@uhis.gov.in");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (roleId) => {
    setRole(roleId);
    if (DEMO_CREDENTIALS[roleId]) {
      setEmail(DEMO_CREDENTIALS[roleId].email);
      setPassword(DEMO_CREDENTIALS[roleId].password);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password required.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password, role);
      toast.success("Welcome to UHIS.");
      navigate(ROLE_DASHBOARDS[role] || "/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Authentication failed. Check your credentials.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (r) => {
    await demoLogin(r);
    toast.success(`Demo session — ${ROLES.find((x) => x.id === r)?.label} portal.`);
    navigate(ROLE_DASHBOARDS[r] || "/dashboard");
  };

  const selectedRole = ROLES.find((r) => r.id === role);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        fontFamily: "'Inter', sans-serif",
      }}
      className="login-grid"
    >
      {/* Left — blue identity panel */}
      <div
        style={{
          background: "linear-gradient(160deg, #1E3A5F 0%, #1E293B 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "2.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle at 20% 80%, rgba(37,99,235,0.2) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", position: "relative" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "9px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HeartPulse size={18} color="white" />
          </div>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "white",
              letterSpacing: "-0.02em",
            }}
          >
            UHIS
          </span>
        </div>

        <div style={{ position: "relative" }}>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: "2.5rem",
              color: "white",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              marginBottom: "1rem",
            }}
          >
            Secure
            <br />
            Portal Access
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.7,
              maxWidth: "340px",
              marginBottom: "2.5rem",
            }}
          >
            UHIS provides role-separated access to a unified national health record system.
            Authenticate with your credentials or ABHA ID.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {SECURITY_INFO.map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "7px",
                    background: "rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={13} color="rgba(255,255,255,0.6)" />
                </div>
                <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", position: "relative" }}>
          ABDM Compliant · IT Act 2000 · National Health Authority © 2026
        </div>
      </div>

      {/* Right — form */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "2.5rem",
          background: "var(--color-surface)",
        }}
      >
        <div style={{ maxWidth: "400px", width: "100%", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: "1.5rem",
              letterSpacing: "-0.025em",
              color: "var(--color-ink)",
              marginBottom: "0.375rem",
            }}
          >
            Sign in to your portal
          </h2>
          <p className="type-body" style={{ marginBottom: "1.75rem" }}>
            Select your role and enter your credentials.
          </p>

          <div className="type-label" style={{ marginBottom: "0.625rem" }}>Your Role</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleSelect(r.id)}
                style={{
                  padding: "0.4rem 0.875rem",
                  borderRadius: "99px",
                  border: `1.5px solid ${role === r.id ? r.color : "var(--color-border-deep)"}`,
                  background: role === r.id ? r.color + "15" : "var(--color-panel)",
                  color: role === r.id ? r.color : "var(--color-ink-secondary)",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.8rem",
                  fontWeight: role === r.id ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {selectedRole && (
            <div
              style={{
                background: "var(--color-panel)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                padding: "0.625rem 1rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ width: "7px", height: "7px", borderRadius: "99px", background: selectedRole.color, flexShrink: 0 }} />
              <span className="type-label">Signing in as</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", fontWeight: 600, color: selectedRole.color }}>
                {selectedRole.label}
              </span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <PrecisionInput
              label="Email / ABHA ID"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label className="type-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="precision-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-ink-muted)",
                    padding: 0,
                    display: "flex",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} style={{ marginTop: "0.5rem", width: "100%", justifyContent: "center" }}>
              {loading ? "Authenticating..." : <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>Authenticate <ArrowRight size={16} /></span>}
            </Button>
          </form>

          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)" }}>
            <div className="type-label" style={{ marginBottom: "0.75rem" }}>1-Click Demo Access</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleDemo(r.id)}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    background: "var(--color-panel)",
                    border: "1.5px solid var(--color-border)",
                    borderRadius: "6px",
                    padding: "0.3rem 0.65rem",
                    cursor: "pointer",
                    color: "var(--color-ink-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    transition: "all 120ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = r.color;
                    e.currentTarget.style.color = r.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.color = "var(--color-ink-secondary)";
                  }}
                >
                  <ArrowRight size={10} />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <span className="type-micro">No account? </span>
            <button
              type="button"
              onClick={() => navigate("/register")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--color-accent-primary)",
                textDecoration: "underline",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Register with ABHA ID
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-grid { grid-template-columns: 1fr !important; }
          .login-grid > div:first-child { display: none !important; }
        }
      `}</style>
    </div>
  );
}
