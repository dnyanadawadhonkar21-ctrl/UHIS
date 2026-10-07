import React from "react";
import { Stethoscope, CheckCircle2, ArrowRight, ShieldCheck, Clock, AlertCircle } from "lucide-react";
import Button from "../ui/Button";
import StatusCode from "../ui/StatusCode";

export default function CurrentConsultationCard({
  activePatient,
  onOpenConsultation,
  onCompleteConsultation,
}) {
  if (!activePatient) {
    return (
      <div
        style={{
          background: "var(--color-panel)",
          border: "1px dashed var(--color-border-deep)",
          borderRadius: "10px",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "var(--color-surface-alt)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-ink-muted)",
            }}
          >
            <Stethoscope size={20} />
          </div>
          <div>
            <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.15rem" }}>
              CURRENT CONSULTATION
            </div>
            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--color-ink-secondary)" }}>
              No patient currently in consultation chamber
            </div>
          </div>
        </div>
        <div className="type-micro" style={{ color: "var(--color-ink-muted)" }}>
          Call the next waiting patient from the queue below to begin
        </div>
      </div>
    );
  }

  const isEmergency = activePatient.priority === "emergency";
  const isUrgent = activePatient.priority === "urgent";

  return (
    <div
      style={{
        background: "var(--color-panel)",
        border: "1.5px solid var(--color-signal-info-border)",
        borderTop: "3px solid var(--color-signal-info)",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(37, 99, 235, 0.08)",
        padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "0.85rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "var(--color-signal-info-bg)",
              color: "var(--color-accent-primary)",
              padding: "0.2rem 0.6rem",
              borderRadius: "99px",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--color-accent-primary)",
                display: "inline-block",
                animation: "pulse 1.5s infinite",
              }}
            />
            CURRENT CONSULTATION · ACTIVE SESSION
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.7rem",
              color: "var(--color-signal-normal)",
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={13} /> Temporary Access Active
          </span>
        </div>

        <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>
          Chamber 03 · Session Token #ABDM-{activePatient.token.replace("-", "")}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: "1.25rem",
          alignItems: "center",
        }}
        className="current-consult-grid"
      >
        {/* Token Badge */}
        <div
          style={{
            background: "var(--color-ink)",
            color: "#ffffff",
            padding: "0.65rem 1rem",
            borderRadius: "8px",
            textAlign: "center",
            minWidth: "80px",
          }}
        >
          <div className="type-micro" style={{ color: "var(--color-ink-chassis)", fontSize: "0.65rem", fontWeight: 600 }}>
            TOKEN
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "1.4rem",
              fontWeight: 800,
              letterSpacing: "0.05em",
              lineHeight: 1.1,
            }}
          >
            {activePatient.token}
          </div>
        </div>

        {/* Patient Details */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
            <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-ink)" }}>
              {activePatient.patientName || activePatient.name}
            </span>
            <span className="type-id" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
              {activePatient.age}Y · {activePatient.gender}
            </span>
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                padding: "0.15rem 0.5rem",
                borderRadius: "99px",
                textTransform: "uppercase",
                background: isEmergency
                  ? "var(--color-signal-critical-bg)"
                  : isUrgent
                  ? "var(--color-signal-warning-bg)"
                  : "var(--color-surface-alt)",
                color: isEmergency
                  ? "var(--color-signal-critical)"
                  : isUrgent
                  ? "var(--color-signal-warning)"
                  : "var(--color-ink-secondary)",
                border: `1px solid ${
                  isEmergency
                    ? "var(--color-signal-critical-border)"
                    : isUrgent
                    ? "var(--color-signal-warning-border)"
                    : "var(--color-border)"
                }`,
              }}
            >
              {activePatient.priority || "ROUTINE"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
            <span className="type-label" style={{ color: "var(--color-ink-secondary)", fontSize: "0.7rem", whiteSpace: "nowrap" }}>
              Complaint:
            </span>
            <span className="type-body" style={{ color: "var(--color-ink)", fontSize: "0.85rem", fontWeight: 500 }}>
              {activePatient.chiefComplaint || activePatient.complaint}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
          <Button
            onClick={() => onOpenConsultation && onOpenConsultation(activePatient)}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Stethoscope size={14} /> OPEN CONSULTATION WORKSPACE
          </Button>
          <Button
            variant="secondary"
            onClick={() => onCompleteConsultation && onCompleteConsultation(activePatient)}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <CheckCircle2 size={14} /> COMPLETE
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @media (max-width: 800px) {
          .current-consult-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
