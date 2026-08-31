import React, { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import InstrumentPanel from "../components/ui/InstrumentPanel";
import DataRow from "../components/ui/DataRow";
import StatusCode from "../components/ui/StatusCode";
import Button from "../components/ui/Button";
import PrecisionInput from "../components/ui/PrecisionInput";
import Modal from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";
import { prescriptionQueue } from "../data/mockData";

const TABS = [
  { id: "queue", label: "RX QUEUE" },
  { id: "verify", label: "VERIFY PRESCRIPTION" },
  { id: "inventory", label: "STOCK ALERTS" },
];

const LOW_STOCK = [
  { name: "Metformin HCl 500mg", sku: "MF-500-BL", stock: 42, reorderAt: 100, unit: "tabs" },
  { name: "Amoxicillin 500mg Cap", sku: "AMX-500-C", stock: 18, reorderAt: 50, unit: "caps" },
  { name: "ORS Sachets (Electral)", sku: "ORS-ELC-S", stock: 30, reorderAt: 80, unit: "sachets" },
  { name: "Amlodipine 5mg", sku: "AML-5-TB", stock: 55, reorderAt: 60, unit: "tabs" },
  { name: "Insulin Glargine 100U/mL", sku: "INS-GLG-V", stock: 8, reorderAt: 20, unit: "vials" },
];

export default function PharmacyDashboard() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("queue");
  const [lookupVal, setLookupVal] = useState("");
  const [dispensed, setDispensed] = useState(["RX-2024-0711-0038"]);

  const stats = {
    total: prescriptionQueue.length,
    pending: prescriptionQueue.filter((r) => r.status === "pending").length,
    dispensed: prescriptionQueue.filter((r) => r.status === "dispensed").length,
    lowStock: LOW_STOCK.filter((s) => s.stock < s.reorderAt).length,
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
            { label: "RX QUEUE TODAY", value: stats.total, signal: "muted" },
            { label: "PENDING DISPENSE", value: stats.pending, signal: "warning" },
            { label: "DISPENSED", value: stats.dispensed, signal: "normal" },
            { label: "LOW STOCK ALERTS", value: stats.lowStock, signal: "critical" },
          ].map(({ label, value, signal }, i) => (
            <div key={label} style={{ padding: "1.25rem", borderRight: i < 3 ? "1px solid var(--color-border)" : "none" }}>
              <div className="type-label" style={{ marginBottom: "0.4rem" }}>{label}</div>
              <div className="type-stat" style={{ color: signal === "muted" ? "var(--color-ink)" : `var(--color-signal-${signal})` }}>
                {value.toString().padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>

        {activeTab === "queue" && (
          <div className="fade-in">
            {prescriptionQueue.map((rx) => {
              const isDispensed = dispensed.includes(rx.rxId || rx.id);
              return (
                <div
                  key={rx.rxId || rx.id}
                  className={`instrument-panel channel-${isDispensed ? "normal" : "warning"}`}
                  style={{ marginBottom: "1.25rem" }}
                >
                  <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.15rem" }}>
                        {rx.rxId || rx.id} · {rx.issued || rx.issuedDate}
                      </div>
                      <div className="type-heading">{rx.patient || rx.patientName}</div>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <StatusCode status={isDispensed ? "normal" : "warning"} label={isDispensed ? "DISPENSED" : "PENDING"} />
                      {!isDispensed && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setDispensed((d) => [...d, rx.rxId || rx.id]);
                            toast.success(`Rx ${rx.rxId || rx.id} dispensed successfully.`);
                          }}
                        >
                          DISPENSE ALL →
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 1.25rem", background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
                      <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>PRESCRIBED BY: {rx.doctor || rx.prescribedBy}</span>
                      <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>ABHA: {rx.abhaId || "91-4782-3391-6284"}</span>
                    </div>
                    {(rx.items || []).map((item, i) => (
                      <div
                        key={i}
                        className="data-row"
                        style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
                      >
                        <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{item.name}</span>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>QTY: {item.qty}</span>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>{item.frequency}</span>
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>{item.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "verify" && (
          <div className="fade-in">
            <InstrumentPanel title="Prescription Verification" subtitle="LOOKUP" channel="info">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <input
                  className="precision-input"
                  placeholder="Enter Rx Number or Patient Mobile / ABHA ID"
                  value={lookupVal}
                  onChange={(e) => setLookupVal(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Button onClick={() => toast.info(`Searching for: ${lookupVal}`)}>LOOKUP</Button>
              </div>
              <div className="type-body" style={{ color: "var(--color-ink-secondary)", padding: "2rem 0", textAlign: "center" }}>
                Enter an Rx number, ABHA ID, or patient mobile to verify a prescription.
              </div>
            </InstrumentPanel>
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="fade-in">
            {LOW_STOCK.map((s) => {
              const pct = Math.round((s.stock / s.reorderAt) * 100);
              const sig = pct < 50 ? "critical" : "warning";
              return (
                <div
                  key={s.sku}
                  className={`instrument-panel channel-${sig}`}
                  style={{ marginBottom: "1px" }}
                >
                  <div style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.25rem" }}>
                        <span className="type-value" style={{ color: "var(--color-ink)" }}>{s.name}</span>
                        <span className="type-id" style={{ color: "var(--color-ink-muted)" }}>{s.sku}</span>
                      </div>
                      <div style={{ height: "4px", background: "var(--color-surface-alt)", width: "200px", marginTop: "0.4rem", borderRadius: "99px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(pct, 100)}%`,
                            background: sig === "critical" ? "var(--color-signal-critical)" : "var(--color-signal-warning)",
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                      <div>
                        <div className="type-label" style={{ color: "var(--color-ink-secondary)" }}>CURRENT STOCK</div>
                        <div className="type-value" style={{ fontSize: "1.1rem", fontWeight: 600, color: `var(--color-signal-${sig})` }}>{s.stock} {s.unit}</div>
                      </div>
                      <div>
                        <div className="type-label" style={{ color: "var(--color-ink-secondary)" }}>REORDER AT</div>
                        <div className="type-value" style={{ fontSize: "1.1rem" }}>{s.reorderAt} {s.unit}</div>
                      </div>
                      <Button size="sm" onClick={() => toast.success(`Reorder placed for ${s.name}.`)}>REORDER</Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
