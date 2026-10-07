import React, { useState, useEffect } from "react";
import {
  Edit,
  Download,
  AlertTriangle,
  Heart,
  Pill,
  FlaskConical,
  Calendar,
  Upload,
  Plus,
  FileText,
  FileImage,
  Eye,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  FolderOpen,
  CheckCircle,
  ShieldCheck,
  Phone,
  MapPin,
  Ruler,
  Weight,
  Droplet,
  Save,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Clock,
  ClipboardList,
  Sparkles,
  Thermometer,
  Layers,
  Filter,
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
import { visits as mockVisitsList, timelineEvents as mockTimelineEvents } from "../data/mockData";
import AIPatientOverview from "../components/patient/AIPatientOverview";

const TABS = [
  { id: "overview", label: "OVERVIEW" },
  { id: "records", label: "MEDICAL RECORDS" },
  { id: "conditions", label: "CONDITIONS" },
  { id: "medications", label: "MEDICATIONS" },
  { id: "labs", label: "LABS" },
  { id: "visits", label: "VISITS" },
  { id: "vaccinations", label: "VACCINATIONS" },
  { id: "allergies", label: "ALLERGIES" },
  { id: "timeline", label: "TIMELINE" },
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

const STATUS_SIGNAL = {
  active: "warning",
  chronic: "critical",
  recovered: "normal",
  scheduled: "info",
  confirmed: "info",
  completed: "normal",
  cancelled: "muted",
  due: "warning",
  due_soon: "warning",
  overdue: "critical",
  pending: "warning",
  processing: "info",
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [conditionFilter, setConditionFilter] = useState("ALL");
  const [visitTab, setVisitTab] = useState("upcoming");
  const [profileLoading, setProfileLoading] = useState(true);

  // Dynamic Patient Profile state
  const [patient, setPatient] = useState({
    name: user?.fullName || user?.name || "Patient",
    abhaId: user?.abhaId || "91-XXXX-XXXX-XXXX",
    gender: "Male",
    bloodGroup: "O+",
    phone: "",
    address: "",
    age: 30,
    height: "—",
    weight: "—",
    emergencyContact: "—",
    primaryPhysician: "Assigned upon OPD Consultation",
  });

  // Dynamic medical data states (defaults to empty arrays)
  const [conditionsList, setConditionsList] = useState([]);
  const [allergiesList, setAllergiesList] = useState([]);
  const [vaccinationsList, setVaccinationsList] = useState([]);
  const [medicationsList, setMedicationsList] = useState([]);
  const [labReportsList, setLabReportsList] = useState([]);
  const [visitsList, setVisitsList] = useState([]);
  const [timelineList, setTimelineList] = useState([]);
  const [expandedVisits, setExpandedVisits] = useState({});
  const [timelineFilter, setTimelineFilter] = useState("ALL");

  // Toggle single visit expansion
  const toggleVisit = (id) => {
    setExpandedVisits((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Toggle all visits expansion
  const toggleAllVisits = () => {
    const visitItems = timelineList.filter(
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

  // Medical records upload & viewing state
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordFilter, setRecordFilter] = useState("ALL");
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

  // Edit Profile Form State
  const [editForm, setEditForm] = useState({
    height: "",
    weight: "",
    phoneNumber: "",
    emergencyContact: "",
    emergencyPhone: "",
    address: "",
    bloodGroup: "O+",
  });
  const [editSaving, setEditSaving] = useState(false);

  // Image Viewer Modal / Lightbox state
  const [previewRecord, setPreviewRecord] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    fetchPatientProfile();
    fetchMedicalRecords();
    fetchTimeline();
  }, [user]);

  const fetchPatientProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await api.get('/patients/profile').catch(() => null);
      if (res && res.data && res.data.success && res.data.patientData) {
        const { patient: p, age, diseases: d, allergies: a, vaccinations: v, medications: m, visits: vis, labReports: l } = res.data.patientData;
        if (p) {
          setPatient({
            name: p.user?.fullName || user?.fullName || user?.name || "Patient",
            abhaId: p.abhaId || user?.abhaId || "91-XXXX-XXXX-XXXX",
            gender: p.gender || "Male",
            bloodGroup: p.bloodGroup || "O+",
            phone: p.user?.phoneNumber || p.phoneNumber || "",
            address: p.address || "",
            age: age || p.age || 30,
            height: p.height || "—",
            weight: p.weight || "—",
            emergencyContact: p.emergencyContact || "—",
            primaryPhysician: "Assigned upon OPD Consultation",
          });

          setEditForm({
            height: (p.height || "").replace(" cm", ""),
            weight: (p.weight || "").replace(" kg", ""),
            phoneNumber: p.user?.phoneNumber || p.phoneNumber || "",
            emergencyContact: p.emergencyContact || "",
            emergencyPhone: p.emergencyPhone || "",
            address: p.address || "",
            bloodGroup: p.bloodGroup || "O+",
          });
        }
        setConditionsList(Array.isArray(d) ? d : []);
        setAllergiesList(Array.isArray(a) ? a : []);
        setVaccinationsList(Array.isArray(v) ? v : []);
        setMedicationsList(Array.isArray(m) ? m : []);
        setVisitsList(Array.isArray(vis) ? vis : []);
        setLabReportsList(Array.isArray(l) ? l : []);
      }
    } catch (e) {
      console.warn("Patient profile fetch notice:", e?.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      setRecordsLoading(true);
      const res = await api.get('/patients/medical-records').catch(() => null);
      if (res && res.data && res.data.success) {
        setMedicalRecords(res.data.records || []);
      }
    } catch (e) {
      console.warn("Could not load medical records from backend");
    } finally {
      setRecordsLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const res = await api.get('/patients/timeline').catch(() => null);
      if (res && res.data && res.data.success && Array.isArray(res.data.timeline) && res.data.timeline.length > 0) {
        setTimelineList(res.data.timeline);
        // Automatically expand the latest doctor visit for instant visibility
        const firstVisit = res.data.timeline.find(
          (t) => t.category === "DOCTOR_VISIT" || t.type === "VISIT" || t.type === "appointment"
        );
        if (firstVisit?.id) {
          setExpandedVisits({ [firstVisit.id]: true });
        }
      } else {
        // Safe fallback for prototype patient Rahul Verma
        const isRahul =
          user?.email === 'patient@uhis.gov.in' ||
          user?.fullName?.includes('Rahul') ||
          user?.name?.includes('Rahul');
        if (isRahul && Array.isArray(mockTimelineEvents) && mockTimelineEvents.length > 0) {
          setTimelineList(mockTimelineEvents);
          if (mockTimelineEvents[0]?.id) {
            setExpandedVisits({ [mockTimelineEvents[0].id]: true });
          }
        } else {
          setTimelineList([]);
        }
      }
    } catch (e) {
      console.warn("Timeline fetch notice:", e?.message);
      const isRahul =
        user?.email === 'patient@uhis.gov.in' ||
        user?.fullName?.includes('Rahul') ||
        user?.name?.includes('Rahul');
      if (isRahul && Array.isArray(mockTimelineEvents) && mockTimelineEvents.length > 0) {
        setTimelineList(mockTimelineEvents);
        if (mockTimelineEvents[0]?.id) {
          setExpandedVisits({ [mockTimelineEvents[0].id]: true });
        }
      } else {
        setTimelineList([]);
      }
    }
  };

  // Upload Record
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError("");

    if (!uploadForm.title.trim()) {
      setUploadError("Please enter a record title.");
      return;
    }
    if (!uploadForm.file) {
      setUploadError("Please select a file to upload (JPG, PNG, WEBP, or PDF).");
      return;
    }
    if (uploadForm.file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds the 10 MB limit.");
      return;
    }

    const ext = uploadForm.file.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext)) {
      setUploadError("Invalid file type. Supported types: JPG, PNG, WEBP, PDF.");
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
        await fetchMedicalRecords();
        await fetchTimeline();
        setActiveTab("records");
      } else {
        setUploadError(res?.data?.message || "Failed to upload medical record.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to upload medical record. Please try again.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  // View Record (Image or PDF)
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
      toast.error("Failed to load file preview. You can use Download instead.");
      setPreviewRecord(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Download Record File
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
      toast.error("Failed to download record file.");
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

  // Handle Edit Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const payload = {
        height: editForm.height ? `${editForm.height} cm` : null,
        weight: editForm.weight ? `${editForm.weight} kg` : null,
        phoneNumber: editForm.phoneNumber || null,
        emergencyContact: editForm.emergencyContact || null,
        emergencyPhone: editForm.emergencyPhone || null,
        address: editForm.address || null,
        bloodGroup: editForm.bloodGroup || "O+",
      };
      const res = await api.put('/patients/profile', payload);
      if (res.data.success) {
        toast.success("Profile updated successfully.");
        setEditOpen(false);
        await fetchPatientProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setEditSaving(false);
    }
  };

  const activeConditions = conditionsList.filter((c) => (c.status || '').toLowerCase() !== "recovered").length;
  const activeRx = medicationsList.filter((m) => (m.status || '').toLowerCase() === "active" || m.endDate === "Ongoing").length;
  const pendingLabs = labReportsList.filter((l) => (l.status || '').toLowerCase() === "pending").length;
  const upcomingVisits = visitsList.filter((v) => (v.status || '').toLowerCase() === "scheduled" || (v.status || '').toLowerCase() === "confirmed").length;
  const severeAllergies = allergiesList.filter((a) => (a.severity || '').toLowerCase() === "severe").length;

  const handleTabChange = (id) => setActiveTab(id);

  const displayName = patient.name || user?.fullName || user?.name || "Patient";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "PT";

  const filteredRecords = recordFilter === "ALL"
    ? medicalRecords
    : medicalRecords.filter((r) => (r.recordType || "").toLowerCase() === recordFilter.toLowerCase());

  return (
    <AppLayout tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Patient identity strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            marginBottom: "1.75rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "#16A34A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: "white",
              flexShrink: 0,
              letterSpacing: "-0.01em",
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "var(--color-ink)", letterSpacing: "-0.025em" }}>
                {displayName}
              </span>
              <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{patient.abhaId}</span>
              <span className="status-critical">{patient.bloodGroup}</span>
            </div>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
              {[
                { l: "AGE", v: `${patient.age || 30}Y` },
                { l: "GENDER", v: patient.gender },
                { l: "HEIGHT", v: patient.height },
                { l: "WEIGHT", v: patient.weight },
                { l: "PHONE", v: patient.phone || "—" },
              ].map(({ l, v }) => (
                <div key={l} style={{ display: "flex", gap: "0.35rem" }}>
                  <span className="type-label" style={{ color: "var(--color-ink-muted)" }}>{l}</span>
                  <span className="type-label" style={{ color: "var(--color-ink-secondary)", fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => { setUploadError(""); setUploadModalOpen(true); }}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Upload size={12} /> ADD MEDICAL RECORD
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Edit size={11} /> EDIT PROFILE
            </Button>
          </div>
        </div>

        {/* AI Patient Health Overview */}
        <AIPatientOverview
          patientData={patient}
          conditionsList={conditionsList}
          allergiesList={allergiesList}
          medicationsList={medicationsList}
          visitsList={visitsList}
          timelineList={timelineList}
          mode="patient"
          onNavigateTab={handleTabChange}
        />

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="fade-in">
            {/* Summary readout */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                overflow: "hidden",
                marginBottom: "1.75rem",
                background: "var(--color-panel)",
              }}
              className="summary-grid"
            >
              {[
                { label: "MEDICAL RECORDS", value: medicalRecords.length, signal: "info", tab: "records" },
                { label: "CONDITIONS", value: activeConditions, signal: activeConditions > 0 ? "warning" : "muted", tab: "conditions" },
                { label: "MEDICATIONS", value: activeRx, signal: activeRx > 0 ? "info" : "muted", tab: "medications" },
                { label: "PENDING LABS", value: pendingLabs, signal: pendingLabs > 0 ? "warning" : "muted", tab: "labs" },
                { label: "UPCOMING VISITS", value: upcomingVisits, signal: upcomingVisits > 0 ? "info" : "muted", tab: "visits" },
                { label: "SEVERE ALLERGIES", value: severeAllergies, signal: severeAllergies > 0 ? "critical" : "muted", tab: "allergies" },
              ].map(({ label, value, signal, tab }, i) => (
                <div
                  key={label}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "1.25rem",
                    borderRight: i < 5 ? "1px solid var(--color-border)" : "none",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-panel)")}
                >
                  <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>{label}</span>
                  <span
                    className="type-stat"
                    style={{ color: signal === "muted" ? "var(--color-ink-muted)" : `var(--color-signal-${signal})` }}
                  >
                    {value.toString().padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>

            {/* Severe allergy alert */}
            {severeAllergies > 0 && (
              <div
                style={{
                  background: "var(--color-signal-critical-bg)",
                  border: "1px solid var(--color-signal-critical-border)",
                  borderLeft: "3px solid var(--color-signal-critical)",
                  padding: "0.875rem 1.25rem",
                  marginBottom: "1.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span className="pulse-signal" style={{ color: "var(--color-signal-critical)", fontSize: "0.9rem" }}>●</span>
                <span className="type-label" style={{ color: "var(--color-signal-critical)", fontWeight: 700 }}>SEVERE ALLERGY ON RECORD:</span>
                <span className="type-value" style={{ color: "var(--color-signal-critical)" }}>
                  {allergiesList.filter((a) => (a.severity || '').toLowerCase() === "severe").map((a) => a.allergen || a.name).join(" · ")}
                </span>
                <span className="type-micro" style={{ color: "var(--color-ink-secondary)", marginLeft: "auto" }}>
                  Inform all treating clinicians
                </span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }} className="overview-grid">
              {/* Medical Records Instrument Panel */}
              <InstrumentPanel
                title="Recent Medical Records & Scans"
                subtitle="DIAGNOSTIC ARCHIVE"
                channel="info"
                action={
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <Button variant="primary" size="sm" onClick={() => { setUploadError(""); setUploadModalOpen(true); }}>
                      <Plus size={11} /> UPLOAD
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setActiveTab("records")}>
                      ALL RECORDS
                    </Button>
                  </div>
                }
              >
                {medicalRecords.length === 0 ? (
                  <div style={{ padding: "1.75rem 1rem", textAlign: "center" }}>
                    <p className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                      No medical records uploaded yet.
                    </p>
                    <Button variant="secondary" size="sm" onClick={() => { setUploadError(""); setUploadModalOpen(true); }}>
                      <Upload size={11} /> Upload First Record
                    </Button>
                  </div>
                ) : (
                  medicalRecords.slice(0, 4).map((r) => {
                    const ext = (r.attachmentUrl || "").split(".").pop().toLowerCase();
                    const isImg = ["jpg", "jpeg", "png", "webp"].includes(ext);
                    const icon = RECORD_TYPE_ICONS[r.recordType] || "📄";

                    return (
                      <div key={r.id} className="data-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "1rem" }}>{icon}</span>
                            <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {r.title}
                            </span>
                            <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: "4px", background: "var(--color-surface-alt)", border: "1px solid var(--color-border)", color: "var(--color-ink-secondary)", fontWeight: 600 }}>
                              {r.recordType}
                            </span>
                          </div>
                          <div className="type-micro" style={{ color: "var(--color-ink-secondary)", marginTop: "0.2rem" }}>
                            {r.recordDate ? new Date(r.recordDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recent"}
                            {ext ? ` · ${ext.toUpperCase()}` : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewRecord(r)}
                            style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.55rem", fontSize: "0.75rem" }}
                          >
                            <Eye size={11} /> {isImg ? "View Image" : "View Record"}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDownloadRecord(r)}
                            style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.55rem", fontSize: "0.75rem" }}
                            title="Download File"
                          >
                            <Download size={11} />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </InstrumentPanel>

              {/* Recent lab results */}
              <InstrumentPanel title="Recent Lab Results" subtitle="LABORATORY" channel="info"
                action={<Button variant="secondary" size="sm" onClick={() => setActiveTab("labs")}>ALL LABS</Button>}>
                {labReportsList.length === 0 ? (
                  <div style={{ padding: "1.75rem 1rem", textAlign: "center" }}>
                    <p className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                      No lab diagnostic reports on record.
                    </p>
                  </div>
                ) : (
                  labReportsList.slice(0, 4).map((r) => (
                    <div key={r.id} className="data-row">
                      <div style={{ flex: 1 }}>
                        <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{r.testName || r.test}</div>
                        <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>{r.date || r.sampleDate || "Completed"} · {r.facility || "Pathology Dept"}</div>
                      </div>
                      <StatusCode status={(r.status === "completed" ? "normal" : "warning")} label={(r.status || "completed").toUpperCase()} />
                    </div>
                  ))
                )}
              </InstrumentPanel>

              {/* Active medications */}
              <InstrumentPanel title="Active Medications" subtitle="CURRENT RX" channel="info"
                action={<Button variant="secondary" size="sm" onClick={() => setActiveTab("medications")}>ALL RX</Button>}>
                {medicationsList.length === 0 ? (
                  <div style={{ padding: "1.75rem 1rem", textAlign: "center" }}>
                    <p className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                      No active medications or prescriptions recorded.
                    </p>
                  </div>
                ) : (
                  medicationsList.slice(0, 4).map((m) => (
                    <div key={m.id} className="data-row">
                      <div style={{ flex: 1 }}>
                        <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{m.name} {m.dosage}</div>
                        <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>{m.frequency}</div>
                      </div>
                      <StatusCode status="info" label="ACTIVE" />
                    </div>
                  ))
                )}
              </InstrumentPanel>

              {/* Upcoming visits */}
              <InstrumentPanel title="Upcoming Appointments" subtitle="SCHEDULED VISITS" channel="normal"
                action={<Button variant="secondary" size="sm" onClick={() => setActiveTab("visits")}>ALL VISITS</Button>}>
                {visitsList.length === 0 ? (
                  <div style={{ padding: "1.75rem 1rem", textAlign: "center" }}>
                    <p className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                      No upcoming appointments scheduled.
                    </p>
                  </div>
                ) : (
                  visitsList.slice(0, 3).map((v) => (
                    <div key={v.id} className="data-row">
                      <div style={{ flex: 1 }}>
                        <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{v.doctor}</div>
                        <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>{v.date || v.appointmentDate} · {v.facility || "Hospital"}</div>
                      </div>
                      <StatusCode status="info" label="SCHEDULED" />
                    </div>
                  ))
                )}
              </InstrumentPanel>
            </div>
          </div>
        )}

        {/* MEDICAL RECORDS TAB */}
        {activeTab === "records" && (
          <div className="fade-in">
            {/* Action Bar & Filter Pills */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["ALL", ...RECORD_TYPES].map((f) => (
                  <button
                    key={f}
                    onClick={() => setRecordFilter(f)}
                    className={recordFilter === f ? "filter-pill-active" : "filter-pill"}
                  >
                    {f === "ALL" ? "ALL RECORDS" : f.toUpperCase()}
                  </button>
                ))}
              </div>
              <Button
                variant="primary"
                onClick={() => { setUploadError(""); setUploadModalOpen(true); }}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Plus size={13} /> UPLOAD MEDICAL RECORD
              </Button>
            </div>

            {/* Records List or Empty State */}
            {recordsLoading ? (
              <div style={{ padding: "3rem", textAlign: "center", background: "var(--color-panel)", border: "1px solid var(--color-border)", borderRadius: "8px" }}>
                <span className="type-body" style={{ color: "var(--color-ink-secondary)" }}>Loading medical records...</span>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div
                style={{
                  background: "var(--color-panel)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  padding: "3.5rem 1.5rem",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "var(--color-surface-alt)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-ink-muted)",
                    marginBottom: "0.25rem",
                  }}
                >
                  <FolderOpen size={24} />
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-ink)" }}>
                  No medical records added yet.
                </div>
                <p className="type-body" style={{ color: "var(--color-ink-secondary)", maxWidth: "420px", fontSize: "0.85rem" }}>
                  Upload your diagnostic images (X-rays, MRIs, CT scans), prescription documents, or lab reports to securely link them to your digital health profile.
                </p>
                <Button
                  variant="primary"
                  onClick={() => { setUploadError(""); setUploadModalOpen(true); }}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem" }}
                >
                  <Upload size={12} /> Upload Your First Record
                </Button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {filteredRecords.map((r) => {
                  const ext = (r.attachmentUrl || "").split(".").pop().toLowerCase();
                  const isImg = ["jpg", "jpeg", "png", "webp"].includes(ext);
                  const icon = RECORD_TYPE_ICONS[r.recordType] || "📄";
                  const formattedDate = r.recordDate
                    ? new Date(r.recordDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Recent";

                  return (
                    <div
                      key={r.id}
                      className="instrument-panel channel-info"
                      style={{ background: "var(--color-panel)" }}
                    >
                      <div style={{ padding: "1.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: "260px" }}>
                            {/* Record Header */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{icon}</span>
                              <span
                                style={{
                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                  fontWeight: 700,
                                  fontSize: "1.05rem",
                                  color: "var(--color-ink)",
                                  letterSpacing: "-0.015em",
                                }}
                              >
                                {r.title}
                              </span>
                              <span
                                style={{
                                  background: "var(--color-surface-alt)",
                                  color: "var(--color-ink-secondary)",
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "4px",
                                  fontFamily: "'Inter', sans-serif",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  letterSpacing: "0.04em",
                                  border: "1px solid var(--color-border)",
                                }}
                              >
                                {r.recordType}
                              </span>
                              {ext && (
                                <span
                                  style={{
                                    background: isImg ? "rgba(37,99,235,0.08)" : "rgba(220,38,38,0.08)",
                                    color: isImg ? "#2563EB" : "#DC2626",
                                    padding: "0.15rem 0.45rem",
                                    borderRadius: "4px",
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: "0.65rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {ext.toUpperCase()}
                                </span>
                              )}
                            </div>

                            {/* Date and details */}
                            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                              <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
                                DATE: {formattedDate}
                              </span>
                              {r.doctor?.user?.fullName && (
                                <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
                                  PHYSICIAN: {r.doctor.user.fullName}
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            {r.description && (
                              <div
                                className="type-body"
                                style={{
                                  color: "var(--color-ink-secondary)",
                                  fontSize: "0.85rem",
                                  lineHeight: 1.5,
                                  marginTop: "0.35rem",
                                }}
                              >
                                {r.description}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleViewRecord(r)}
                              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                            >
                              <Eye size={12} /> {isImg ? "View Image" : "View Record"}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDownloadRecord(r)}
                              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                            >
                              <Download size={12} /> Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CONDITIONS TAB */}
        {activeTab === "conditions" && (
          <div className="fade-in">
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              {["ALL", "ACTIVE", "CHRONIC", "RECOVERED"].map((f) => (
                <button
                  key={f}
                  onClick={() => setConditionFilter(f)}
                  className={conditionFilter === f ? "filter-pill-active" : "filter-pill"}
                >
                  {f}
                </button>
              ))}
            </div>
            {conditionsList.length === 0 ? (
              <div style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "3rem 1.5rem", textAlign: "center" }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--color-ink)", marginBottom: "0.25rem" }}>
                  No medical conditions recorded on file.
                </div>
                <p className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                  Diagnoses and chronic conditions will appear here once entered by authorized healthcare professionals.
                </p>
              </div>
            ) : (
              conditionsList
                .filter((c) => conditionFilter === "ALL" || (c.status || '').toUpperCase() === conditionFilter)
                .map((c) => (
                  <div
                    key={c.id}
                    className={`instrument-panel channel-${SEVERITY_SIGNAL[(c.severity || '').toLowerCase()] || "muted"}`}
                    style={{ marginBottom: "1px" }}
                  >
                    <div style={{ padding: "1rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                        <div>
                          <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                            <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{c.name}</span>
                            <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>ICD-10: {c.icd10 || c.icdCode || "N/A"}</span>
                          </div>
                          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                            <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
                              DIAGNOSED: {c.diagnosedDate ? new Date(c.diagnosedDate).toLocaleDateString('en-IN') : 'N/A'}
                            </span>
                            <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
                              PHYSICIAN: {c.doctor || c.treatingDoctor || "General Physician"}
                            </span>
                            <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
                              FACILITY: {c.facility || c.hospital || "UHIS Network"}
                            </span>
                          </div>
                          {c.notes && (
                            <div className="type-body" style={{ color: "var(--color-ink-secondary)", marginTop: "0.5rem", fontSize: "0.85rem" }}>
                              {c.notes}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0 }}>
                          <StatusCode
                            status={STATUS_SIGNAL[(c.status || '').toLowerCase()] || "muted"}
                            label={(c.status || "ACTIVE").toUpperCase()}
                          />
                          <StatusCode
                            status={SEVERITY_SIGNAL[(c.severity || '').toLowerCase()] || "muted"}
                            label={(c.severity || "MILD").toUpperCase()}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* MEDICATIONS TAB */}
        {activeTab === "medications" && (
          <div className="fade-in">
            {medicationsList.length === 0 ? (
              <div style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "3rem 1.5rem", textAlign: "center" }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--color-ink)", marginBottom: "0.25rem" }}>
                  No medications recorded yet.
                </div>
                <p className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                  Prescribed medications and dosages will be displayed here automatically when issued by your physician.
                </p>
              </div>
            ) : (
              medicationsList.map((m) => (
                <div
                  key={m.id}
                  className={`instrument-panel channel-${m.endDate === "Ongoing" || m.status === "active" ? "info" : "muted"}`}
                  style={{ marginBottom: "1px" }}
                >
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                          <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{m.name}</span>
                          <span className="type-id" style={{ color: "var(--color-signal-info)" }}>{m.dosage}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.25rem 1rem" }}>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>FREQUENCY: {m.frequency}</span>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>STARTED: {m.startDate}</span>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>UNTIL: {m.endDate || "Ongoing"}</span>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>PRESCRIBED BY: {m.prescribedBy}</span>
                        </div>
                        {m.instructions && (
                          <div className="type-body" style={{ color: "var(--color-ink-secondary)", marginTop: "0.4rem", fontSize: "0.85rem" }}>
                            {m.instructions}
                          </div>
                        )}
                      </div>
                      <StatusCode
                        status={m.endDate === "Ongoing" || m.status === "active" ? "info" : "muted"}
                        label={m.endDate === "Ongoing" || m.status === "active" ? "ACTIVE" : "COMPLETED"}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* LABS TAB */}
        {activeTab === "labs" && (
          <div className="fade-in">
            {labReportsList.length === 0 ? (
              <div style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "3rem 1.5rem", textAlign: "center" }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--color-ink)", marginBottom: "0.25rem" }}>
                  No lab diagnostic reports on record.
                </div>
                <p className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                  Diagnostic test results dispatched from certified pathology laboratories will appear here.
                </p>
              </div>
            ) : (
              labReportsList.map((r) => (
                <div
                  key={r.id}
                  className={`instrument-panel channel-${r.abnormal ? "warning" : "normal"}`}
                  style={{ marginBottom: "1px" }}
                >
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                          <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{r.testName || r.test}</span>
                          <StatusCode status={r.status === "completed" ? "normal" : "warning"} label={(r.status || "COMPLETED").toUpperCase()} />
                        </div>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>DATE: {r.date || r.sampleDate || "Recent"}</span>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>FACILITY: {r.facility || "Pathology Department"}</span>
                        </div>
                        {(r.resultData || r.summary) && (
                          <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem", margin: "0.35rem 0" }}>
                            RESULT: {r.resultData || r.summary}
                          </div>
                        )}
                      </div>
                      {r.status === "completed" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toast.info(`Downloading ${r.testName || r.test} report PDF...`)}
                          style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}
                        >
                          <Download size={11} /> PDF
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* VISITS TAB */}
        {activeTab === "visits" && (
          <div className="fade-in">
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
              {[["upcoming", "UPCOMING OPD"], ["past", "PAST VISITS"]].map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setVisitTab(t)}
                  className={visitTab === t ? "filter-pill-active" : "filter-pill"}
                >
                  {label}
                </button>
              ))}
            </div>
            {visitsList.length === 0 ? (
              <div style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "3rem 1.5rem", textAlign: "center" }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--color-ink)", marginBottom: "0.25rem" }}>
                  No upcoming visits.
                </div>
                <p className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                  Book an OPD appointment with your clinician or hospital desk to schedule a consultation.
                </p>
              </div>
            ) : (
              visitsList
                .filter((v) => visitTab === "upcoming" ? (v.status || '').toLowerCase() === "scheduled" || (v.status || '').toLowerCase() === "confirmed" : (v.status || '').toLowerCase() !== "scheduled")
                .map((v) => (
                  <div
                    key={v.id}
                    className={`instrument-panel channel-${STATUS_SIGNAL[(v.status || '').toLowerCase()] || "muted"}`}
                    style={{ marginBottom: "1px" }}
                  >
                    <div style={{ padding: "1rem 1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                            <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{v.doctor}</span>
                            <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{v.specialty || v.specialization || "General Medicine"}</span>
                          </div>
                          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                            <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>DATE: {v.date || v.appointmentDate}</span>
                            <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>FACILITY: {v.facility || "AIIMS New Delhi"}</span>
                          </div>
                          <div className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                            REASON: {v.reason || "Routine Consultation"}
                          </div>
                        </div>
                        <StatusCode status={STATUS_SIGNAL[(v.status || '').toLowerCase()] || "muted"} label={(v.status || "SCHEDULED").toUpperCase()} />
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* VACCINATIONS TAB */}
        {activeTab === "vaccinations" && (
          <div className="fade-in">
            {vaccinationsList.length === 0 ? (
              <div style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "3rem 1.5rem", textAlign: "center" }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--color-ink)", marginBottom: "0.25rem" }}>
                  No vaccination records on file.
                </div>
                <p className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                  Immunizations administered at verified healthcare centers will be recorded on your digital card.
                </p>
              </div>
            ) : (
              vaccinationsList.map((v) => (
                <div
                  key={v.id}
                  className={`instrument-panel channel-${(v.status || '').toLowerCase() === "completed" ? "normal" : "warning"}`}
                  style={{ marginBottom: "1px" }}
                >
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                          <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{v.vaccine}</span>
                          <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{v.dose}</span>
                        </div>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>DATE: {v.date || v.dateAdministered}</span>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>FACILITY: {v.facility || v.hospital || "UHIS Health Center"}</span>
                          <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>BATCH: {v.batch || v.batchNumber || "COV-2021-8812"}</span>
                        </div>
                      </div>
                      <StatusCode
                        status={(v.status || '').toLowerCase() === "completed" ? "normal" : "warning"}
                        label={(v.status || "COMPLETED").toUpperCase()}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ALLERGIES TAB */}
        {activeTab === "allergies" && (
          <div className="fade-in">
            {allergiesList.length === 0 ? (
              <div style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "3rem 1.5rem", textAlign: "center" }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--color-ink)", marginBottom: "0.25rem" }}>
                  No allergies recorded.
                </div>
                <p className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                  Any clinical drug, food, or environmental allergies will be listed here for treating physicians.
                </p>
              </div>
            ) : (
              allergiesList.map((a) => (
                <div
                  key={a.id || a.name}
                  className={`instrument-panel channel-${SEVERITY_SIGNAL[(a.severity || '').toLowerCase()] || "muted"}`}
                  style={{ marginBottom: "1px" }}
                >
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                          <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>{a.allergen || a.name}</span>
                          <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{a.category}</span>
                          {(a.severity || '').toLowerCase() === "severe" && <span className="status-critical pulse-signal">● SEVERE</span>}
                        </div>
                        <div className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                          REACTION: {a.reaction || (Array.isArray(a.symptoms) ? a.symptoms.join(', ') : a.symptoms || 'Allergic reaction')}
                        </div>
                        {a.precautions && (
                          <div className="type-body" style={{ color: "var(--color-signal-critical)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                            PRECAUTIONS: {a.precautions}
                          </div>
                        )}
                      </div>
                      <StatusCode
                        status={SEVERITY_SIGNAL[(a.severity || '').toLowerCase()] || "muted"}
                        label={(a.severity || "MILD").toUpperCase()}
                        pulse={(a.severity || '').toLowerCase() === "severe"}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TIMELINE TAB - DOCTOR VISIT TIMELINE */}
        {activeTab === "timeline" && (
          <div className="fade-in">
            {/* Timeline Toolbar & Header */}
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
                    {timelineList.length} {timelineList.length === 1 ? "Event" : "Events"}
                  </span>
                </div>
                <div className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                  Chronological log of completed clinical consultations, diagnoses, vitals, prescriptions & diagnostic uploads.
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "0.35rem", background: "var(--color-surface)", padding: "0.25rem", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  {["ALL", "VISITS", "RECORDS"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setTimelineFilter(f)}
                      style={{
                        padding: "0.25rem 0.65rem",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        borderRadius: "5px",
                        border: "none",
                        cursor: "pointer",
                        background: timelineFilter === f ? "var(--color-accent-primary)" : "transparent",
                        color: timelineFilter === f ? "#ffffff" : "var(--color-ink-secondary)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {f === "ALL" ? `ALL (${timelineList.length})` : f === "VISITS" ? `VISITS (${timelineList.filter(t => t.category === "DOCTOR_VISIT" || t.type === "VISIT" || t.type === "appointment").length})` : `RECORDS (${timelineList.filter(t => t.category === "MEDICAL_RECORD" || (t.category !== "DOCTOR_VISIT" && t.type !== "VISIT" && t.type !== "appointment")).length})`}
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
                  {timelineList.filter(t => t.category === "DOCTOR_VISIT" || t.type === "VISIT").every(t => expandedVisits[t.id]) ? "Collapse All" : "Expand All"}
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
              const filtered = timelineList.filter((item) => {
                if (timelineFilter === "VISITS") return item.category === "DOCTOR_VISIT" || item.type === "VISIT" || item.type === "appointment";
                if (timelineFilter === "RECORDS") return item.category === "MEDICAL_RECORD" || (item.category !== "DOCTOR_VISIT" && item.type !== "VISIT" && item.type !== "appointment");
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
                      As you complete doctor consultations or upload diagnostic medical records, your chronological healthcare visit timeline will automatically build here.
                    </p>
                    <Button variant="secondary" size="sm" onClick={() => { setUploadError(""); setUploadModalOpen(true); }}>
                      <Upload size={13} style={{ marginRight: "0.35rem" }} /> Upload Your First Medical Record
                    </Button>
                  </div>
                );
              }

              return (
                <div style={{ position: "relative", paddingLeft: "1.75rem" }}>
                  {/* Continuous Timeline Vertical Line */}
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
                          {/* Timeline Node Dot */}
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

                          {/* Visit Card */}
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
                            {/* 1. Compact Summary Header (Always Visible) */}
                            <div style={{ padding: "1.1rem 1.25rem" }}>
                              {/* Row 1: Date, Time, OPD Badge, Status */}
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

                              {/* Row 2: Doctor Name, Specialization, Hospital */}
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

                              {/* Row 3: Quick Summary Bar (DATE → DOCTOR → DIAGNOSIS → PRESCRIPTIONS) */}
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
                                    {/* Diagnosis Badge */}
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

                                    {/* Prescriptions Count Badge */}
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

                                    {/* Tests Badge */}
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
                                        {tests.length} {tests.length === 1 ? "Test Ordered" : "Tests Ordered"}
                                      </span>
                                    )}
                                  </div>

                                  {/* Expand / Collapse Button */}
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
                                    <span>{isExpanded ? "Hide Consultation Details" : "View Consultation Details"}</span>
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* 2. Expanded Complete Details Section */}
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
                                {/* Section A: Reason for Visit & Symptoms Reported */}
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

                                {/* Section B: Doctor's Findings / Observations */}
                                {t.findings && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                    <div className="type-id" style={{ color: "var(--color-accent-primary)", fontSize: "0.72rem", letterSpacing: "0.06em", fontWeight: 700 }}>
                                      2. DOCTOR'S FINDINGS & CLINICAL OBSERVATIONS
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

                                {/* Section C: Recorded Vitals (If Available) */}
                                {t.vitals && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    <div className="type-id" style={{ color: "var(--color-accent-primary)", fontSize: "0.72rem", letterSpacing: "0.06em", fontWeight: 700 }}>
                                      3. VITALS RECORDED DURING VISIT
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
                                            <Droplet size={11} color="#06b6d4" /> SPO2 OXYGEN
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

                                {/* Section D: Diagnosis & ICD Classification */}
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

                                {/* Section E: Prescriptions Given */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div className="type-id" style={{ color: "var(--color-accent-primary)", fontSize: "0.72rem", letterSpacing: "0.06em", fontWeight: 700 }}>
                                      5. PRESCRIPTIONS & MEDICATION ORDERS ({prescriptions.length})
                                    </div>
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

                                {/* Section F: Recommended Tests / Investigations */}
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

                                {/* Section G: Doctor's Advice & Lifestyle Guidance */}
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

                                {/* Section H: Follow-Up Recommendation */}
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

                    // Render Uploaded Diagnostic Medical Record Entry
                    const recordDateStr = t.date || t.recordDate || t.createdAt;
                    const formattedRecordDate = recordDateStr
                      ? new Date(recordDateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                      : "Recent";

                    return (
                      <div key={t.id || `record-${idx}`} style={{ position: "relative", marginBottom: "1.5rem" }}>
                        {/* Timeline Node Dot */}
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

                        {/* Record Card */}
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
            placeholder="e.g. Chest X-Ray - PA View, Brain MRI Scan"
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
              onClick={() => document.getElementById("record-file-input")?.click()}
            >
              <input
                id="record-file-input"
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

      {/* Edit Profile Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Patient Profile" subtitle="PROFILE MANAGEMENT">
        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <PrecisionInput
              label="Height (cm)"
              type="number"
              value={editForm.height}
              onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
              placeholder="170"
            />
            <PrecisionInput
              label="Weight (kg)"
              type="number"
              value={editForm.weight}
              onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
              placeholder="68"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <PrecisionInput
              label="Mobile Number"
              type="tel"
              value={editForm.phoneNumber}
              onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
              placeholder="+91 98765 43210"
            />
            <div>
              <label className="type-label" style={{ marginBottom: "0.4rem", display: "block" }}>Blood Group</label>
              <select
                className="precision-input"
                value={editForm.bloodGroup}
                onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                style={{ padding: "0.55rem 0.75rem" }}
              >
                {["A+", "A−", "B+", "B−", "O+", "O−", "AB+", "AB−"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <PrecisionInput
              label="Emergency Contact Name"
              value={editForm.emergencyContact}
              onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
              placeholder="e.g. Spouse / Parent"
            />
            <PrecisionInput
              label="Emergency Phone"
              type="tel"
              value={editForm.emergencyPhone}
              onChange={(e) => setEditForm({ ...editForm, emergencyPhone: e.target.value })}
              placeholder="+91 98877 66554"
            />
          </div>
          <PrecisionInput
            label="Full Address"
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            placeholder="Street, Locality, City, State"
          />
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>CANCEL</Button>
            <Button type="submit" disabled={editSaving} style={{ flex: 1, justifyContent: "center" }}>
              {editSaving ? "SAVING..." : "SAVE CHANGES"}
            </Button>
          </div>
        </form>
      </Modal>

      <style>{`
        @media (max-width: 900px) {
          .summary-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .overview-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .summary-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </AppLayout>
  );
}
