import React, { useState } from "react";
import { 
  HeartPulse, 
  Activity, 
  AlertTriangle, 
  FileText, 
  Pill, 
  History, 
  TestTube2, 
  Sparkles,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import AIPatientOverview from "../patient/AIPatientOverview";
import InstrumentPanel from "../ui/InstrumentPanel";
import StatusCode from "../ui/StatusCode";
import DataRow from "../ui/DataRow";
import PreviousPrescriptionsList from "./PreviousPrescriptionsList";
import { conditions, allergies, labReports, visits } from "../../data/mockData";

const SUB_TABS = [
  { id: "overview", label: "AI CLINICAL OVERVIEW", icon: Sparkles },
  { id: "vitals", label: "VITALS & PARAMETERS", icon: Activity },
  { id: "history", label: "CONDITIONS & ALLERGIES", icon: History },
  { id: "prescriptions", label: "PREVIOUS RX", icon: Pill },
  { id: "labs", label: "LAB REPORTS", icon: TestTube2 },
];

export default function PatientMedicalRecordView({
  patient,
  savedPrescriptions = [],
  authorizedRecords = null,
}) {
  const [activeSubTab, setActiveSubTab] = useState("overview");

  if (!patient) return null;

  // Use authorized data from backend if available, otherwise mock data
  const displayConditions = (authorizedRecords?.diseases && authorizedRecords.diseases.length > 0)
    ? authorizedRecords.diseases.map((d) => ({
        id: d.id,
        name: d.name,
        icd10: d.icdCode || "E11.9",
        status: (d.severity === "CHRONIC" || d.severity === "SEVERE") ? "chronic" : "active",
        diagnosedDate: d.diagnosedDate ? new Date(d.diagnosedDate).toLocaleDateString() : "Recent",
        facility: d.hospital || "AIIMS New Delhi",
        doctor: d.treatingDoctor || "Consulting Physician",
        notes: d.notes,
      }))
    : conditions;

  const displayAllergies = (authorizedRecords?.allergies && authorizedRecords.allergies.length > 0)
    ? authorizedRecords.allergies.map((a, i) => ({
        id: a.id || `al-${i}`,
        allergen: a.name || a.allergen || "Known Allergen",
        category: a.category || "Drug",
        severity: (a.severity || "severe").toLowerCase(),
        reaction: a.reaction || "Anaphylaxis / Hypersensitivity",
        precautions: a.precautions || "Strict avoidance",
      }))
    : allergies;

  const displayLabReports = (authorizedRecords?.labReports && authorizedRecords.labReports.length > 0)
    ? authorizedRecords.labReports.map((r, i) => ({
        id: r.id || `lab-${i}`,
        testName: r.testName || r.test || "Laboratory Panel",
        category: r.category || r.testCategory || "Pathology",
        summary: r.summary || r.resultData || "Findings normal",
        date: r.sampleDate || r.date || "Recent",
        facility: r.laboratoryName || "Hospital Diagnostics Lab",
        orderedBy: r.orderedBy || "Physician",
        status: r.status === "COMPLETED" || r.status === "completed" ? "completed" : "pending",
        abnormal: r.status === "ABNORMAL",
      }))
    : labReports;

  return (
    <div
      style={{
        background: "var(--color-panel)",
        border: "1px solid var(--color-border)",
        borderRadius: "10px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "0.85rem 1.15rem",
          background: "var(--color-surface-alt)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShieldCheck size={16} style={{ color: "var(--color-signal-normal)" }} />
          <span className="type-heading" style={{ fontSize: "0.9rem", color: "var(--color-ink)" }}>
            PATIENT MEDICAL RECORD (READ-ONLY)
          </span>
        </div>
        <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>
          Historical Longitudinal EHR · AIIMS / ABDM Network
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          overflowX: "auto",
        }}
      >
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.65rem 0.95rem",
                fontSize: "0.75rem",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--color-accent-primary)" : "var(--color-ink-secondary)",
                background: isActive ? "var(--color-panel)" : "transparent",
                border: "none",
                borderBottom: isActive ? "2px solid var(--color-accent-primary)" : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 100ms ease",
              }}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Container */}
      <div style={{ padding: "1.15rem" }}>
        {/* SUB TAB 1: AI CLINICAL OVERVIEW */}
        {activeSubTab === "overview" && (
          <div className="fade-in">
            <AIPatientOverview mode="doctor" patientData={patient} />

            {/* Quick Demographics & Alerts Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }} className="med-grid-2col">
              <InstrumentPanel title="Presenting Clinical Profile" subtitle="CURRENT VISIT" channel="info">
                <DataRow label="PATIENT NAME" value={patient.patientName || patient.name} />
                <DataRow label="AGE / GENDER" value={`${patient.age}Y · ${patient.gender}`} />
                <DataRow label="BLOOD GROUP" value="O+" />
                <DataRow label="CHIEF COMPLAINT" value={patient.chiefComplaint || patient.complaint} />
                <DataRow label="PRIORITY" value={(patient.priority || "ROUTINE").toUpperCase()} />
              </InstrumentPanel>

              <InstrumentPanel title="Critical Safety & Allergies" subtitle="ALERTS" channel="critical">
                <div style={{ padding: "0.75rem 1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      background: "var(--color-signal-critical-bg)",
                      border: "1px solid var(--color-signal-critical-border)",
                      borderRadius: "6px",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <AlertTriangle size={15} style={{ color: "var(--color-signal-critical)", flexShrink: 0 }} />
                    <div style={{ fontSize: "0.8rem", color: "var(--color-signal-critical)", fontWeight: 600 }}>
                      Severe Penicillin Allergy (Anaphylaxis Risk)
                    </div>
                  </div>

                  <div className="type-micro" style={{ color: "var(--color-ink-secondary)", lineHeight: 1.4 }}>
                    Avoid all Beta-Lactam antibiotics (Amoxicillin, Ampicillin, Cephalosporins). Confirm alternative broad-spectrum options if required.
                  </div>
                </div>
              </InstrumentPanel>
            </div>
          </div>
        )}

        {/* SUB TAB 2: VITALS & PARAMETERS */}
        {activeSubTab === "vitals" && (
          <div className="fade-in">
            <InstrumentPanel title="Vital Parameters Recorded This Encounter" subtitle="TRIAGE & OPD" channel="info">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "0.85rem",
                  padding: "0.5rem 0",
                }}
              >
                {[
                  { label: "BLOOD PRESSURE", value: patient.vitals?.bp || "132/84", unit: "mmHg", status: "normal" },
                  { label: "HEART RATE", value: patient.vitals?.pulse || "74", unit: "bpm", status: "normal" },
                  { label: "BODY TEMP", value: patient.vitals?.temp || "98.4°F", unit: "°F", status: "normal" },
                  { label: "OXYGEN SPO₂", value: patient.vitals?.spo2 || "98%", unit: "%", status: "normal" },
                  { label: "BODY WEIGHT", value: "74 kg", unit: "kg", status: "normal" },
                  { label: "HEIGHT / BMI", value: "176 cm (23.9)", unit: "BMI Normal", status: "normal" },
                ].map((v) => (
                  <div
                    key={v.label}
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      padding: "0.75rem",
                    }}
                  >
                    <div className="type-label" style={{ fontSize: "0.65rem", marginBottom: "0.25rem" }}>
                      {v.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        color: "var(--color-ink)",
                      }}
                    >
                      {v.value}
                    </div>
                    <div className="type-micro" style={{ color: "var(--color-ink-muted)", marginTop: "2px" }}>
                      {v.unit}
                    </div>
                  </div>
                ))}
              </div>
            </InstrumentPanel>
          </div>
        )}

        {/* SUB TAB 3: CONDITIONS & ALLERGIES */}
        {activeSubTab === "history" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <InstrumentPanel title="Active & Chronic Health Conditions" subtitle="EHR DIAGNOSES" channel="muted">
              {displayConditions.map((c) => (
                <div key={c.id} className="data-row">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="type-value" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                        {c.name}
                      </span>
                      <span className="type-id" style={{ color: "var(--color-accent-primary)", fontSize: "0.75rem" }}>
                        [{c.icd10}]
                      </span>
                    </div>
                    <div className="type-micro" style={{ color: "var(--color-ink-muted)", marginTop: "2px" }}>
                      Diagnosed {c.diagnosedDate} · {c.facility} · {c.doctor}
                    </div>
                  </div>
                  <StatusCode
                    status={c.status === "chronic" ? "critical" : c.status === "active" ? "warning" : "normal"}
                    label={c.status.toUpperCase()}
                  />
                </div>
              ))}
            </InstrumentPanel>

            <InstrumentPanel title="Allergies & Adverse Reactions" subtitle="PATIENT SAFETY REGISTRY" channel="critical">
              {displayAllergies.map((a) => (
                <div key={a.id} className="data-row">
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--color-signal-critical)", fontSize: "0.85rem" }}>
                      {a.allergen} ({a.category})
                    </div>
                    <div className="type-micro" style={{ color: "var(--color-ink-secondary)", marginTop: "2px" }}>
                      Reaction: {a.reaction} · Precautions: {a.precautions}
                    </div>
                  </div>
                  <span className="status-critical">{a.severity.toUpperCase()}</span>
                </div>
              ))}
            </InstrumentPanel>
          </div>
        )}

        {/* SUB TAB 4: PREVIOUS PRESCRIPTIONS */}
        {activeSubTab === "prescriptions" && (
          <div className="fade-in">
            <div style={{ marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
                HISTORICAL PHARMACOTHERAPY & PREVIOUS VISITS
              </div>
              <span className="type-micro" style={{ color: "var(--color-ink-muted)" }}>
                Read-only records from past doctor encounters
              </span>
            </div>
            <PreviousPrescriptionsList visits={visits} savedPrescriptions={savedPrescriptions} />
          </div>
        )}

        {/* SUB TAB 5: LAB REPORTS */}
        {activeSubTab === "labs" && (
          <div className="fade-in">
            <InstrumentPanel title="Diagnostic Laboratory Investigations" subtitle="PATHOLOGY & BIOCHEMISTRY" channel="muted">
              {displayLabReports.map((r) => (
                <div key={r.id} className="data-row" style={{ alignItems: "flex-start", padding: "0.85rem 1.25rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="type-value" style={{ fontWeight: 700, fontSize: "0.875rem" }}>
                        {r.testName || r.test}
                      </span>
                      <span className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>
                        ({r.category})
                      </span>
                      {r.abnormal && (
                        <span className="status-warning" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
                          FLAGGED
                        </span>
                      )}
                    </div>
                    <div className="type-micro" style={{ color: "var(--color-ink-secondary)", marginTop: "4px" }}>
                      {r.summary || r.resultData}
                    </div>
                    <div className="type-micro" style={{ color: "var(--color-ink-muted)", marginTop: "2px" }}>
                      Date: {r.date} · Facility: {r.facility} · Ordered by: {r.orderedBy}
                    </div>
                  </div>

                  <StatusCode
                    status={r.status === "completed" ? "normal" : "warning"}
                    label={r.status.toUpperCase()}
                  />
                </div>
              ))}
            </InstrumentPanel>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .med-grid-2col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
