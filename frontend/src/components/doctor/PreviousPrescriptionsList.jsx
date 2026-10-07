import React, { useState } from "react";
import { Pill, Calendar, User, ChevronDown, ChevronUp, FileText, CheckCircle2 } from "lucide-react";
import { visits as mockVisits } from "../../data/mockData";

export default function PreviousPrescriptionsList({ visits = mockVisits, savedPrescriptions = [] }) {
  const [expandedId, setExpandedId] = useState("V001");

  // Combine mock historical visits that have prescriptions + any newly saved prescriptions in this session
  const allPrescriptionRecords = [
    ...savedPrescriptions.map((sp, idx) => ({
      id: `SAVED-${idx}`,
      date: sp.date || "Today",
      doctorName: sp.doctorName || "Dr. Anita Desai",
      specialty: sp.specialty || "Internal Medicine",
      diagnosis: sp.diagnosis || "Clinical Consultation",
      icdCode: sp.icdCode || "General",
      prescriptions: sp.medicines || [],
      doctorNotes: sp.instructions || "",
      isCurrentSession: true,
    })),
    ...visits.filter((v) => v.prescriptions && v.prescriptions.length > 0),
  ];

  if (allPrescriptionRecords.length === 0) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          background: "var(--color-surface)",
          border: "1px dashed var(--color-border)",
          borderRadius: "8px",
          color: "var(--color-ink-muted)",
        }}
      >
        <FileText size={24} style={{ margin: "0 auto 0.5rem" }} />
        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>No Historical Prescriptions on Record</div>
        <div className="type-micro">Previous prescription records will appear here once registered.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {allPrescriptionRecords.map((rec) => {
        const isExpanded = expandedId === rec.id;
        const meds = rec.prescriptions || [];

        return (
          <div
            key={rec.id}
            style={{
              background: "var(--color-panel)",
              border: rec.isCurrentSession
                ? "1.5px solid var(--color-signal-normal-border)"
                : "1px solid var(--color-border)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : rec.id)}
              style={{
                padding: "0.75rem 1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                background: rec.isCurrentSession ? "var(--color-signal-normal-bg)" : "var(--color-surface-alt)",
                borderBottom: isExpanded ? "1px solid var(--color-border)" : "none",
                userSelect: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                <Calendar size={14} style={{ color: "var(--color-ink-secondary)" }} />
                <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--color-ink)" }}>
                  {rec.date}
                </span>
                <span className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>
                  by {rec.doctorName || rec.doctor} ({rec.specialty || "General Medicine"})
                </span>
                {rec.isCurrentSession && (
                  <span
                    style={{
                      background: "var(--color-signal-normal)",
                      color: "#ffffff",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      padding: "0.1rem 0.45rem",
                      borderRadius: "4px",
                    }}
                  >
                    SAVED THIS VISIT
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span className="type-micro" style={{ fontWeight: 600, color: "var(--color-ink-secondary)" }}>
                  {meds.length} {meds.length === 1 ? "Medicine" : "Medicines"}
                </span>
                {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {/* Expanded Body (Read-only) */}
            {isExpanded && (
              <div style={{ padding: "0.85rem 1rem" }}>
                {/* Diagnosis */}
                <div style={{ marginBottom: "0.65rem" }}>
                  <span className="type-label" style={{ fontSize: "0.65rem", color: "var(--color-ink-secondary)" }}>
                    DIAGNOSIS & OBSERVATION:
                  </span>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--color-ink)", marginTop: "2px" }}>
                    {rec.diagnosis || "General Consultation"}
                    {rec.icdCode && (
                      <span className="type-id" style={{ marginLeft: "6px", color: "var(--color-accent-primary)", fontSize: "0.75rem" }}>
                        [{rec.icdCode}]
                      </span>
                    )}
                  </div>
                </div>

                {/* Medicines List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "0.75rem" }}>
                  {meds.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      style={{
                        padding: "0.5rem 0.75rem",
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "6px",
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 2fr",
                        gap: "0.5rem",
                        alignItems: "center",
                        fontSize: "0.8rem",
                      }}
                      className="prev-rx-row"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Pill size={13} style={{ color: "var(--color-accent-primary)", flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>
                          {m.medicineName || m.name}
                        </span>
                      </div>
                      <div style={{ color: "var(--color-ink-secondary)" }}>
                        {m.dosage}
                      </div>
                      <div className="type-micro" style={{ color: "var(--color-ink-secondary)", fontWeight: 500 }}>
                        {m.frequency} {m.duration ? `· ${m.duration}` : ""}
                      </div>
                      <div className="type-micro" style={{ color: "var(--color-ink-muted)", fontStyle: "italic" }}>
                        {m.instructions || m.relationToFood || "Take as directed"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Doctor Notes & Advice */}
                {rec.doctorNotes && (
                  <div
                    style={{
                      padding: "0.5rem 0.75rem",
                      background: "var(--color-surface-alt)",
                      borderRadius: "6px",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <span className="type-label" style={{ fontSize: "0.65rem", color: "var(--color-ink-secondary)" }}>
                      DOCTOR INSTRUCTIONS & LIFESTYLE ADVICE:
                    </span>
                    <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--color-ink)", lineHeight: 1.4 }}>
                      {rec.doctorNotes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @media (max-width: 600px) {
          .prev-rx-row {
            grid-template-columns: 1fr !important;
            gap: 0.25rem !important;
          }
        }
      `}</style>
    </div>
  );
}
