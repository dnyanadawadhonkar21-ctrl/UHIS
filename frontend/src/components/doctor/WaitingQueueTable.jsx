import React from "react";
import { PhoneCall, UserCheck, KeyRound, Lock, Clock, AlertCircle } from "lucide-react";
import Button from "../ui/Button";
import StatusCode from "../ui/StatusCode";

const STATUS_SIGNAL_MAP = {
  booked: "info",
  checked_in: "info",
  waiting: "warning",
  called: "purple",
  patient_present: "info",
  otp_pending: "warning",
  "in-consultation": "info",
  completed: "normal",
  cancelled: "critical",
  no_show: "critical",
};

export default function WaitingQueueTable({
  patients,
  onSelectPatient,
  onCallPatient,
  onRequestMedicalRecords,
}) {
  if (!patients || patients.length === 0) {
    return (
      <div
        className="instrument-panel"
        style={{
          padding: "2.5rem 1.5rem",
          textAlign: "center",
          marginBottom: "1.5rem",
        }}
      >
        <Clock size={28} style={{ color: "var(--color-ink-muted)", marginBottom: "0.5rem" }} />
        <div style={{ fontWeight: 600, color: "var(--color-ink)", fontSize: "0.95rem" }}>
          No Patients Currently Waiting
        </div>
        <div className="type-micro" style={{ color: "var(--color-ink-secondary)", marginTop: "0.25rem" }}>
          All registered queue patients have been consulted or are in session.
        </div>
      </div>
    );
  }

  return (
    <div className="instrument-panel" style={{ overflow: "hidden", marginBottom: "1.75rem" }}>
      <div
        className="panel-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div className="type-heading">Waiting Patients Queue</div>
          <span
            style={{
              background: "var(--color-signal-warning-bg)",
              color: "var(--color-signal-warning)",
              border: "1px solid var(--color-signal-warning-border)",
              borderRadius: "99px",
              padding: "0.15rem 0.55rem",
              fontSize: "0.7rem",
              fontWeight: 700,
            }}
          >
            {patients.length} WAITING
          </span>
        </div>
        <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>
          🔒 Medical records locked until patient arrives & consent OTP is authorized
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              {["TOKEN", "PATIENT & IDENTIFIERS", "AGE / GENDER", "CHIEF COMPLAINT", "PRIORITY", "QUEUE STATUS", "ACTION"].map(
                (h) => (
                  <th
                    key={h}
                    className="type-label"
                    style={{
                      padding: "0.65rem 1rem",
                      textAlign: "left",
                      color: "var(--color-ink-secondary)",
                      background: "var(--color-surface)",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {patients.map((p, idx) => {
              const isNext = idx === 0 && p.status === "waiting";
              const isEmergency = p.priority === "emergency";
              const isUrgent = p.priority === "urgent";

              return (
                <tr
                  key={p.token}
                  onClick={() => onSelectPatient && onSelectPatient(p)}
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    background:
                      p.status === "called"
                        ? "var(--color-signal-purple-bg)"
                        : p.status === "patient_present"
                        ? "var(--color-signal-info-bg)"
                        : isNext
                        ? "var(--color-surface)"
                        : "var(--color-panel)",
                    cursor: "pointer",
                    transition: "background 100ms ease",
                  }}
                  className="queue-row-hover"
                >
                  {/* Token */}
                  <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        className="type-value"
                        style={{
                          color: "var(--color-ink)",
                          fontSize: "1rem",
                          fontWeight: 800,
                          fontFamily: "var(--font-mono, monospace)",
                        }}
                      >
                        {p.token}
                      </span>
                      {isNext && (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            padding: "0.1rem 0.4rem",
                            borderRadius: "4px",
                            background: "var(--color-accent-primary)",
                            color: "#ffffff",
                            letterSpacing: "0.03em",
                          }}
                        >
                          NEXT
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Patient Name & Identifiers */}
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.875rem", fontWeight: 700 }}>
                        {p.patientName || p.name}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                        <span className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>
                          ID: <strong style={{ color: "var(--color-ink)" }}>{p.patientId || p.uhisId || "P-10042"}</strong>
                        </span>
                        <span style={{ color: "var(--color-border-deep)" }}>•</span>
                        <span className="type-micro" style={{ color: "var(--color-accent-primary)", fontWeight: 600 }}>
                          ABHA: {p.abhaId || "N/A"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Age / Gender */}
                  <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                    <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>
                      {p.age}Y · {p.gender}
                    </span>
                  </td>

                  {/* Chief Complaint */}
                  <td style={{ padding: "0.85rem 1rem", maxWidth: "260px" }}>
                    <span
                      className="type-body"
                      style={{
                        color: "var(--color-ink)",
                        fontSize: "0.825rem",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                      title={p.chiefComplaint || p.complaint}
                    >
                      {p.chiefComplaint || p.complaint}
                    </span>
                  </td>

                  {/* Priority */}
                  <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
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
                      {p.priority || "ROUTINE"}
                    </span>
                  </td>

                  {/* Queue Status */}
                  <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                    <StatusCode
                      status={STATUS_SIGNAL_MAP[p.status] || "warning"}
                      label={(p.status || "waiting").replace(/[-_]/g, " ").toUpperCase()}
                    />
                  </td>

                  {/* Action */}
                  <td
                    style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(p.status === "waiting" || p.status === "booked" || p.status === "checked_in") && (
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onCallPatient && onCallPatient(p)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                        >
                          <PhoneCall size={12} /> Call
                        </Button>
                        <Button
                          size="sm"
                          variant={isNext ? "primary" : "secondary"}
                          onClick={() => onRequestMedicalRecords ? onRequestMedicalRecords(p) : onSelectPatient(p)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                        >
                          <KeyRound size={12} /> Request Records
                        </Button>
                      </div>
                    )}

                    {p.status === "called" && (
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onSelectPatient && onSelectPatient(p)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                        >
                          <UserCheck size={12} /> Mark Present
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => onRequestMedicalRecords ? onRequestMedicalRecords(p) : onSelectPatient(p)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                        >
                          <KeyRound size={12} /> Request Records
                        </Button>
                      </div>
                    )}

                    {p.status === "patient_present" && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onRequestMedicalRecords ? onRequestMedicalRecords(p) : onSelectPatient(p)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                      >
                        <KeyRound size={12} /> REQUEST MEDICAL RECORDS
                      </Button>
                    )}

                    {p.status === "otp_pending" && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onSelectPatient && onSelectPatient(p)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                      >
                        <Lock size={12} /> ENTER OTP
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        .queue-row-hover:hover td {
          background: var(--color-surface-alt) !important;
        }
      `}</style>
    </div>
  );
}
