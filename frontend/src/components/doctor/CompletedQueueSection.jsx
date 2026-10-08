import React, { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, FileText } from "lucide-react";
import StatusCode from "../ui/StatusCode";

export default function CompletedQueueSection({ completedPatients }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!completedPatients || completedPatients.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "10px",
        overflow: "hidden",
        marginTop: "1.5rem",
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: "0.85rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          background: "var(--color-surface-alt)",
          borderBottom: isExpanded ? "1px solid var(--color-border)" : "none",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <CheckCircle2 size={16} style={{ color: "var(--color-signal-normal)" }} />
          <span className="type-heading" style={{ fontSize: "0.9rem" }}>
            Completed Consultations Today
          </span>
          <span
            style={{
              background: "var(--color-signal-normal-bg)",
              color: "var(--color-signal-normal)",
              border: "1px solid var(--color-signal-normal-border)",
              borderRadius: "99px",
              padding: "0.1rem 0.5rem",
              fontSize: "0.7rem",
              fontWeight: 700,
            }}
          >
            {completedPatients.length} COMPLETED
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-ink-muted)" }}>
          <span className="type-micro">
            {isExpanded ? "Collapse" : "Expand"}
          </span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {isExpanded && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["TOKEN", "PATIENT", "AGE / GENDER", "CHIEF COMPLAINT", "CONSULTATION STATUS"].map((h) => (
                  <th
                    key={h}
                    className="type-label"
                    style={{
                      padding: "0.55rem 1rem",
                      textAlign: "left",
                      color: "var(--color-ink-muted)",
                      background: "var(--color-surface)",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completedPatients.map((p) => (
                <tr
                  key={p.token}
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    background: "var(--color-panel)",
                    opacity: 0.85,
                  }}
                >
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span
                      className="type-value"
                      style={{
                        color: "var(--color-ink-secondary)",
                        fontFamily: "var(--font-mono, monospace)",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                      }}
                    >
                      {p.token}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span className="type-value" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                      {p.patientName || p.name}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span className="type-id" style={{ color: "var(--color-ink-muted)", fontSize: "0.75rem" }}>
                      {p.age}Y · {p.gender}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", maxWidth: "250px" }}>
                    <span className="type-micro" style={{ color: "var(--color-ink-muted)" }}>
                      {p.chiefComplaint || p.complaint}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: "var(--color-signal-normal)",
                        background: "var(--color-signal-normal-bg)",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "99px",
                        border: "1px solid var(--color-signal-normal-border)",
                      }}
                    >
                      ✓ CLOSED & SIGNED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
