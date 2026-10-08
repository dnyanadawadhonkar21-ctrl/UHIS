import React, { useState, useEffect } from "react";
import {
  Sparkles,
  AlertTriangle,
  Heart,
  Pill,
  Activity,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  Stethoscope,
  Eye,
  FileCheck,
  RefreshCw,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "../../services/api";
import { generateAiPatientOverview } from "../../utils/aiOverviewGenerator";

/**
 * Reusable AI Patient Overview Component
 * 
 * Supports both:
 * - mode="patient" (friendly, structured, easy for patients to understand)
 * - mode="doctor"  (clinical, concise, rapid triage format for clinicians)
 */
export default function AIPatientOverview({
  patientId = null,
  patientData = null,
  conditionsList = [],
  allergiesList = [],
  medicationsList = [],
  visitsList = [],
  timelineList = [],
  mode = "patient", // "patient" | "doctor"
  onNavigateTab = null,
}) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchOverview = async () => {
    try {
      const endpoint = patientId ? `/patients/ai-overview/${patientId}` : "/patients/ai-overview";
      const res = await api.get(endpoint).catch(() => null);

      if (res && res.data && res.data.success && res.data.overview) {
        setOverview(res.data.overview);
        return;
      }
    } catch (err) {
      console.warn("Notice: Using client AI overview derivation engine", err?.message);
    }

    // Fallback: Use shared deterministic AI overview generator
    const generated = generateAiPatientOverview({
      patient: patientData || {},
      conditionsList,
      allergiesList,
      medicationsList,
      visitsList,
      timelineList,
    });
    setOverview(generated);
  };

  useEffect(() => {
    setLoading(true);
    fetchOverview().finally(() => setLoading(false));
  }, [patientId, patientData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOverview();
    setTimeout(() => setRefreshing(false), 400);
  };

  if (loading && !overview) {
    return (
      <div
        style={{
          background: "var(--color-panel, #FFFFFF)",
          border: "1px solid var(--color-border, #E2E8F0)",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.75rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          color: "var(--color-ink-secondary, #64748B)",
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.875rem",
        }}
      >
        <Sparkles size={18} className="spin-slow" style={{ color: "#2563EB" }} />
        <span>Synthesizing AI Patient Overview from electronic health records...</span>
      </div>
    );
  }

  if (!overview) return null;

  const {
    patient,
    summaryNote,
    criticalAlerts = [],
    chronicConditions = [],
    activeMedications = [],
    recentDiagnosis,
    majorHistoryAndSurgeries = [],
    latestVitals,
    recentKeyFindings = [],
    recentInvestigations = [],
    currentTreatmentPlan = [],
    followUpRequirements = [],
    safetyDisclaimer,
    confidenceScore,
  } = overview;

  const isDoctor = mode === "doctor";

  return (
    <div
      className="ai-overview-container"
      style={{
        background: isDoctor
          ? "linear-gradient(180deg, #F8FAFC 0%, var(--color-panel, #FFFFFF) 100%)"
          : "linear-gradient(180deg, #F0FDF4 0%, var(--color-panel, #FFFFFF) 120px)",
        border: isDoctor
          ? "1px solid #CBD5E1"
          : "1px solid #BBF7D0",
        borderRadius: "12px",
        overflow: "hidden",
        marginBottom: "1.75rem",
        boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.05)",
        transition: "all 200ms ease",
      }}
    >
      {/* 1. Header Bar */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderBottom: isCollapsed ? "none" : "1px solid var(--color-border, #E2E8F0)",
          background: isDoctor ? "#0F172A" : "#14532D",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: isDoctor ? "rgba(59, 130, 246, 0.25)" : "rgba(34, 197, 94, 0.25)",
              border: `1px solid ${isDoctor ? "#60A5FA" : "#4ADE80"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isDoctor ? "#93C5FD" : "#86EFAC",
            }}
          >
            <Sparkles size={15} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {isDoctor ? "CLINICAL AI PATIENT OVERVIEW" : "AI Patient Health Overview"}
              </span>
              <span
                style={{
                  background: isDoctor ? "rgba(96, 165, 250, 0.2)" : "rgba(134, 239, 172, 0.2)",
                  color: isDoctor ? "#93C5FD" : "#BBF7D0",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  padding: "0.15rem 0.45rem",
                  borderRadius: "4px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  border: `1px solid ${isDoctor ? "rgba(96, 165, 250, 0.3)" : "rgba(134, 239, 172, 0.3)"}`,
                }}
              >
                {confidenceScore || "EHR SYNTHESIS"}
              </span>
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: isDoctor ? "#94A3B8" : "#A7F3D0",
                marginTop: "0.1rem",
              }}
            >
              {isDoctor
                ? "Key clinical intelligence & contraindications synthesized for rapid OPD triage"
                : "Real-time health summary organized from your verified medical visits & prescriptions"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh AI Overview"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              padding: "0.35rem 0.65rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")}
          >
            <RefreshCw size={12} className={refreshing ? "spin-fast" : ""} />
            <span>SYNC</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              padding: "0.35rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {/* 2. Overview Body (when not collapsed) */}
      {!isCollapsed && (
        <div style={{ padding: "1.25rem", background: "var(--color-panel, #FFFFFF)" }}>
          
          {/* Executive Summary Note */}
          <div
            style={{
              background: isDoctor ? "#F8FAFC" : "#F0FDF4",
              border: `1px solid ${isDoctor ? "#E2E8F0" : "#DCFCE7"}`,
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.65rem",
            }}
          >
            <Info size={16} style={{ color: isDoctor ? "#2563EB" : "#16A34A", marginTop: "0.15rem", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.85rem",
                  color: "var(--color-ink, #0F172A)",
                  lineHeight: "1.45",
                  fontWeight: 500,
                }}
              >
                {summaryNote}
              </span>
            </div>
          </div>

          {/* HIGH PRIORITY: Critical Alerts (Penicillin Allergy, etc.) */}
          {criticalAlerts.length > 0 && (
            <div style={{ marginBottom: "1.25rem" }}>
              {criticalAlerts.map((alert, idx) => (
                <div
                  key={alert.id || idx}
                  style={{
                    background: alert.severity === "CRITICAL" ? "#FEF2F2" : "#FFFBEB",
                    border: `1px solid ${alert.severity === "CRITICAL" ? "#FCA5A5" : "#FDE68A"}`,
                    borderLeft: `4px solid ${alert.severity === "CRITICAL" ? "#DC2626" : "#D97706"}`,
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    marginBottom: idx < criticalAlerts.length - 1 ? "0.5rem" : "0",
                  }}
                >
                  <AlertTriangle
                    size={18}
                    style={{
                      color: alert.severity === "CRITICAL" ? "#DC2626" : "#D97706",
                      marginTop: "0.1rem",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          color: alert.severity === "CRITICAL" ? "#991B1B" : "#92400E",
                        }}
                      >
                        {alert.title}
                      </span>
                      <span
                        style={{
                          background: alert.severity === "CRITICAL" ? "#DC2626" : "#D97706",
                          color: "white",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          padding: "0.1rem 0.4rem",
                          borderRadius: "4px",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.8rem",
                        color: alert.severity === "CRITICAL" ? "#7F1D1D" : "#78350F",
                        marginTop: "0.2rem",
                        lineHeight: "1.4",
                      }}
                    >
                      {alert.description}
                    </div>
                    {alert.actionNote && (
                      <div
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: alert.severity === "CRITICAL" ? "#B91C1C" : "#B45309",
                          marginTop: "0.3rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <span>⚠ Action:</span>
                        <span>{alert.actionNote}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grid Layout: Clinical Columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isDoctor ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
              gap: "1rem",
              marginBottom: "1.25rem",
            }}
            className="ai-overview-grid"
          >
            {/* Card 1: Conditions & Diagnoses */}
            <div
              style={{
                background: "var(--color-surface, #F8FAFC)",
                border: "1px solid var(--color-border, #E2E8F0)",
                borderRadius: "8px",
                padding: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.75rem",
                  borderBottom: "1px solid var(--color-border, #E2E8F0)",
                  paddingBottom: "0.4rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Heart size={14} style={{ color: "#DC2626" }} />
                  <span className="type-label" style={{ fontWeight: 700, color: "var(--color-ink, #0F172A)" }}>
                    {isDoctor ? "CONDITIONS & DIAGNOSES" : "Chronic Conditions"}
                  </span>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("conditions")}
                    style={{ background: "none", border: "none", color: "#2563EB", fontSize: "0.7rem", cursor: "pointer", fontWeight: 600 }}
                  >
                    View All →
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {chronicConditions.map((c, i) => (
                  <div
                    key={c.id || i}
                    style={{
                      background: "var(--color-panel, #FFFFFF)",
                      border: "1px solid var(--color-border, #E2E8F0)",
                      borderRadius: "6px",
                      padding: "0.5rem 0.65rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-ink, #0F172A)" }}>
                        {c.name}
                      </span>
                      {c.icdCode && (
                        <span style={{ fontSize: "0.65rem", fontFamily: "monospace", background: "#EFF6FF", color: "#2563EB", padding: "0.1rem 0.35rem", borderRadius: "3px", fontWeight: 700 }}>
                          {c.icdCode}
                        </span>
                      )}
                    </div>
                    {c.notes && (
                      <div style={{ fontSize: "0.72rem", color: "var(--color-ink-secondary, #64748B)", marginTop: "0.2rem", lineHeight: "1.3" }}>
                        {c.notes}
                      </div>
                    )}
                  </div>
                ))}

                {majorHistoryAndSurgeries.length > 0 && (
                  <div style={{ marginTop: "0.25rem", paddingTop: "0.4rem", borderTop: "1px dashed var(--color-border, #E2E8F0)" }}>
                    <div className="type-micro" style={{ color: "var(--color-ink-muted, #94A3B8)", marginBottom: "0.25rem" }}>
                      PAST SURGICAL HISTORY
                    </div>
                    {majorHistoryAndSurgeries.map((s, idx) => (
                      <div key={idx} style={{ fontSize: "0.75rem", color: "var(--color-ink-secondary, #475569)", fontWeight: 500 }}>
                        • {s.title}: <span style={{ color: "#16A34A" }}>{s.outcome}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Current Medications & Treatment */}
            <div
              style={{
                background: "var(--color-surface, #F8FAFC)",
                border: "1px solid var(--color-border, #E2E8F0)",
                borderRadius: "8px",
                padding: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.75rem",
                  borderBottom: "1px solid var(--color-border, #E2E8F0)",
                  paddingBottom: "0.4rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Pill size={14} style={{ color: "#2563EB" }} />
                  <span className="type-label" style={{ fontWeight: 700, color: "var(--color-ink, #0F172A)" }}>
                    {isDoctor ? "ACTIVE PHARMACOTHERAPY" : "Current Medications"}
                  </span>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("medications")}
                    style={{ background: "none", border: "none", color: "#2563EB", fontSize: "0.7rem", cursor: "pointer", fontWeight: 600 }}
                  >
                    Prescriptions →
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {activeMedications.length === 0 ? (
                  <div style={{ fontSize: "0.75rem", color: "var(--color-ink-secondary, #64748B)" }}>
                    No active medications recorded.
                  </div>
                ) : (
                  activeMedications.map((m, i) => (
                    <div
                      key={m.id || i}
                      style={{
                        background: "var(--color-panel, #FFFFFF)",
                        border: "1px solid var(--color-border, #E2E8F0)",
                        borderRadius: "6px",
                        padding: "0.5rem 0.65rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", fontWeight: 700, color: "#1E3A8A" }}>
                          {m.name}
                        </span>
                        <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#047857", background: "#ECFDF5", padding: "0.1rem 0.35rem", borderRadius: "3px" }}>
                          {m.frequency}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--color-ink-secondary, #64748B)", marginTop: "0.2rem" }}>
                        {m.instructions || `Take with water.`}
                      </div>
                    </div>
                  ))
                )}

                {/* Treatment Advice */}
                {currentTreatmentPlan.length > 0 && (
                  <div style={{ marginTop: "0.25rem", paddingTop: "0.4rem", borderTop: "1px dashed var(--color-border, #E2E8F0)" }}>
                    <div className="type-micro" style={{ color: "var(--color-ink-muted, #94A3B8)", marginBottom: "0.25rem" }}>
                      LIFESTYLE & PROTOCOL
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-ink-secondary, #475569)", lineHeight: "1.35" }}>
                      {currentTreatmentPlan[1] || currentTreatmentPlan[0]}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Vitals & Recent Findings (Always in Doctor mode, combined in Patient mode) */}
            <div
              style={{
                background: "var(--color-surface, #F8FAFC)",
                border: "1px solid var(--color-border, #E2E8F0)",
                borderRadius: "8px",
                padding: "1rem",
                gridColumn: isDoctor ? "auto" : "1 / -1",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.75rem",
                  borderBottom: "1px solid var(--color-border, #E2E8F0)",
                  paddingBottom: "0.4rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Activity size={14} style={{ color: "#059669" }} />
                  <span className="type-label" style={{ fontWeight: 700, color: "var(--color-ink, #0F172A)" }}>
                    {isDoctor ? "LATEST VITALS & CLINICAL STATUS" : "Recent Vitals & Doctor Findings"}
                  </span>
                </div>
                <span className="type-micro" style={{ color: "var(--color-ink-muted, #94A3B8)" }}>
                  {latestVitals?.recordedAt || "Latest Consultation"}
                </span>
              </div>

              {/* Vitals Strip */}
              {latestVitals && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "0.35rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  {[
                    { label: "BP", value: latestVitals.bp || "128/82", unit: "mmHg" },
                    { label: "PULSE", value: latestVitals.pulse || "72", unit: "bpm" },
                    { label: "SpO₂", value: latestVitals.spo2 || "99%", unit: "" },
                    { label: "WT", value: latestVitals.weight || "74 kg", unit: "" },
                  ].map((vit) => (
                    <div
                      key={vit.label}
                      style={{
                        background: "var(--color-panel, #FFFFFF)",
                        border: "1px solid var(--color-border, #E2E8F0)",
                        borderRadius: "6px",
                        padding: "0.35rem 0.5rem",
                        textAlign: "center",
                      }}
                    >
                      <div className="type-micro" style={{ color: "var(--color-ink-muted, #94A3B8)", fontSize: "0.6rem" }}>
                        {vit.label}
                      </div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "var(--color-ink, #0F172A)" }}>
                        {vit.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Key Observations */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {recentKeyFindings.map((f, idx) => (
                  <div
                    key={f.id || idx}
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-ink-secondary, #475569)",
                      background: "var(--color-panel, #FFFFFF)",
                      border: "1px solid var(--color-border, #E2E8F0)",
                      borderRadius: "6px",
                      padding: "0.45rem 0.6rem",
                      lineHeight: "1.35",
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "var(--color-ink, #0F172A)" }}>{f.domain}: </span>
                    {f.finding}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Follow-up & Safety Disclaimer Bottom Strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.75rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid var(--color-border, #E2E8F0)",
              fontSize: "0.75rem",
            }}
          >
            {/* Follow-up reminder */}
            {followUpRequirements.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontWeight: 700,
                    color: "#D97706",
                    background: "#FEF3C7",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                  }}
                >
                  <Calendar size={12} /> UPCOMING FOLLOW-UP:
                </span>
                <span style={{ color: "var(--color-ink, #0F172A)", fontWeight: 600 }}>
                  {followUpRequirements[0].targetDate} — {followUpRequirements[0].purpose}
                </span>
              </div>
            )}

            {/* AI Safety Disclaimer */}
            <div
              style={{
                color: "var(--color-ink-muted, #94A3B8)",
                fontSize: "0.7rem",
                fontStyle: "italic",
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Info size={11} />
              <span>{safetyDisclaimer}</span>
            </div>
          </div>

        </div>
      )}

      <style>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinFast {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-slow {
          animation: spinSlow 4s linear infinite;
        }
        .spin-fast {
          animation: spinFast 0.6s linear infinite;
        }
        @media (max-width: 900px) {
          .ai-overview-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
