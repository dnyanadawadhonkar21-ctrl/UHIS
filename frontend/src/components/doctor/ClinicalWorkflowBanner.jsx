import React, { useState } from "react";
import { Info, ChevronDown, ChevronUp, Shield, ArrowRight } from "lucide-react";

export default function ClinicalWorkflowBanner() {
  const [showDetails, setShowDetails] = useState(false);

  const steps = [
    { label: "1. Waiting", tip: "In Queue" },
    { label: "2. Called", tip: "To Chamber" },
    { label: "3. In Chamber", tip: "Patient Present" },
    { label: "4. OTP Consent", tip: "Auth Required" },
    { label: "5. Temp Access", tip: "EHR Unlocked" },
    { label: "6. Consultation", tip: "Rx & Notes" },
    { label: "7. Completed", tip: "Session Closed" },
  ];

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        padding: "0.75rem 1rem",
        marginBottom: "1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Shield size={14} style={{ color: "var(--color-accent-primary)" }} />
          <span className="type-label" style={{ color: "var(--color-ink)", fontWeight: 700 }}>
            ABDM CLINICAL WORKFLOW & ACCESS PROTOCOL:
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            color: "var(--color-accent-primary)",
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: 0,
          }}
        >
          {showDetails ? "Hide Workflow Stages" : "View Workflow Stages"}
          {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          marginTop: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        {steps.map((s, idx) => (
          <React.Fragment key={s.label}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "var(--color-panel)",
                border: "1px solid var(--color-border)",
                borderRadius: "4px",
                padding: "0.2rem 0.45rem",
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "var(--color-ink-secondary)",
              }}
            >
              <span>{s.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <span style={{ color: "var(--color-ink-muted)", fontSize: "0.7rem" }}>→</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {showDetails && (
        <div
          style={{
            marginTop: "0.75rem",
            paddingTop: "0.75rem",
            borderTop: "1px solid var(--color-border)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.6rem",
            fontSize: "0.75rem",
            color: "var(--color-ink-secondary)",
          }}
        >
          <div>
            <strong style={{ color: "var(--color-ink)" }}>Waiting → Called:</strong>
            <p style={{ margin: "2px 0 0" }}>Patient is called to the consultation chamber via OPD token announcement.</p>
          </div>
          <div>
            <strong style={{ color: "var(--color-ink)" }}>In Chamber → OTP:</strong>
            <p style={{ margin: "2px 0 0" }}>Patient identity confirmed. Doctor requests temporary access OTP on patient mobile.</p>
          </div>
          <div>
            <strong style={{ color: "var(--color-ink)" }}>Temp Access → Consult:</strong>
            <p style={{ margin: "2px 0 0" }}>EHR history, labs, and vitals unlocked for the duration of the clinical encounter.</p>
          </div>
          <div>
            <strong style={{ color: "var(--color-ink)" }}>Completed:</strong>
            <p style={{ margin: "2px 0 0" }}>Prescription signed, summary saved, and temporary record access expires safely.</p>
          </div>
        </div>
      )}
    </div>
  );
}
