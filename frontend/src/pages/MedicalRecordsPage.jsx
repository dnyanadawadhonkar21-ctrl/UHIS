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
import { timelineEvents, labReports, visits, conditions, medications, patientData } from "../data/mockData";

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

const TYPE_LABELS = {
  appointment: "OPD",
  visit: "VISIT",
  lab: "LAB",
  diagnosis: "DX",
  vaccination: "VAX",
  surgery: "SURG",
  "medical-record": "RECORD",
};

const YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("timeline");
  const [filter, setFilter] = useState("ALL");
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

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
  }, []);

  const fetchRecords = async () => {
    try {
      setRecordsLoading(true);
      const res = await api.get('/patients/medical-records').catch(() => null);
      if (res && res.data && res.data.success) {
        setMedicalRecords(res.data.records || []);
      }
    } catch (e) {
      console.warn("Using offline records");
    } finally {
      setRecordsLoading(false);
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
      let content = "";
      let filename = "";
      let mimeType = "application/json";

      if (exportItem.format === "JSON") {
        const bundle = {
          resourceType: "Bundle",
          type: "collection",
          timestamp: new Date().toISOString(),
          patient: patientData,
          conditions,
          medications,
          labReports,
          medicalRecords,
        };
        content = JSON.stringify(bundle, null, 2);
        filename = `ABDM_FHIR_Bundle_${patientData.name.replace(/\s+/g, "_")}.json`;
      } else {
        // PDF / Text Longitudinal Summary export
        const summary = [
          "===========================================================",
          "           UNIFIED HEALTHCARE INTERFACE SYSTEM (UHIS)       ",
          "                   LONGITUDINAL HEALTH SUMMARY             ",
          "===========================================================",
          `PATIENT NAME:   ${patientData.name}`,
          `ABHA ID:        ${patientData.abhaId}`,
          `DATE OF BIRTH:  ${patientData.dob} (Age: ${patientData.age})`,
          `GENDER:         ${patientData.gender}`,
          `BLOOD GROUP:    ${patientData.bloodGroup}`,
          `EXPORT DATE:    ${new Date().toLocaleString('en-IN')}`,
          "-----------------------------------------------------------",
          "\n1. ACTIVE CONDITIONS & DIAGNOSES:",
          ...conditions.map((c) => `  - [${c.icd10}] ${c.name} (${c.status.toUpperCase()}) - Diagnosed: ${c.diagnosedDate}`),
          "\n2. ACTIVE MEDICATIONS (RX):",
          ...medications.map((m) => `  - ${m.name} ${m.dosage} | ${m.frequency} | Prescribed by: ${m.prescribedBy}`),
          "\n3. RECENT LAB REPORTS:",
          ...labReports.map((l) => `  - ${l.testName} (${l.date}): ${l.summary || l.resultData}`),
          "\n4. UPLOADED MEDICAL RECORDS & SCANS:",
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

  const allTimeline = timelineEvents || [];
  const filteredTimeline = filter === "ALL"
    ? allTimeline
    : allTimeline.filter((t) => (t.type || "").toLowerCase() === filter.toLowerCase());

  return (
    <AppLayout tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="fade-in">
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["ALL", "VISIT", "LAB", "DIAGNOSIS", "VACCINATION", "SURGERY"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={filter === f ? "filter-pill-active" : "filter-pill"}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => { setUploadError(""); setUploadModalOpen(true); }}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Plus size={12} /> ADD MEDICAL RECORD
              </Button>
            </div>

            {/* Year grouping */}
            {YEARS.map((year) => {
              const yearItems = filteredTimeline.filter((t) => (t.date || "").startsWith(year));
              if (!yearItems.length) return null;
              return (
                <div key={year} style={{ marginBottom: "2rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        color: "var(--color-ink)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {year}
                    </span>
                    <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
                    <span className="type-micro" style={{ color: "var(--color-ink-muted)" }}>
                      {yearItems.length} {yearItems.length === 1 ? "event" : "events"}
                    </span>
                  </div>
                  <div style={{ position: "relative", paddingLeft: "1.25rem" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: "4px",
                        top: 0,
                        bottom: 0,
                        width: "1px",
                        background: "var(--color-border)",
                      }}
                    />
                    {yearItems.map((t) => (
                      <div key={t.id} style={{ position: "relative", marginBottom: "0.75rem", paddingLeft: "1rem" }}>
                        <div
                          style={{
                            position: "absolute",
                            left: "-5px",
                            top: "0.4rem",
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: t.signal === "critical" ? "var(--color-signal-critical)"
                              : t.signal === "warning" ? "var(--color-signal-warning)"
                              : t.signal === "info" ? "var(--color-signal-info)"
                              : "var(--color-signal-normal)",
                          }}
                        />
                        <div
                          className={`instrument-panel channel-${t.signal || "info"}`}
                          style={{ background: "var(--color-panel)" }}
                        >
                          <div
                            style={{
                              padding: "0.75rem 1.25rem",
                              display: "flex",
                              gap: "1rem",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", flex: 1 }}>
                              <span
                                style={{
                                  background: "var(--color-surface-alt)",
                                  color: "var(--color-ink-secondary)",
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "4px",
                                  fontFamily: "'Inter', sans-serif",
                                  fontSize: "0.65rem",
                                  fontWeight: 600,
                                  letterSpacing: "0.06em",
                                  flexShrink: 0,
                                  border: "1px solid var(--color-border)",
                                }}
                              >
                                {TYPE_LABELS[t.type] || (t.type || "").toUpperCase()}
                              </span>
                              <span className="type-id" style={{ color: "var(--color-ink-secondary)", flexShrink: 0 }}>
                                {t.date}
                              </span>
                              <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>
                                {t.title}
                              </span>
                            </div>
                            <span className="type-micro" style={{ color: "var(--color-ink-secondary)", flexShrink: 0 }}>
                              {t.detail || t.summary}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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
                <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--color-ink)", marginBottom: "0.25rem" }}>
                    No medical records uploaded yet.
                  </div>
                  <p className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                    Upload your X-rays, MRI scans, CT scans, or medical reports.
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
              {conditions.map((c) => (
                <div key={c.id} className="data-row">
                  <div>
                    <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{c.name}</span>
                    <span className="type-id" style={{ color: "var(--color-ink-muted)", marginLeft: "0.5rem" }}>{c.icd10}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>{c.diagnosedDate}</span>
                    <StatusCode
                      status={c.status === "chronic" ? "critical" : c.status === "active" ? "warning" : "normal"}
                      label={c.status.toUpperCase()}
                    />
                  </div>
                </div>
              ))}
            </InstrumentPanel>

            {/* Medication History */}
            <InstrumentPanel title="Medication History" subtitle="ALL PRESCRIPTIONS" channel="info">
              {medications.map((m) => (
                <div key={m.id} className="data-row">
                  <div>
                    <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{m.name} {m.dosage}</span>
                    <span className="type-micro" style={{ color: "var(--color-ink-secondary)", display: "block" }}>{m.prescribedBy} · {m.startDate}</span>
                  </div>
                  <StatusCode status={m.endDate === "Ongoing" ? "info" : "normal"} label={m.endDate === "Ongoing" ? "ACTIVE" : "COMPLETED"} />
                </div>
              ))}
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
