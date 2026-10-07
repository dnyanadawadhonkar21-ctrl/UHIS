import React, { useState } from "react";
import { 
  Stethoscope, 
  FileText, 
  Plus, 
  X, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  AlertTriangle,
  Lock,
  ArrowRight
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import InstrumentPanel from "../components/ui/InstrumentPanel";
import StatusCode from "../components/ui/StatusCode";
import DataRow from "../components/ui/DataRow";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PrecisionInput from "../components/ui/PrecisionInput";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { doctorQueue as initialQueue, patientData, conditions, labReports } from "../data/mockData";
import AIPatientOverview from "../components/patient/AIPatientOverview";

import PatientAccessLockModal from "../components/doctor/PatientAccessLockModal";
import CurrentConsultationCard from "../components/doctor/CurrentConsultationCard";
import WaitingQueueTable from "../components/doctor/WaitingQueueTable";
import CompletedQueueSection from "../components/doctor/CompletedQueueSection";
import ConsultationEmptyState from "../components/doctor/ConsultationEmptyState";
import ClinicalWorkflowBanner from "../components/doctor/ClinicalWorkflowBanner";
import ConsultationWorkspace from "../components/doctor/ConsultationWorkspace";

const TABS = [
  { id: "queue", label: "OPD QUEUE" },
  { id: "consultation", label: "CONSULTATION" },
  { id: "records", label: "PATIENT RECORDS" },
];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("queue");
  
  // Queue state management
  const [queue, setQueue] = useState(initialQueue);
  const [activePatient, setActivePatient] = useState(() => {
    return initialQueue.find((p) => p.status === "in-consultation" || p.status === "in_consultation") || null;
  });

  // Modal states
  const [selectedPatientForModal, setSelectedPatientForModal] = useState(null);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  // Partition queue into active, waiting, and completed
  const currentConsultingPatient = queue.find(
    (p) => p.status === "in-consultation" || p.status === "in_consultation" || p.status === "access_granted"
  );
  
  const waitingPatients = queue.filter(
    (p) => p.status === "waiting" || p.status === "called" || p.status === "patient_present" || p.status === "otp_pending"
  );

  const completedPatients = queue.filter((p) => p.status === "completed");

  const stats = {
    total: queue.length,
    waiting: waitingPatients.length,
    inConsultation: currentConsultingPatient ? 1 : 0,
    completed: completedPatients.length,
  };

  const displayName = user?.name || user?.fullName || "Dr. Anita Desai";
  const doctorSpecialty = user?.specialty || user?.specialization || "Internal Medicine";

  // Workflow Action Handlers
  const handleOpenPatientModal = (patient) => {
    setSelectedPatientForModal(patient);
    setIsAccessModalOpen(true);
  };

  const handleCallPatient = (patient) => {
    setQueue((prev) =>
      prev.map((p) => (p.token === patient.token ? { ...p, status: "called" } : p))
    );
    setSelectedPatientForModal((prev) => (prev && prev.token === patient.token ? { ...prev, status: "called" } : prev));
    toast.info(`Calling Token ${patient.token} (${patient.patientName || patient.name}) to Chamber 03.`);
  };

  const handleMarkPresent = (patient) => {
    setQueue((prev) =>
      prev.map((p) => (p.token === patient.token ? { ...p, status: "patient_present" } : p))
    );
    setSelectedPatientForModal((prev) => (prev && prev.token === patient.token ? { ...prev, status: "patient_present" } : prev));
    toast.success(`Token ${patient.token} is present in chamber. Ready for consent authorization.`);
  };

  const handleRequestOtp = (patient) => {
    setQueue((prev) =>
      prev.map((p) => (p.token === patient.token ? { ...p, status: "otp_pending" } : p))
    );
    setSelectedPatientForModal((prev) => (prev && prev.token === patient.token ? { ...prev, status: "otp_pending" } : prev));
    toast.info(`ABDM Consent OTP sent to patient mobile. Demo code: 847291`);
  };

  const handleVerifyOtp = (patient, otp) => {
    if (otp === "847291" || otp.length === 6) {
      setQueue((prev) =>
        prev.map((p) => {
          if (p.token === patient.token) {
            return { ...p, status: "in-consultation" };
          }
          if (p.status === "in-consultation") {
            return { ...p, status: "completed" };
          }
          return p;
        })
      );
      
      const updated = { ...patient, status: "in-consultation" };
      setActivePatient(updated);
      setSelectedPatientForModal(updated);
      toast.success(`Consent verified! Temporary 15-minute EHR access granted for ${patient.patientName || patient.name}.`);
      return true;
    } else {
      return false;
    }
  };

  const handleOpenConsultation = (patient) => {
    setActivePatient(patient);
    setIsAccessModalOpen(false);
    setActiveTab("consultation");
  };

  const handleCompleteConsultation = (patient) => {
    const targetPatient = patient || activePatient;
    if (!targetPatient) return;

    setQueue((prev) =>
      prev.map((p) => (p.token === targetPatient.token ? { ...p, status: "completed" } : p))
    );

    if (activePatient?.token === targetPatient.token) {
      setActivePatient(null);
    }
    
    setIsAccessModalOpen(false);
    toast.success(`Consultation completed for ${targetPatient.patientName || targetPatient.name}. Session closed.`);
    setActiveTab("queue");
  };

  return (
    <AppLayout tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      <div style={{ maxWidth: "1150px", margin: "0 auto" }}>

        {/* OPD Stats Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            border: "1px solid var(--color-border)",
            background: "var(--color-panel)",
            borderRadius: "10px",
            overflow: "hidden",
            marginBottom: "1.5rem",
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

        {/* TAB 1: OPD QUEUE */}
        {activeTab === "queue" && (
          <div className="fade-in">
            {/* Header with doctor info */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div>
                <div className="type-heading" style={{ fontSize: "1.2rem" }}>
                  OPD Live Patient Queue
                </div>
                <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>
                  Real-time clinical session queue and access authorization controller
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--color-surface-alt)",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <Stethoscope size={14} style={{ color: "var(--color-accent-primary)" }} />
                <span className="type-micro" style={{ fontWeight: 600, color: "var(--color-ink)" }}>
                  {displayName} · {doctorSpecialty} · Chamber 03
                </span>
              </div>
            </div>

            {/* Workflow Protocol Banner */}
            <ClinicalWorkflowBanner />

            {/* Section B: Current Consultation */}
            <CurrentConsultationCard
              activePatient={currentConsultingPatient}
              onOpenConsultation={(patient) => {
                setActivePatient(patient);
                setActiveTab("consultation");
              }}
              onCompleteConsultation={handleCompleteConsultation}
            />

            {/* Section C: Waiting Queue */}
            <WaitingQueueTable
              patients={waitingPatients}
              onSelectPatient={handleOpenPatientModal}
              onCallPatient={handleCallPatient}
            />

            {/* Section 7: Completed Patients */}
            <CompletedQueueSection completedPatients={completedPatients} />
          </div>
        )}

        {/* TAB 2: CONSULTATION WORKSPACE + PRESCRIPTION COMPOSER */}
        {activeTab === "consultation" && (
          <ConsultationWorkspace
            patient={activePatient}
            doctorUser={user}
            onGoToQueue={() => setActiveTab("queue")}
            onCompleteConsultation={handleCompleteConsultation}
            onReauthorize={(p) => handleOpenPatientModal(p)}
          />
        )}

        {/* TAB 3: PATIENT RECORDS */}
        {activeTab === "records" && (
          <div className="fade-in">
            {activePatient && (activePatient.status === "in-consultation" || activePatient.status === "access_granted") ? (
              <div>
                <div
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    padding: "0.75rem 1.25rem",
                    marginBottom: "1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <ShieldCheck size={16} style={{ color: "var(--color-signal-normal)" }} />
                    <span className="type-value" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                      Active Patient EHR: {activePatient.patientName || activePatient.name} ({activePatient.token})
                    </span>
                  </div>
                  <span className="type-micro" style={{ color: "var(--color-signal-normal)", fontWeight: 600 }}>
                    ABDM Consent Verified
                  </span>
                </div>

                <AIPatientOverview mode="doctor" patientData={activePatient} />
                
                <InstrumentPanel
                  title={`Medical History & Past Diagnoses — ${activePatient.patientName || activePatient.name || "Rahul Verma"}`}
                  subtitle="PATIENT EHR RECORDS"
                  channel="muted"
                >
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
            ) : (
              <div
                className="instrument-panel"
                style={{
                  padding: "3.5rem 2rem",
                  textAlign: "center",
                  maxWidth: "680px",
                  margin: "1.5rem auto",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "12px",
                    background: "var(--color-surface-alt)",
                    color: "var(--color-ink-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.25rem",
                  }}
                >
                  <Lock size={28} />
                </div>

                <div className="type-heading" style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                  EHR HEALTH RECORDS GUARD
                </div>

                <p
                  className="type-body"
                  style={{
                    color: "var(--color-ink-secondary)",
                    fontSize: "0.9rem",
                    maxWidth: "500px",
                    margin: "0 auto 1.75rem",
                    lineHeight: 1.6,
                  }}
                >
                  Under Ayushman Bharat Digital Mission (ABDM) and UHIS privacy protocols, patient medical records and longitudinal health data cannot be browsed without active patient presence and authorized OTP consent.
                </p>

                <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
                  <Button
                    onClick={() => setActiveTab("queue")}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}
                  >
                    SELECT PATIENT FROM OPD QUEUE <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Patient Access Lock Modal */}
      <PatientAccessLockModal
        isOpen={isAccessModalOpen}
        patient={selectedPatientForModal}
        onClose={() => setIsAccessModalOpen(false)}
        onCallPatient={handleCallPatient}
        onMarkPresent={handleMarkPresent}
        onRequestOtp={handleRequestOtp}
        onVerifyOtp={handleVerifyOtp}
        onOpenConsultation={handleOpenConsultation}
      />
    </AppLayout>
  );
}
