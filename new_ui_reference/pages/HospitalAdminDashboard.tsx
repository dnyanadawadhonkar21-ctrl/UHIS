import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import InstrumentPanel from "../components/ui/InstrumentPanel";
import DataRow from "../components/ui/DataRow";
import StatusCode from "../components/ui/StatusCode";
import Button from "../components/ui/Button";
import { useToast } from "../contexts/ToastContext";
import { hospitalStats, departments } from "../data/mockData";

const TABS = [
  { id: "overview", label: "OVERVIEW" },
  { id: "beds", label: "BED MANAGEMENT" },
  { id: "staff", label: "STAFF ROSTER" },
  { id: "reports", label: "DAILY REPORTS" },
];

const STAFF = [
  { id: "D-001", name: "Dr. Priya Sharma", dept: "Internal Medicine", shift: "08:00–16:00", status: "on_duty" },
  { id: "D-002", name: "Dr. Arjun Mehta", dept: "Cardiology", shift: "08:00–16:00", status: "on_duty" },
  { id: "D-003", name: "Dr. Sunita Rao", dept: "Pediatrics", shift: "16:00–00:00", status: "off_duty" },
  { id: "D-004", name: "Dr. Kiran Nair", dept: "Neurology", shift: "00:00–08:00", status: "off_duty" },
  { id: "D-005", name: "Dr. Rahul Desai", dept: "Emergency", shift: "08:00–16:00", status: "on_duty" },
  { id: "D-006", name: "Dr. Meera Pillai", dept: "Orthopedics", shift: "08:00–16:00", status: "leave" },
];

