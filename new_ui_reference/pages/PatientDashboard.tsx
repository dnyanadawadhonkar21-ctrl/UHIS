import { useState } from "react";
import { Edit, Download, AlertTriangle, Heart, Pill, FlaskConical, Calendar, Activity, Clock, Shield, Stethoscope, Syringe } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import InstrumentPanel from "../components/ui/InstrumentPanel";
import StatusCode from "../components/ui/StatusCode";
import DataRow from "../components/ui/DataRow";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PrecisionInput from "../components/ui/PrecisionInput";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import {
  patientData, conditions, allergies, vaccinations,
  medications, labReports, visits, timeline
} from "../data/mockData";

const TABS = [
  { id: "overview", label: "OVERVIEW" },
  { id: "conditions", label: "CONDITIONS" },
  { id: "medications", label: "MEDICATIONS" },
  { id: "labs", label: "LABS" },
  { id: "visits", label: "VISITS" },
  { id: "vaccinations", label: "VACCINATIONS" },
  { id: "allergies", label: "ALLERGIES" },
  { id: "timeline", label: "TIMELINE" },
];

const SEVERITY_SIGNAL: Record<string, "critical" | "warning" | "normal" | "muted"> = {
  severe: "critical", moderate: "warning", mild: "normal",
};

const STATUS_SIGNAL: Record<string, "critical" | "warning" | "normal" | "info" | "muted"> = {
  active: "warning", chronic: "critical", recovered: "normal", scheduled: "info", completed: "normal", cancelled: "muted",
  completed_r: "normal", due_soon: "warning", overdue: "critical",
  in_processing: "info", pending_collection: "warning", pending: "warning",
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [conditionFilter, setConditionFilter] = useState("ALL");
  const [visitTab, setVisitTab] = useState("upcoming");

  const activeConditions = conditions.filter((c) => c.status !== "recovered").length;
  const activeRx = medications.filter((m) => m.endDate === "Ongoing").length;
  const pendingLabs = labReports.filter((l) => l.status === "pending").length;
  const upcomingVisits = visits.filter((v) => v.status === "scheduled").length;
  const severeAllergies = allergies.filter((a) => a.severity === "severe").length;

  const handleTabChange = (id: string) => setActiveTab(id);

  return (
    <AppLayout tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Patient identity strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            marginBottom: "1.75rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "#16A34A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: "white",
              flexShrink: 0,
              letterSpacing: "-0.01em",
            }}
          >
            RV
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "var(--color-ink)", letterSpacing: "-0.025em" }}>
                {patientData.name}
              </span>
              <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{patientData.abhaId}</span>
              <span className="status-critical">{patientData.bloodGroup}</span>
            </div>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
              {[
                { l: "AGE", v: `${patientData.age}Y` },
                { l: "GENDER", v: patientData.gender },
                { l: "HEIGHT", v: patientData.height },
                { l: "WEIGHT", v: patientData.weight },
                { l: "PHYSICIAN", v: "Dr. Anita Desai" },
              ].map(({ l, v }) => (
                <div key={l} style={{ display: "flex", gap: "0.35rem" }}>
                  <span className="type-label" style={{ color: "var(--color-ink-muted)" }}>{l}</span>
                  <span className="type-label" style={{ color: "var(--color-ink-secondary)", fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Edit size={11} /> EDIT PROFILE
          </Button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="fade-in">
            {/* Summary readout */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                overflow: "hidden",
                marginBottom: "1.75rem",
                background: "var(--color-panel)",
              }}
              className="summary-grid"
            >
              {[
                { label: "CONDITIONS", value: activeConditions, signal: "warning", icon: Heart, tab: "conditions" },
                { label: "MEDICATIONS", value: activeRx, signal: "info", icon: Pill, tab: "medications" },
                { label: "PENDING LABS", value: pendingLabs, signal: "warning", icon: FlaskConical, tab: "labs" },
                { label: "UPCOMING VISITS", value: upcomingVisits, signal: "info", icon: Calendar, tab: "visits" },
                { label: "SEVERE ALLERGIES", value: severeAllergies, signal: "critical", icon: AlertTriangle, tab: "allergies" },
              ].map(({ label, value, signal, tab }, i) => (
                <div
                  key={label}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "1.25rem",
                    borderRight: i < 4 ? "1px solid var(--color-border)" : "none",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-panel)")}
                >
                  <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>{label}</span>
                  <span
                    className="type-stat"
                    style={{ color: signal === "muted" ? "var(--color-ink)" : `var(--color-signal-${signal})` }}
                  >
                    {value.toString().padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>

            {/* Severe allergy alert */}
            {severeAllergies > 0 && (
              <div
                style={{
                  background: "var(--color-signal-critical-bg)",
                  border: "1px solid var(--color-signal-critical-border)",
                  borderLeft: "3px solid var(--color-signal-critical)",
                  padding: "0.875rem 1.25rem",
                  marginBottom: "1.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span className="pulse-signal" style={{ color: "var(--color-signal-critical)", fontSize: "0.9rem" }}>●</span>
                <span className="type-label" style={{ color: "var(--color-signal-critical)", fontWeight: 700 }}>SEVERE ALLERGY ON RECORD:</span>
                <span className="type-value" style={{ color: "var(--color-signal-critical)" }}>
                  {allergies.filter((a) => a.severity === "severe").map((a) => a.allergen).join(" · ")}
                </span>
                <span className="type-micro" style={{ color: "var(--color-ink-secondary)", marginLeft: "auto" }}>
                  Inform all treating clinicians
                </span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }} className="overview-grid">
              {/* Recent lab results */}
              <InstrumentPanel title="Recent Lab Results" subtitle="LABORATORY" channel="info"
                action={<Button variant="secondary" size="sm" onClick={() => setActiveTab("labs")}>ALL LABS</Button>}>
                {labReports.slice(0, 4).map((r) => (
                  <div key={r.id} className="data-row">
                    <div style={{ flex: 1 }}>
                      <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.8rem" }}>{r.test}</div>
                      <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>{r.date} · {r.facility}</div>
                    </div>
                    <StatusCode status={r.signal as any} label={r.status.toUpperCase()} />
                  </div>
                ))}
              </InstrumentPanel>

              {/* Active medications */}
              <InstrumentPanel title="Active Medications" subtitle="CURRENT RX" channel="info"
                action={<Button variant="secondary" size="sm" onClick={() => setActiveTab("medications")}>ALL RX</Button>}>
                {medications.filter((m) => m.endDate === "Ongoing").map((m) => (
                  <div key={m.id} className="data-row">
                    <div style={{ flex: 1 }}>
                      <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.8rem" }}>{m.name} {m.dosage}</div>
                      <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>{m.frequency} · {m.category}</div>
                    </div>
                    <StatusCode status="info" label="ACTIVE" />
                  </div>
                ))}
              </InstrumentPanel>

              {/* Upcoming visits */}
              <InstrumentPanel title="Upcoming Appointments" subtitle="SCHEDULED VISITS" channel="normal"
                action={<Button variant="secondary" size="sm" onClick={() => setActiveTab("visits")}>ALL VISITS</Button>}>
                {visits.filter((v) => v.status === "scheduled").map((v) => (
                  <div key={v.id} className="data-row">
                    <div style={{ flex: 1 }}>
                      <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.8rem" }}>{v.doctor}</div>
                      <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>{v.date} · {v.time} · {v.facility}</div>
                    </div>
                    <StatusCode status="info" label="SCHEDULED" />
                  </div>
                ))}
              </InstrumentPanel>

              {/* Health vitals snapshot */}
              <InstrumentPanel title="Wellness Snapshot" subtitle="LAST RECORDED" channel="muted">
                {[
                  { label: "STEPS TODAY", value: "6,420", signal: "warning" },
                  { label: "SLEEP", value: "7h 15m", signal: "normal" },
                  { label: "HYDRATION", value: "2.1 L", signal: "warning" },
                  { label: "RESTING HEART RATE", value: "72 bpm", signal: "normal" },
                  { label: "BLOOD PRESSURE", value: "132 / 86 mmHg", signal: "warning" },
                  { label: "BLOOD GLUCOSE (FBG)", value: "Pending", signal: "muted" },
                ].map(({ label, value, signal }) => (
                  <DataRow key={label} label={label} value={<span className={`status-${signal}`}>{value}</span>} />
                ))}
              </InstrumentPanel>
            </div>
          </div>
        )}

        {/* CONDITIONS TAB */}
        {activeTab === "conditions" && (
          <div className="fade-in">
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              {["ALL", "ACTIVE", "CHRONIC", "RECOVERED"].map((f) => (
                <button
                  key={f}
                  onClick={() => setConditionFilter(f)}
                  className={conditionFilter === f ? "filter-pill-active" : "filter-pill"}
                >
                  {f}
                </button>
              ))}
            </div>
            {conditions
              .filter((c) => conditionFilter === "ALL" || c.status.toUpperCase() === conditionFilter)
              .map((c) => (
                <div
                  key={c.id}
                  className={`instrument-panel channel-${SEVERITY_SIGNAL[c.severity] || "muted"}`}
                  style={{ marginBottom: "1px" }}
                >
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                          <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{c.name}</span>
                          <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>ICD-10: {c.icd10}</span>
                        </div>
                        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
                            DIAGNOSED: {c.diagnosedDate}
                          </span>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
                            PHYSICIAN: {c.doctor}
                          </span>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
                            FACILITY: {c.facility}
                          </span>
                        </div>
                        {c.notes && (
                          <div className="type-body" style={{ color: "var(--color-ink-secondary)", marginTop: "0.5rem", fontSize: "0.8rem" }}>
                            {c.notes}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0 }}>
                        <StatusCode
                          status={STATUS_SIGNAL[c.status] || "muted"}
                          label={c.status.toUpperCase()}
                        />
                        <StatusCode
                          status={SEVERITY_SIGNAL[c.severity] || "muted"}
                          label={c.severity.toUpperCase()}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* MEDICATIONS TAB */}
        {activeTab === "medications" && (
          <div className="fade-in">
            {medications.map((m) => (
              <div
                key={m.id}
                className={`instrument-panel channel-${m.endDate === "Ongoing" ? "info" : "muted"}`}
                style={{ marginBottom: "1px" }}
              >
                <div style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                        <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{m.name}</span>
                        <span className="type-id" style={{ color: "var(--color-signal-info)" }}>{m.dosage}</span>
                        <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{m.category}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.25rem 1rem" }}>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>FREQUENCY: {m.frequency}</span>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>STARTED: {m.startDate}</span>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>UNTIL: {m.endDate}</span>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>PRESCRIBED BY: {m.prescribedBy}</span>
                      </div>
                      <div className="type-body" style={{ color: "var(--color-ink-secondary)", marginTop: "0.4rem", fontSize: "0.8rem" }}>
                        {m.instructions}
                      </div>
                    </div>
                    <StatusCode
                      status={m.endDate === "Ongoing" ? "info" : "muted"}
                      label={m.endDate === "Ongoing" ? "ACTIVE" : "COMPLETED"}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LABS TAB */}
        {activeTab === "labs" && (
          <div className="fade-in">
            {labReports.map((r) => (
              <div
                key={r.id}
                className={`instrument-panel channel-${r.signal}`}
                style={{ marginBottom: "1px" }}
              >
                <div style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                        <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{r.test}</span>
                        <StatusCode status={r.signal as any} label={r.status.toUpperCase()} />
                      </div>
                      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>DATE: {r.date}</span>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>FACILITY: {r.facility}</span>
                      </div>
                      {r.result && (
                        <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.8rem", margin: "0.35rem 0" }}>
                          RESULT: {r.result}
                        </div>
                      )}
                      <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>
                        REF: {r.reference}
                      </div>
                      {r.notes && (
                        <div className="type-body" style={{ color: "var(--color-ink-secondary)", marginTop: "0.35rem", fontSize: "0.8rem" }}>
                          {r.notes}
                        </div>
                      )}
                    </div>
                    {r.status === "completed" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toast.info(`Downloading ${r.test} report...`)}
                        style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}
                      >
                        <Download size={11} /> PDF
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VISITS TAB */}
        {activeTab === "visits" && (
          <div className="fade-in">
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
              {[["upcoming", "UPCOMING OPD"], ["past", "PAST VISITS"]].map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setVisitTab(t)}
                  className={visitTab === t ? "filter-pill-active" : "filter-pill"}
                >
                  {label}
                </button>
              ))}
            </div>
            {visits
              .filter((v) => visitTab === "upcoming" ? v.status === "scheduled" : v.status !== "scheduled")
              .map((v) => (
                <div
                  key={v.id}
                  className={`instrument-panel channel-${STATUS_SIGNAL[v.status] || "muted"}`}
                  style={{ marginBottom: "1px" }}
                >
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                          <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{v.doctor}</span>
                          <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{v.specialization}</span>
                        </div>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>DATE: {v.date} · {v.time}</span>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>FACILITY: {v.facility}</span>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>TOKEN: {v.token}</span>
                        </div>
                        <div className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.8rem" }}>
                          REASON: {v.reason}
                        </div>
                        {v.notes && (
                          <div className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.8rem", marginTop: "0.3rem" }}>
                            NOTES: {v.notes}
                          </div>
                        )}
                      </div>
                      <StatusCode status={STATUS_SIGNAL[v.status] as any} label={v.status.toUpperCase()} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* VACCINATIONS TAB */}
        {activeTab === "vaccinations" && (
          <div className="fade-in">
            {vaccinations.map((v) => (
              <div
                key={v.id}
                className={`instrument-panel channel-${v.status === "completed" ? "normal" : v.status === "due_soon" ? "warning" : "critical"}`}
                style={{ marginBottom: "1px" }}
              >
                <div style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                        <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{v.vaccine}</span>
                        <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{v.dose}</span>
                      </div>
                      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        {v.date && <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>DATE: {v.date}</span>}
                        {v.facility && <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>FACILITY: {v.facility}</span>}
                        {v.batch && <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>BATCH: {v.batch}</span>}
                        {v.nextDue && <span className="type-label" style={{ color: "var(--color-signal-warning)", fontWeight: 600 }}>NEXT DUE: {v.nextDue}</span>}
                      </div>
                    </div>
                    <StatusCode
                      status={v.status === "completed" ? "normal" : v.status === "due_soon" ? "warning" : "critical"}
                      label={v.status === "completed" ? "COMPLETED" : v.status === "due_soon" ? "DUE SOON" : "OVERDUE"}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ALLERGIES TAB */}
        {activeTab === "allergies" && (
          <div className="fade-in">
            {allergies.map((a) => (
              <div
                key={a.id}
                className={`instrument-panel channel-${SEVERITY_SIGNAL[a.severity] || "muted"}`}
                style={{ marginBottom: "1px" }}
              >
                <div style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                        <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{a.allergen}</span>
                        <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{a.category}</span>
                        {a.severity === "severe" && <span className="status-critical pulse-signal">● SEVERE</span>}
                      </div>
                      <div style={{ display: "flex", gap: "1rem", marginBottom: "0.35rem" }}>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>RECORDED: {a.recordedDate}</span>
                      </div>
                      <div className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.8rem" }}>
                        REACTION: {a.reaction}
                      </div>
                      <div className="type-body" style={{ color: "var(--color-signal-critical)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                        PRECAUTIONS: {a.precautions}
                      </div>
                    </div>
                    <StatusCode
                      status={SEVERITY_SIGNAL[a.severity] || "muted"}
                      label={a.severity.toUpperCase()}
                      pulse={a.severity === "severe"}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="fade-in">
            <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
              <div
                style={{
                  position: "absolute",
                  left: "6px",
                  top: 0,
                  bottom: 0,
                  width: "1px",
                  background: "var(--color-border)",
                }}
              />
              {timeline.map((t) => (
                <div
                  key={t.id}
                  style={{
                    position: "relative",
                    marginBottom: "1.25rem",
                    paddingLeft: "1.25rem",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "-6px",
                      top: "0.35rem",
                      width: "10px",
                      height: "10px",
                      background: t.signal === "critical" ? "var(--color-signal-critical)"
                        : t.signal === "warning" ? "var(--color-signal-warning)"
                        : t.signal === "info" ? "var(--color-signal-info)"
                        : "var(--color-signal-normal)",
                      flexShrink: 0,
                    }}
                  />
                  <div
                    className={`instrument-panel channel-${t.signal}`}
                    style={{ background: "var(--color-panel)" }}
                  >
                    <div style={{ padding: "0.875rem 1.25rem" }}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                        <span className="type-id" style={{ color: "var(--color-ink-secondary)", flexShrink: 0 }}>{t.date}</span>
                        <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{t.title}</span>
                      </div>
                      <span className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.8rem" }}>{t.detail}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Patient Profile" subtitle="PROFILE MANAGEMENT">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <PrecisionInput label="Height (cm)" defaultValue={patientData.height.replace(" cm", "")} />
            <PrecisionInput label="Weight (kg)" defaultValue={patientData.weight.replace(" kg", "")} />
          </div>
          <PrecisionInput label="Mobile Number" defaultValue={patientData.phone} />
          <PrecisionInput label="Emergency Contact" defaultValue={patientData.emergencyContact} />
          <PrecisionInput label="Primary Physician" defaultValue={patientData.primaryPhysician} />
          <PrecisionInput label="Full Address" defaultValue={patientData.address} />
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>CANCEL</Button>
            <Button onClick={() => { toast.success("Profile updated."); setEditOpen(false); }}>SAVE CHANGES</Button>
          </div>
        </div>
      </Modal>

      <style>{`
        @media (max-width: 900px) {
          .summary-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .overview-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .summary-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </AppLayout>
  );
}
