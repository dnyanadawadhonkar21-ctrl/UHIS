import { useNavigate } from "react-router-dom";
import { Activity, ChevronRight } from "lucide-react";
import { useAuth, UserRole } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import AppLayout from "../components/layout/AppLayout";

const PORTALS = [
  { code: "PT", role: "patient" as UserRole, title: "Patient Portal", path: "/patient",
    desc: "Longitudinal health records, appointments, medications, lab results.", signal: "normal" },
  { code: "DR", role: "doctor" as UserRole, title: "Clinician OPD", path: "/doctor",
    desc: "Patient queue, EHR access, clinical notes, prescription builder.", signal: "info" },
  { code: "HA", role: "admin" as UserRole, title: "Hospital Admin", path: "/hospital",
    desc: "Bed management, staff rostering, departmental metrics.", signal: "warning" },
  { code: "SA", role: "superadmin" as UserRole, title: "System Administrator", path: "/superadmin",
    desc: "National grid governance, hospital onboarding, security audit.", signal: "critical" },
  { code: "DL", role: "lab" as UserRole, title: "Diagnostic Lab", path: "/lab",
    desc: "Test order queue, sample collection, result upload, dispatch.", signal: "purple" },
  { code: "PH", role: "pharmacy" as UserRole, title: "Pharmacy Dispense", path: "/pharmacy",
    desc: "Prescription verification, dispensation, inventory management.", signal: "normal" },
  { code: "RC", role: "receptionist" as UserRole, title: "Reception / OPD Desk", path: "/reception",
    desc: "Walk-in registration, token generation, doctor slot assignment.", signal: "info" },
];

export default function DashboardSelectionPage() {
  const navigate = useNavigate();
  const { user, demoLogin } = useAuth();
  const { toast } = useToast();

  const handleSelect = (portal: typeof PORTALS[0]) => {
    if (user?.role !== portal.role) {
      demoLogin(portal.role);
      toast.info(`Switched to ${portal.title} role.`);
    }
    navigate(portal.path);
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.5rem" }}>
            PORTAL SELECTION
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 400,
                fontSize: "1.75rem",
                color: "var(--color-ink-secondary)",
                letterSpacing: "-0.02em",
              }}
            >
              Welcome back,
            </span>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: "1.75rem",
                color: "var(--color-ink)",
                letterSpacing: "-0.025em",
              }}
            >
              {user?.name || "User"}
            </span>
          </div>
          <div className="type-body" style={{ color: "var(--color-ink-secondary)" }}>
            Select a portal to enter. Role access is determined by your registration credentials.
          </div>
        </div>

        {/* System status strip */}
        <div
          style={{
            background: "var(--color-panel)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            display: "flex",
            gap: "1.5rem",
            padding: "0.6rem 1rem",
            marginBottom: "1.75rem",
            overflowX: "auto",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--color-signal-normal)", display: "inline-block", flexShrink: 0 }} />
            <span className="type-label" style={{ color: "var(--color-signal-normal)", fontWeight: 600 }}>GRID OPERATIONAL</span>
          </div>
          {[
            { l: "SESSION", v: user?.id || "—" },
            { l: "ROLE", v: (user?.role || "—").toUpperCase() },
            { l: "FACILITY", v: user?.facility || "—" },
          ].map(({ l, v }) => (
            <div key={l} style={{ display: "flex", gap: "0.4rem", whiteSpace: "nowrap", alignItems: "center" }}>
              <span className="type-label">{l}</span>
              <span className="type-micro" style={{ color: "var(--color-ink)", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Portal grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0" }}>
          {PORTALS.map((p, i) => (
            <div
              key={p.code}
              onClick={() => handleSelect(p)}
              className={`instrument-panel channel-${p.signal}`}
              style={{
                cursor: "pointer",
                marginBottom: "1px",
                marginRight: "1px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-panel)")}
            >
              <div style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: "1.25rem",
                      color: `var(--color-signal-${p.signal === "purple" ? "purple" : p.signal})`,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {p.code}
                  </span>
                  {user?.role === p.role && (
                    <span className="status-normal">ACTIVE</span>
                  )}
                </div>
                <div className="type-value" style={{ color: "var(--color-ink)", marginBottom: "0.4rem", fontSize: "0.9rem" }}>
                  {p.title}
                </div>
                <p className="type-micro" style={{ color: "var(--color-ink-secondary)", lineHeight: 1.65, marginBottom: "0.75rem" }}>
                  {p.desc}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <span className="type-label" style={{ color: `var(--color-signal-${p.signal})`, fontWeight: 600 }}>ENTER</span>
                  <ChevronRight size={10} style={{ color: `var(--color-signal-${p.signal})` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
