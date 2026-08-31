import React, { useState, useEffect } from "react";
import { Edit, Download, AlertTriangle, Heart, Pill, FlaskConical, Calendar } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import InstrumentPanel from "../components/ui/InstrumentPanel";
import StatusCode from "../components/ui/StatusCode";
import DataRow from "../components/ui/DataRow";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PrecisionInput from "../components/ui/PrecisionInput";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import {
  patientData as defaultPatient,
  conditions as defaultConditions,
  allergies as defaultAllergies,
  vaccinations as defaultVaccinations,
  medications as defaultMedications,
  labReports as defaultLabReports,
  visits as defaultVisits,
  timelineEvents as defaultTimeline,
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

const SEVERITY_SIGNAL = {
  severe: "critical",
  moderate: "warning",
  mild: "normal",
};

const STATUS_SIGNAL = {
  active: "warning",
  chronic: "critical",
  recovered: "normal",
  scheduled: "info",
  completed: "normal",
  cancelled: "muted",
  due: "warning",
  due_soon: "warning",
  overdue: "critical",
  pending: "warning",
  processing: "info",
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [conditionFilter, setConditionFilter] = useState("ALL");
  const [visitTab, setVisitTab] = useState("upcoming");

  const [patient, setPatient] = useState(defaultPatient);
  const [conditionsList, setConditionsList] = useState(defaultConditions);
  const [allergiesList, setAllergiesList] = useState(defaultAllergies);
  const [vaccinationsList, setVaccinationsList] = useState(defaultVaccinations);
  const [medicationsList, setMedicationsList] = useState(defaultMedications);
  const [labReportsList, setLabReportsList] = useState(defaultLabReports);
  const [visitsList, setVisitsList] = useState(defaultVisits);
  const [timelineList, setTimelineList] = useState(defaultTimeline);

  useEffect(() => {
    fetchRealPatientData();
  }, []);

  const fetchRealPatientData = async () => {
    try {
      const res = await api.get('/patients/profile').catch(() => null);
      if (res && res.data && res.data.success && res.data.patientData) {
        const { patient: p, diseases: d, allergies: a, vaccinations: v, medications: m, labReports: l } = res.data.patientData;
        if (p) {
          setPatient({
            ...defaultPatient,
            name: p.user?.fullName || p.fullName || defaultPatient.name,
            abhaId: p.abhaId || defaultPatient.abhaId,
            gender: p.gender || defaultPatient.gender,
            bloodGroup: p.bloodGroup || defaultPatient.bloodGroup,
            phone: p.user?.phoneNumber || p.phoneNumber || defaultPatient.phone,
            address: p.address || defaultPatient.address,
          });
        }
        if (d && d.length > 0) setConditionsList(d);
        if (a && a.length > 0) setAllergiesList(a);
        if (v && v.length > 0) setVaccinationsList(v);
        if (m && m.length > 0) setMedicationsList(m);
        if (l && l.length > 0) setLabReportsList(l);
      }
    } catch (e) {
      console.warn("Using offline patient dataset");
    }
  };

  const activeConditions = conditionsList.filter((c) => (c.status || '').toLowerCase() !== "recovered").length;
  const activeRx = medicationsList.filter((m) => (m.status || '').toLowerCase() === "active" || m.endDate === "Ongoing").length;
  const pendingLabs = labReportsList.filter((l) => (l.status || '').toLowerCase() === "pending").length;
  const upcomingVisits = visitsList.filter((v) => (v.status || '').toLowerCase() === "scheduled" || (v.status || '').toLowerCase() === "confirmed").length;
  const severeAllergies = allergiesList.filter((a) => (a.severity || '').toLowerCase() === "severe").length;

  const handleTabChange = (id) => setActiveTab(id);

  const initials = (patient.name || "Rahul Verma")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "var(--color-ink)", letterSpacing: "-0.025em" }}>
                {patient.name}
              </span>
              <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{patient.abhaId}</span>
              <span className="status-critical">{patient.bloodGroup}</span>
            </div>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
              {[
                { l: "AGE", v: `${patient.age || 35}Y` },
                { l: "GENDER", v: patient.gender },
                { l: "HEIGHT", v: patient.height },
                { l: "WEIGHT", v: patient.weight },
                { l: "PHYSICIAN", v: patient.primaryPhysician || "Dr. Anita Desai" },
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
                    transition: "all 150ms ease",
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
                  {allergiesList.filter((a) => (a.severity || '').toLowerCase() === "severe").map((a) => a.allergen).join(" · ")}
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
                {labReportsList.slice(0, 4).map((r) => (
                  <div key={r.id} className="data-row">
                    <div style={{ flex: 1 }}>
                      <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{r.testName || r.test}</div>
                      <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>{r.date || r.sampleDate} · {r.facility || "Pathology Dept"}</div>
                    </div>
                    <StatusCode status={(r.status === "completed" ? "normal" : "warning")} label={(r.status || "completed").toUpperCase()} />
                  </div>
                ))}
              </InstrumentPanel>

              {/* Active medications */}
              <InstrumentPanel title="Active Medications" subtitle="CURRENT RX" channel="info"
                action={<Button variant="secondary" size="sm" onClick={() => setActiveTab("medications")}>ALL RX</Button>}>
                {medicationsList.slice(0, 4).map((m) => (
                  <div key={m.id} className="data-row">
                    <div style={{ flex: 1 }}>
                      <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{m.name} {m.dosage}</div>
                      <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>{m.frequency}</div>
                    </div>
                    <StatusCode status="info" label="ACTIVE" />
                  </div>
                ))}
              </InstrumentPanel>

              {/* Upcoming visits */}
              <InstrumentPanel title="Upcoming Appointments" subtitle="SCHEDULED VISITS" channel="normal"
                action={<Button variant="secondary" size="sm" onClick={() => setActiveTab("visits")}>ALL VISITS</Button>}>
                {visitsList.slice(0, 3).map((v) => (
                  <div key={v.id} className="data-row">
                    <div style={{ flex: 1 }}>
                      <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{v.doctor}</div>
                      <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>{v.date || v.appointmentDate} · {v.facility || "Main Hospital"}</div>
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
                  { label: "BLOOD GLUCOSE (FBG)", value: "118 mg/dL", signal: "normal" },
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
            {conditionsList
              .filter((c) => conditionFilter === "ALL" || (c.status || '').toUpperCase() === conditionFilter)
              .map((c) => (
                <div
                  key={c.id}
                  className={`instrument-panel channel-${SEVERITY_SIGNAL[(c.severity || '').toLowerCase()] || "muted"}`}
                  style={{ marginBottom: "1px" }}
                >
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                          <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{c.name}</span>
                          <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>ICD-10: {c.icd10 || c.icdCode || "E11.9"}</span>
                        </div>
                        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
                            DIAGNOSED: {c.diagnosedDate ? new Date(c.diagnosedDate).toLocaleDateString('en-IN') : 'N/A'}
                          </span>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
                            PHYSICIAN: {c.doctor || c.treatingDoctor || "General Physician"}
                          </span>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
                            FACILITY: {c.facility || c.hospital || "UHIS Network"}
                          </span>
                        </div>
                        {c.notes && (
                          <div className="type-body" style={{ color: "var(--color-ink-secondary)", marginTop: "0.5rem", fontSize: "0.85rem" }}>
                            {c.notes}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0 }}>
                        <StatusCode
                          status={STATUS_SIGNAL[(c.status || '').toLowerCase()] || "muted"}
                          label={(c.status || "ACTIVE").toUpperCase()}
                        />
                        <StatusCode
                          status={SEVERITY_SIGNAL[(c.severity || '').toLowerCase()] || "muted"}
                          label={(c.severity || "MILD").toUpperCase()}
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
            {medicationsList.map((m) => (
              <div
                key={m.id}
                className={`instrument-panel channel-${m.endDate === "Ongoing" || m.status === "active" ? "info" : "muted"}`}
                style={{ marginBottom: "1px" }}
              >
                <div style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                        <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{m.name}</span>
                        <span className="type-id" style={{ color: "var(--color-signal-info)" }}>{m.dosage}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.25rem 1rem" }}>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>FREQUENCY: {m.frequency}</span>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>STARTED: {m.startDate}</span>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>UNTIL: {m.endDate || "Ongoing"}</span>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>PRESCRIBED BY: {m.prescribedBy}</span>
                      </div>
                      {m.instructions && (
                        <div className="type-body" style={{ color: "var(--color-ink-secondary)", marginTop: "0.4rem", fontSize: "0.85rem" }}>
                          {m.instructions}
                        </div>
                      )}
                    </div>
                    <StatusCode
                      status={m.endDate === "Ongoing" || m.status === "active" ? "info" : "muted"}
                      label={m.endDate === "Ongoing" || m.status === "active" ? "ACTIVE" : "COMPLETED"}
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
            {labReportsList.map((r) => (
              <div
                key={r.id}
                className={`instrument-panel channel-${r.abnormal ? "warning" : "normal"}`}
                style={{ marginBottom: "1px" }}
              >
                <div style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                        <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{r.testName || r.test}</span>
                        <StatusCode status={r.status === "completed" ? "normal" : "warning"} label={(r.status || "COMPLETED").toUpperCase()} />
                      </div>
                      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>DATE: {r.date || r.sampleDate}</span>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>FACILITY: {r.facility || "Pathology Department"}</span>
                      </div>
                      {(r.resultData || r.summary) && (
                        <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem", margin: "0.35rem 0" }}>
                          RESULT: {r.resultData || r.summary}
                        </div>
                      )}
                    </div>
                    {r.status === "completed" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toast.info(`Downloading ${r.testName || r.test} report PDF...`)}
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
            {visitsList
              .filter((v) => visitTab === "upcoming" ? (v.status || '').toLowerCase() === "scheduled" || (v.status || '').toLowerCase() === "confirmed" : (v.status || '').toLowerCase() !== "scheduled")
              .map((v) => (
                <div
                  key={v.id}
                  className={`instrument-panel channel-${STATUS_SIGNAL[(v.status || '').toLowerCase()] || "muted"}`}
                  style={{ marginBottom: "1px" }}
                >
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                          <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{v.doctor}</span>
                          <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{v.specialty || v.specialization || "General Medicine"}</span>
                        </div>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>DATE: {v.date || v.appointmentDate}</span>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>FACILITY: {v.facility || "AIIMS New Delhi"}</span>
                        </div>
                        <div className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                          REASON: {v.reason || "Routine Consultation"}
                        </div>
                      </div>
                      <StatusCode status={STATUS_SIGNAL[(v.status || '').toLowerCase()] || "muted"} label={(v.status || "SCHEDULED").toUpperCase()} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* VACCINATIONS TAB */}
        {activeTab === "vaccinations" && (
          <div className="fade-in">
            {vaccinationsList.map((v) => (
              <div
                key={v.id}
                className={`instrument-panel channel-${(v.status || '').toLowerCase() === "completed" ? "normal" : "warning"}`}
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
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>DATE: {v.date || v.dateAdministered}</span>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>FACILITY: {v.facility || v.hospital || "UHIS Health Center"}</span>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>BATCH: {v.batch || v.batchNumber || "COV-2021-8812"}</span>
                      </div>
                    </div>
                    <StatusCode
                      status={(v.status || '').toLowerCase() === "completed" ? "normal" : "warning"}
                      label={(v.status || "COMPLETED").toUpperCase()}
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
            {allergiesList.map((a) => (
              <div
                key={a.id}
                className={`instrument-panel channel-${SEVERITY_SIGNAL[(a.severity || '').toLowerCase()] || "muted"}`}
                style={{ marginBottom: "1px" }}
              >
                <div style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                        <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{a.allergen}</span>
                        <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{a.category}</span>
                        {(a.severity || '').toLowerCase() === "severe" && <span className="status-critical pulse-signal">● SEVERE</span>}
                      </div>
                      <div className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                        REACTION: {a.reaction || (Array.isArray(a.symptoms) ? a.symptoms.join(', ') : 'Allergic reaction')}
                      </div>
                      {a.precautions && (
                        <div className="type-body" style={{ color: "var(--color-signal-critical)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                          PRECAUTIONS: {a.precautions}
                        </div>
                      )}
                    </div>
                    <StatusCode
                      status={SEVERITY_SIGNAL[(a.severity || '').toLowerCase()] || "muted"}
                      label={(a.severity || "MILD").toUpperCase()}
                      pulse={(a.severity || '').toLowerCase() === "severe"}
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
              {timelineList.map((t) => (
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
                      borderRadius: "50%",
                      background: "var(--color-accent-primary)",
                      flexShrink: 0,
                    }}
                  />
                  <div
                    className="instrument-panel channel-info"
                    style={{ background: "var(--color-panel)" }}
                  >
                    <div style={{ padding: "0.875rem 1.25rem" }}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                        <span className="type-id" style={{ color: "var(--color-ink-secondary)", flexShrink: 0 }}>{t.date}</span>
                        <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{t.title}</span>
                      </div>
                      <span className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>{t.summary || t.detail}</span>
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
            <PrecisionInput label="Height (cm)" defaultValue={patient.height.replace(" cm", "")} />
            <PrecisionInput label="Weight (kg)" defaultValue={patient.weight.replace(" kg", "")} />
          </div>
          <PrecisionInput label="Mobile Number" defaultValue={patient.phone} />
          <PrecisionInput label="Emergency Contact" defaultValue={patient.emergencyContact} />
          <PrecisionInput label="Primary Physician" defaultValue={patient.primaryPhysician} />
          <PrecisionInput label="Full Address" defaultValue={patient.address} />
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
