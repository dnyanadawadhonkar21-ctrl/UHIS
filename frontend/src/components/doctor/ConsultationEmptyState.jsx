import React from "react";
import { Stethoscope, ArrowRight, UserPlus, ShieldAlert } from "lucide-react";
import Button from "../ui/Button";

export default function ConsultationEmptyState({ onGoToQueue, reason = "none" }) {
  const isLocked = reason === "locked";

  return (
    <div
      className="instrument-panel"
      style={{
        padding: "3.5rem 2rem",
        textAlign: "center",
        maxWidth: "680px",
        margin: "1.5rem auto",
        background: "var(--color-panel)",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "12px",
          background: isLocked ? "var(--color-signal-warning-bg)" : "var(--color-signal-info-bg)",
          color: isLocked ? "var(--color-signal-warning)" : "var(--color-accent-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem",
        }}
      >
        {isLocked ? <ShieldAlert size={28} /> : <Stethoscope size={28} />}
      </div>

      <div className="type-heading" style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
        {isLocked ? "ACCESS AUTHORIZATION REQUIRED" : "NO ACTIVE CONSULTATION"}
      </div>

      <p
        className="type-body"
        style={{
          color: "var(--color-ink-secondary)",
          fontSize: "0.9rem",
          maxWidth: "480px",
          margin: "0 auto 1.75rem",
          lineHeight: 1.6,
        }}
      >
        {isLocked
          ? "This patient's medical records are currently locked. You must call the patient, confirm arrival in the chamber, and verify the consent OTP before accessing the clinical workspace."
          : "You don't currently have a patient in active consultation. Select a patient from the OPD queue to call them and initiate access authorization."}
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
        <Button
          onClick={onGoToQueue}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.65rem 1.5rem" }}
        >
          GO TO OPD QUEUE <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
}
