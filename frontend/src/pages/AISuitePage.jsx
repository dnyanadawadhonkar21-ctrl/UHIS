import React, { useState } from "react";
import { Send, Brain, FlaskConical, AlertTriangle, Scan } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import InstrumentPanel from "../components/ui/InstrumentPanel";
import Button from "../components/ui/Button";
import { useToast } from "../context/ToastContext";

const TABS = [
  { id: "symptom", label: "SYMPTOM CHECKER" },
  { id: "explainer", label: "LAB EXPLAINER" },
  { id: "ddi", label: "DRUG INTERACTION" },
  { id: "ocr", label: "OCR SCANNER" },
];

const SYMPTOM_RESPONSES = [
  "Based on reported symptoms — persistent headache, facial pressure, and nasal congestion — probable diagnoses include: Sinusitis (ICD-10: J32.9), Tension-type headache (G44.2), or Allergic rhinitis (J30.9). Recommendation: consult ENT for physical examination and possibly sinus X-ray.",
  "Symptoms suggest mild upper respiratory tract infection. Monitor for fever > 38.5°C, difficulty breathing, or worsening. Symptomatic management recommended. Seek care if symptoms persist beyond 5 days.",
  "Reported fatigue, polyuria, and polydipsia are classic symptoms of uncontrolled hyperglycaemia. Immediate fasting blood glucose and HbA1c recommended. Consult endocrinologist.",
];

const DDI_RESPONSES = [
  { drugs: ["Metformin", "Alcohol"], level: "warning", msg: "Concurrent use may increase risk of lactic acidosis. Avoid alcohol while on Metformin therapy." },
  { drugs: ["Warfarin", "Aspirin"], level: "critical", msg: "Significantly increased bleeding risk. Avoid combination unless benefits clearly outweigh risks. Monitor INR closely." },
  { drugs: ["Amlodipine", "Atorvastatin"], level: "info", msg: "Monitor for myopathy with Atorvastatin doses > 20mg. No dose adjustment required at standard doses." },
];

