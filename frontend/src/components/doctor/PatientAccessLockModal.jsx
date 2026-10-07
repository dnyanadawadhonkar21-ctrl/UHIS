import React, { useState } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  UserCheck, 
  PhoneCall, 
  KeyRound, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  X,
  Stethoscope,
  FileLock2
} from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import StatusCode from "../ui/StatusCode";

const WORKFLOW_STEPS = [
  { step: 1, key: "waiting", label: "Patient Waiting", desc: "In OPD waiting queue" },
  { step: 2, key: "called", label: "Call Patient", desc: "Token called to chamber" },
  { step: 3, key: "patient_present", label: "Patient Arrives", desc: "Physically in chamber" },
  { step: 4, key: "otp_pending", label: "OTP Authorization", desc: "Consent verification" },
  { step: 5, key: "access_granted", label: "Access Granted", desc: "15-min temp EHR access" },
  { step: 6, key: "in-consultation", label: "Consultation", desc: "Active examination" },
];

export default function PatientAccessLockModal({
  isOpen,
  patient,
  onClose,
  onCallPatient,
  onMarkPresent,
  onRequestOtp,
  onVerifyOtp,
  onOpenConsultation,
}) {
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  if (!isOpen || !patient) return null;

  const status = patient.status || "waiting";
  const isAccessGranted = status === "in-consultation" || status === "access_granted";
  const isOtpPending = status === "otp_pending";
  const isPatientPresent = status === "patient_present";
  const isCalled = status === "called";
  const isWaiting = status === "waiting";
  const isCompleted = status === "completed";

  const getStepStatus = (stepKey, stepIndex) => {
    const stepOrder = ["waiting", "called", "patient_present", "otp_pending", "access_granted", "in-consultation", "completed"];
    const currentIndex = stepOrder.indexOf(status);
    const thisIndex = stepOrder.indexOf(stepKey);

    if (isCompleted) return "completed";
    if (thisIndex < currentIndex || (isAccessGranted && stepIndex <= 5)) return "completed";
    if (thisIndex === currentIndex || (isAccessGranted && stepKey === "in-consultation")) return "active";
    return "pending";
  };

  const handleVerifyOtp = () => {
    if (!enteredOtp || enteredOtp.trim().length < 4) {
      setOtpError("Please enter a valid OTP.");
      return;
    }
    setOtpError("");
    const success = onVerifyOtp ? onVerifyOtp(patient, enteredOtp) : true;
    if (!success && success !== undefined) {
      setOtpError("Invalid OTP. Try the demo code: 847291");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Patient Consultation & Access Authorization"
      subtitle="DATA PROTECTION & WORKFLOW CONTROL"
      width="720px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        
        {/* Patient Identity Strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            padding: "0.85rem 1.15rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                background: "var(--color-ink)",
                color: "#ffffff",
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
                fontSize: "1.1rem",
                padding: "0.35rem 0.65rem",
                borderRadius: "6px",
                letterSpacing: "0.05em",
              }}
            >
              {patient.token}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-ink)" }}>
                {patient.patientName || patient.name}
              </div>
              <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>
                {patient.age}Y · {patient.gender} · {patient.patientId || "ID: P-10042"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                padding: "0.2rem 0.55rem",
                borderRadius: "99px",
                textTransform: "uppercase",
                background:
                  patient.priority === "emergency"
                    ? "var(--color-signal-critical-bg)"
                    : patient.priority === "urgent"
                    ? "var(--color-signal-warning-bg)"
                    : "var(--color-surface-alt)",
                color:
                  patient.priority === "emergency"
                    ? "var(--color-signal-critical)"
                    : patient.priority === "urgent"
                    ? "var(--color-signal-warning)"
                    : "var(--color-ink-secondary)",
                border: `1px solid ${
                  patient.priority === "emergency"
                    ? "var(--color-signal-critical-border)"
                    : patient.priority === "urgent"
                    ? "var(--color-signal-warning-border)"
                    : "var(--color-border)"
                }`,
              }}
            >
              {patient.priority || "ROUTINE"} PRIORITY
            </span>

            <StatusCode
              status={
                isAccessGranted
                  ? "info"
                  : isOtpPending
                  ? "warning"
                  : isCalled
                  ? "purple"
                  : isCompleted
                  ? "normal"
                  : "warning"
              }
              label={status.replace(/[-_]/g, " ").toUpperCase()}
            />
          </div>
        </div>

        {/* Chief Complaint Strip (Allowed Queue Info) */}
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "var(--color-surface-alt)",
            border: "1px solid var(--color-border)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
          }}
        >
          <span className="type-label" style={{ whiteSpace: "nowrap", paddingTop: "2px" }}>
            Chief Complaint:
          </span>
          <span className="type-body" style={{ color: "var(--color-ink)", fontSize: "0.85rem", fontWeight: 500 }}>
            {patient.chiefComplaint || patient.complaint || "Routine Clinical Consultation"}
          </span>
        </div>

        {/* Clinical Workflow Stepper Bar */}
        <div style={{ marginTop: "0.25rem" }}>
          <div className="type-label" style={{ marginBottom: "0.6rem", color: "var(--color-ink-secondary)" }}>
            CLINICAL ACCESS WORKFLOW PROGRESS
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "0.35rem",
              background: "var(--color-surface)",
              padding: "0.65rem",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
            }}
          >
            {WORKFLOW_STEPS.map((s, idx) => {
              const stepStatus = getStepStatus(s.key, idx + 1);
              const isCurrent = stepStatus === "active";
              const isPast = stepStatus === "completed";

              return (
                <div
                  key={s.step}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    padding: "0.4rem 0.2rem",
                    borderRadius: "6px",
                    background: isCurrent
                      ? "var(--color-panel)"
                      : isPast
                      ? "var(--color-signal-normal-bg)"
                      : "transparent",
                    border: isCurrent
                      ? "1.5px solid var(--color-accent-primary)"
                      : isPast
                      ? "1px solid var(--color-signal-normal-border)"
                      : "1px solid transparent",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      marginBottom: "0.25rem",
                      background: isPast
                        ? "var(--color-signal-normal)"
                        : isCurrent
                        ? "var(--color-accent-primary)"
                        : "var(--color-border)",
                      color: "#ffffff",
                    }}
                  >
                    {isPast ? "✓" : s.step}
                  </div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent
                        ? "var(--color-accent-primary)"
                        : isPast
                        ? "var(--color-signal-normal)"
                        : "var(--color-ink-muted)",
                      lineHeight: 1.2,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Access Lock / Security State Banner */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderRadius: "8px",
            border: `1.5px solid ${
              isAccessGranted
                ? "var(--color-signal-normal-border)"
                : isOtpPending
                ? "var(--color-signal-warning-border)"
                : "var(--color-border-deep)"
            }`,
            background: isAccessGranted
              ? "var(--color-signal-normal-bg)"
              : isOtpPending
              ? "var(--color-signal-warning-bg)"
              : "var(--color-panel)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isAccessGranted
                  ? "var(--color-signal-normal)"
                  : isOtpPending
                  ? "var(--color-signal-warning)"
                  : "var(--color-surface-alt)",
                color: isAccessGranted || isOtpPending ? "#ffffff" : "var(--color-ink-secondary)",
                flexShrink: 0,
              }}
            >
              {isAccessGranted ? (
                <ShieldCheck size={20} />
              ) : isOtpPending ? (
                <KeyRound size={20} />
              ) : (
                <Lock size={20} />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: isAccessGranted
                    ? "var(--color-signal-normal)"
                    : isOtpPending
                    ? "var(--color-signal-warning)"
                    : "var(--color-ink)",
                  marginBottom: "0.25rem",
                }}
              >
                {isAccessGranted
                  ? "Temporary Medical Data Access Granted"
                  : isOtpPending
                  ? "OTP Authorization In Progress"
                  : isPatientPresent
                  ? "Patient In Chamber — Consent Authorization Required"
                  : isCalled
                  ? "Patient Called — Waiting for Arrival in Chamber"
                  : "Patient is Currently Waiting for Consultation"}
              </div>

              <div
                className="type-body"
                style={{
                  fontSize: "0.825rem",
                  color: "var(--color-ink-secondary)",
                  lineHeight: 1.5,
                  marginBottom: "0.75rem",
                }}
              >
                {isAccessGranted ? (
                  "Active temporary clinical session (ABDM Consent Valid). Full EHR history, medications, and clinical workspace unlocked."
                ) : (
                  "Medical records will remain strictly locked until the patient is present in the chamber and temporary access is authorized via consent."
                )}
              </div>

              {/* Data Safety Rules Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.6rem",
                  fontSize: "0.75rem",
                  background: "var(--color-surface)",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "6px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div>
                  <span style={{ color: "var(--color-signal-normal)", fontWeight: 700 }}>✓ Allowed (Queue Info):</span>
                  <div style={{ color: "var(--color-ink-secondary)", marginTop: "2px" }}>
                    Token, Name, Age/Gender, Chief Complaint, Priority
                  </div>
                </div>
                <div>
                  <span style={{ color: isAccessGranted ? "var(--color-signal-normal)" : "var(--color-signal-critical)", fontWeight: 700 }}>
                    {isAccessGranted ? "✓ Unlocked for Consultation:" : "🔒 Locked Before Authorization:"}
                  </span>
                  <div style={{ color: "var(--color-ink-secondary)", marginTop: "2px" }}>
                    EHR History, Past Prescriptions, Lab Reports, AI Summary
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Action Workspace / Controls */}
        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            paddingTop: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
          }}
        >
          {/* State 1: WAITING */}
          {isWaiting && (
            <div>
              <div className="type-micro" style={{ marginBottom: "0.5rem", color: "var(--color-ink-secondary)" }}>
                Step 1: Patient is in the waiting area. Call patient to the consultation chamber.
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Button
                  onClick={() => onCallPatient && onCallPatient(patient)}
                  style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}
                >
                  <PhoneCall size={14} /> CALL PATIENT TO CHAMBER
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  BACK TO QUEUE
                </Button>
              </div>
            </div>
          )}

          {/* State 2: CALLED */}
          {isCalled && (
            <div>
              <div className="type-micro" style={{ marginBottom: "0.5rem", color: "var(--color-ink-secondary)" }}>
                Step 2: Patient has been called. When the patient enters the chamber, mark them as present.
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Button
                  onClick={() => onMarkPresent && onMarkPresent(patient)}
                  style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}
                >
                  <UserCheck size={14} /> PATIENT IS IN CHAMBER (MARK PRESENT)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onCallPatient && onCallPatient(patient)}
                  style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}
                >
                  <PhoneCall size={14} /> CALL AGAIN
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  BACK TO QUEUE
                </Button>
              </div>
            </div>
          )}

          {/* State 3: PATIENT PRESENT */}
          {isPatientPresent && (
            <div>
              <div className="type-micro" style={{ marginBottom: "0.5rem", color: "var(--color-ink-secondary)" }}>
                Step 3: Patient is in front of the doctor. Request temporary access authorization OTP to unlock medical records.
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Button
                  onClick={() => onRequestOtp && onRequestOtp(patient)}
                  style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}
                >
                  <KeyRound size={14} /> REQUEST ACCESS OTP →
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  BACK TO QUEUE
                </Button>
              </div>
            </div>
          )}

          {/* State 4: OTP PENDING */}
          {isOtpPending && (
            <div style={{ background: "var(--color-surface)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
              <div className="type-label" style={{ marginBottom: "0.4rem", color: "var(--color-ink)" }}>
                PATIENT ACCESS OTP VERIFICATION
              </div>
              <div className="type-micro" style={{ marginBottom: "0.75rem", color: "var(--color-ink-secondary)" }}>
                Enter the 6-digit consent OTP sent to the patient's registered phone.
                <span style={{ marginLeft: "6px", fontWeight: 700, color: "var(--color-accent-primary)" }}>
                  (Demo Code: 847291)
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 847291"
                    className="precision-input"
                    value={enteredOtp}
                    onChange={(e) => {
                      setEnteredOtp(e.target.value.replace(/\D/g, ""));
                      setOtpError("");
                    }}
                    style={{
                      letterSpacing: "0.3em",
                      fontFamily: "var(--font-mono, monospace)",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      textAlign: "center",
                    }}
                  />
                  {otpError && (
                    <div style={{ color: "var(--color-signal-critical)", fontSize: "0.75rem", marginTop: "4px" }}>
                      {otpError}
                    </div>
                  )}
                </div>

                <Button onClick={handleVerifyOtp} style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  <ShieldCheck size={14} /> VERIFY & GRANT ACCESS
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onRequestOtp && onRequestOtp(patient)}
                >
                  RESEND OTP
                </Button>
              </div>
            </div>
          )}

          {/* State 5 & 6: ACCESS GRANTED / IN CONSULTATION */}
          {isAccessGranted && (
            <div>
              <div className="type-micro" style={{ marginBottom: "0.5rem", color: "var(--color-signal-normal)" }}>
                ✓ Patient access authorized. You can now open the clinical workspace and view medical records.
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Button
                  onClick={() => onOpenConsultation && onOpenConsultation(patient)}
                  style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}
                >
                  <Stethoscope size={14} /> OPEN CONSULTATION WORKSPACE →
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  BACK TO QUEUE
                </Button>
              </div>
            </div>
          )}

          {/* State 7: COMPLETED */}
          {isCompleted && (
            <div>
              <div className="type-micro" style={{ marginBottom: "0.5rem", color: "var(--color-ink-muted)" }}>
                Consultation for this patient is complete.
              </div>
              <Button variant="secondary" onClick={onClose}>
                BACK TO QUEUE
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
