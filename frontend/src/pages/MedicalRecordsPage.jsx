import React, { useState } from "react";
import { Download } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import InstrumentPanel from "../components/ui/InstrumentPanel";
import StatusCode from "../components/ui/StatusCode";
import Button from "../components/ui/Button";
import { timelineEvents, labReports, visits, conditions, medications } from "../data/mockData";

const TABS = [
  { id: "timeline", label: "TIMELINE" },
  { id: "records", label: "ALL RECORDS" },
  { id: "export", label: "EXPORT" },
];

const TYPE_LABELS = {
  appointment: "OPD",
  visit: "VISIT",
  lab: "LAB",
  diagnosis: "DX",
  vaccination: "VAX",
  surgery: "SURG",
};

const YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];

export default function MedicalRecordsPage() {
  const [activeTab, setActiveTab] = useState("timeline");
  const [filter, setFilter] = useState("ALL");

  const allTimeline = timelineEvents || [];

  const filteredTimeline = filter === "ALL"
    ? allTimeline
    : allTimeline.filter((t) => (t.type || "").toLowerCase() === filter.toLowerCase());

  return (
    <AppLayout tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        {activeTab === "timeline" && (
          <div className="fade-in">
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              {["ALL", "VISIT", "LAB", "DIAGNOSIS", "VACCINATION", "SURGERY"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={filter === f ? "filter-pill-active" : "filter-pill"}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Year grouping */}
            {YEARS.map((year) => {
              const yearItems = filteredTimeline.filter((t) => (t.date || "").startsWith(year));
              if (!yearItems.length) return null;
              return (
                <div key={year} style={{ marginBottom: "2rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        color: "var(--color-ink)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {year}
                    </span>
                    <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
                    <span className="type-micro" style={{ color: "var(--color-ink-muted)" }}>
                      {yearItems.length} {yearItems.length === 1 ? "event" : "events"}
                    </span>
                  </div>
                  <div style={{ position: "relative", paddingLeft: "1.25rem" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: "4px",
                        top: 0,
                        bottom: 0,
                        width: "1px",
                        background: "var(--color-border)",
                      }}
                    />
                    {yearItems.map((t) => (
                      <div key={t.id} style={{ position: "relative", marginBottom: "0.75rem", paddingLeft: "1rem" }}>
                        <div
                          style={{
                            position: "absolute",
                            left: "-5px",
                            top: "0.4rem",
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: t.signal === "critical" ? "var(--color-signal-critical)"
                              : t.signal === "warning" ? "var(--color-signal-warning)"
                              : t.signal === "info" ? "var(--color-signal-info)"
                              : "var(--color-signal-normal)",
                          }}
                        />
                        <div
                          className={`instrument-panel channel-${t.signal || "info"}`}
                          style={{ background: "var(--color-panel)" }}
                        >
                          <div
                            style={{
                              padding: "0.75rem 1.25rem",
                              display: "flex",
                              gap: "1rem",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", flex: 1 }}>
                              <span
                                style={{
                                  background: "var(--color-surface-alt)",
                                  color: "var(--color-ink-secondary)",
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "4px",
                                  fontFamily: "'Inter', sans-serif",
                                  fontSize: "0.65rem",
                                  fontWeight: 600,
                                  letterSpacing: "0.06em",
                                  flexShrink: 0,
                                  border: "1px solid var(--color-border)",
                                }}
                              >
                                {TYPE_LABELS[t.type] || (t.type || "").toUpperCase()}
                              </span>
                              <span className="type-id" style={{ color: "var(--color-ink-secondary)", flexShrink: 0 }}>
                                {t.date}
                              </span>
                              <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>
                                {t.title}
                              </span>
                            </div>
                            <span className="type-micro" style={{ color: "var(--color-ink-secondary)", flexShrink: 0 }}>
                              {t.detail || t.summary}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "records" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <InstrumentPanel title="Conditions on Record" subtitle="DIAGNOSES" channel="warning">
              {conditions.map((c) => (
                <div key={c.id} className="data-row">
                  <div>
                    <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{c.name}</span>
                    <span className="type-id" style={{ color: "var(--color-ink-muted)", marginLeft: "0.5rem" }}>{c.icd10}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>{c.diagnosedDate}</span>
                    <StatusCode
                      status={c.status === "chronic" ? "critical" : c.status === "active" ? "warning" : "normal"}
                      label={c.status.toUpperCase()}
                    />
                  </div>
                </div>
              ))}
            </InstrumentPanel>

            <InstrumentPanel title="Medication History" subtitle="ALL PRESCRIPTIONS" channel="info">
              {medications.map((m) => (
                <div key={m.id} className="data-row">
                  <div>
                    <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{m.name} {m.dosage}</span>
                    <span className="type-micro" style={{ color: "var(--color-ink-secondary)", display: "block" }}>{m.prescribedBy} · {m.startDate}</span>
                  </div>
                  <StatusCode status={m.endDate === "Ongoing" ? "info" : "normal"} label={m.endDate === "Ongoing" ? "ACTIVE" : "COMPLETED"} />
                </div>
              ))}
            </InstrumentPanel>
          </div>
        )}

        {activeTab === "export" && (
          <div className="fade-in">
            <InstrumentPanel title="Export Medical Records" subtitle="DATA PORTABILITY" channel="muted">
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {[
                  { label: "Complete Health Summary (PDF)", desc: "Full longitudinal record — conditions, meds, labs, visits", format: "PDF" },
                  { label: "ABDM FHIR Bundle (JSON)", desc: "Machine-readable interoperable health record", format: "JSON" },
                  { label: "Lab Reports Archive (ZIP)", desc: "All completed lab report PDFs in a single archive", format: "ZIP" },
                  { label: "Prescription History (PDF)", desc: "All prescriptions with dosage and prescriber details", format: "PDF" },
                  { label: "Vaccination Certificate (PDF)", desc: "WHO-standard immunisation record", format: "PDF" },
                ].map(({ label, desc, format }) => (
                  <div
                    key={label}
                    className="data-row"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div>
                      <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{label}</div>
                      <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>{desc}</div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
                      <span className="type-label" style={{ color: "var(--color-ink-muted)" }}>{format}</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                        onClick={() => {}}
                      >
                        <Download size={11} /> DOWNLOAD
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </InstrumentPanel>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
