import React, { useState } from "react";
import ConsultationHeader from "./ConsultationHeader";
import PatientMedicalRecordView from "./PatientMedicalRecordView";
import PrescriptionComposer from "./PrescriptionComposer";
import ConsultationEmptyState from "./ConsultationEmptyState";
import AccessExpiredState from "./AccessExpiredState";
import { useToast } from "../../context/ToastContext";

export default function ConsultationWorkspace({
  patient,
  doctorUser,
  onGoToQueue,
  onCompleteConsultation,
  onReauthorize,
}) {
  const toast = useToast();
  const [savedPrescriptions, setSavedPrescriptions] = useState([]);

  if (!patient) {
    return <ConsultationEmptyState onGoToQueue={onGoToQueue} reason="none" />;
  }

  const isExpired = patient.status === "access_expired";
  const isAuthorized =
    patient.status === "in-consultation" ||
    patient.status === "in_consultation" ||
    patient.status === "access_granted";

  if (isExpired) {
    return (
      <AccessExpiredState
        onReturnToQueue={onGoToQueue}
        onReauthorize={() => onReauthorize && onReauthorize(patient)}
      />
    );
  }

  if (!isAuthorized) {
    return <ConsultationEmptyState onGoToQueue={onGoToQueue} reason="locked" />;
  }

  const handleSavePrescription = (prescriptionPayload) => {
    setSavedPrescriptions((prev) => [prescriptionPayload, ...prev]);
    toast.success(
      `Digital prescription for ${prescriptionPayload.diagnosis} saved successfully. Ready for dispatch upon consultation completion.`
    );
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Patient Header with Consultation Actions */}
      <ConsultationHeader
        patient={patient}
        onCompleteConsultation={onCompleteConsultation}
        onBackToQueue={onGoToQueue}
      />

      {/* Main Workspace: 2-Column Responsive Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 1fr",
          gap: "1.25rem",
          alignItems: "start",
        }}
        className="consult-workspace-layout"
      >
        {/* Left Column: Patient Medical Information (Read-Only) */}
        <div>
          <PatientMedicalRecordView
            patient={patient}
            savedPrescriptions={savedPrescriptions}
          />
        </div>

        {/* Right Column: Doctor Actions / New Prescription Composer */}
        <div>
          <PrescriptionComposer
            patient={patient}
            doctorUser={doctorUser}
            onSavePrescription={handleSavePrescription}
            onCancel={() => toast.info("Prescription editing dismissed.")}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .consult-workspace-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