export default function HospitalAdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const occupancyPct = Math.round((hospitalStats.occupiedBeds / hospitalStats.totalBeds) * 100);
  const icuPct = Math.round((hospitalStats.icuOccupied / hospitalStats.icuBeds) * 100);

  return (
    <AppLayout tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* KPI strip */}
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
            { label: "TOTAL BEDS", value: hospitalStats.totalBeds, signal: "muted" },
            { label: "OCCUPIED", value: hospitalStats.occupiedBeds, signal: occupancyPct > 90 ? "critical" : "warning" },
            { label: "ICU OCCUPIED", value: `${hospitalStats.icuOccupied} / ${hospitalStats.icuBeds}`, signal: icuPct > 90 ? "critical" : "warning" },
            { label: "DOCTORS ON DUTY", value: hospitalStats.doctorsOnDuty, signal: "normal" },
          ].map(({ label, value, signal }, i) => (
            <div key={label} style={{ padding: "1.25rem", borderRight: i < 3 ? "1px solid var(--color-border)" : "none" }}>
              <div className="type-label" style={{ marginBottom: "0.4rem" }}>{label}</div>
              <div className="type-stat" style={{ color: signal === "muted" ? "var(--color-ink)" : `var(--color-signal-${signal})` }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="fade-in ha-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <InstrumentPanel title="Today's Activity" subtitle="FACILITY METRICS" channel="muted">
              <DataRow label="ADMISSIONS TODAY" value={<span className="status-info">{hospitalStats.admissionsToday}</span>} />
              <DataRow label="DISCHARGES TODAY" value={<span className="status-normal">{hospitalStats.dischargestoday}</span>} />
              <DataRow label="PENDING DISCHARGES" value={<span className="status-warning">{hospitalStats.pendingDischarges}</span>} />
              <DataRow label="ICU OCCUPANCY" value={<span className={icuPct > 90 ? "status-critical" : "status-warning"}>{icuPct}%</span>} />
              <DataRow label="GENERAL OCCUPANCY" value={<span className={occupancyPct > 90 ? "status-critical" : "status-warning"}>{occupancyPct}%</span>} />
            </InstrumentPanel>

            <InstrumentPanel title="Departmental Occupancy" subtitle="LIVE STATUS" channel="muted">
              {departments.map((d) => {
                const pct = Math.round((d.occupied / d.total) * 100);
                const sig = pct >= 90 ? "critical" : pct >= 75 ? "warning" : "normal";
                return (
                  <div key={d.name} style={{ padding: "0.625rem 1.25rem", borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>{d.name.toUpperCase()}</span>
                      <span className="type-value" style={{ fontSize: "0.8rem", fontWeight: 600, color: `var(--color-signal-${sig})` }}>
                        {d.occupied} / {d.total} · {pct}%
                      </span>
                    </div>
                    <div style={{ height: "4px", background: "var(--color-surface-alt)", width: "100%", borderRadius: "99px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: sig === "critical" ? "var(--color-signal-critical)"
                            : sig === "warning" ? "var(--color-signal-warning)"
                            : "var(--color-signal-normal)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </InstrumentPanel>

            <InstrumentPanel title="Emergency Contacts" subtitle="DUTY ROSTER" channel="critical">
              {[
                { label: "EMERGENCY PHYSICIAN ON CALL", val: "Dr. Rahul Desai · +91 98100 44221" },
                { label: "ICU ATTENDING", val: "Dr. Arjun Mehta · +91 98200 55441" },
                { label: "BLOOD BANK", val: "Ext. 2241 · External: 011-4422-8800" },
                { label: "AMBULANCE DISPATCH", val: "Ext. 1101 · 108" },
              ].map(({ label, val }) => (
                <DataRow key={label} label={label} value={val} />
              ))}
            </InstrumentPanel>

            <InstrumentPanel title="System Alerts" subtitle="ATTENTION REQUIRED" channel="warning">
              {[
                { msg: "ICU capacity at 77.5% — Monitor closely", sig: "warning" as const },
                { msg: "7 patients pending discharge — Bed management action needed", sig: "warning" as const },
                { msg: "Cardiology at 86.7% occupancy", sig: "critical" as const },
                { msg: "Emergency dept: 28/30 beds occupied", sig: "critical" as const },
              ].map(({ msg, sig }) => (
                <div
                  key={msg}
                  style={{
                    padding: "0.625rem 1.25rem",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "flex-start",
                  }}
                >
                  <span className={`status-${sig}`} style={{ flexShrink: 0, marginTop: "0.1rem" }}>
                    {sig === "critical" ? "■" : "◆"}
                  </span>
                  <span className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.8rem" }}>{msg}</span>
                </div>
              ))}
            </InstrumentPanel>
          </div>
        )}

        {activeTab === "beds" && (
          <div className="fade-in">
            {departments.map((d) => {
              const pct = Math.round((d.occupied / d.total) * 100);
              const sig = pct >= 90 ? "critical" : pct >= 75 ? "warning" : "normal";
              const avail = d.total - d.occupied;
              return (
                <div key={d.name} className={`instrument-panel channel-${sig}`} style={{ marginBottom: "1px" }}>
                  <div style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <div className="type-heading" style={{ marginBottom: "0.25rem" }}>{d.name}</div>
                      <div style={{ display: "flex", gap: "1.25rem" }}>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>TOTAL: {d.total}</span>
                        <span className="type-label" style={{ color: `var(--color-signal-${sig})`, fontWeight: 600 }}>OCCUPIED: {d.occupied}</span>
                        <span className="type-label" style={{ color: "var(--color-signal-normal)", fontWeight: 600 }}>AVAILABLE: {avail}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span className="type-value" style={{ fontSize: "1.4rem", fontWeight: 800, color: `var(--color-signal-${sig})`, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.02em" }}>{pct}%</span>
                      <Button variant="secondary" size="sm" onClick={() => toast.info(`Bed allocation report for ${d.name} exported.`)}>
                        REPORT
                      </Button>
                    </div>
                  </div>
                  <div style={{ padding: "0 1.25rem 1rem" }}>
                    <div style={{ height: "6px", background: "var(--color-surface-alt)" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: sig === "critical" ? "var(--color-signal-critical)"
                            : sig === "warning" ? "var(--color-signal-warning)"
                            : "var(--color-signal-normal)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "staff" && (
          <div className="fade-in">
            <div className="instrument-panel" style={{ overflow: "hidden" }}>
              <div className="panel-header">
                <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.15rem" }}>TODAY</div>
                <div className="type-heading">Doctor Duty Roster</div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["ID", "NAME", "DEPARTMENT", "SHIFT", "STATUS"].map((h) => (
                      <th key={h} className="type-label" style={{ padding: "0.6rem 1rem", textAlign: "left", color: "var(--color-ink-secondary)", background: "var(--color-surface)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STAFF.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "0.75rem 1rem" }}><span className="type-id" style={{ color: "var(--color-ink-muted)" }}>{s.id}</span></td>
                      <td style={{ padding: "0.75rem 1rem" }}><span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{s.name}</span></td>
                      <td style={{ padding: "0.75rem 1rem" }}><span className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.8rem" }}>{s.dept}</span></td>
                      <td style={{ padding: "0.75rem 1rem" }}><span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{s.shift}</span></td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <StatusCode
                          status={s.status === "on_duty" ? "normal" : s.status === "leave" ? "warning" : "muted"}
                          label={s.status.replace("_", " ").toUpperCase()}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <style>{`@media (max-width: 900px) { .ha-grid { grid-template-columns: 1fr !important; } }`}</style>
    </AppLayout>
  );
}
