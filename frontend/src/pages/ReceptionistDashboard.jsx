import React, { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import InstrumentPanel from "../components/ui/InstrumentPanel";
import DataRow from "../components/ui/DataRow";
import StatusCode from "../components/ui/StatusCode";
import Button from "../components/ui/Button";
import PrecisionInput from "../components/ui/PrecisionInput";
import Modal from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";

const TABS = [
  { id: "checkin", label: "CHECK-IN" },
  { id: "doctors", label: "DOCTOR AVAILABILITY" },
  { id: "tokens", label: "TOKEN MANAGEMENT" },
];

const DOCTORS = [
  { id: "D-001", name: "Dr. Priya Sharma", dept: "Internal Medicine", slots: 5, status: "available" },
  { id: "D-002", name: "Dr. Arjun Mehta", dept: "Cardiology", slots: 2, status: "available" },
  { id: "D-003", name: "Dr. Sunita Rao", dept: "Pediatrics", slots: 0, status: "full" },
  { id: "D-004", name: "Dr. Kiran Nair", dept: "Neurology", slots: 8, status: "available" },
  { id: "D-005", name: "Dr. Rahul Desai", dept: "Emergency", slots: 3, status: "available" },
  { id: "D-006", name: "Dr. Meera Pillai", dept: "Orthopedics", slots: 0, status: "leave" },
];

let tokenCounter = 7;

export default function ReceptionistDashboard() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("checkin");
  const [searchVal, setSearchVal] = useState("");
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(DOCTORS[0]);
  const [issuedTokens, setIssuedTokens] = useState([
    { token: "006", name: "Vikram Singh", doctor: "Dr. Priya Sharma", time: "09:14" },
    { token: "005", name: "Deepa Nair", doctor: "Dr. Priya Sharma", time: "09:02" },
  ]);
  const [walkInForm, setWalkInForm] = useState({ name: "", phone: "", age: "", gender: "Male", complaint: "" });

  const handleIssueToken = () => {
    const token = String(tokenCounter++).padStart(3, "0");
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setIssuedTokens((prev) => [
      { token, name: walkInForm.name || "Walk-in Patient", doctor: selectedDoctor.name, time },
      ...prev,
    ]);
    toast.success(`Token #${token} issued — ${selectedDoctor.name}`);
    setTokenModalOpen(false);
    setWalkInForm({ name: "", phone: "", age: "", gender: "Male", complaint: "" });
  };

  return (
    <AppLayout tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

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
            { label: "TOKENS ISSUED TODAY", value: issuedTokens.length, signal: "muted" },
            { label: "DOCTORS AVAILABLE", value: DOCTORS.filter((d) => d.status === "available").length, signal: "normal" },
            { label: "DOCTORS FULL", value: DOCTORS.filter((d) => d.status === "full").length, signal: "warning" },
            { label: "ON LEAVE TODAY", value: DOCTORS.filter((d) => d.status === "leave").length, signal: "muted" },
          ].map(({ label, value, signal }, i) => (
            <div key={label} style={{ padding: "1.25rem", borderRight: i < 3 ? "1px solid var(--color-border)" : "none" }}>
              <div className="type-label" style={{ marginBottom: "0.4rem" }}>{label}</div>
              <div className="type-stat" style={{ color: signal === "muted" ? "var(--color-ink)" : `var(--color-signal-${signal})` }}>
                {value.toString().padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>

        {activeTab === "checkin" && (
          <div className="fade-in rc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <InstrumentPanel title="Patient Lookup" subtitle="ABHA ID / QR SCAN" channel="info">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                <input
                  className="precision-input"
                  placeholder="ABHA ID, Mobile, or Name"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Button onClick={() => toast.info(`Searching: ${searchVal}`)}>SEARCH</Button>
              </div>
              <div className="type-body" style={{ color: "var(--color-ink-secondary)", padding: "1.5rem 0", textAlign: "center", fontSize: "0.8rem" }}>
                Scan patient QR code or enter ABHA ID to look up their record and assign a doctor slot.
              </div>
            </InstrumentPanel>

            <InstrumentPanel title="Quick Token Issue" subtitle="WALK-IN REGISTRATION" channel="normal"
              action={<Button size="sm" onClick={() => setTokenModalOpen(true)}>+ ISSUE TOKEN</Button>}>
              {issuedTokens.slice(0, 5).map((t) => (
                <div key={t.token} className="data-row">
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline" }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: "1rem", color: "var(--color-ink)" }}>
                      #{t.token}
                    </span>
                    <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.8rem" }}>{t.name}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>{t.doctor}</div>
                    <div className="type-micro" style={{ color: "var(--color-ink-muted)" }}>{t.time}</div>
                  </div>
                </div>
              ))}
            </InstrumentPanel>
          </div>
        )}

        {activeTab === "doctors" && (
          <div className="fade-in">
            {DOCTORS.map((d) => (
              <div
                key={d.id}
                className={`instrument-panel channel-${d.status === "available" && d.slots > 0 ? "normal" : d.status === "full" ? "warning" : "muted"}`}
                style={{ marginBottom: "1px" }}
              >
                <div style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.2rem" }}>
                      <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{d.name}</span>
                      <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{d.dept}</span>
                    </div>
                    <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
                      {d.status === "available" ? `${d.slots} SLOTS AVAILABLE` : d.status === "full" ? "SLOTS FULL" : "ON LEAVE"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <StatusCode
                      status={d.status === "available" && d.slots > 0 ? "normal" : d.status === "full" ? "warning" : "muted"}
                      label={d.status === "leave" ? "ON LEAVE" : d.status === "full" ? "FULL" : "AVAILABLE"}
                    />
                    {d.status === "available" && d.slots > 0 && (
                      <Button
                        size="sm"
                        onClick={() => { setSelectedDoctor(d); setTokenModalOpen(true); }}
                      >
                        ASSIGN PATIENT
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "tokens" && (
          <div className="fade-in">
            <div className="instrument-panel" style={{ overflow: "hidden" }}>
              <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.15rem" }}>TODAY</div>
                  <div className="type-heading">Issued Tokens</div>
                </div>
                <Button size="sm" onClick={() => setTokenModalOpen(true)}>+ ISSUE TOKEN</Button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["TOKEN", "PATIENT NAME", "ASSIGNED DOCTOR", "TIME ISSUED"].map((h) => (
                      <th key={h} className="type-label" style={{ padding: "0.6rem 1rem", textAlign: "left", color: "var(--color-ink-secondary)", background: "var(--color-surface)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {issuedTokens.map((t) => (
                    <tr key={t.token} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: "1rem" }}>#{t.token}</span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}><span className="type-value" style={{ fontSize: "0.85rem" }}>{t.name}</span></td>
                      <td style={{ padding: "0.75rem 1rem" }}><span className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.8rem" }}>{t.doctor}</span></td>
                      <td style={{ padding: "0.75rem 1rem" }}><span className="type-id" style={{ color: "var(--color-ink-muted)" }}>{t.time}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={tokenModalOpen} onClose={() => setTokenModalOpen(false)} title="Issue OPD Token" subtitle="WALK-IN REGISTRATION">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <PrecisionInput label="Patient Name" value={walkInForm.name} onChange={(e) => setWalkInForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full Name" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <PrecisionInput label="Mobile" value={walkInForm.phone} onChange={(e) => setWalkInForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
            <PrecisionInput label="Age" type="number" value={walkInForm.age} onChange={(e) => setWalkInForm((f) => ({ ...f, age: e.target.value }))} placeholder="35" />
          </div>
          <div>
            <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.35rem" }}>ASSIGN DOCTOR</div>
            <select className="precision-input" value={selectedDoctor.id}
              onChange={(e) => setSelectedDoctor(DOCTORS.find((d) => d.id === e.target.value) || DOCTORS[0])}>
              {DOCTORS.filter((d) => d.status === "available" && d.slots > 0).map((d) => (
                <option key={d.id} value={d.id}>{d.name} · {d.dept} · {d.slots} slots</option>
              ))}
            </select>
          </div>
          <PrecisionInput label="Chief Complaint" value={walkInForm.complaint} onChange={(e) => setWalkInForm((f) => ({ ...f, complaint: e.target.value }))} placeholder="Brief description" />
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <Button variant="secondary" onClick={() => setTokenModalOpen(false)}>CANCEL</Button>
            <Button onClick={handleIssueToken}>ISSUE TOKEN + PRINT SLIP</Button>
          </div>
        </div>
      </Modal>

      <style>{`@media (max-width: 900px) { .rc-grid { grid-template-columns: 1fr !important; } }`}</style>
    </AppLayout>
  );
}
