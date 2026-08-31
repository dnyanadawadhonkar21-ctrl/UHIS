import { useState } from "react";
import { Stethoscope, FileText, Plus, X } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import InstrumentPanel from "../components/ui/InstrumentPanel";
import StatusCode from "../components/ui/StatusCode";
import DataRow from "../components/ui/DataRow";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PrecisionInput from "../components/ui/PrecisionInput";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { opdQueue, patientData, conditions, medications, labReports } from "../data/mockData";

const TABS = [
  { id: "queue", label: "OPD QUEUE" },
  { id: "consultation", label: "CONSULTATION" },
  { id: "prescription", label: "PRESCRIPTIONS" },
  { id: "records", label: "PATIENT RECORDS" },
];

const STATUS_SIGNAL: Record<string, "info" | "warning" | "normal" | "muted"> = {
  in_consultation: "info",
  waiting: "warning",
  completed: "normal",
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("queue");
  const [activePatient, setActivePatient] = useState(opdQueue[0]);
  const [rxOpen, setRxOpen] = useState(false);
  const [rxItems, setRxItems] = useState([{ name: "", dosage: "", frequency: "1-0-1", duration: "" }]);
  const [clinicalNotes, setClinicalNotes] = useState("");

  const addRxItem = () =>
    setRxItems((prev) => [...prev, { name: "", dosage: "", frequency: "1-0-1", duration: "" }]);

  const removeRxItem = (i: number) =>
    setRxItems((prev) => prev.filter((_, idx) => idx !== i));

  const stats = {
    total: opdQueue.length,
    waiting: opdQueue.filter((p) => p.status === "waiting").length,
    inConsultation: opdQueue.filter((p) => p.status === "in_consultation").length,
    completed: opdQueue.filter((p) => p.status === "completed").length,
  };

  return (
    <AppLayout tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* OPD stats strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            border: "1px solid var(--color-border)",
            background: "var(--color-panel)",
            borderRadius: "10px",
            overflow: "hidden",
            marginBottom: "1.75rem",
          }}
        >
          {[
            { label: "TOTAL TODAY", value: stats.total, signal: "muted" },
            { label: "WAITING", value: stats.waiting, signal: "warning" },
            { label: "IN CONSULTATION", value: stats.inConsultation, signal: "info" },
            { label: "COMPLETED", value: stats.completed, signal: "normal" },
          ].map(({ label, value, signal }, i) => (
            <div
              key={label}
              style={{
                padding: "1.25rem",
                borderRight: i < 3 ? "1px solid var(--color-border)" : "none",
              }}
            >
              <div className="type-label" style={{ marginBottom: "0.4rem" }}>{label}</div>
              <div
                className="type-stat"
                style={{ color: signal === "muted" ? "var(--color-ink)" : `var(--color-signal-${signal})` }}
              >
                {value.toString().padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>

        {/* OPD QUEUE TAB */}
        {activeTab === "queue" && (
          <div className="fade-in">
            <div className="instrument-panel" style={{ overflow: "hidden" }}>
              <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.15rem" }}>TODAY</div>
                  <div className="type-heading">OPD Patient Queue</div>
                </div>
                <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>
                  Dr. {user?.name} · {user?.specialization}
                </div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["TOKEN", "PATIENT", "AGE / GENDER", "CHIEF COMPLAINT", "ABHA ID", "STATUS", "ACTION"].map((h) => (
                      <th
                        key={h}
                        className="type-label"
                        style={{
                          padding: "0.6rem 1rem",
                          textAlign: "left",
                          color: "var(--color-ink-secondary)",
                          background: "var(--color-surface)",
                          fontWeight: 600,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {opdQueue.map((p) => (
                    <tr
                      key={p.token}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        background: activePatient.token === p.token ? "var(--color-signal-info-bg)" : "var(--color-panel)",
                      }}
                    >
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "1rem", fontWeight: 800 }}>
                          {p.token}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{p.name}</span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>
                          {p.age}Y · {p.gender}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", maxWidth: "220px" }}>
                        <span className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.8rem" }}>
                          {p.complaint}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span className="type-id" style={{ color: "var(--color-ink-muted)" }}>{p.abhaId}</span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <StatusCode status={STATUS_SIGNAL[p.status]} label={p.status.replace("_", " ").toUpperCase()} />
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {p.status !== "completed" && (
                          <Button
                            size="sm"
                            variant={p.status === "in_consultation" ? "primary" : "secondary"}
                            onClick={() => { setActivePatient(p); setActiveTab("consultation"); }}
                          >
                            {p.status === "in_consultation" ? "ACTIVE" : "START"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONSULTATION TAB */}
        {activeTab === "consultation" && (
          <div className="fade-in consult-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.25rem" }}>
            {/* Patient summary */}
            <div>
              <InstrumentPanel title={activePatient.name} subtitle="ACTIVE CONSULTATION" channel="info"
                action={<span className="type-value" style={{ color: "var(--color-ink)", fontSize: "1.5rem", fontWeight: 800 }}>#{activePatient.token}</span>}>
                <DataRow label="AGE / GENDER" value={`${activePatient.age}Y · ${activePatient.gender}`} />
                <DataRow label="ABHA ID" value={activePatient.abhaId} />
                <DataRow label="CHIEF COMPLAINT" value={activePatient.complaint} />
                <DataRow label="BLOOD GROUP" value="O+" />
                <DataRow label="KNOWN ALLERGIES" value={<span className="status-critical">■ Penicillin</span>} />
                <DataRow label="ACTIVE CONDITIONS" value="T2DM · Hypertension" />
                <DataRow label="CURRENT RX" value="Metformin · Amlodipine" />
              </InstrumentPanel>

              <InstrumentPanel title="Recent Labs" subtitle="LAST VISIT" channel="muted">
                {labReports.slice(0, 3).map((r) => (
                  <DataRow
                    key={r.id}
                    label={r.test}
                    value={<span className={`status-${r.signal}`}>{r.result || "PENDING"}</span>}
                  />
                ))}
              </InstrumentPanel>
            </div>

            {/* Clinical workspace */}
            <div>
              <InstrumentPanel title="Clinical Notes" subtitle="CONSULTATION WORKSPACE" channel="muted">
                <div>
                  <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.5rem" }}>
                    PRESENTING COMPLAINT & ASSESSMENT
                  </div>
                  <textarea
                    className="precision-input"
                    style={{ minHeight: "140px", resize: "vertical", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem" }}
                    placeholder="Enter clinical notes, examination findings, assessment..."
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                  />
                </div>
                <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.35rem" }}>DIAGNOSIS (ICD-10)</div>
                    <input className="precision-input" placeholder="E11.9, I10..." />
                  </div>
                  <div>
                    <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.35rem" }}>FOLLOW-UP</div>
                    <input className="precision-input" type="date" />
                  </div>
                </div>
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
                  <Button onClick={() => setRxOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <FileText size={12} /> BUILD PRESCRIPTION
                  </Button>
                  <Button variant="secondary" onClick={() => toast.success("Consultation notes saved.")}>
                    SAVE NOTES
                  </Button>
                  <Button
                    variant="secondary"
                    style={{ marginLeft: "auto" }}
                    onClick={() => { toast.success("Consultation completed. Next patient."); setActiveTab("queue"); }}
                  >
                    END CONSULTATION →
                  </Button>
                </div>
              </InstrumentPanel>

              {/* Vital parameters */}
              <InstrumentPanel title="Vital Parameters" subtitle="RECORDED THIS VISIT" channel="muted">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", padding: "0.5rem 0" }}>
                  {[
                    { l: "Blood Pressure", p: "mmHg" },
                    { l: "Heart Rate", p: "bpm" },
                    { l: "Temperature", p: "°C" },
                    { l: "SpO₂", p: "%" },
                    { l: "Respiratory Rate", p: "/min" },
                    { l: "Weight", p: "kg" },
                  ].map(({ l, p }) => (
                    <div key={l}>
                      <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.25rem" }}>{l.toUpperCase()}</div>
                      <input className="precision-input" placeholder={p} />
                    </div>
                  ))}
                </div>
              </InstrumentPanel>
            </div>
          </div>
        )}

        {/* RECORDS TAB */}
        {activeTab === "records" && (
          <div className="fade-in">
            <InstrumentPanel title="Medical History — Rahul Verma" subtitle="PATIENT EHR" channel="muted">
              {conditions.map((c) => (
                <div key={c.id} className="data-row">
                  <div>
                    <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{c.name}</span>
                    <span className="type-micro" style={{ color: "var(--color-ink-secondary)", marginLeft: "0.5rem" }}>{c.icd10}</span>
                  </div>
                  <StatusCode
                    status={c.status === "chronic" ? "critical" : c.status === "active" ? "warning" : "normal"}
                    label={c.status.toUpperCase()}
                  />
                </div>
              ))}
            </InstrumentPanel>
          </div>
        )}
      </div>

      {/* Prescription Builder Modal */}
      <Modal isOpen={rxOpen} onClose={() => setRxOpen(false)} title="Digital Prescription Builder" subtitle="RX BUILDER" width="680px">
        <div style={{ marginBottom: "1rem" }}>
          <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.5rem" }}>
            PATIENT: {activePatient.name} · {activePatient.abhaId}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {rxItems.map((item, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                gap: "0.5rem",
                alignItems: "end",
                padding: "0.75rem",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <PrecisionInput label="Medication" value={item.name} onChange={(e) =>
                setRxItems((prev) => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))
              } placeholder="Metformin HCl" />
              <PrecisionInput label="Dosage" value={item.dosage} onChange={(e) =>
                setRxItems((prev) => prev.map((x, idx) => idx === i ? { ...x, dosage: e.target.value } : x))
              } placeholder="500mg" />
              <div>
                <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.35rem" }}>FREQUENCY</div>
                <select
                  className="precision-input"
                  value={item.frequency}
                  onChange={(e) => setRxItems((prev) => prev.map((x, idx) => idx === i ? { ...x, frequency: e.target.value } : x))}
                >
                  {["1-0-0", "0-0-1", "1-0-1", "1-1-0", "1-1-1", "As needed"].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
              <PrecisionInput label="Duration" value={item.duration} onChange={(e) =>
                setRxItems((prev) => prev.map((x, idx) => idx === i ? { ...x, duration: e.target.value } : x))
              } placeholder="7 days" />
              <button
                onClick={() => removeRxItem(i)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-signal-critical)", padding: "0 0 4px" }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={addRxItem} style={{ display: "flex", alignItems: "center", gap: "0.4rem", width: "fit-content" }}>
            <Plus size={11} /> ADD MEDICATION
          </Button>
        </div>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
          <Button variant="secondary" onClick={() => setRxOpen(false)}>CANCEL</Button>
          <Button onClick={() => { toast.success("Prescription saved and dispatched."); setRxOpen(false); }}>
            SIGN & DISPATCH →
          </Button>
        </div>
      </Modal>

      <style>{`
        @media (max-width: 900px) {
          .consult-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppLayout>
  );
}
