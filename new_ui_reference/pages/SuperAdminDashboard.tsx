import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import InstrumentPanel from "../components/ui/InstrumentPanel";
import DataRow from "../components/ui/DataRow";
import StatusCode from "../components/ui/StatusCode";
import Button from "../components/ui/Button";
import { useToast } from "../contexts/ToastContext";

const TABS = [
  { id: "grid", label: "NETWORK GRID" },
  { id: "onboarding", label: "ONBOARDING QUEUE" },
  { id: "security", label: "SECURITY & AUDIT" },
  { id: "api", label: "API HEALTH" },
];

const HOSPITALS_PENDING = [
  { id: "HOS-2026-0041", name: "Shree Ganesh Medical Centre", city: "Pune", beds: 120, submitted: "2026-08-28", status: "pending_review" },
  { id: "HOS-2026-0038", name: "KC Hospital & Research", city: "Hyderabad", beds: 280, submitted: "2026-08-25", status: "pending_review" },
  { id: "HOS-2026-0035", name: "Sunrise Multispeciality", city: "Bengaluru", beds: 180, submitted: "2026-08-20", status: "documents_pending" },
];

const AUDIT_LOG = [
  { time: "2026-08-31 14:22", event: "BULK RECORD ACCESS", user: "DR-4421 · AIIMS Delhi", level: "warning" },
  { time: "2026-08-31 13:15", event: "FAILED LOGIN × 5", user: "IP 203.193.45.22", level: "critical" },
  { time: "2026-08-31 11:44", event: "API KEY ROTATED", user: "SA-001 · System Admin", level: "normal" },
  { time: "2026-08-31 09:30", event: "HOSPITAL ONBOARDED", user: "SA-001 · System Admin", level: "info" },
  { time: "2026-08-30 22:11", event: "SCHEDULED BACKUP", user: "SYSTEM", level: "normal" },
];

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("grid");

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
            { label: "CONNECTED HOSPITALS", value: "847", signal: "normal" },
            { label: "REGISTERED ABHA IDs", value: "10.2M", signal: "info" },
            { label: "API CALLS TODAY", value: "3.1M", signal: "normal" },
            { label: "PENDING ONBOARDING", value: "3", signal: "warning" },
          ].map(({ label, value, signal }, i) => (
            <div key={label} style={{ padding: "1.25rem", borderRight: i < 3 ? "1px solid var(--color-border)" : "none" }}>
              <div className="type-label" style={{ marginBottom: "0.4rem" }}>{label}</div>
              <div className="type-stat" style={{ color: signal === "muted" ? "var(--color-ink)" : `var(--color-signal-${signal})` }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {activeTab === "grid" && (
          <div className="fade-in sa-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <InstrumentPanel title="System Health" subtitle="LIVE MONITORING" channel="normal">
              {[
                { l: "API GATEWAY", v: "● OPERATIONAL", s: "normal" },
                { l: "DATABASE CLUSTER (IN-WEST)", v: "● ONLINE · 4ms", s: "normal" },
                { l: "DATABASE CLUSTER (IN-EAST)", v: "● ONLINE · 7ms", s: "normal" },
                { l: "ABHA VERIFICATION SERVICE", v: "● ONLINE", s: "normal" },
                { l: "NOTIFICATION BROKER", v: "◆ DEGRADED", s: "warning" },
                { l: "PDF GENERATION SERVICE", v: "● ONLINE", s: "normal" },
                { l: "BACKUP SERVICE", v: "● SCHEDULED 02:00", s: "info" },
              ].map(({ l, v, s }) => (
                <DataRow key={l} label={l} value={<span className={`status-${s}`}>{v}</span>} />
              ))}
            </InstrumentPanel>

            <InstrumentPanel title="National Grid Statistics" subtitle="AGGREGATE METRICS" channel="info">
              {[
                { l: "STATES CONNECTED", v: "28 / 28" },
                { l: "UNION TERRITORIES", v: "8 / 8" },
                { l: "AYUSHMAN BHARAT FACILITIES", v: "12,441" },
                { l: "PRIVATE HOSPITALS", v: "4,022" },
                { l: "DIAGNOSTIC LABS", v: "8,831" },
                { l: "PHARMACIES", v: "31,204" },
                { l: "RECORDS CREATED TODAY", v: "1,204,318" },
                { l: "API UPTIME (30 DAYS)", v: "99.97%" },
              ].map(({ l, v }) => (
                <DataRow key={l} label={l} value={v} />
              ))}
            </InstrumentPanel>
          </div>
        )}

        {activeTab === "onboarding" && (
          <div className="fade-in">
            {HOSPITALS_PENDING.map((h) => (
              <div
                key={h.id}
                className={`instrument-panel channel-${h.status === "documents_pending" ? "warning" : "info"}`}
                style={{ marginBottom: "1px" }}
              >
                <div style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                      <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{h.name}</span>
                      <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{h.id}</span>
                    </div>
                    <div style={{ display: "flex", gap: "1.25rem" }}>
                      <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>CITY: {h.city}</span>
                      <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>BEDS: {h.beds}</span>
                      <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>SUBMITTED: {h.submitted}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <StatusCode
                      status={h.status === "documents_pending" ? "warning" : "info"}
                      label={h.status.replace("_", " ").toUpperCase()}
                    />
                    <Button size="sm" onClick={() => toast.success(`${h.name} approved and onboarded.`)}>APPROVE</Button>
                    <Button variant="secondary" size="sm" onClick={() => toast.warning(`${h.name} rejected.`)}>REJECT</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "security" && (
          <div className="fade-in">
            <div className="instrument-panel" style={{ overflow: "hidden" }}>
              <div className="panel-header">
                <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.15rem" }}>LAST 24 HOURS</div>
                <div className="type-heading">Security Audit Log</div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["TIMESTAMP", "EVENT", "USER / SOURCE", "LEVEL"].map((h) => (
                      <th key={h} className="type-label" style={{ padding: "0.6rem 1rem", textAlign: "left", color: "var(--color-ink-secondary)", background: "var(--color-surface)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AUDIT_LOG.map((a, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "0.7rem 1rem" }}><span className="type-id" style={{ color: "var(--color-ink-muted)" }}>{a.time}</span></td>
                      <td style={{ padding: "0.7rem 1rem" }}><span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{a.event}</span></td>
                      <td style={{ padding: "0.7rem 1rem" }}><span className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.8rem" }}>{a.user}</span></td>
                      <td style={{ padding: "0.7rem 1rem" }}>
                        <StatusCode status={a.level as any} label={a.level.toUpperCase()} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "api" && (
          <div className="fade-in sa-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <InstrumentPanel title="API Endpoint Health" subtitle="REAL-TIME" channel="normal">
              {[
                { endpoint: "POST /api/v2/auth/login", latency: "18ms", req: "2,441/min", status: "normal" },
                { endpoint: "GET /api/v2/records/:id", latency: "12ms", req: "8,820/min", status: "normal" },
                { endpoint: "POST /api/v2/prescription", latency: "34ms", req: "441/min", status: "normal" },
                { endpoint: "GET /api/v2/lab-reports", latency: "22ms", req: "1,203/min", status: "normal" },
                { endpoint: "POST /api/v2/abha/verify", latency: "89ms", req: "320/min", status: "warning" },
                { endpoint: "POST /api/v2/notifications", latency: "142ms", req: "1,100/min", status: "warning" },
              ].map((e) => (
                <div key={e.endpoint} className="data-row">
                  <span className="type-id" style={{ color: "var(--color-ink-secondary)", fontSize: "0.72rem" }}>{e.endpoint}</span>
                  <span className="type-value" style={{ fontSize: "0.75rem", flexShrink: 0, color: `var(--color-signal-${e.status})`, fontWeight: 600 }}>
                    {e.latency}
                  </span>
                </div>
              ))}
            </InstrumentPanel>
            <InstrumentPanel title="Traffic Overview" subtitle="TODAY" channel="info">
              {[
                { l: "TOTAL API CALLS", v: "3,104,441" },
                { l: "PEAK REQUESTS/SEC", v: "1,204" },
                { l: "4XX ERRORS", v: "1,220 (0.04%)" },
                { l: "5XX ERRORS", v: "12 (0.0004%)" },
                { l: "CACHE HIT RATE", v: "87.3%" },
                { l: "CDN EDGE NODES", v: "12 ACTIVE" },
                { l: "RATE LIMITED REQUESTS", v: "440" },
              ].map(({ l, v }) => (
                <DataRow key={l} label={l} value={v} />
              ))}
            </InstrumentPanel>
          </div>
        )}
      </div>
      <style>{`@media (max-width: 900px) { .sa-grid { grid-template-columns: 1fr !important; } }`}</style>
    </AppLayout>
  );
}
