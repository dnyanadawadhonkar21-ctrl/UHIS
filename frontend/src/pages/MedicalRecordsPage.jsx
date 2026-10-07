import React, { useState, useEffect } from "react";
import {
  Download,
  Upload,
  Plus,
  Eye,
  FileText,
  FileImage,
  AlertTriangle,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Clock,
  Heart,
  Pill,
  FlaskConical,
  Calendar,
  MapPin,
  Thermometer,
  Droplet,
  Weight,
  Layers,
  Sparkles,
  Activity,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import InstrumentPanel from "../components/ui/InstrumentPanel";
import StatusCode from "../components/ui/StatusCode";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PrecisionInput from "../components/ui/PrecisionInput";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { timelineEvents as mockTimelineEvents } from "../data/mockData";

const TABS = [
  { id: "timeline", label: "TIMELINE" },
  { id: "records", label: "ALL RECORDS" },
  { id: "export", label: "EXPORT" },
];

const RECORD_TYPES = [
  "X-Ray",
  "MRI",
  "CT Scan",
  "Medical Report",
  "Prescription",
  "Other",
];

const RECORD_TYPE_ICONS = {
  "X-Ray": "🩻",
  "MRI": "🧠",
  "CT Scan": "🩻",
  "Medical Report": "📄",
  "Prescription": "💊",
  "Other": "📁",
};

const SEVERITY_SIGNAL = {
  severe: "critical",
  moderate: "warning",
  mild: "normal",
};

const TYPE_LABELS = {
  appointment: "OPD",
  APPOINTMENT: "OPD",
  visit: "VISIT",
  DOCTOR_VISIT: "VISIT",
  lab: "LAB",
  LAB_REPORT: "LAB",
  diagnosis: "DX",
  DIAGNOSIS: "DX",
  vaccination: "VAX",
  surgery: "SURG",
  medical_record: "RECORD",
  MEDICAL_RECORD: "RECORD",
  PRESCRIPTION: "RX",
};

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("records");
  const [filter, setFilter] = useState("ALL");
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [timelineEventsList, setTimelineEventsList] = useState([]);
  const [expandedVisits, setExpandedVisits] = useState({});
  const [patientDataState, setPatientDataState] = useState(null);
  const [conditionsList, setConditionsList] = useState([]);
  const [medicationsList, setMedicationsList] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Toggle single visit expansion
  const toggleVisit = (id) => {
    setExpandedVisits((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Toggle all visits expansion
  const toggleAllVisits = () => {
    const visitItems = timelineEventsList.filter(
      (t) => t.category === "DOCTOR_VISIT" || t.type === "VISIT" || t.type === "appointment"
    );
    const allExpanded = visitItems.length > 0 && visitItems.every((t) => expandedVisits[t.id]);
    if (allExpanded) {
      setExpandedVisits({});
    } else {
      const nextState = {};
      visitItems.forEach((t) => {
        nextState[t.id] = true;
      });
      setExpandedVisits(nextState);
    }
  };

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadForm, setUploadForm] = useState({
    title: "",
    recordType: "X-Ray",
    recordDate: new Date().toISOString().split("T")[0],
    description: "",
    file: null,
  });

  // Image lightbox state
  const [previewRecord, setPreviewRecord] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    fetchRecords();
    fetchPatientProfileData();
    fetchTimelineData();
  }, [user]);

  const fetchRecords = async () => {
    try {
      setRecordsLoading(true);
      const res = await api.get('/patients/medical-records').catch(() => null);
      if (res && res.data && res.data.success) {
        setMedicalRecords(res.data.records || []);
      }
    } catch (e) {
      console.warn("Using offline records notice:", e?.message);
    } finally {
      setRecordsLoading(false);
    }
  };

  const fetchPatientProfileData = async () => {
    try {
      const res = await api.get('/patients/profile').catch(() => null);
      if (res && res.data && res.data.success && res.data.patientData) {
        const { patient, diseases, medications } = res.data.patientData;
        setPatientDataState(patient);
        setConditionsList(Array.isArray(diseases) ? diseases : []);
        setMedicationsList(Array.isArray(medications) ? medications : []);
      }
    } catch (e) {
      console.warn("Profile fetch notice in medical records page:", e?.message);
    }
  };

  const fetchTimelineData = async () => {
    try {
      const res = await api.get('/patients/timeline').catch(() => null);
      if (res && res.data && res.data.success && Array.isArray(res.data.timeline) && res.data.timeline.length > 0) {
        setTimelineEventsList(res.data.timeline);
        const firstVisit = res.data.timeline.find(
          (t) => t.category === "DOCTOR_VISIT" || t.type === "VISIT" || t.type === "appointment"
        );
        if (firstVisit?.id) {
          setExpandedVisits({ [firstVisit.id]: true });
        }
      } else {
        const isRahul =
          user?.email === 'patient@uhis.gov.in' ||
          user?.fullName?.includes('Rahul') ||
          user?.name?.includes('Rahul');
        if (isRahul && Array.isArray(mockTimelineEvents) && mockTimelineEvents.length > 0) {
          setTimelineEventsList(mockTimelineEvents);
          if (mockTimelineEvents[0]?.id) {
            setExpandedVisits({ [mockTimelineEvents[0].id]: true });
          }
        } else {
          setTimelineEventsList([]);
        }
      }
    } catch (e) {
      console.warn("Timeline fetch notice:", e?.message);
      const isRahul =
        user?.email === 'patient@uhis.gov.in' ||
        user?.fullName?.includes('Rahul') ||
        user?.name?.includes('Rahul');
      if (isRahul && Array.isArray(mockTimelineEvents) && mockTimelineEvents.length > 0) {
        setTimelineEventsList(mockTimelineEvents);
        if (mockTimelineEvents[0]?.id) {
          setExpandedVisits({ [mockTimelineEvents[0].id]: true });
        }
      } else {
        setTimelineEventsList([]);
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError("");

    if (!uploadForm.title.trim()) {
      setUploadError("Please enter a record title.");
      return;
    }
    if (!uploadForm.file) {
      setUploadError("Please select a file to upload.");
      return;
    }
    if (uploadForm.file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10 MB limit.");
      return;
    }

    const ext = uploadForm.file.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext)) {
      setUploadError("Invalid file type. Supported: JPG, PNG, WEBP, PDF.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title.trim());
      formData.append('recordType', uploadForm.recordType);
      formData.append('recordDate', uploadForm.recordDate || new Date().toISOString().split('T')[0]);
      formData.append('description', uploadForm.description.trim());

      const res = await api.post('/patients/medical-records', formData);

      if (res && res.data && res.data.success) {
        toast.success("Medical record uploaded successfully.");
        setUploadModalOpen(false);
        setUploadForm({
          title: "",
          recordType: "X-Ray",
          recordDate: new Date().toISOString().split("T")[0],
          description: "",
          file: null,
        });
        await fetchRecords();
        await fetchTimelineData();
        setActiveTab("records");
      } else {
        setUploadError(res?.data?.message || "Failed to upload.");
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || "Failed to upload record.");
    } finally {
      setUploading(false);
    }
  };

  const handleViewRecord = async (record) => {
    const ext = (record.attachmentUrl || '').split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
    const isPdf = ext === 'pdf';

    try {
      setPreviewLoading(true);
      setPreviewRecord(record);
      setZoomLevel(1);

      const res = await api.get(`/patients/medical-records/${record.id}/file`, {
        responseType: 'blob',
      });

      const blobType = isImage ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : 'application/pdf';
      const blob = new Blob([res.data], { type: blobType });
      const blobUrl = URL.createObjectURL(blob);

      if (isPdf) {
        window.open(blobUrl, '_blank');
        setPreviewRecord(null);
      } else {
        setPreviewBlobUrl(blobUrl);
      }
    } catch (err) {
      toast.error("Failed to load preview.");
      setPreviewRecord(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadRecord = async (record) => {
    try {
      toast.info(`Downloading "${record.title}"...`);
      const res = await api.get(`/patients/medical-records/${record.id}/file?download=true`, {
        responseType: 'blob',
      });

      const ext = (record.attachmentUrl || '').split('.').pop().toLowerCase() || 'bin';
      const cleanTitle = (record.title || 'medical-record').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanTitle}.${ext}`;

      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`"${record.title}" downloaded successfully.`);
    } catch (err) {
      toast.error("Failed to download file.");
    }
  };

  const handleExportDownload = (exportItem) => {
    try {
      toast.info(`Generating ${exportItem.label}...`);
      const patientName = patientDataState?.user?.fullName || user?.fullName || user?.name || "Patient";
      const abhaId = patientDataState?.abhaId || user?.abhaId || "91-XXXX-XXXX-XXXX";
      let content = "";
      let filename = "";
      let mimeType = "application/json";

      if (exportItem.format === "JSON") {
        const bundle = {
          resourceType: "Bundle",
          type: "collection",
          timestamp: new Date().toISOString(),
          patient: {
            name: patientName,
            abhaId: abhaId,
            gender: patientDataState?.gender,
            bloodGroup: patientDataState?.bloodGroup,
          },
          conditions: conditionsList,
          medications: medicationsList,
          medicalRecords: medicalRecords,
        };
        content = JSON.stringify(bundle, null, 2);
        filename = `ABDM_FHIR_Bundle_${patientName.replace(/\s+/g, "_")}.json`;
      } else {
        const summary = [
          "===========================================================",
          "           UNIFIED HEALTHCARE INTERFACE SYSTEM (UHIS)       ",
          "                   LONGITUDINAL HEALTH SUMMARY             ",
          "===========================================================",
          `PATIENT NAME:   ${patientName}`,
          `ABHA ID:        ${abhaId}`,
          `GENDER:         ${patientDataState?.gender || "—"}`,
          `BLOOD GROUP:    ${patientDataState?.bloodGroup || "—"}`,
          `EXPORT DATE:    ${new Date().toLocaleString('en-IN')}`,
          "-----------------------------------------------------------",
          "\n1. CONDITIONS ON RECORD:",
          ...(conditionsList.length > 0
            ? conditionsList.map((c) => `  - [${c.icdCode || "ICD-10"}] ${c.name} (${c.status || "ACTIVE"}) - Diagnosed: ${c.diagnosedDate ? new Date(c.diagnosedDate).toLocaleDateString('en-IN') : 'N/A'}`)
            : ["  - No conditions recorded on file."]),
          "\n2. MEDICATIONS & PRESCRIPTIONS:",
          ...(medicationsList.length > 0
            ? medicationsList.map((m) => `  - ${m.name} ${m.dosage || ""} | ${m.frequency || ""} | Prescribed by: ${m.prescribedBy || "Doctor"}`)
            : ["  - No active medications on file."]),
          "\n3. UPLOADED MEDICAL RECORDS & SCANS:",
          ...(medicalRecords.length > 0
            ? medicalRecords.map((r) => `  - [${r.recordType}] ${r.title} (Date: ${new Date(r.recordDate).toLocaleDateString('en-IN')})`)
            : ["  - No digital image records uploaded."]),
          "\n===========================================================",
          "Certified by National Health Authority (ABDM Compliant)",
          "===========================================================",
        ].join("\n");

        content = summary;
        filename = `${exportItem.label.replace(/[^a-zA-Z0-9_-]/g, "_")}.txt`;
        mimeType = "text/plain";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${exportItem.label} downloaded successfully.`);
    } catch (e) {
      toast.error("Export generation failed.");
    }
  };

  const closeImageViewer = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewBlobUrl(null);
    setPreviewRecord(null);
    setZoomLevel(1);
  };

  const filteredTimeline = filter === "ALL"
    ? timelineEventsList
    : timelineEventsList.filter((t) => (t.type || t.category || "").toLowerCase() === filter.toLowerCase());

  return (
    <AppLayout tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        {/* TIMELINE TAB - DOCTOR VISIT TIMELINE */}
        {activeTab === "timeline" && (
          <div className="fade-in">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
                padding: "0.875rem 1rem",
                background: "var(--color-panel)",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Stethoscope size={16} style={{ color: "var(--color-accent-primary)" }} />
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--color-ink)" }}>
                    Doctor Visit Timeline
                  </span>
                  <span
                    style={{
                      background: "var(--color-surface-alt)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "12px",
                      padding: "0.1rem 0.5rem",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "var(--color-accent-primary)",
                    }}
                  >
                    {timelineEventsList.length} Events
                  </span>
                </div>
                <div className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                  Chronological history of completed clinical consultations, diagnoses, vitals, prescriptions & diagnostic reports.
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "0.35rem", background: "var(--color-surface)", padding: "0.25rem", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  {["ALL", "VISITS", "RECORDS"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      style={{
                        padding: "0.25rem 0.65rem",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        borderRadius: "5px",
                        border: "none",
                        cursor: "pointer",
                        background: filter === f ? "var(--color-accent-primary)" : "transparent",
                        color: filter === f ? "#ffffff" : "var(--color-ink-secondary)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {f === "ALL" ? `ALL (${timelineEventsList.length})` : f === "VISITS" ? `VISITS (${timelineEventsList.filter(t => t.category === "DOCTOR_VISIT" || t.type === "VISIT" || t.type === "appointment").length})` : `RECORDS (${timelineEventsList.filter(t => t.category === "MEDICAL_RECORD" || (t.category !== "DOCTOR_VISIT" && t.type !== "VISIT" && t.type !== "appointment")).length})`}
                    </button>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleAllVisits}
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem" }}
                  title="Expand or collapse all consultation details"
                >
                  <Layers size={13} />
                  {timelineEventsList.filter(t => t.category === "DOCTOR_VISIT" || t.type === "VISIT").every(t => expandedVisits[t.id]) ? "Collapse All" : "Expand All"}
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => { setUploadError(""); setUploadModalOpen(true); }}
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem" }}
                >
                  <Plus size={13} /> ADD MEDICAL RECORD
                </Button>
              </div>
            </div>

            {/* Timeline Items List */}
            {(() => {
              const filtered = timelineEventsList.filter((item) => {
                if (filter === "VISITS") return item.category === "DOCTOR_VISIT" || item.type === "VISIT" || item.type === "appointment";
                if (filter === "RECORDS") return item.category === "MEDICAL_RECORD" || (item.category !== "DOCTOR_VISIT" && item.type !== "VISIT" && item.type !== "appointment");
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "3.5rem 1.5rem", textAlign: "center" }}>
                    <div style={{ display: "inline-flex", padding: "1rem", borderRadius: "50%", background: "var(--color-surface-alt)", marginBottom: "1rem", color: "var(--color-accent-primary)" }}>
                      <Stethoscope size={32} />
                    </div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "var(--color-ink)", marginBottom: "0.35rem" }}>
                      No Doctor Visits Recorded Yet
                    </div>
                    <p className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem", maxWidth: "480px", margin: "0 auto 1.25rem" }}>
                      As you complete doctor consultations or upload diagnostic medical files, your chronological healthcare visit timeline will automatically build here.
                    </p>
                    <Button variant="secondary" size="sm" onClick={() => { setUploadError(""); setUploadModalOpen(true); }}>
                      <Upload size={13} style={{ marginRight: "0.35rem" }} /> Upload Your First Medical Record
                    </Button>
                  </div>
                );
              }

              return (
                <div style={{ position: "relative", paddingLeft: "1.75rem" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "7px",
                      top: "1rem",
                      bottom: "1rem",
                      width: "2px",
                      background: "var(--color-border)",
                    }}
                  />

                  {filtered.map((t, idx) => {
                    const isDoctorVisit = t.category === "DOCTOR_VISIT" || t.type === "VISIT" || t.type === "appointment";
                    const isExpanded = !!expandedVisits[t.id];

                    if (isDoctorVisit) {
                      const visitDateStr = t.date || t.visitDate || t.appointmentDate;
                      const formattedDate = visitDateStr
                        ? new Date(visitDateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "Recent Visit";
                      const timeStr = t.timeSlot || (visitDateStr ? new Date(visitDateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "10:00 AM");
                      const prescriptions = Array.isArray(t.prescriptions) ? t.prescriptions : [];
                      const symptoms = Array.isArray(t.symptoms) ? t.symptoms : t.symptoms ? [t.symptoms] : [];
                      const tests = Array.isArray(t.testsRecommended) ? t.testsRecommended : t.testsRecommended ? [t.testsRecommended] : [];

                      return (
                        <div key={t.id || `visit-${idx}`} style={{ position: "relative", marginBottom: "1.5rem" }}>
                          <div
                            style={{
                              position: "absolute",
                              left: "-1.75rem",
                              top: "1.1rem",
                              width: "16px",
                              height: "16px",
                              borderRadius: "50%",
                              background: "var(--color-panel)",
                              border: "3px solid var(--color-accent-primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 2,
                            }}
                          />

                          <div
                            style={{
                              background: "var(--color-panel)",
                              border: "1px solid var(--color-border)",
                              borderLeft: "4px solid var(--color-accent-primary)",
                              borderRadius: "10px",
                              overflow: "hidden",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <div style={{ padding: "1.1rem 1.25rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.3rem",
                                      background: "var(--color-surface-alt)",
                                      border: "1px solid var(--color-border)",
                                      padding: "0.2rem 0.55rem",
                                      borderRadius: "6px",
                                      fontSize: "0.78rem",
                                      fontWeight: 700,
                                      color: "var(--color-ink)",
                                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    }}
                                  >
                                    <Calendar size={13} style={{ color: "var(--color-accent-primary)" }} />
                                    {formattedDate}
                                  </span>

                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.25rem",
                                      background: "var(--color-surface)",
                                      border: "1px solid var(--color-border)",
                                      padding: "0.2rem 0.5rem",
                                      borderRadius: "6px",
                                      fontSize: "0.75rem",
                                      color: "var(--color-ink-secondary)",
                                    }}
                                  >
                                    <Clock size={12} />
                                    {timeStr}
                                  </span>

                                  <span
                                    style={{
                                      background: "rgba(14, 165, 233, 0.1)",
                                      color: "var(--color-accent-primary)",
                                      border: "1px solid rgba(14, 165, 233, 0.25)",
                                      padding: "0.15rem 0.5rem",
                                      borderRadius: "4px",
                                      fontSize: "0.7rem",
                                      fontWeight: 700,
                                      letterSpacing: "0.05em",
                                    }}
                                  >
                                    OPD CONSULTATION
                                  </span>
                                </div>

                                <StatusCode status="normal" label={(t.status || "COMPLETED").toUpperCase()} />
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "var(--color-ink)" }}>
                                      {t.doctorName || t.doctor || "Consultant Physician"}
                                    </span>
                                    <span
                                      style={{
                                        background: "var(--color-surface-alt)",
                                        border: "1px solid var(--color-border)",
                                        padding: "0.15rem 0.5rem",
                                        borderRadius: "4px",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        color: "var(--color-accent-primary)",
                                      }}
                                    >
                                      {t.doctorSpecialization || t.specialty || "Internal Medicine"}
                                    </span>
                                    {t.doctorQualification && (
                                      <span className="type-id" style={{ color: "var(--color-ink-secondary)", fontSize: "0.75rem" }}>
                                        ({t.doctorQualification})
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem", color: "var(--color-ink-secondary)", fontSize: "0.82rem" }}>
                                    <MapPin size={13} style={{ flexShrink: 0 }} />
                                    <span>{t.hospitalName || t.facility || "AIIMS New Delhi"}</span>
                                    {t.hospitalAddress && (
                                      <span style={{ opacity: 0.8 }}>· {t.hospitalAddress}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Summary bar */}
                              <div
                                style={{
                                  background: "var(--color-surface)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: "8px",
                                  padding: "0.75rem 1rem",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "0.5rem",
                                }}
                              >
                                {(t.chiefComplaint || t.reason) && (
                                  <div style={{ fontSize: "0.83rem", color: "var(--color-ink)", display: "flex", gap: "0.4rem" }}>
                                    <span style={{ fontWeight: 700, color: "var(--color-ink-secondary)", flexShrink: 0 }}>Reason / Complaint:</span>
                                    <span>{t.chiefComplaint || t.reason}</span>
                                  </div>
                                )}

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.35rem",
                                        background: "rgba(16, 185, 129, 0.1)",
                                        border: "1px solid rgba(16, 185, 129, 0.3)",
                                        color: "var(--color-signal-normal)",
                                        padding: "0.2rem 0.55rem",
                                        borderRadius: "6px",
                                        fontSize: "0.78rem",
                                        fontWeight: 600,
                                      }}
                                    >
                                      <Activity size={13} />
                                      Diagnosis: {t.diagnosis || "OPD Assessment"}
                                      {t.icdCode ? ` (${t.icdCode})` : ""}
                                    </span>

                                    {prescriptions.length > 0 && (
                                      <span
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "0.3rem",
                                          background: "rgba(245, 158, 11, 0.1)",
                                          border: "1px solid rgba(245, 158, 11, 0.3)",
                                          color: "var(--color-signal-warning)",
                                          padding: "0.2rem 0.55rem",
                                          borderRadius: "6px",
                                          fontSize: "0.78rem",
                                          fontWeight: 600,
                                        }}
                                      >
                                        <Pill size={13} />
                                        {prescriptions.length} {prescriptions.length === 1 ? "Medicine Prescribed" : "Medicines Prescribed"}
                                      </span>
                                    )}

                                    {tests.length > 0 && (
                                      <span
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "0.3rem",
                                          background: "rgba(139, 92, 246, 0.1)",
                                          border: "1px solid rgba(139, 92, 246, 0.3)",
                                          color: "#a78bfa",
                                          padding: "0.2rem 0.55rem",
                                          borderRadius: "6px",
                                          fontSize: "0.78rem",
                                          fontWeight: 600,
                                        }}
                                      >
                                        <FlaskConical size={13} />
                                        {tests.length} Tests
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => toggleVisit(t.id)}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.35rem",
                                      background: isExpanded ? "var(--color-surface-alt)" : "var(--color-panel)",
                                      border: "1px solid var(--color-border)",
                                      color: "var(--color-ink)",
                                      padding: "0.3rem 0.75rem",
                                      borderRadius: "6px",
                                      fontSize: "0.78rem",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Section */}
                            {isExpanded && (
                              <div
                                style={{
                                  borderTop: "1px solid var(--color-border)",
                                  background: "var(--color-surface)",
                                  padding: "1.25rem",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "1.1rem",
                                }}
                              >
                                {/* Reason & Symptoms */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                  <div className="type-id" style={{ color: "var(--color-accent-primary)", fontSize: "0.72rem", letterSpacing: "0.06em", fontWeight: 700 }}>
                                    1. REASON FOR VISIT & SYMPTOMS REPORTED
                                  </div>
                                  <div style={{ fontSize: "0.85rem", color: "var(--color-ink)", lineHeight: 1.5 }}>
                                    {t.chiefComplaint || t.reason || "Routine Clinical Follow-Up"}
                                  </div>
                                  {symptoms.length > 0 && (
                                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                                      {symptoms.map((sym, sIdx) => (
                                        <span
                                          key={sIdx}
                                          style={{
                                            background: "var(--color-panel)",
                                            border: "1px solid var(--color-border)",
                                            padding: "0.15rem 0.5rem",
                                            borderRadius: "12px",
                                            fontSize: "0.76rem",
                                            color: "var(--color-ink-secondary)",
                                          }}
                                        >
                                          • {sym}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Findings */}
                                {t.findings && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                    <div className="type-id" style={{ color: "var(--color-accent-primary)", fontSize: "0.72rem", letterSpacing: "0.06em", fontWeight: 700 }}>
                                      2. DOCTOR'S FINDINGS & OBSERVATIONS
                                    </div>
                                    <div
                                      style={{
                                        background: "var(--color-panel)",
                                        borderLeft: "3px solid var(--color-accent-primary)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "6px",
                                        padding: "0.65rem 0.85rem",
                                        fontSize: "0.84rem",
                                        color: "var(--color-ink)",
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      {t.findings}
                                    </div>
                                  </div>
                                )}

                                {/* Vitals */}
                                {t.vitals && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    <div className="type-id" style={{ color: "var(--color-accent-primary)", fontSize: "0.72rem", letterSpacing: "0.06em", fontWeight: 700 }}>
                                      3. RECORDED VITALS
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem" }}>
                                      {t.vitals.bp && (
                                        <div style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "0.5rem 0.75rem" }}>
                                          <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--color-ink-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                            <Heart size={11} color="#ef4444" /> BLOOD PRESSURE
                                          </div>
                                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-ink)", marginTop: "0.15rem" }}>
                                            {t.vitals.bp}
                                          </div>
                                        </div>
                                      )}
                                      {t.vitals.pulse && (
                                        <div style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "0.5rem 0.75rem" }}>
                                          <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--color-ink-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                            <Activity size={11} color="#f59e0b" /> PULSE RATE
                                          </div>
                                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-ink)", marginTop: "0.15rem" }}>
                                            {t.vitals.pulse}
                                          </div>
                                        </div>
                                      )}
                                      {t.vitals.temp && (
                                        <div style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "0.5rem 0.75rem" }}>
                                          <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--color-ink-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                            <Thermometer size={11} color="#eab308" /> TEMPERATURE
                                          </div>
                                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-ink)", marginTop: "0.15rem" }}>
                                            {t.vitals.temp}
                                          </div>
                                        </div>
                                      )}
                                      {t.vitals.spo2 && (
                                        <div style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "0.5rem 0.75rem" }}>
                                          <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--color-ink-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                            <Droplet size={11} color="#06b6d4" /> SPO2
                                          </div>
                                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-ink)", marginTop: "0.15rem" }}>
                                            {t.vitals.spo2}
                                          </div>
                                        </div>
                                      )}
                                      {(t.vitals.weight || t.vitals.height) && (
                                        <div style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "0.5rem 0.75rem" }}>
                                          <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--color-ink-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                            <Weight size={11} /> WEIGHT / HEIGHT
                                          </div>
                                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-ink)", marginTop: "0.15rem" }}>
                                            {t.vitals.weight || "—"} {t.vitals.height ? `· ${t.vitals.height}` : ""}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Diagnosis */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                  <div className="type-id" style={{ color: "var(--color-accent-primary)", fontSize: "0.72rem", letterSpacing: "0.06em", fontWeight: 700 }}>
                                    4. DIAGNOSIS & CLINICAL ASSESSMENT
                                  </div>
                                  <div
                                    style={{
                                      background: "var(--color-panel)",
                                      border: "1px solid var(--color-border)",
                                      borderRadius: "8px",
                                      padding: "0.75rem 1rem",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      gap: "0.75rem",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <div>
                                      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--color-ink)" }}>
                                        {t.diagnosis || "Clinical OPD Assessment"}
                                      </div>
                                      {t.icdCode && (
                                        <div className="type-id" style={{ color: "var(--color-ink-secondary)", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                                          ICD-10 Code: {t.icdCode}
                                        </div>
                                      )}
                                    </div>
                                    <StatusCode status={SEVERITY_SIGNAL[(t.severity || "moderate").toLowerCase()] || "warning"} label={(t.severity || "MODERATE").toUpperCase()} />
                                  </div>
                                </div>

                                {/* Prescriptions */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                  <div className="type-id" style={{ color: "var(--color-accent-primary)", fontSize: "0.72rem", letterSpacing: "0.06em", fontWeight: 700 }}>
                                    5. PRESCRIPTIONS & MEDICATION ORDERS ({prescriptions.length})
                                  </div>

                                  {prescriptions.length === 0 ? (
                                    <div style={{ fontSize: "0.82rem", color: "var(--color-ink-secondary)", fontStyle: "italic", background: "var(--color-panel)", padding: "0.6rem 0.85rem", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                                      No prescription medications issued during this visit.
                                    </div>
                                  ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                      {prescriptions.map((rx, rxIdx) => (
                                        <div
                                          key={rx.id || `rx-${rxIdx}`}
                                          style={{
                                            background: "var(--color-panel)",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "8px",
                                            padding: "0.75rem 1rem",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.35rem",
                                          }}
                                        >
                                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                                              <Pill size={14} style={{ color: "var(--color-accent-primary)" }} />
                                              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "var(--color-ink)" }}>
                                                {rx.medicineName}
                                              </span>
                                              <span
                                                style={{
                                                  background: "var(--color-surface-alt)",
                                                  border: "1px solid var(--color-border)",
                                                  padding: "0.1rem 0.45rem",
                                                  borderRadius: "4px",
                                                  fontSize: "0.72rem",
                                                  fontWeight: 600,
                                                  color: "var(--color-ink)",
                                                }}
                                              >
                                                {rx.dosage}
                                              </span>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                              <span
                                                style={{
                                                  background: "rgba(14, 165, 233, 0.1)",
                                                  color: "var(--color-accent-primary)",
                                                  border: "1px solid rgba(14, 165, 233, 0.25)",
                                                  padding: "0.15rem 0.5rem",
                                                  borderRadius: "4px",
                                                  fontSize: "0.72rem",
                                                  fontWeight: 600,
                                                }}
                                              >
                                                {rx.frequency}
                                              </span>
                                              <span
                                                style={{
                                                  background: "var(--color-surface-alt)",
                                                  border: "1px solid var(--color-border)",
                                                  color: "var(--color-ink-secondary)",
                                                  padding: "0.15rem 0.5rem",
                                                  borderRadius: "4px",
                                                  fontSize: "0.72rem",
                                                  fontWeight: 600,
                                                }}
                                              >
                                                {rx.duration || (rx.durationDays ? `${rx.durationDays} days` : "As directed")}
                                              </span>
                                            </div>
                                          </div>

                                          {rx.instructions && (
                                            <div style={{ fontSize: "0.8rem", color: "var(--color-ink-secondary)", paddingLeft: "1.4rem" }}>
                                              <span style={{ fontWeight: 600 }}>Instructions:</span> {rx.instructions}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Recommended Tests */}
                                {tests.length > 0 && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                    <div className="type-id" style={{ color: "var(--color-accent-primary)", fontSize: "0.72rem", letterSpacing: "0.06em", fontWeight: 700 }}>
                                      6. TESTS & INVESTIGATIONS RECOMMENDED
                                    </div>
                                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                      {tests.map((tst, tIdx) => (
                                        <span
                                          key={tIdx}
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.35rem",
                                            background: "var(--color-panel)",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "6px",
                                            padding: "0.35rem 0.65rem",
                                            fontSize: "0.8rem",
                                            color: "var(--color-ink)",
                                          }}
                                        >
                                          <FlaskConical size={13} style={{ color: "#a78bfa" }} />
                                          {tst}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Doctor's Advice */}
                                {t.doctorNotes && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                    <div className="type-id" style={{ color: "var(--color-accent-primary)", fontSize: "0.72rem", letterSpacing: "0.06em", fontWeight: 700 }}>
                                      7. DOCTOR'S ADVICE & LIFESTYLE GUIDANCE
                                    </div>
                                    <div
                                      style={{
                                        background: "rgba(14, 165, 233, 0.05)",
                                        border: "1px solid rgba(14, 165, 233, 0.2)",
                                        borderRadius: "6px",
                                        padding: "0.65rem 0.85rem",
                                        fontSize: "0.84rem",
                                        color: "var(--color-ink)",
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      {t.doctorNotes}
                                    </div>
                                  </div>
                                )}

                                {/* Follow-up */}
                                {t.followUp && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                    <div className="type-id" style={{ color: "var(--color-accent-primary)", fontSize: "0.72rem", letterSpacing: "0.06em", fontWeight: 700 }}>
                                      8. FOLLOW-UP RECOMMENDATION
                                    </div>
                                    <div
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.45rem",
                                        background: "var(--color-panel)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "6px",
                                        padding: "0.45rem 0.75rem",
                                        fontSize: "0.84rem",
                                        color: "var(--color-ink)",
                                        width: "fit-content",
                                      }}
                                    >
                                      <Calendar size={14} style={{ color: "var(--color-accent-primary)" }} />
                                      <span>{t.followUp}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Medical record entry
                    const recordDateStr = t.date || t.recordDate || t.createdAt;
                    const formattedRecordDate = recordDateStr
                      ? new Date(recordDateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                      : "Recent";

                    return (
                      <div key={t.id || `record-${idx}`} style={{ position: "relative", marginBottom: "1.5rem" }}>
                        <div
                          style={{
                            position: "absolute",
                            left: "-1.75rem",
                            top: "1.1rem",
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            background: "var(--color-panel)",
                            border: "3px solid #8b5cf6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 2,
                          }}
                        />

                        <div
                          style={{
                            background: "var(--color-panel)",
                            border: "1px solid var(--color-border)",
                            borderLeft: "4px solid #8b5cf6",
                            borderRadius: "10px",
                            padding: "1rem 1.25rem",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  background: "var(--color-surface-alt)",
                                  border: "1px solid var(--color-border)",
                                  padding: "0.2rem 0.55rem",
                                  borderRadius: "6px",
                                  fontSize: "0.78rem",
                                  fontWeight: 700,
                                  color: "var(--color-ink)",
                                }}
                              >
                                <Calendar size={13} style={{ color: "#8b5cf6" }} />
                                {formattedRecordDate}
                              </span>

                              <span
                                style={{
                                  background: "rgba(139, 92, 246, 0.1)",
                                  color: "#a78bfa",
                                  border: "1px solid rgba(139, 92, 246, 0.25)",
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "4px",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  letterSpacing: "0.05em",
                                }}
                              >
                                {RECORD_TYPE_ICONS[t.type] || "📄"} {(t.type || "MEDICAL REPORT").toUpperCase()}
                              </span>
                            </div>

                            <StatusCode status="info" label="RECORDED" />
                          </div>

                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--color-ink)", marginBottom: "0.25rem" }}>
                            {t.title}
                          </div>

                          {t.description && (
                            <div className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.84rem", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                              {t.description}
                            </div>
                          )}

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", borderTop: "1px solid var(--color-border)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                            <span className="type-id" style={{ color: "var(--color-ink-secondary)", fontSize: "0.75rem" }}>
                              Uploaded by: {t.doctorName || "Self / Clinical Staff"}
                            </span>

                            {t.attachmentUrl && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleViewRecord(t)}
                                style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem" }}
                              >
                                <Eye size={13} /> View Attached Record
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ALL RECORDS TAB */}
        {activeTab === "records" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Uploaded Diagnostic Scans & Records Panel */}
            <InstrumentPanel
              title="Uploaded Medical Images & Documents"
              subtitle="SECURE FILE ARCHIVE"
              channel="info"
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => { setUploadError(""); setUploadModalOpen(true); }}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <Plus size={11} /> ADD RECORD
                </Button>
              }
            >
              {recordsLoading ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  <span className="type-body" style={{ color: "var(--color-ink-secondary)" }}>Loading records...</span>
                </div>
              ) : medicalRecords.length === 0 ? (
                <div style={{ padding: "2.5rem 1rem", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--color-ink)", marginBottom: "0.25rem" }}>
                    No medical records added yet.
                  </div>
                  <p className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                    Upload your X-rays, MRI scans, CT scans, or medical reports to link them to your profile.
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => { setUploadError(""); setUploadModalOpen(true); }}>
                    <Upload size={11} /> Upload Record
                  </Button>
                </div>
              ) : (
                medicalRecords.map((r) => {
                  const ext = (r.attachmentUrl || "").split(".").pop().toLowerCase();
                  const isImg = ["jpg", "jpeg", "png", "webp"].includes(ext);
                  const icon = RECORD_TYPE_ICONS[r.recordType] || "📄";

                  return (
                    <div key={r.id} className="data-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "1.1rem" }}>{icon}</span>
                          <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.9rem", fontWeight: 600 }}>
                            {r.title}
                          </span>
                          <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.45rem", borderRadius: "4px", background: "var(--color-surface-alt)", border: "1px solid var(--color-border)", color: "var(--color-ink-secondary)", fontWeight: 600 }}>
                            {r.recordType}
                          </span>
                          {ext && (
                            <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: "4px", background: isImg ? "rgba(37,99,235,0.08)" : "rgba(220,38,38,0.08)", color: isImg ? "#2563EB" : "#DC2626", fontWeight: 700 }}>
                              {ext.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
                          <span className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>
                            Date: {r.recordDate ? new Date(r.recordDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "Recent"}
                          </span>
                          {r.description && (
                            <span className="type-micro" style={{ color: "var(--color-ink-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {r.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleViewRecord(r)}
                          style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                        >
                          <Eye size={11} /> {isImg ? "View Image" : "View Record"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownloadRecord(r)}
                          style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                        >
                          <Download size={11} /> Download
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </InstrumentPanel>

            {/* Conditions on Record */}
            <InstrumentPanel title="Conditions on Record" subtitle="DIAGNOSES" channel="warning">
              {conditionsList.length === 0 ? (
                <div style={{ padding: "1.5rem", textAlign: "center" }}>
                  <span className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                    No conditions recorded on file.
                  </span>
                </div>
              ) : (
                conditionsList.map((c) => (
                  <div key={c.id} className="data-row">
                    <div>
                      <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{c.name}</span>
                      <span className="type-id" style={{ color: "var(--color-ink-muted)", marginLeft: "0.5rem" }}>{c.icdCode || "ICD-10"}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
                        {c.diagnosedDate ? new Date(c.diagnosedDate).toLocaleDateString('en-IN') : 'N/A'}
                      </span>
                      <StatusCode
                        status={(c.status || '').toLowerCase() === "chronic" ? "critical" : "warning"}
                        label={(c.status || "ACTIVE").toUpperCase()}
                      />
                    </div>
                  </div>
                ))
              )}
            </InstrumentPanel>

            {/* Medication History */}
            <InstrumentPanel title="Medication History" subtitle="ALL PRESCRIPTIONS" channel="info">
              {medicationsList.length === 0 ? (
                <div style={{ padding: "1.5rem", textAlign: "center" }}>
                  <span className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                    No medications recorded on file.
                  </span>
                </div>
              ) : (
                medicationsList.map((m) => (
                  <div key={m.id} className="data-row">
                    <div>
                      <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{m.name} {m.dosage}</span>
                      <span className="type-micro" style={{ color: "var(--color-ink-secondary)", display: "block" }}>{m.prescribedBy} · {m.startDate}</span>
                    </div>
                    <StatusCode status={m.endDate === "Ongoing" ? "info" : "normal"} label={m.endDate === "Ongoing" ? "ACTIVE" : "COMPLETED"} />
                  </div>
                ))
              )}
            </InstrumentPanel>
          </div>
        )}

        {/* EXPORT TAB */}
        {activeTab === "export" && (
          <div className="fade-in">
            <InstrumentPanel title="Export Medical Records" subtitle="DATA PORTABILITY" channel="muted">
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {[
                  { label: "Complete Health Summary (PDF/Text)", desc: "Full longitudinal record — conditions, meds, labs, visits, and uploaded scans", format: "PDF" },
                  { label: "ABDM FHIR Bundle (JSON)", desc: "Machine-readable interoperable health record conforming to ABDM standards", format: "JSON" },
                  { label: "Lab Reports Archive", desc: "All completed lab diagnostic summaries in a single document", format: "PDF" },
                  { label: "Prescription History", desc: "All prescriptions with dosage, frequency, and prescriber details", format: "PDF" },
                  { label: "Vaccination Certificate", desc: "WHO/ABDM-standard immunization record", format: "PDF" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="data-row"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div>
                      <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{item.label}</div>
                      <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>{item.desc}</div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
                      <span className="type-label" style={{ color: "var(--color-ink-muted)" }}>{item.format}</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                        onClick={() => handleExportDownload(item)}
                      >
                        <Download size={11} /> DOWNLOAD
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </InstrumentPanel>
          </div>
        )}
      </div>

      {/* Upload Medical Record Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Medical Record"
        subtitle="LONGITUDINAL HEALTH ARCHIVE"
      >
        <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {uploadError && (
            <div
              style={{
                background: "var(--color-signal-critical-bg)",
                border: "1px solid var(--color-signal-critical-border)",
                padding: "0.75rem 1rem",
                borderRadius: "6px",
                color: "var(--color-signal-critical)",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <AlertTriangle size={15} />
              <span>{uploadError}</span>
            </div>
          )}

          <PrecisionInput
            label="Record Title *"
            placeholder="e.g. Chest X-Ray - PA View, MRI Brain Scan"
            value={uploadForm.title}
            onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label className="type-label">Record Type *</label>
              <select
                className="precision-input"
                value={uploadForm.recordType}
                onChange={(e) => setUploadForm({ ...uploadForm, recordType: e.target.value })}
                style={{ padding: "0.55rem 0.75rem" }}
              >
                {RECORD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {RECORD_TYPE_ICONS[t]} {t}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label className="type-label">Record Date *</label>
              <input
                type="date"
                className="precision-input"
                value={uploadForm.recordDate}
                onChange={(e) => setUploadForm({ ...uploadForm, recordDate: e.target.value })}
                style={{ padding: "0.55rem 0.75rem" }}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label className="type-label">Clinical Notes / Description (Optional)</label>
            <textarea
              className="precision-input"
              rows={3}
              placeholder="e.g. Follow-up chest radiograph showing clear lung fields."
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          {/* File Upload Dropzone */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label className="type-label">Attach File * (JPG, PNG, WEBP, PDF — Max 10MB)</label>
            <div
              style={{
                border: "2px dashed var(--color-border)",
                borderRadius: "8px",
                padding: "1.5rem",
                textAlign: "center",
                background: "var(--color-surface-alt)",
                cursor: "pointer",
                position: "relative",
              }}
              onClick={() => document.getElementById("page-record-file-input")?.click()}
            >
              <input
                id="page-record-file-input"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadForm({ ...uploadForm, file: e.target.files[0] });
                    setUploadError("");
                  }
                }}
              />
              <Upload size={24} style={{ color: "var(--color-accent-primary)", margin: "0 auto 0.5rem auto" }} />
              {uploadForm.file ? (
                <div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "var(--color-ink)" }}>
                    {uploadForm.file.name}
                  </div>
                  <div className="type-micro" style={{ color: "var(--color-ink-secondary)", marginTop: "0.2rem" }}>
                    {(uploadForm.file.size / (1024 * 1024)).toFixed(2)} MB · Click to change file
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "0.85rem", color: "var(--color-ink)" }}>
                    Click to browse or drop file here
                  </div>
                  <div className="type-micro" style={{ color: "var(--color-ink-muted)", marginTop: "0.2rem" }}>
                    Supported: JPG, PNG, WEBP, PDF (Max 10 MB)
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setUploadModalOpen(false)}
              disabled={uploading}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={uploading}
              style={{ flex: 1, justifyContent: "center" }}
            >
              {uploading ? "UPLOADING FILE..." : "CONFIRM & UPLOAD"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Image Lightbox / Full Viewer Modal */}
      {previewRecord && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={closeImageViewer}
        >
          <div
            style={{
              background: "var(--color-panel)",
              borderRadius: "12px",
              border: "1px solid var(--color-border)",
              width: "100%",
              maxWidth: "920px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                background: "var(--color-surface)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>{RECORD_TYPE_ICONS[previewRecord.recordType] || "🩻"}</span>
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-ink)" }}>
                    {previewRecord.title}
                  </h3>
                  <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "4px", background: "var(--color-surface-alt)", border: "1px solid var(--color-border)", color: "var(--color-ink-secondary)", fontWeight: 600 }}>
                    {previewRecord.recordType}
                  </span>
                </div>
                <div className="type-micro" style={{ color: "var(--color-ink-secondary)", marginTop: "0.15rem" }}>
                  {previewRecord.recordDate ? new Date(previewRecord.recordDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                  title="Zoom Out"
                  style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "0.4rem", cursor: "pointer", color: "var(--color-ink)" }}
                >
                  <ZoomOut size={15} />
                </button>
                <span className="type-micro" style={{ minWidth: "40px", textAlign: "center" }}>{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                  title="Zoom In"
                  style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "0.4rem", cursor: "pointer", color: "var(--color-ink)" }}
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  title="Reset Zoom"
                  style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "0.4rem", cursor: "pointer", color: "var(--color-ink)" }}
                >
                  <RotateCcw size={15} />
                </button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownloadRecord(previewRecord)}
                  style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginLeft: "0.25rem" }}
                >
                  <Download size={12} /> Download
                </Button>
                <button
                  onClick={closeImageViewer}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.4rem",
                    color: "var(--color-ink-muted)",
                    borderRadius: "6px",
                    display: "flex",
                  }}
                  title="Close (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Image Canvas */}
            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "350px",
                maxHeight: "65vh",
                background: "#0f172a",
              }}
            >
              {previewLoading ? (
                <div style={{ color: "white", fontFamily: "'Inter', sans-serif", fontSize: "0.9rem" }}>
                  Loading image stream...
                </div>
              ) : previewBlobUrl ? (
                <img
                  src={previewBlobUrl}
                  alt={previewRecord.title}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "60vh",
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: "center center",
                    transition: "transform 150ms ease",
                    borderRadius: "4px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  }}
                />
              ) : (
                <div style={{ color: "white" }}>Failed to load image preview.</div>
              )}
            </div>

            {/* Viewer Footer */}
            {previewRecord.description && (
              <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
                <span className="type-micro" style={{ color: "var(--color-ink-muted)", fontWeight: 600 }}>CLINICAL NOTES: </span>
                <span className="type-body" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{previewRecord.description}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
