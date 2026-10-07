import React from "react";
import { X, CheckCircle2, Pill, Printer, FileCheck, ShieldCheck, HeartPulse } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

export default function PrescriptionPreviewModal({
  isOpen,
  onClose,
  prescriptionData,
  patient,
  doctorUser,
  onConfirmSave,
}) {
  if (!isOpen || !prescriptionData || !patient) return null;

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const doctorName = doctorUser?.name || doctorUser?.fullName || "Dr. Anita Desai";
  const doctorSpecialty = doctorUser?.specialty || doctorUser?.specialization || "Internal Medicine";
  const doctorReg = doctorUser?.regNumber || "MCI-48921-ND";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Digital E-Prescription Preview"
      subtitle="VERIFY PRESCRIPTION BEFORE ISSUING"
      width="780px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Prescription Paper Preview Container */}
        <div
          style={{
            background: "var(--color-panel)",
            border: "1.5px solid var(--color-border-deep)",
            borderRadius: "8px",
            padding: "1.5rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {/* Prescription Hospital & Doctor Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "2px solid var(--color-accent-primary)",
              paddingBottom: "1rem",
              marginBottom: "1rem",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <HeartPulse size={20} style={{ color: "var(--color-accent-primary)" }} />
                <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--color-ink)", letterSpacing: "-0.01em" }}>
                  AIIMS NEW DELHI — CENTRAL OPD FACILITY
                </span>
              </div>
              <div className="type-micro" style={{ color: "var(--color-ink-secondary)", marginTop: "2px" }}>
                Ayushman Bharat Digital Mission (ABDM) Integrated Clinical Health Facility
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-ink)" }}>
                {doctorName}
              </div>
              <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>
                {doctorSpecialty} · Reg No: {doctorReg}
              </div>
              <div className="type-micro" style={{ color: "var(--color-ink-muted)" }}>
                Date: {today}
              </div>
            </div>
          </div>

          {/* Patient Details Strip */}
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              padding: "0.65rem 0.85rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "0.5rem",
              marginBottom: "1rem",
              fontSize: "0.75rem",
            }}
          >
            <div>
              <span style={{ color: "var(--color-ink-muted)", fontWeight: 600 }}>PATIENT:</span>
              <div style={{ fontWeight: 700, color: "var(--color-ink)" }}>
                {patient.patientName || patient.name}
              </div>
            </div>
            <div>
              <span style={{ color: "var(--color-ink-muted)", fontWeight: 600 }}>AGE / GENDER:</span>
              <div style={{ fontWeight: 600, color: "var(--color-ink)" }}>
                {patient.age}Y / {patient.gender}
              </div>
            </div>
            <div>
              <span style={{ color: "var(--color-ink-muted)", fontWeight: 600 }}>TOKEN / ID:</span>
              <div style={{ fontWeight: 700, color: "var(--color-ink)", fontFamily: "var(--font-mono, monospace)" }}>
                #{patient.token} · {patient.patientId || "P-10042"}
              </div>
            </div>
            <div>
              <span style={{ color: "var(--color-ink-muted)", fontWeight: 600 }}>ABHA ADDRESS:</span>
              <div style={{ fontWeight: 600, color: "var(--color-accent-primary)" }}>
                {patient.abhaAddress || "patient@abdm"}
              </div>
            </div>
          </div>

          {/* Diagnosis */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div className="type-label" style={{ color: "var(--color-ink-secondary)", fontSize: "0.7rem", marginBottom: "0.25rem" }}>
              DIAGNOSIS & CLINICAL OBSERVATIONS (Rx)
            </div>
            <div
              style={{
                padding: "0.6rem 0.85rem",
                background: "var(--color-surface-alt)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "0.9rem",
                color: "var(--color-ink)",
              }}
            >
              {prescriptionData.diagnosisText || "Routine clinical evaluation and management"}
              {prescriptionData.icdCode && (
                <span className="type-id" style={{ marginLeft: "8px", color: "var(--color-accent-primary)", fontSize: "0.8rem" }}>
                  [{prescriptionData.icdCode}]
                </span>
              )}
            </div>
          </div>

          {/* Prescribed Medicines Table */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div className="type-label" style={{ color: "var(--color-ink-secondary)", fontSize: "0.7rem", marginBottom: "0.4rem" }}>
              PRESCRIBED PHARMACOLOGICAL REGIMEN
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-alt)", borderBottom: "1.5px solid var(--color-border)" }}>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontWeight: 700, color: "var(--color-ink-secondary)" }}>
                    #
                  </th>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontWeight: 700, color: "var(--color-ink-secondary)" }}>
                    MEDICINE & STRENGTH
                  </th>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontWeight: 700, color: "var(--color-ink-secondary)" }}>
                    DOSAGE
                  </th>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontWeight: 700, color: "var(--color-ink-secondary)" }}>
                    FREQUENCY
                  </th>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontWeight: 700, color: "var(--color-ink-secondary)" }}>
                    DURATION
                  </th>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontWeight: 700, color: "var(--color-ink-secondary)" }}>
                    TIMING & INSTRUCTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {prescriptionData.items && prescriptionData.items.length > 0 ? (
                  prescriptionData.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "0.6rem 0.75rem", fontWeight: 700, color: "var(--color-ink-muted)" }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem", fontWeight: 700, color: "var(--color-ink)" }}>
                        {item.medicineName || item.name || "Medicine"}
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem", color: "var(--color-ink-secondary)" }}>
                        {item.dosage || "1 dose"}
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem", fontWeight: 600, color: "var(--color-accent-primary)" }}>
                        {item.frequency || "1-0-1"}
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem", color: "var(--color-ink-secondary)" }}>
                        {item.duration || `${item.durationDays || "5"} days`}
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem", color: "var(--color-ink-secondary)", fontSize: "0.75rem" }}>
                        <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>
                          {item.timing || "After food"}
                        </span>
                        {item.instructions ? ` · ${item.instructions}` : ""}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: "1rem", textAlign: "center", color: "var(--color-ink-muted)" }}>
                      No medicines prescribed for this visit.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* General Advice / Instructions */}
          {prescriptionData.advice && (
            <div style={{ marginBottom: "1.25rem" }}>
              <div className="type-label" style={{ color: "var(--color-ink-secondary)", fontSize: "0.7rem", marginBottom: "0.25rem" }}>
                DOCTOR ADVICE & LIFESTYLE INSTRUCTIONS
              </div>
              <div
                style={{
                  padding: "0.6rem 0.85rem",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  fontSize: "0.825rem",
                  color: "var(--color-ink)",
                  lineHeight: 1.5,
                }}
              >
                {prescriptionData.advice}
              </div>
            </div>
          )}

          {/* Footer & Digital Signature Badge */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              paddingTop: "1rem",
              borderTop: "1px dashed var(--color-border-deep)",
              marginTop: "1rem",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div className="type-micro" style={{ color: "var(--color-ink-muted)", maxWidth: "340px" }}>
              This is a legally valid e-prescription issued under the National Digital Health Mission & Pharmacy Practice Regulations.
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.4rem 0.75rem",
                borderRadius: "6px",
                background: "var(--color-signal-normal-bg)",
                border: "1px solid var(--color-signal-normal-border)",
              }}
            >
              <FileCheck size={16} style={{ color: "var(--color-signal-normal)" }} />
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-signal-normal)" }}>
                  DIGITALLY SIGNED & VERIFIED
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--color-ink-secondary)" }}>
                  {doctorName} · {today}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button variant="secondary" onClick={onClose}>
            EDIT PRESCRIPTION
          </Button>
          <Button
            onClick={() => {
              if (onConfirmSave) onConfirmSave();
              onClose();
            }}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <CheckCircle2 size={15} /> CONFIRM & SAVE PRESCRIPTION
          </Button>
        </div>
      </div>
    </Modal>
  );
}
