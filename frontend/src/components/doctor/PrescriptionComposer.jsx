import React, { useState } from "react";
import { 
  Pill, 
  Plus, 
  Trash2, 
  FileText, 
  Eye, 
  Save, 
  RotateCcw, 
  Sparkles, 
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle2,
  Stethoscope
} from "lucide-react";
import Button from "../ui/Button";
import PrecisionInput from "../ui/PrecisionInput";
import PrescriptionPreviewModal from "./PrescriptionPreviewModal";
import { useToast } from "../../context/ToastContext";

const COMMON_DOSAGES = ["500mg", "650mg", "250mg", "100mg", "10mg", "5mg", "1 tablet", "2 tablets", "5ml", "10ml", "1 drop", "2 puffs"];
const COMMON_FREQUENCIES = [
  "1-0-1 (Twice daily)",
  "1-0-0 (Morning after food)",
  "0-0-1 (Night at bedtime)",
  "1-1-1 (Three times daily)",
  "1-1-1-1 (Four times daily)",
  "SOS (As needed / Only for symptoms)",
  "Once weekly",
];
const COMMON_TIMINGS = [
  "After food",
  "Before food (30 mins prior)",
  "With food",
  "Empty stomach (Morning)",
  "At bedtime",
  "As needed for pain/fever",
];
const COMMON_DURATIONS = ["3 days", "5 days", "7 days", "10 days", "14 days", "30 days", "90 days (Chronic)"];

