import React from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, Shield, Brain, Link2, ArrowRight, CheckCircle } from "lucide-react";
import Button from "../components/ui/Button";

const METRICS = [
  { label: "Patient Records", value: "10.2M+", sub: "Unified across facilities" },
  { label: "Connected Hospitals", value: "847", sub: "Onboarded to national grid" },
  { label: "System Uptime", value: "99.97%", sub: "Last 90 days" },
  { label: "Daily Transactions", value: "3.1M", sub: "API calls processed" },
];

const FEATURES = [
  {
    icon: Link2,
    title: "Longitudinal Health Record",
    desc: "One unified record spanning all facilities — visits, labs, prescriptions, and immunisations — accessible anywhere on the national health grid.",
  },
  {
    icon: Shield,
    title: "ABHA Universal Identity",
    desc: "Ayushman Bharat Digital Mission compliant. A single 14-digit health ID links every interaction across public and private providers.",
  },
  {
    icon: Brain,
    title: "Clinical AI Intelligence",
    desc: "Symptom triage, drug interaction checking, lab result explainer, and OCR-based digitisation of physical medical records.",
  },
  {
    icon: HeartPulse,
    title: "End-to-End Encrypted",
    desc: "AES-256 at rest, TLS 1.3 in transit. Role-based access control enforced at every API boundary with full audit logs.",
  },
];

const PORTALS = [
  { code: "PT", role: "Patient", path: "/login", desc: "View records, book appointments, track medications.", color: "#16A34A" },
  { code: "DR", role: "Clinician", path: "/login", desc: "OPD queue management, EHR access, prescription builder.", color: "#2563EB" },
  { code: "HA", role: "Hospital Admin", path: "/login", desc: "Bed management, staff rostering, occupancy metrics.", color: "#D97706" },
  { code: "DL", role: "Diagnostic Lab", path: "/login", desc: "Order management, result upload, report dispatch.", color: "#0EA5E9" },
  { code: "PH", role: "Pharmacy", path: "/login", desc: "Prescription verification, dispensation, stock control.", color: "#DC2626" },
  { code: "RC", role: "Reception", path: "/login", desc: "Walk-in registration, token generation, slot assignment.", color: "#7C3AED" },
];

const TRUST = [
  "ABDM Certified · v2.1",
  "IT Act 2000 Compliant",
  "AES-256 Encryption",
  "99.97% Uptime SLA",
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
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
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
          padding: "5rem 2rem 4rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle at 70% 40%, rgba(37,99,235,0.15) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(22, 163, 74, 0.15)",
              border: "1px solid rgba(22,163,74,0.3)",
              borderRadius: "99px",
              padding: "0.35rem 0.875rem",
              marginBottom: "1.75rem",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "99px", background: "#16A34A", flexShrink: 0 }} />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#4ADE80",
                letterSpacing: "0.04em",
              }}
            >
              SYSTEM OPERATIONAL · ABDM Compliant
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4rem",
              alignItems: "center",
            }}
            className="hero-grid"
          >
            <div>
              <h1
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(2rem, 4vw, 3.25rem)",
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
                  fontSize: "1.05rem",
                  color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.7,
                  maxWidth: "440px",
                  marginBottom: "2.5rem",
                }}
              >
                A mission-critical, multi-role EMR connecting patients, clinicians,
                labs, pharmacies, and hospital administrators on a single verified national health grid.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
                <Button size="lg" onClick={() => navigate("/login")}>
                  Access Portal <ArrowRight size={16} />
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  style={{ background: "transparent", borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)" }}
                  onClick={() => navigate("/register")}
                >
                  Register with ABHA
                </Button>
              </div>
              <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                {TRUST.map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <CheckCircle size={12} style={{ color: "#4ADE80", flexShrink: 0 }} />
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.75rem",
                        color: "rgba(255,255,255,0.5)",
                        fontWeight: 500,
                      }}
                    >
                      {t}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics card */}
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                padding: "2rem",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  marginBottom: "1.5rem",
                }}
              >
                Live System Overview
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                {METRICS.map((m) => (
                  <div key={m.label}>
                    <div
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: "2rem",
                        color: "white",
                        letterSpacing: "-0.03em",
                        lineHeight: 1,
                        marginBottom: "0.25rem",
                      }}
                    >
                      {m.value}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.7)",
                        marginBottom: "0.1rem",
                      }}
                    >
                      {m.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.7rem",
                        color: "rgba(255,255,255,0.35)",
                      }}
                    >
                      {m.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "4rem 2rem", background: "var(--color-panel)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="type-label" style={{ color: "var(--color-accent-primary)", marginBottom: "0.75rem" }}>
              PLATFORM CAPABILITIES
            </div>
            <h2
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: "2rem",
                letterSpacing: "-0.03em",
                color: "var(--color-ink)",
              }}
            >
              Built for India's Healthcare
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "var(--color-signal-info-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <Icon size={20} style={{ color: "var(--color-accent-primary)" }} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      color: "var(--color-ink)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {f.title}
                  </h3>
                  <p className="type-body" style={{ lineHeight: 1.65, fontSize: "0.85rem" }}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Portals */}
      <section style={{ padding: "4rem 2rem", background: "var(--color-surface)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="type-label" style={{ color: "var(--color-accent-primary)", marginBottom: "0.75rem" }}>
              ACCESS PORTALS
            </div>
            <h2
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: "2rem",
                letterSpacing: "-0.03em",
                color: "var(--color-ink)",
              }}
            >
              Select Your Role
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "1rem",
            }}
          >
            {PORTALS.map((p) => (
              <div
                key={p.code}
                onClick={() => navigate(p.path)}
                style={{
                  background: "var(--color-panel)",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  cursor: "pointer",
                  transition: "box-shadow 150ms ease, border-color 150ms ease, transform 150ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
                  e.currentTarget.style.borderColor = p.color;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: p.color + "15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      color: p.color,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {p.code}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    color: "var(--color-ink)",
                    marginBottom: "0.4rem",
                  }}
                >
                  {p.role}
                </h3>
                <p className="type-body" style={{ fontSize: "0.8rem", lineHeight: 1.6, marginBottom: "1rem" }}>
                  {p.desc}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: p.color }}>Access Portal</span>
                  <ArrowRight size={12} style={{ color: p.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          background: "var(--color-chassis)",
          padding: "1.75rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
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
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
        }
      `}</style>
    </div>
  );
}
