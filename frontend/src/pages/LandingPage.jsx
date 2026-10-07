import React from "react";
import { useNavigate } from "react-router-dom";
import {
  HeartPulse,
  Shield,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
  UserCheck,
  FileText,
  Stethoscope,
  Lock,
  Database,
  ArrowDown,
  Pill,
  ClipboardList
} from "lucide-react";
import Button from "../components/ui/Button";

const CORE_FEATURES = [
  {
    icon: Database,
    title: "Unified Health Records",
    desc: "Keep important medical information organized in one secure digital health record.",
    badge: "Consolidated Data",
  },
  {
    icon: Stethoscope,
    title: "Secure Doctor Access",
    desc: "Allow authorized healthcare professionals to access relevant records when needed.",
    badge: "Clinical Portals",
  },
  {
    icon: Lock,
    title: "Patient-Controlled Sharing",
    desc: "Patients control when and how their medical information is shared.",
    badge: "Consent Framework",
  },
  {
    icon: ClipboardList,
    title: "Digital Medical Records",
    desc: "Store prescriptions, reports, diagnoses, and other important medical information digitally.",
    badge: "Longitudinal EHR",
  },
];

const TRUST_PILLARS = [
  "ABHA Universal Identity",
  "Role-Based Access Control",
  "AES-256 Data Encryption",
  "Patient Consent Manager",
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-surface)", fontFamily: "'Inter', sans-serif" }}>
      {/* Nav */}
      <nav
        style={{
          background: "var(--color-panel)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 2rem",
          height: "60px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--color-accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HeartPulse size={17} color="white" />
          </div>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              letterSpacing: "-0.02em",
              color: "var(--color-ink)",
            }}
          >
            UHIS
          </span>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.7rem",
              color: "var(--color-ink-muted)",
              marginLeft: "0.25rem",
            }}
          >
            National Health Interface
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Button variant="secondary" size="sm" onClick={() => navigate("/login")}>
            Sign In
          </Button>
          <Button size="sm" onClick={() => navigate("/register")}>
            Register
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(135deg, #1E293B 0%, #1E3A5F 50%, #1E293B 100%)",
          padding: "4.5rem 2rem 4rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle at 70% 40%, rgba(37,99,235,0.18) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: "1120px", margin: "0 auto", position: "relative" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(37, 99, 235, 0.2)",
              border: "1px solid rgba(96, 165, 250, 0.3)",
              borderRadius: "99px",
              padding: "0.35rem 0.875rem",
              marginBottom: "1.75rem",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "99px", background: "#60A5FA", flexShrink: 0 }} />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#93C5FD",
                letterSpacing: "0.04em",
              }}
            >
              SECURE HEALTHCARE INFRASTRUCTURE
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr",
              gap: "3.5rem",
              alignItems: "center",
            }}
            className="hero-grid"
          >
            <div>
              <h1
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(2rem, 3.8vw, 3.25rem)",
                  color: "white",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                  marginBottom: "1.5rem",
                }}
              >
                India's Unified
                <br />
                <span style={{ color: "#60A5FA" }}>Electronic Health</span>
                <br />
                Record Platform
              </h1>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "1.025rem",
                  color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.7,
                  maxWidth: "460px",
                  marginBottom: "2.25rem",
                }}
              >
                A mission-critical, multi-role EMR connecting patients, clinicians,
                labs, pharmacies, and hospital administrators on a single verified national health grid.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2.25rem" }}>
                <Button size="lg" onClick={() => navigate("/login")}>
                  Access Portal <ArrowRight size={16} />
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  style={{ background: "transparent", borderColor: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.9)" }}
                  onClick={() => navigate("/register")}
                >
                  Register with ABHA
                </Button>
              </div>
              <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                {TRUST_PILLARS.map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <CheckCircle size={13} style={{ color: "#4ADE80", flexShrink: 0 }} />
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.75rem",
                        color: "rgba(255,255,255,0.65)",
                        fontWeight: 500,
                      }}
                    >
                      {t}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* UHIS IN ACTION / Unified Health Record Card */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.65)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "16px",
                padding: "1.75rem",
                backdropFilter: "blur(12px)",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "#60A5FA",
                      textTransform: "uppercase",
                      marginBottom: "0.15rem",
                    }}
                  >
                    UHIS IN ACTION
                  </div>
                  <div
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      color: "white",
                    }}
                  >
                    Unified Health Flow
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    padding: "0.2rem 0.55rem",
                    borderRadius: "99px",
                    background: "rgba(34, 197, 94, 0.15)",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                    color: "#4ADE80",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <ShieldCheck size={11} /> End-to-End
                </span>
              </div>

              {/* Visual Flow Nodes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {/* Step 1: Patient Health ID */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    padding: "0.75rem 0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "rgba(37, 99, 235, 0.25)",
                      border: "1px solid rgba(96, 165, 250, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <UserCheck size={16} color="#93C5FD" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, color: "white" }}>
                      Patient Health ID (ABHA)
                    </div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.55)" }}>
                      Unique digital health identity for cross-provider care
                    </div>
                  </div>
                </div>

                {/* Connector Arrow 1 */}
                <div style={{ display: "flex", justifyContent: "center", margin: "-0.2rem 0" }}>
                  <ArrowDown size={14} style={{ color: "rgba(147, 197, 253, 0.6)" }} />
                </div>

                {/* Step 2: Unified Medical Records */}
                <div
                  style={{
                    background: "rgba(37, 99, 235, 0.12)",
                    border: "1px solid rgba(96, 165, 250, 0.25)",
                    borderRadius: "10px",
                    padding: "0.75rem 0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "rgba(37, 99, 235, 0.35)",
                      border: "1px solid rgba(96, 165, 250, 0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={16} color="#60A5FA" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, color: "white" }}>
                      Unified Medical Records
                    </div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.6)" }}>
                      Centralized timeline of visits, labs, medications & alerts
                    </div>
                  </div>
                </div>

                {/* Connector Arrow 2 */}
                <div style={{ display: "flex", justifyContent: "center", margin: "-0.2rem 0" }}>
                  <ArrowDown size={14} style={{ color: "rgba(147, 197, 253, 0.6)" }} />
                </div>

                {/* Step 3: Secure Doctor Access */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    padding: "0.75rem 0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "rgba(22, 163, 74, 0.25)",
                      border: "1px solid rgba(74, 222, 128, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Stethoscope size={16} color="#86EFAC" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, color: "white" }}>
                      Secure Doctor Access
                    </div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.55)" }}>
                      Role-authorized clinician access with patient-controlled consent
                    </div>
                  </div>
                </div>
              </div>

              {/* Supporting Items Grid */}
              <div
                style={{
                  marginTop: "1.25rem",
                  paddingTop: "1.1rem",
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.6rem 0.75rem",
                }}
              >
                {[
                  "Medical History",
                  "Prescriptions",
                  "Lab & Diagnostic Reports",
                  "Patient-controlled access",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <CheckCircle size={12} style={{ color: "#60A5FA", flexShrink: 0 }} />
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.72rem",
                        color: "rgba(255, 255, 255, 0.75)",
                        fontWeight: 500,
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section: One Health Record. Wherever You Need It. */}
      <section style={{ padding: "5rem 2rem", background: "var(--color-surface)" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div
              className="type-label"
              style={{
                color: "var(--color-accent-primary)",
                marginBottom: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
              }}
            >
              UNIFIED HEALTH ARCHITECTURE
            </div>
            <h2
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(1.75rem, 2.5vw, 2.25rem)",
                letterSpacing: "-0.03em",
                color: "var(--color-ink)",
                marginBottom: "0.75rem",
              }}
            >
              One Health Record. Wherever You Need It.
            </h2>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.95rem",
                color: "var(--color-ink-secondary)",
                maxWidth: "600px",
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              A seamless, secure digital ecosystem connecting care providers while keeping patients in complete control of their data.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {CORE_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  style={{
                    background: "var(--color-panel)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "14px",
                    padding: "1.75rem 1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    transition: "border-color 150ms ease, box-shadow 150ms ease",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "var(--color-signal-info-bg)",
                      border: "1px solid var(--color-signal-info-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <Icon size={20} style={{ color: "var(--color-accent-primary)" }} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 600,
                      fontSize: "1.05rem",
                      color: "var(--color-ink)",
                      marginBottom: "0.6rem",
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="type-body"
                    style={{
                      lineHeight: 1.65,
                      fontSize: "0.875rem",
                      color: "var(--color-ink-secondary)",
                      flex: 1,
                    }}
                  >
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: "0 2rem 5rem", background: "var(--color-surface)" }}>
        <div
          style={{
            maxWidth: "1120px",
            margin: "0 auto",
            background: "var(--color-chassis)",
            borderRadius: "16px",
            padding: "3rem 2.5rem",
            border: "1px solid var(--color-border-chassis)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "2rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: "560px" }}>
            <h3
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: "1.5rem",
                color: "white",
                letterSpacing: "-0.02em",
                marginBottom: "0.5rem",
              }}
            >
              Experience Unified Digital Healthcare
            </h3>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.6,
              }}
            >
              Sign in to access clinical workflows and patient timelines, or register with your ABHA ID to create your unified health profile.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Button size="md" onClick={() => navigate("/login")}>
              Access Portal <ArrowRight size={15} />
            </Button>
            <Button
              variant="secondary"
              size="md"
              style={{ background: "transparent", borderColor: "rgba(255,255,255,0.25)", color: "white" }}
              onClick={() => navigate("/register")}
            >
              Register with ABHA
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          background: "var(--color-chassis-mid)",
          padding: "1.75rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HeartPulse size={12} color="rgba(255,255,255,0.6)" />
          </div>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            UHIS · © 2026 Unified Health Interface System
          </span>
        </div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {["Privacy Policy", "Data Governance", "Grievance Redressal", "Emergency: 104"].map((l) => (
            <span
              key={l}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.35)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
            >
              {l}
            </span>
          ))}
        </div>
      </footer>

      <style>{`
        @media (max-width: 868px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
        }
      `}</style>
    </div>
  );
}
