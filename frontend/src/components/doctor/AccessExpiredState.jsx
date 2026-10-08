import React from "react";
import { Clock, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import Button from "../ui/Button";

export default function AccessExpiredState({ onReturnToQueue, onReauthorize }) {
  return (
    <div
      className="instrument-panel"
      style={{
        padding: "3.5rem 2rem",
        textAlign: "center",
        maxWidth: "680px",
        margin: "2rem auto",
        background: "var(--color-panel)",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "12px",
          background: "var(--color-signal-critical-bg)",
          color: "var(--color-signal-critical)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem",
        }}
      >
        <Clock size={28} />
      </div>

      <div className="type-heading" style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
        PATIENT ACCESS EXPIRED
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
        Your temporary 15-minute clinical access session to this patient's medical records has expired in compliance with ABDM data privacy protocols.
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <Button
          onClick={onReturnToQueue}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}
        >
          RETURN TO OPD QUEUE <ArrowRight size={14} />
        </Button>
        {onReauthorize && (
          <Button
            variant="secondary"
            onClick={onReauthorize}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}
          >
            <RefreshCw size={14} /> Re-request Access OTP
          </Button>
        )}
      </div>
    </div>
  );
}
