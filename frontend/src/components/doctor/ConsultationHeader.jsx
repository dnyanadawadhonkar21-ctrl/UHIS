import React from "react";
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  User,
  ArrowLeft
} from "lucide-react";
import Button from "../ui/Button";

export default function ConsultationHeader({
  patient,
  onCompleteConsultation,
  onBackToQueue,
}) {
  if (!patient) return null;

  const isEmergency = patient.priority === "emergency";
  const isUrgent = patient.priority === "urgent";

  return (
    <div
      style={{
        background: "var(--color-panel)",
        border: "1px solid var(--color-border)",
        borderTop: "3px solid var(--color-accent-primary)",
        borderRadius: "10px",
        padding: "1rem 1.25rem",
        marginBottom: "1.25rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Left: Patient Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          {/* OPD Token Box */}
          <div
            style={{
              background: "var(--color-ink)",
              color: "#ffffff",
              padding: "0.45rem 0.75rem",
              borderRadius: "8px",
              textAlign: "center",
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 800,
              fontSize: "1.15rem",
              lineHeight: 1,
              letterSpacing: "0.05em",
            }}
          >
            <div style={{ fontSize: "0.55rem", color: "var(--color-ink-chassis)", fontWeight: 600, marginBottom: "2px" }}>
              TOKEN
            </div>
            {patient.token}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-ink)" }}>
                {patient.patientName || patient.name}
              </span>
              <span className="type-id" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                {patient.age}Y · {patient.gender}
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
                {patient.priority || "ROUTINE"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
              <span className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>
                Patient ID: <strong style={{ color: "var(--color-ink)" }}>{patient.patientId || "P-10042"}</strong>
              </span>
              <span style={{ color: "var(--color-border-deep)" }}>•</span>
              <span className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>
                ABHA: <strong style={{ color: "var(--color-ink)" }}>{patient.abhaId || "91-4782-3391-6284"}</strong>
              </span>
              <span style={{ color: "var(--color-border-deep)" }}>•</span>
              <span className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>
                Complaint: <strong style={{ color: "var(--color-ink)" }}>{patient.chiefComplaint || patient.complaint}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Access Status & Consultation Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Access Status Pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--color-signal-normal-bg)",
              border: "1px solid var(--color-signal-normal-border)",
              color: "var(--color-signal-normal)",
              padding: "0.35rem 0.75rem",
              borderRadius: "99px",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={14} />
            <span>Temporary Access Active</span>
            <span style={{ opacity: 0.75, fontSize: "0.7rem", fontFamily: "var(--font-mono, monospace)" }}>
              (15m Session)
            </span>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={onBackToQueue}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <ArrowLeft size={13} /> OPD Queue
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => onCompleteConsultation && onCompleteConsultation(patient)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "var(--color-signal-normal)",
              borderColor: "var(--color-signal-normal)",
            }}
          >
            <CheckCircle2 size={14} /> Complete Consultation
          </Button>
        </div>
      </div>
    </div>
  );
}