export default function AISuitePage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("symptom");
  const [symptomInput, setSymptomInput] = useState("");
  const [symptomResult, setSymptomResult] = useState(null);
  const [labInput, setLabInput] = useState("");
  const [labResult, setLabResult] = useState(null);
  const [drug1, setDrug1] = useState("");
  const [drug2, setDrug2] = useState("");
  const [ddiResult, setDdiResult] = useState(null);
  const [ocrFile, setOcrFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const simulateAI = async (fn) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    fn();
    setLoading(false);
  };

  const handleSymptomCheck = () => {
    if (!symptomInput) { toast.error("Enter symptoms first."); return; }
    simulateAI(() => setSymptomResult(SYMPTOM_RESPONSES[Math.floor(Math.random() * SYMPTOM_RESPONSES.length)]));
  };

  const handleLabExplain = () => {
    if (!labInput) { toast.error("Paste lab values first."); return; }
    simulateAI(() => setLabResult(
      `ANALYSIS OF ENTERED LAB VALUES:\n\nHbA1c 6.8% — Slightly above normal (>6.5% diagnostic for T2DM). Patient is in diabetic range. Monitor with current Metformin regimen and lifestyle modifications.\n\nLDL 112 mg/dL — Marginally above optimal (<100 mg/dL for diabetic patients). Continue Atorvastatin and reinforce dietary fat reduction.\n\nAll other CBC and KFT parameters are within normal reference ranges. No immediate intervention required.`
    ));
  };

  const handleDDI = () => {
    if (!drug1 || !drug2) { toast.error("Enter both medications."); return; }
    simulateAI(() => {
      const match = DDI_RESPONSES.find((d) =>
        d.drugs.some((x) => x.toLowerCase().includes(drug1.toLowerCase())) &&
        d.drugs.some((x) => x.toLowerCase().includes(drug2.toLowerCase()))
      );
      setDdiResult(match || {
        drugs: [drug1, drug2],
        level: "normal",
        msg: `No clinically significant interaction found between ${drug1} and ${drug2}. Administer as prescribed. Always verify with a clinical pharmacist.`,
      });
    });
  };

  return (
    <AppLayout tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Identity header */}
        <div
          style={{
            background: "var(--color-signal-info-bg)",
            border: "1px solid var(--color-signal-info-border)",
            borderLeft: "3px solid var(--color-signal-info)",
            borderRadius: "8px",
            padding: "1rem 1.25rem",
            marginBottom: "1.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <Brain size={18} style={{ color: "var(--color-signal-info)", flexShrink: 0 }} />
          <div>
            <span className="type-label" style={{ color: "var(--color-signal-info)", fontWeight: 600 }}>UHIS CLINICAL AI SUITE</span>
            <div className="type-micro" style={{ color: "var(--color-ink-secondary)", marginTop: "0.15rem" }}>
              For clinical decision support only. Not a substitute for professional medical judgment.
            </div>
          </div>
        </div>

        {/* SYMPTOM CHECKER */}
        {activeTab === "symptom" && (
          <div className="fade-in">
            <InstrumentPanel title="AI Symptom Checker" subtitle="TRIAGE SUPPORT" channel="info">
              <div style={{ marginBottom: "1rem" }}>
                <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.5rem" }}>
                  DESCRIBE SYMPTOMS
                </div>
                <textarea
                  className="precision-input"
                  style={{ minHeight: "120px", resize: "vertical" }}
                  placeholder="Describe symptoms, duration, severity, and any relevant medical history..."
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSymptomCheck}
                disabled={loading}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Send size={12} /> {loading ? "ANALYSING..." : "RUN ASSESSMENT"}
              </Button>
              {symptomResult && (
                <div
                  style={{
                    marginTop: "1.25rem",
                    background: "var(--color-signal-info-bg)",
                    border: "1px solid var(--color-signal-info-border)",
                    borderLeft: "3px solid var(--color-signal-info)",
                    padding: "1rem 1.25rem",
                    borderRadius: "6px",
                  }}
                >
                  <div className="type-label" style={{ color: "var(--color-signal-info)", fontWeight: 600, marginBottom: "0.5rem" }}>
                    ● AI TRIAGE ASSESSMENT
                  </div>
                  <div className="type-body" style={{ color: "var(--color-ink)", lineHeight: 1.7, fontSize: "0.85rem" }}>
                    {symptomResult}
                  </div>
                </div>
              )}
            </InstrumentPanel>
          </div>
        )}

        {/* LAB EXPLAINER */}
        {activeTab === "explainer" && (
          <div className="fade-in">
            <InstrumentPanel title="Lab Report Explainer" subtitle="PLAIN LANGUAGE TRANSLATION" channel="normal">
              <div style={{ marginBottom: "1rem" }}>
                <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.5rem" }}>
                  PASTE LAB VALUES
                </div>
                <textarea
                  className="precision-input"
                  style={{ minHeight: "120px", resize: "vertical" }}
                  placeholder="Paste lab report values here. e.g. HbA1c: 6.8%, LDL: 112, HDL: 48, eGFR: 89..."
                  value={labInput}
                  onChange={(e) => setLabInput(e.target.value)}
                />
              </div>
              <Button
                onClick={handleLabExplain}
                disabled={loading}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                <FlaskConical size={12} /> {loading ? "PROCESSING..." : "EXPLAIN IN PLAIN LANGUAGE"}
              </Button>
              {labResult && (
                <div
                  style={{
                    marginTop: "1.25rem",
                    background: "var(--color-signal-normal-bg)",
                    border: "1px solid var(--color-signal-normal-border)",
                    borderLeft: "3px solid var(--color-signal-normal)",
                    padding: "1rem 1.25rem",
                    borderRadius: "6px",
                  }}
                >
                  <div className="type-label" style={{ color: "var(--color-signal-normal)", fontWeight: 600, marginBottom: "0.5rem" }}>
                    ● AI INTERPRETATION
                  </div>
                  <pre
                    className="type-body"
                    style={{
                      color: "var(--color-ink)",
                      lineHeight: 1.7,
                      fontSize: "0.875rem",
                      whiteSpace: "pre-wrap",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {labResult}
                  </pre>
                </div>
              )}
            </InstrumentPanel>
          </div>
        )}

        {/* DRUG-DRUG INTERACTION */}
        {activeTab === "ddi" && (
          <div className="fade-in">
            <InstrumentPanel title="Drug-Drug Interaction Checker" subtitle="POLYPHARMACY SAFETY" channel="warning">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.35rem" }}>DRUG 1</div>
                  <input
                    className="precision-input"
                    placeholder="e.g. Warfarin"
                    value={drug1}
                    onChange={(e) => setDrug1(e.target.value)}
                  />
                </div>
                <div>
                  <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.35rem" }}>DRUG 2</div>
                  <input
                    className="precision-input"
                    placeholder="e.g. Aspirin"
                    value={drug2}
                    onChange={(e) => setDrug2(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={handleDDI}
                disabled={loading}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                <AlertTriangle size={12} /> {loading ? "CHECKING..." : "CHECK INTERACTION"}
              </Button>
              {ddiResult && (
                <div
                  style={{
                    marginTop: "1.25rem",
                    background: ddiResult.level === "critical" ? "var(--color-signal-critical-bg)"
                      : ddiResult.level === "warning" ? "var(--color-signal-warning-bg)"
                      : "var(--color-signal-normal-bg)",
                    border: `1px solid ${ddiResult.level === "critical" ? "var(--color-signal-critical-border)"
                      : ddiResult.level === "warning" ? "var(--color-signal-warning-border)"
                      : "var(--color-signal-normal-border)"}`,
                    borderLeft: `3px solid var(--color-signal-${ddiResult.level})`,
                    padding: "1rem 1.25rem",
                    borderRadius: "6px",
                  }}
                >
                  <div className="type-label" style={{ color: `var(--color-signal-${ddiResult.level})`, fontWeight: 600, marginBottom: "0.5rem" }}>
                    ● INTERACTION RESULT: {ddiResult.level.toUpperCase()}
                  </div>
                  <div className="type-body" style={{ color: "var(--color-ink)", lineHeight: 1.7, fontSize: "0.85rem" }}>
                    {ddiResult.msg}
                  </div>
                </div>
              )}

              {/* Quick reference */}
              <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-border)" }}>
                <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.75rem" }}>
                  DEMO PAIRS TO TRY
                </div>
                {DDI_RESPONSES.map((d, i) => (
                  <div
                    key={i}
                    style={{ padding: "0.4rem 0", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", cursor: "pointer" }}
                    onClick={() => { setDrug1(d.drugs[0]); setDrug2(d.drugs[1]); }}
                  >
                    <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>
                      {d.drugs[0]} + {d.drugs[1]}
                    </span>
                    <span className={`status-${d.level}`}>{d.level.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </InstrumentPanel>
          </div>
        )}

        {/* OCR SCANNER */}
        {activeTab === "ocr" && (
          <div className="fade-in">
            <InstrumentPanel title="Medical OCR Scanner" subtitle="DOCUMENT DIGITISATION" channel="purple">
              <div
                style={{
                  border: "1.5px dashed var(--color-border-deep)",
                  borderRadius: "10px",
                  padding: "3rem",
                  textAlign: "center",
                  marginBottom: "1.25rem",
                  cursor: "pointer",
                  background: "var(--color-surface)",
                  transition: "border-color 150ms ease",
                }}
                onClick={() => {
                  setOcrFile("RX_SCAN_001.jpg");
                  simulateAI(() => toast.success("OCR scan complete. Structured output generated."));
                }}
              >
                <Scan size={32} style={{ color: "var(--color-ink-muted)", marginBottom: "0.75rem" }} />
                <div className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
                  CLICK TO UPLOAD OR SCAN
                </div>
                <div className="type-micro" style={{ color: "var(--color-ink-muted)", marginTop: "0.35rem" }}>
                  Supports JPG, PNG, PDF — Prescription slips, lab prints, discharge summaries
                </div>
              </div>
              {ocrFile && !loading && (
                <div
                  style={{
                    background: "var(--color-signal-purple-bg, rgba(124, 58, 237, 0.05))",
                    border: "1px solid var(--color-signal-purple-border, rgba(124, 58, 237, 0.2))",
                    borderLeft: "3px solid var(--color-signal-purple)",
                    padding: "1rem 1.25rem",
                    borderRadius: "6px",
                  }}
                >
                  <div className="type-label" style={{ color: "var(--color-signal-purple)", fontWeight: 600, marginBottom: "0.75rem" }}>
                    ● OCR RESULT — {ocrFile}
                  </div>
                  <pre
                    className="type-id"
                    style={{
                      color: "var(--color-ink)",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.8rem",
                    }}
                  >
{`{
  "type": "prescription",
  "doctor": "Dr. Anita Desai",
  "facility": "AIIMS New Delhi",
  "date": "2024-03-15",
  "patient": "Rahul Verma",
  "medications": [
    { "name": "Metformin HCl", "dosage": "500mg", "frequency": "1-0-1", "duration": "30 days" },
    { "name": "Atorvastatin", "dosage": "10mg", "frequency": "0-0-1", "duration": "30 days" }
  ],
  "instructions": "After food. Monitor blood glucose.",
  "confidence": 0.97
}`}
                  </pre>
                  <Button
                    variant="secondary"
                    size="sm"
                    style={{ marginTop: "0.75rem" }}
                    onClick={() => toast.success("Structured data saved to patient record.")}
                  >
                    SAVE TO PATIENT RECORD
                  </Button>
                </div>
              )}
            </InstrumentPanel>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
