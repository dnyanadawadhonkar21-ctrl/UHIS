import React from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, AlertCircle } from "lucide-react";
import Button from "../components/ui/Button";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-surface)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        padding: "2rem",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "3rem" }}>
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: "var(--color-accent-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HeartPulse size={15} color="white" />
        </div>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            letterSpacing: "-0.02em",
            color: "var(--color-ink)",
          }}
        >
          UHIS
        </span>
      </div>

      {/* Card */}
      <div
        style={{
          background: "var(--color-panel)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "3rem",
          textAlign: "center",
          maxWidth: "440px",
          width: "100%",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "var(--color-signal-critical-bg)",
            border: "1px solid var(--color-signal-critical-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
          }}
        >
          <AlertCircle size={24} style={{ color: "var(--color-signal-critical)" }} />
        </div>

        <div
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: "4.5rem",
            color: "var(--color-ink)",
            letterSpacing: "-0.05em",
            lineHeight: 1,
            marginBottom: "0.5rem",
          }}
        >
          404
        </div>

        <div
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 600,
            fontSize: "1.1rem",
            color: "var(--color-ink)",
            marginBottom: "0.75rem",
          }}
        >
          Page not found
        </div>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.875rem",
            color: "var(--color-ink-secondary)",
            lineHeight: 1.7,
            marginBottom: "2rem",
          }}
        >
          The requested page does not exist or you do not have permission to access this resource.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            ← Go Back
          </Button>
          <Button onClick={() => navigate("/")}>
            Return Home
          </Button>
        </div>
      </div>

      {/* Error meta */}
      <div
        style={{
          marginTop: "1.5rem",
          display: "flex",
          gap: "1.5rem",
          padding: "0.6rem 1.25rem",
          background: "var(--color-panel)",
          border: "1px solid var(--color-border)",
          borderRadius: "8px",
        }}
      >
        {[
          { l: "Error Code", v: "HTTP 404" },
          { l: "Timestamp", v: new Date().toISOString().slice(0, 19).replace("T", " ") },
        ].map(({ l, v }) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div className="type-label" style={{ marginBottom: "0.15rem" }}>{l}</div>
            <div className="type-id" style={{ color: "var(--color-ink)", fontWeight: 500 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
