import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import InstrumentPanel from "../components/ui/InstrumentPanel";
import StatusCode from "../components/ui/StatusCode";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PrecisionInput from "../components/ui/PrecisionInput";
import { useToast } from "../contexts/ToastContext";
import { labOrders } from "../data/mockData";

const TABS = [
  { id: "orders", label: "TEST ORDERS" },
  { id: "entry", label: "RESULT ENTRY" },
  { id: "dispatch", label: "DISPATCH QUEUE" },
];

const STATUS_SIGNAL: Record<string, "warning" | "info" | "normal" | "critical"> = {
  pending_collection: "warning",
  in_processing: "info",
  completed: "normal",
};

const PRIORITY_SIGNAL: Record<string, "critical" | "warning" | "info"> = {
  stat: "critical",
  urgent: "warning",
  routine: "info",
};

export default function LabDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("orders");
  const [resultOpen, setResultOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(labOrders[0]);
  const [filter, setFilter] = useState("ALL");

  const filtered = filter === "ALL" ? labOrders
    : labOrders.filter((o) => o.status.replace("_", " ").toUpperCase() === filter);

  const stats = {
    total: labOrders.length,
    pending: labOrders.filter((o) => o.status === "pending_collection").length,
    processing: labOrders.filter((o) => o.status === "in_processing").length,
    completed: labOrders.filter((o) => o.status === "completed").length,
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
            { label: "TOTAL ORDERS", value: stats.total, signal: "muted" },
            { label: "PENDING COLLECTION", value: stats.pending, signal: "warning" },
            { label: "IN PROCESSING", value: stats.processing, signal: "info" },
            { label: "COMPLETED", value: stats.completed, signal: "normal" },
          ].map(({ label, value, signal }, i) => (
            <div key={label} style={{ padding: "1.25rem", borderRight: i < 3 ? "1px solid var(--color-border)" : "none" }}>
              <div className="type-label" style={{ marginBottom: "0.4rem" }}>{label}</div>
              <div className="type-stat" style={{ color: signal === "muted" ? "var(--color-ink)" : `var(--color-signal-${signal})` }}>
                {value.toString().padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>

        {activeTab === "orders" && (
          <div className="fade-in">
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              {["ALL", "PENDING COLLECTION", "IN PROCESSING", "COMPLETED"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={filter === f ? "filter-pill-active" : "filter-pill"}
                >
                  {f}
                </button>
              ))}
            </div>

            {labOrders.map((o) => (
              <div
                key={o.id}
                className={`instrument-panel channel-${STATUS_SIGNAL[o.status]}`}
                style={{ marginBottom: "1px" }}
              >
                <div style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                      <span className="type-id" style={{ color: "var(--color-ink-muted)" }}>{o.id}</span>
                      <StatusCode status={PRIORITY_SIGNAL[o.priority]} label={o.priority.toUpperCase()} />
                    </div>
                    <div className="type-value" style={{ color: "var(--color-ink)", marginBottom: "0.3rem" }}>{o.test}</div>
                    <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                      <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>PATIENT: {o.patient}</span>
                      <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>ORDERED BY: {o.orderedBy}</span>
                      <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>DATE: {o.orderedDate}</span>
                      {o.sampleDate && <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>SAMPLE: {o.sampleDate}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <StatusCode status={STATUS_SIGNAL[o.status]} label={o.status.replace(/_/g, " ").toUpperCase()} />
                    {o.status !== "completed" && (
                      <Button
                        size="sm"
                        onClick={() => { setSelectedOrder(o); setResultOpen(true); }}
                      >
                        {o.status === "pending_collection" ? "COLLECT" : "ENTER RESULT"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "entry" && (
          <div className="fade-in">
            <InstrumentPanel title="Manual Result Entry" subtitle="RESULT ENTRY FORM" channel="info">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <PrecisionInput label="Order ID" placeholder="LO-2024-XXXX-XXX" />
                  <PrecisionInput label="Patient ABHA ID / Name" placeholder="91-XXXX-XXXX-XXXX" />
                </div>
                <PrecisionInput label="Test Name" placeholder="HbA1c, CBC, Lipid Profile..." />
                <PrecisionInput label="Result Value" placeholder="e.g. 6.8%, 14.8 g/dL, 112 mg/dL" />
                <PrecisionInput label="Reference Range" placeholder="e.g. Normal: < 5.7%" />
                <div>
                  <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.35rem" }}>CLINICAL NOTES</div>
                  <textarea
                    className="precision-input"
                    style={{ minHeight: "80px", resize: "vertical", fontFamily: "'Inter', sans-serif" }}
                    placeholder="Optional pathologist notes..."
                  />
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <Button onClick={() => toast.success("Result saved and patient notified.")}>SAVE & NOTIFY PATIENT</Button>
                  <Button variant="secondary" onClick={() => toast.info("Result saved as draft.")}>SAVE DRAFT</Button>
                </div>
              </div>
            </InstrumentPanel>
          </div>
        )}

        {activeTab === "dispatch" && (
          <div className="fade-in">
            <InstrumentPanel title="Report Dispatch Queue" subtitle="COMPLETED REPORTS" channel="normal">
              {labOrders.filter((o) => o.status === "completed").map((o) => (
                <div key={o.id} className="data-row">
                  <div>
                    <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{o.test}</div>
                    <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>{o.patient} · {o.orderedDate}</div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Button size="sm" variant="secondary" onClick={() => toast.info(`PDF dispatched to ${o.patient}.`)}>DISPATCH PDF</Button>
                  </div>
                </div>
              ))}
            </InstrumentPanel>
          </div>
        )}
      </div>

      <Modal isOpen={resultOpen} onClose={() => setResultOpen(false)} title="Enter Test Result" subtitle="RESULT ENTRY">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="type-value" style={{ color: "var(--color-ink)" }}>{selectedOrder.test}</div>
          <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>Patient: {selectedOrder.patient} · {selectedOrder.id}</div>
          <PrecisionInput label="Result Value" placeholder="Enter measured value with units" />
          <PrecisionInput label="Reference Range" placeholder="Normal range for this test" />
          <div>
            <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.35rem" }}>CLINICAL NOTES</div>
            <textarea className="precision-input" style={{ minHeight: "70px", resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Button variant="secondary" onClick={() => setResultOpen(false)}>CANCEL</Button>
            <Button onClick={() => { toast.success("Result saved. Patient notified."); setResultOpen(false); }}>SAVE & NOTIFY</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