export default function PrescriptionComposer({
  patient,
  doctorUser,
  onSavePrescription,
  onCancel,
}) {
  const toast = useToast();

  const [diagnosisText, setDiagnosisText] = useState("Acute upper respiratory tract infection");
  const [icdCode, setIcdCode] = useState("J06.9");
  const [advice, setAdvice] = useState("Drink plenty of warm fluids (2.5L/day), take adequate vocal & physical rest, avoid cold beverages. Return immediately if high fever persists > 3 days or breathing difficulty occurs.");
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  });

  const [items, setItems] = useState([
    {
      medicineName: "Paracetamol 650mg (Dolo)",
      dosage: "650mg",
      frequency: "1-0-1 (Twice daily)",
      duration: "5 days",
      timing: "After food",
      instructions: "Take after meals. SOS if fever > 100°F.",
    },
    {
      medicineName: "Montelukast + Levocetirizine (10mg/5mg)",
      dosage: "1 tablet",
      frequency: "0-0-1 (Night at bedtime)",
      duration: "7 days",
      timing: "At bedtime",
      instructions: "May cause mild drowsiness. Avoid driving.",
    },
  ]);

  const [previewOpen, setPreviewOpen] = useState(false);

  // Add new medicine item
  const handleAddMedicine = () => {
    setItems((prev) => [
      ...prev,
      {
        medicineName: "",
        dosage: "500mg",
        frequency: "1-0-1 (Twice daily)",
        duration: "5 days",
        timing: "After food",
        instructions: "",
      },
    ]);
  };

  // Remove medicine item
  const handleRemoveMedicine = (idx) => {
    if (items.length === 1) {
      toast.info("At least one medication row is recommended or clear all fields.");
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Update specific medicine field
  const handleUpdateMedicine = (idx, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  // Reset form
  const handleClear = () => {
    setDiagnosisText("");
    setIcdCode("");
    setAdvice("");
    setItems([
      {
        medicineName: "",
        dosage: "500mg",
        frequency: "1-0-1 (Twice daily)",
        duration: "5 days",
        timing: "After food",
        instructions: "",
      },
    ]);
    toast.info("Prescription composer cleared.");
  };

  // Save handler
  const handleSave = () => {
    if (!diagnosisText.trim()) {
      toast.error("Please enter a clinical diagnosis.");
      return;
    }

    const validMeds = items.filter((m) => m.medicineName.trim().length > 0);
    if (validMeds.length === 0) {
      toast.error("Please specify at least one medication name.");
      return;
    }

    const prescriptionPayload = {
      patientId: patient.patientId || patient.id || "P-10042",
      token: patient.token,
      patientName: patient.patientName || patient.name,
      diagnosis: diagnosisText,
      icdCode: icdCode,
      medicines: validMeds,
      instructions: advice,
      followUpDate: followUpDate,
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      doctorName: doctorUser?.name || doctorUser?.fullName || "Dr. Anita Desai",
      specialty: doctorUser?.specialty || doctorUser?.specialization || "Internal Medicine",
    };

    if (onSavePrescription) {
      onSavePrescription(prescriptionPayload);
    }
  };

  return (
    <div
      style={{
        background: "var(--color-panel)",
        border: "1.5px solid var(--color-accent-primary)",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(37, 99, 235, 0.08)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: "0.85rem 1.15rem",
          background: "linear-gradient(to right, #2563EB, #1D4ED8)",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "0.85rem",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            Rx
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "0.95rem", letterSpacing: "0.02em" }}>
              NEW PRESCRIPTION
            </div>
            <div style={{ fontSize: "0.68rem", opacity: 0.85 }}>
              DOCTOR ACTIONS · DIGITAL E-PRESCRIPTION COMPOSER
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "6px",
            color: "#ffffff",
            padding: "0.3rem 0.65rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 120ms ease",
          }}
        >
          <Eye size={13} /> Preview Rx
        </button>
      </div>

      {/* Main Composer Body */}
      <div style={{ padding: "1.15rem", display: "flex", flexDirection: "column", gap: "1.15rem" }}>
        
        {/* Section A: Diagnosis & ICD-10 */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "0.85rem",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="type-label" style={{ marginBottom: "0.4rem", color: "var(--color-ink-secondary)" }}>
            CLINICAL DIAGNOSIS & ASSESSMENT
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.6rem" }} className="diag-grid">
            <div>
              <input
                type="text"
                className="precision-input"
                placeholder="Enter clinical diagnosis (e.g. Acute Bronchitis)..."
                value={diagnosisText}
                onChange={(e) => setDiagnosisText(e.target.value)}
                style={{ fontWeight: 600 }}
              />
            </div>
            <div>
              <input
                type="text"
                className="precision-input"
                placeholder="ICD-10 Code (e.g. J20.9)"
                value={icdCode}
                onChange={(e) => setIcdCode(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section B: Medicines List Builder */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.6rem",
            }}
          >
            <div className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
              PRESCRIBED MEDICINES ({items.length})
            </div>
            <button
              type="button"
              onClick={handleAddMedicine}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                background: "var(--color-signal-info-bg)",
                border: "1px solid var(--color-signal-info-border)",
                borderRadius: "6px",
                padding: "0.25rem 0.6rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--color-accent-primary)",
                cursor: "pointer",
              }}
            >
              <Plus size={13} /> Add Medicine
            </button>
          </div>

          {/* Medicines Dynamic Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border-deep)",
                  borderRadius: "8px",
                  padding: "0.85rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                  position: "relative",
                }}
              >
                {/* Top row: Medicine Name + Delete */}
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div className="type-micro" style={{ marginBottom: "2px", fontWeight: 600, color: "var(--color-ink-secondary)" }}>
                      Medicine Name #{idx + 1}
                    </div>
                    <input
                      type="text"
                      className="precision-input"
                      placeholder="e.g. Paracetamol 650mg, Amoxicillin 500mg..."
                      value={item.medicineName}
                      onChange={(e) => handleUpdateMedicine(idx, "medicineName", e.target.value)}
                      style={{ fontWeight: 600 }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveMedicine(idx)}
                    title="Remove medicine"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-signal-critical)",
                      padding: "6px",
                      borderRadius: "6px",
                      marginTop: "16px",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Second row: Dosage, Frequency, Duration, Timing */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1.5fr 1fr 1.3fr",
                    gap: "0.5rem",
                  }}
                  className="med-details-grid"
                >
                  {/* Dosage */}
                  <div>
                    <div className="type-micro" style={{ marginBottom: "2px", color: "var(--color-ink-secondary)" }}>
                      Dosage
                    </div>
                    <input
                      type="text"
                      list={`dosages-${idx}`}
                      className="precision-input"
                      placeholder="e.g. 500mg"
                      value={item.dosage}
                      onChange={(e) => handleUpdateMedicine(idx, "dosage", e.target.value)}
                    />
                    <datalist id={`dosages-${idx}`}>
                      {COMMON_DOSAGES.map((d) => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  </div>

                  {/* Frequency */}
                  <div>
                    <div className="type-micro" style={{ marginBottom: "2px", color: "var(--color-ink-secondary)" }}>
                      Frequency
                    </div>
                    <select
                      className="precision-input"
                      value={item.frequency}
                      onChange={(e) => handleUpdateMedicine(idx, "frequency", e.target.value)}
                      style={{ fontSize: "0.8rem", padding: "0.5rem 0.4rem" }}
                    >
                      {COMMON_FREQUENCIES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <div className="type-micro" style={{ marginBottom: "2px", color: "var(--color-ink-secondary)" }}>
                      Duration
                    </div>
                    <input
                      type="text"
                      list={`durations-${idx}`}
                      className="precision-input"
                      placeholder="e.g. 5 days"
                      value={item.duration}
                      onChange={(e) => handleUpdateMedicine(idx, "duration", e.target.value)}
                    />
                    <datalist id={`durations-${idx}`}>
                      {COMMON_DURATIONS.map((dur) => (
                        <option key={dur} value={dur} />
                      ))}
                    </datalist>
                  </div>

                  {/* Timing / Relation to Food */}
                  <div>
                    <div className="type-micro" style={{ marginBottom: "2px", color: "var(--color-ink-secondary)" }}>
                      Timing / Food
                    </div>
                    <select
                      className="precision-input"
                      value={item.timing}
                      onChange={(e) => handleUpdateMedicine(idx, "timing", e.target.value)}
                      style={{ fontSize: "0.8rem", padding: "0.5rem 0.4rem" }}
                    >
                      {COMMON_TIMINGS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Third row: Specific instructions */}
                <div>
                  <input
                    type="text"
                    className="precision-input"
                    placeholder="Specific instructions (e.g. SOS for fever, Avoid milk, Do not crush)..."
                    value={item.instructions}
                    onChange={(e) => handleUpdateMedicine(idx, "instructions", e.target.value)}
                    style={{ fontSize: "0.8rem", padding: "0.4rem 0.6rem" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section C: Additional General Instructions & Follow-up */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "0.85rem",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="type-label" style={{ marginBottom: "0.4rem", color: "var(--color-ink-secondary)" }}>
            ADDITIONAL PATIENT INSTRUCTIONS & LIFESTYLE ADVICE
          </div>

          <textarea
            className="precision-input"
            rows={2}
            placeholder="Enter lifestyle instructions, dietary restrictions, precautions..."
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            style={{ fontSize: "0.825rem", resize: "vertical", minHeight: "65px" }}
          />

          <div style={{ marginTop: "0.6rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span className="type-micro" style={{ fontWeight: 600, color: "var(--color-ink-secondary)" }}>
              Recommended Follow-Up Date:
            </span>
            <input
              type="date"
              className="precision-input"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              style={{ width: "auto", padding: "0.35rem 0.65rem", fontSize: "0.8rem" }}
            />
          </div>
        </div>

        {/* Section D: Action Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "0.75rem",
            borderTop: "1px solid var(--color-border)",
            flexWrap: "wrap",
            gap: "0.6rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClear}
              style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
            >
              <RotateCcw size={12} /> Clear
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
            >
              <Eye size={12} /> Preview
            </Button>
          </div>

          <Button
            onClick={handleSave}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1.4rem" }}
          >
            <Save size={14} /> SAVE PRESCRIPTION
          </Button>
        </div>

        <div className="type-micro" style={{ color: "var(--color-ink-muted)", textAlign: "center" }}>
          Saved prescriptions will sync to patient's Ayushman Bharat health record upon session completion.
        </div>
      </div>

      {/* Prescription Preview Modal */}
      <PrescriptionPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        prescriptionData={{
          diagnosisText,
          icdCode,
          advice,
          items,
          followUpDate,
        }}
        patient={patient}
        doctorUser={doctorUser}
        onConfirmSave={handleSave}
      />

      <style>{`
        @media (max-width: 600px) {
          .diag-grid, .med-details-grid {
            grid-template-columns: 1fr !important;
            gap: 0.4rem !important;
          }
        }
      `}</style>
    </div>
  );
}
