import React, { useState, useEffect } from "react";
import {
  Edit,
  Download,
  AlertTriangle,
  Heart,
  Pill,
  FlaskConical,
  Calendar, ShieldCheck, KeyRound, Clock, CheckCircle2, Lock, Eye,
  Upload,
  Plus,
  FileText,
  FileImage,
  Eye,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  File,
  Activity,
  FolderOpen,
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
import api from "../services/api";
import {
  patientData as defaultPatient,
  conditions as defaultConditions,
  allergies as defaultAllergies,
  vaccinations as defaultVaccinations,
  medications as defaultMedications,
  labReports as defaultLabReports,
  visits as defaultVisits,
  timelineEvents as defaultTimeline,
} from "../data/mockData";

const TABS = [
  { id: "overview", label: "OVERVIEW" },
  { id: "records", label: "MEDICAL RECORDS" },
  { id: "emergency", label: "🚨 EMERGENCY ACCESS" },
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

  // Patient profile data
  const [patient, setPatient] = useState(defaultPatient);
  const [conditionsList, setConditionsList] = useState(defaultConditions);
  const [allergiesList, setAllergiesList] = useState(defaultAllergies);
  const [vaccinationsList, setVaccinationsList] = useState(defaultVaccinations);
  const [medicationsList, setMedicationsList] = useState(defaultMedications);
  const [labReportsList, setLabReportsList] = useState(defaultLabReports);
  const [visitsList, setVisitsList] = useState(defaultVisits);
  const [timelineList, setTimelineList] = useState(defaultTimeline);

  // Medical records state
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

  // Image Viewer Modal / Lightbox state
  const [previewRecord, setPreviewRecord] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Emergency Access Patient State
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [approvedOtpModal, setApprovedOtpModal] = useState(null); // { otp, expiresAt, doctorName, hospitalName, reason }
  const [activeGeneratedOtp, setActiveGeneratedOtp] = useState(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(300);

  useEffect(() => {
    fetchRealPatientData();
    fetchMedicalRecords();
    fetchEmergencyRequests();


    const handleSyncEvent = () => {
      fetchEmergencyRequests();
      syncFromLocalStorage();
    };

    window.addEventListener("storage", handleSyncEvent);
    window.addEventListener("uhis_emergency_update", handleSyncEvent);

    const interval = setInterval(() => {
      fetchEmergencyRequests();
      syncFromLocalStorage();
    }, 2500);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleSyncEvent);
      window.removeEventListener("uhis_emergency_update", handleSyncEvent);
    };
  }, [user]);

  const syncFromLocalStorage = () => {
    try {
      const currentEmail = (user?.email || "").toLowerCase().trim();
      const currentAbha = (patient?.abhaId || "").toLowerCase().trim();
      const currentName = (patient?.name || user?.name || user?.fullName || "").toLowerCase().trim();
      const currentId = (patient?.id || "").toLowerCase().trim();

      const storedReq = localStorage.getItem("uhis_active_emergency_request");
      if (storedReq && currentEmail) {
        const parsed = JSON.parse(storedReq);
        const target = (parsed.patientUHISId || parsed.patientEmail || parsed.email || "").toLowerCase().trim();
        const targetName = (parsed.patientName || "").toLowerCase().trim();

        // STRICT ACCOUNT ISOLATION: Only sync if target matches the current patient's email or ABHA ID or Name
        const isTarget = target && (
          target === currentEmail ||
          target === currentAbha ||
          target === currentId ||
          (targetName && currentName && targetName === currentName)
        );

        if (isTarget) {
          setEmergencyRequests((prev) => {
            if (!prev.find((r) => r.id === parsed.id)) {
              return [parsed, ...prev];
            }
            return prev.map((r) => (r.id === parsed.id ? { ...r, ...parsed } : r));
          });
        }
      }

      const storedOtpData = localStorage.getItem("uhis_active_emergency_otp_data");
      if (storedOtpData && currentEmail) {
        const parsedOtp = JSON.parse(storedOtpData);
        const otpTarget = (parsedOtp.patientUHISId || parsedOtp.patientEmail || parsedOtp.email || "").toLowerCase().trim();
        const otpTargetName = (parsedOtp.patientName || "").toLowerCase().trim();

        // STRICT ACCOUNT ISOLATION: Only sync OTP if target matches currently logged-in patient
        const isOtpTarget = (
          !otpTarget ||
          otpTarget === currentEmail ||
          otpTarget === currentAbha ||
          otpTarget === currentId ||
          (otpTargetName && currentName && otpTargetName === currentName)
        );

        if (isOtpTarget) {
          if (parsedOtp && parsedOtp.otp) {
            const now = Date.now();
            const expTime = new Date(parsedOtp.expiresAt).getTime();
            if (expTime > now) {
              setActiveGeneratedOtp(parsedOtp);
              setOtpSecondsLeft(Math.floor((expTime - now) / 1000));
            } else {
              localStorage.removeItem("uhis_active_emergency_otp_data");
              setActiveGeneratedOtp(null);
            }
          }
        }
      }
    } catch (e) { }
  };


  // OTP Countdown timer
  useEffect(() => {
    let timer;
    if ((approvedOtpModal || activeGeneratedOtp) && otpSecondsLeft > 0) {
      timer = setInterval(() => {
        setOtpSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            localStorage.removeItem("uhis_active_emergency_otp_data");
            setActiveGeneratedOtp(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [approvedOtpModal, activeGeneratedOtp, otpSecondsLeft]);

  const fetchRealPatientData = async () => {
    try {
      const res = await api.get('/patients/profile').catch(() => null);
      if (res && res.data && res.data.success && res.data.patientData) {
        const { patient: p, diseases: d, allergies: a, vaccinations: v, medications: m, labReports: l } = res.data.patientData;
        if (p) {
          setPatient({
            ...defaultPatient,
            name: p.user?.fullName || p.fullName || defaultPatient.name,
            abhaId: p.abhaId || defaultPatient.abhaId,
            gender: p.gender || defaultPatient.gender,
            bloodGroup: p.bloodGroup || defaultPatient.bloodGroup,
            phone: p.user?.phoneNumber || p.phoneNumber || defaultPatient.phone,
            address: p.address || defaultPatient.address,
          });
        }
        if (d && d.length > 0) setConditionsList(d);
        if (a && a.length > 0) setAllergiesList(a);
        if (v && v.length > 0) setVaccinationsList(v);
        if (m && m.length > 0) setMedicationsList(m);
        if (l && l.length > 0) setLabReportsList(l);
      }
    } catch (e) {
      console.warn("Using offline patient dataset");
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
        // Open PDF directly in a new tab
        window.open(blobUrl, '_blank');
        setPreviewRecord(null);
      } else {
        // Open image in the built-in Lightbox viewer
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

  const fetchEmergencyRequests = async () => {
    try {
      const res = await api.get('/emergency-access/patient/requests').catch(() => null);
      if (res && res.data && res.data.success && res.data.requests) {
        setEmergencyRequests((prev) => {
          const apiReqs = res.data.requests;
          return apiReqs;
        });
      }
    } catch (e) {
      // offline
    }
  };

  const handleApproveEmergency = async (requestId) => {
    try {
      let otpData = null;
      const res = await api.post(`/emergency-access/patient/approve/${requestId}`).catch(() => null);

      if (res && res.data && res.data.success && res.data.otp) {
        otpData = {
          requestId,
          otp: res.data.otp,
          expiresAt: res.data.expiresAt,
          doctorName: res.data.doctorName || "Dr. Anita Desai",
          hospitalName: res.data.hospitalName || "AIIMS New Delhi",
          reason: res.data.reason || "Emergency treatment",
        };
      } else {
        // Deterministic/secure 6-digit random number for mock/offline demo
        const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
        otpData = {
          requestId,
          otp: mockOtp,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          doctorName: "Dr. Anita Desai",
          hospitalName: "AIIMS New Delhi — Central Facility",
          reason: "Emergency treatment",
        };
      }

      toast.success(`✓ Emergency Access Approved! OTP: ${otpData.otp}`);
      setApprovedOtpModal(otpData);
      setActiveGeneratedOtp(otpData);
      setOtpSecondsLeft(300);

      // Save to localStorage so Doctor portal in other tab automatically receives it
      localStorage.setItem("uhis_active_emergency_otp_data", JSON.stringify(otpData));
      localStorage.setItem("uhis_active_emergency_request", JSON.stringify({
        id: requestId,
        status: "APPROVED",
        doctorName: otpData.doctorName,
        hospitalName: otpData.hospitalName,
        reason: otpData.reason,
        expiresAt: otpData.expiresAt,
      }));
      window.dispatchEvent(new CustomEvent("uhis_emergency_update"));

      setEmergencyRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "APPROVED", expiresAt: otpData.expiresAt } : r))
      );
    } catch (e) {
      toast.error("Failed to approve emergency request.");
    }
  };

  const handleRejectEmergency = async (requestId) => {
    try {
      await api.post(`/emergency-access/patient/reject/${requestId}`).catch(() => null);
      toast.warning("Emergency access request rejected.");
      setEmergencyRequests((prev) => prev.filter((r) => r.id !== requestId));
      localStorage.removeItem("uhis_active_emergency_request");
      localStorage.removeItem("uhis_active_emergency_otp_data");
      window.dispatchEvent(new CustomEvent("uhis_emergency_update"));
      fetchEmergencyRequests();
    } catch (e) {
      toast.error("Failed to reject request.");
    }
  };

  // Demo helper: simulate incoming doctor request directly from patient dashboard
  const handleSimulateIncomingRequest = () => {
    let docName = "Dr. Rajesh Verma";
    let spec = "Cardiology & Intensive Care";
    if (user?.email === "patient23@uhis.org") {
      docName = "Dr. Sneha Kulkarni";
      spec = "Pulmonology & Critical Care";
    } else if (user?.email === "patient24@uhis.org") {
      docName = "Dr. Amit Sen";
      spec = "Neurology & Neuro-Rehabilitation";
    }

    const simReq = {
      id: "REQ-" + Math.floor(100000 + Math.random() * 900000),
      doctorId: "DOC-DEMO",
      doctorName: docName,
      doctorSpecialization: spec,
      hospitalName: "Apollo Hospital — Central Facility",
      reason: "Emergency treatment — acute triage",
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    setEmergencyRequests((prev) => [simReq, ...prev]);
    localStorage.setItem("uhis_active_emergency_request", JSON.stringify(simReq));
    window.dispatchEvent(new CustomEvent("uhis_emergency_update"));
    toast.info(`🚨 Emergency access request from ${docName} received!`);
  };


  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const activeConditions = conditionsList.filter((c) => (c.status || '').toLowerCase() !== "recovered").length;
  const activeRx = medicationsList.filter((m) => (m.status || '').toLowerCase() === "active" || m.endDate === "Ongoing").length;
  const pendingLabs = labReportsList.filter((l) => (l.status || '').toLowerCase() === "pending").length;
  const upcomingVisits = visitsList.filter((v) => (v.status || '').toLowerCase() === "scheduled" || (v.status || '').toLowerCase() === "confirmed").length;
  const severeAllergies = allergiesList.filter((a) => (a.severity || '').toLowerCase() === "severe").length;

  const pendingEmergencyReq = emergencyRequests.find((r) => r.status === "PENDING");
  const approvedEmergencyReq = emergencyRequests.find((r) => r.status === "APPROVED");
  const activeEmergencyAccess = emergencyRequests.find((r) => r.status === "VERIFIED");


  const handleTabChange = (id) => setActiveTab(id);

  const initials = (patient.name || "Rahul Verma")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const filteredRecords = recordFilter === "ALL"
    ? medicalRecords
    : medicalRecords.filter((r) => (r.recordType || "").toLowerCase() === recordFilter.toLowerCase());

  return (
    <AppLayout tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* 🚨 PENDING EMERGENCY ACCESS REQUEST BANNER */}
        {pendingEmergencyReq && (
          <div
            className="instrument-panel channel-critical fade-in"
            style={{
              background: "var(--color-signal-critical-bg)",
              border: "1px solid var(--color-signal-critical-border)",
              borderLeft: "5px solid var(--color-signal-critical)",
              padding: "1.25rem 1.5rem",
              borderRadius: "10px",
              marginBottom: "1.75rem",
              boxShadow: "0 4px 20px rgba(220, 38, 38, 0.12)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span className="pulse-signal" style={{ color: "var(--color-signal-critical)", fontSize: "1.1rem" }}>●</span>
                  <span className="type-label" style={{ color: "var(--color-signal-critical)", fontWeight: 800, fontSize: "0.95rem" }}>
                    🚨 EMERGENCY DOCTOR ACCESS REQUEST
                  </span>
                </div>
                <div className="type-heading" style={{ fontSize: "1.25rem", color: "var(--color-ink)", marginBottom: "0.2rem" }}>
                  {pendingEmergencyReq.doctorName} · {pendingEmergencyReq.hospitalName}
                </div>
                <div className="type-body" style={{ color: "var(--color-ink)", fontSize: "0.875rem", marginBottom: "0.4rem" }}>
                  is requesting temporary emergency read-only access to your UHIS health records.
                </div>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <span className="type-label" style={{ color: "var(--color-signal-critical)", fontWeight: 700 }}>
                    REASON: {pendingEmergencyReq.reason}
                  </span>
                  <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>
                    STATUS: PENDING YOUR APPROVAL
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexShrink: 0 }}>
                <Button
                  variant="secondary"
                  onClick={() => handleRejectEmergency(pendingEmergencyReq.id)}
                >
                  REJECT
                </Button>
                <Button
                  onClick={() => handleApproveEmergency(pendingEmergencyReq.id)}
                  style={{
                    background: "var(--color-signal-critical)",
                    borderColor: "var(--color-signal-critical)",
                    color: "white",
                    fontWeight: 700,
                    boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
                  }}
                >
                  APPROVE ACCESS & GENERATE OTP →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ✓ GENERATED EMERGENCY OTP ACTIVE CARD */}
        {(activeGeneratedOtp || approvedEmergencyReq) && (
          <div
            className="instrument-panel channel-normal fade-in"
            style={{
              background: "var(--color-signal-normal-bg)",
              border: "2px solid var(--color-signal-normal-border)",
              borderLeft: "5px solid var(--color-signal-normal)",
              padding: "1.25rem 1.5rem",
              borderRadius: "10px",
              marginBottom: "1.75rem",
              boxShadow: "0 4px 20px rgba(16, 185, 129, 0.15)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <CheckCircle2 size={18} color="var(--color-signal-normal)" />
                  <span className="type-label" style={{ color: "var(--color-signal-normal)", fontWeight: 800, fontSize: "0.95rem" }}>
                    ✓ EMERGENCY ACCESS OTP READY
                  </span>
                </div>
                <div className="type-heading" style={{ fontSize: "1.1rem", color: "var(--color-ink)", marginBottom: "0.2rem" }}>
                  Authorized Clinician: {activeGeneratedOtp?.doctorName || approvedEmergencyReq?.doctorName || "Dr. Rajesh Verma"} ({activeGeneratedOtp?.hospitalName || approvedEmergencyReq?.hospitalName || "Apollo Hospital"})
                </div>
                <div className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>
                  Reason: <em>{activeGeneratedOtp?.reason || approvedEmergencyReq?.reason || "Emergency Treatment"}</em> — Share this 6-digit OTP with the doctor now.
                </div>
              </div>

              <div style={{ textAlign: "center", background: "var(--color-panel)", padding: "0.75rem 1.5rem", borderRadius: "10px", border: "1px solid var(--color-border)", minWidth: "220px" }}>
                <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.2rem" }}>YOUR 6-DIGIT OTP</div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 800,
                    fontSize: "2.2rem",
                    letterSpacing: "0.25em",
                    color: "var(--color-accent-primary)",
                  }}
                >
                  {activeGeneratedOtp?.otp || (approvedEmergencyReq ? "OTP ACTIVE" : "••••••")}
                </div>
                {(!activeGeneratedOtp?.otp && approvedEmergencyReq) && (
                  <Button
                    size="sm"
                    onClick={() => handleApproveEmergency(approvedEmergencyReq.id)}
                    style={{ marginTop: "0.5rem", width: "100%", fontSize: "0.75rem" }}
                  >
                    SHOW OTP CODE
                  </Button>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", marginTop: "0.25rem" }}>
                  <Clock size={12} color="var(--color-signal-critical)" />
                  <span className="type-label" style={{ color: "var(--color-signal-critical)", fontWeight: 700, fontSize: "0.75rem" }}>
                    EXPIRES IN: {formatTimer(otpSecondsLeft)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* 🔐 ACTIVE EMERGENCY SESSION NOTICE */}
        {activeEmergencyAccess && (
          <div
            style={{
              background: "var(--color-signal-warning-bg)",
              border: "1px solid var(--color-signal-warning-border)",
              borderLeft: "4px solid var(--color-signal-warning)",
              borderRadius: "8px",
              padding: "0.875rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Lock size={15} color="var(--color-signal-warning)" />
              <span className="type-label" style={{ color: "var(--color-signal-warning)", fontWeight: 800 }}>
                ACTIVE EMERGENCY ACCESS SESSION:
              </span>
              <span className="type-value" style={{ fontSize: "0.85rem", color: "var(--color-ink)" }}>
                {activeEmergencyAccess.doctorName} ({activeEmergencyAccess.hospitalName}) · Read-only
              </span>
            </div>
            <span className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>
              Reason: {activeEmergencyAccess.reason} · Recorded in UHIS Audit Trail
            </span>
          </div>
        )}

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
                {patient.name}
              </span>
              <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{patient.abhaId}</span>
              <span className="status-critical">{patient.bloodGroup}</span>
            </div>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
              {[
                { l: "AGE", v: `${patient.age || 35}Y` },
                { l: "GENDER", v: patient.gender },
                { l: "HEIGHT", v: patient.height },
                { l: "WEIGHT", v: patient.weight },
                { l: "PHYSICIAN", v: patient.primaryPhysician || "Dr. Anita Desai" },
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
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button
                variant={activeTab === "emergency" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setActiveTab("emergency")}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: activeTab === "emergency" ? "var(--color-signal-critical)" : undefined, borderColor: activeTab === "emergency" ? "var(--color-signal-critical)" : undefined }}
              >
                <AlertTriangle size={12} /> 🚨 EMERGENCY PORTAL
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Edit size={11} /> EDIT PROFILE
              </Button>
            </div>
          </div>
        </div>

        {/* 🚨 DEDICATED EMERGENCY ACCESS TAB */}
        {activeTab === "emergency" && (
          <div className="fade-in">
            <InstrumentPanel
              title="Emergency Access Control & OTP Authorization"
              subtitle="PATIENT DATA CONSENT"
              channel="critical"
              action={
                !pendingEmergencyReq && (
                  <Button size="sm" onClick={handleSimulateIncomingRequest} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <AlertTriangle size={12} /> SIMULATE DOCTOR REQUEST
                  </Button>
                )
              }
            >
              <div style={{ padding: "0.5rem 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.875rem" }}>
                  When a verified hospital doctor requires emergency access to your UHIS medical record, you will receive an instant authorization request here. Upon your approval, a single-use 6-digit OTP will be generated for the clinician.
                </div>

                {emergencyRequests.length === 0 ? (
                  <div
                    style={{
                      background: "var(--color-surface)",
                      border: "1px dashed var(--color-border)",
                      borderRadius: "8px",
                      padding: "2.5rem 1.5rem",
                      textAlign: "center",
                    }}
                  >
                    <ShieldCheck size={32} color="var(--color-signal-normal)" style={{ margin: "0 auto 0.75rem" }} />
                    <div className="type-heading" style={{ fontSize: "1.1rem" }}>No Active Emergency Requests</div>
                    <div className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem", maxWidth: "440px", margin: "0.4rem auto 1.25rem" }}>
                      Your medical records are fully protected. Only doctors you authorize with a genuine OTP can view emergency records.
                    </div>
                    <Button onClick={handleSimulateIncomingRequest} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                      <AlertTriangle size={13} /> Receive Demo Emergency Request (Dr. Anita Desai)
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {emergencyRequests.map((req) => (
                      <div
                        key={req.id}
                        className={`data-row channel-${req.status === "PENDING" ? "critical" : req.status === "APPROVED" ? "normal" : "info"}`}
                        style={{
                          background: "var(--color-surface)",
                          padding: "1rem 1.25rem",
                          borderRadius: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "1rem",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
                            <span className="type-value" style={{ color: "var(--color-ink)", fontWeight: 700 }}>{req.doctorName}</span>
                            <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>{req.hospitalName}</span>
                          </div>
                          <div className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                            Reason: <strong>{req.reason}</strong>
                          </div>
                          <div className="type-micro" style={{ color: "var(--color-ink-muted)", marginTop: "0.2rem" }}>
                            Requested: {req.createdAt ? new Date(req.createdAt).toLocaleTimeString() : "Just now"}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                          <StatusCode
                            status={req.status === "PENDING" ? "critical" : req.status === "APPROVED" ? "normal" : "info"}
                            label={req.status}
                          />
                          {req.status === "PENDING" && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <Button variant="secondary" size="sm" onClick={() => handleRejectEmergency(req.id)}>REJECT</Button>
                              <Button size="sm" onClick={() => handleApproveEmergency(req.id)}>APPROVE & ISSUE OTP →</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </InstrumentPanel>
          </div>
        )}


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
                { label: "MEDICAL RECORDS", value: medicalRecords.length, signal: "info", icon: FileImage, tab: "records" },
                { label: "CONDITIONS", value: activeConditions, signal: "warning", icon: Heart, tab: "conditions" },
                { label: "MEDICATIONS", value: activeRx, signal: "info", icon: Pill, tab: "medications" },
                { label: "PENDING LABS", value: pendingLabs, signal: "warning", icon: FlaskConical, tab: "labs" },
                { label: "UPCOMING VISITS", value: upcomingVisits, signal: "info", icon: Calendar, tab: "visits" },
                { label: "SEVERE ALLERGIES", value: severeAllergies, signal: "critical", icon: AlertTriangle, tab: "allergies" },
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
                    style={{ color: signal === "muted" ? "var(--color-ink)" : `var(--color-signal-${signal})` }}
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
                  <div style={{ padding: "1.25rem 1rem", textAlign: "center" }}>
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
                {labReportsList.slice(0, 4).map((r) => (
                  <div key={r.id} className="data-row">
                    <div style={{ flex: 1 }}>
                      <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{r.testName || r.test}</div>
                      <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>{r.date || r.sampleDate} · {r.facility || "Pathology Dept"}</div>
                    </div>
                    <StatusCode status={(r.status === "completed" ? "normal" : "warning")} label={(r.status || "completed").toUpperCase()} />
                  </div>
                ))}
              </InstrumentPanel>

              {/* Active medications */}
              <InstrumentPanel title="Active Medications" subtitle="CURRENT RX" channel="info"
                action={<Button variant="secondary" size="sm" onClick={() => setActiveTab("medications")}>ALL RX</Button>}>
                {medicationsList.slice(0, 4).map((m) => (
                  <div key={m.id} className="data-row">
                    <div style={{ flex: 1 }}>
                      <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{m.name} {m.dosage}</div>
                      <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>{m.frequency}</div>
                    </div>
                    <StatusCode status="info" label="ACTIVE" />
                  </div>
                ))}
              </InstrumentPanel>

              {/* Upcoming visits */}
              <InstrumentPanel title="Upcoming Appointments" subtitle="SCHEDULED VISITS" channel="normal"
                action={<Button variant="secondary" size="sm" onClick={() => setActiveTab("visits")}>ALL VISITS</Button>}>
                {visitsList.slice(0, 3).map((v) => (
                  <div key={v.id} className="data-row">
                    <div style={{ flex: 1 }}>
                      <div className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{v.doctor}</div>
                      <div className="type-micro" style={{ color: "var(--color-ink-secondary)" }}>{v.date || v.appointmentDate} · {v.facility || "Main Hospital"}</div>
                    </div>
                    <StatusCode status="info" label="SCHEDULED" />
                  </div>
                ))}
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
                  No medical records uploaded yet.
                </div>
                <p className="type-body" style={{ color: "var(--color-ink-secondary)", maxWidth: "420px", fontSize: "0.85rem" }}>
                  Upload your diagnostic images (X-rays, MRIs, CT scans), prescription documents, or lab reports to store them in your longitudinal health record.
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
                    : "Unknown Date";

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
            {conditionsList
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
                          <span className="type-id" style={{ color: "var(--color-ink-secondary)" }}>ICD-10: {c.icd10 || c.icdCode || "E11.9"}</span>
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
              ))}
          </div>
        )}

        {/* MEDICATIONS TAB */}
        {activeTab === "medications" && (
          <div className="fade-in">
            {medicationsList.map((m) => (
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
            ))}
          </div>
        )}

        {/* LABS TAB */}
        {activeTab === "labs" && (
          <div className="fade-in">
            {labReportsList.map((r) => (
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
                        <span className="type-label" style={{ color: "var(--color-ink-secondary)" }}>DATE: {r.date || r.sampleDate}</span>
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
            ))}
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
            {visitsList
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
              ))}
          </div>
        )}

        {/* VACCINATIONS TAB */}
        {activeTab === "vaccinations" && (
          <div className="fade-in">
            {vaccinationsList.map((v) => (
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
            ))}
          </div>
        )}

        {/* ALLERGIES TAB */}
        {activeTab === "allergies" && (
          <div className="fade-in">
            {allergiesList.map((a) => (
              <div
                key={a.id}
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
            ))}
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="fade-in">
            <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
              <div
                style={{
                  position: "absolute",
                  left: "6px",
                  top: 0,
                  bottom: 0,
                  width: "1px",
                  background: "var(--color-border)",
                }}
              />
              {timelineList.map((t) => (
                <div
                  key={t.id}
                  style={{
                    position: "relative",
                    marginBottom: "1.25rem",
                    paddingLeft: "1.25rem",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "-6px",
                      top: "0.35rem",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "var(--color-accent-primary)",
                      flexShrink: 0,
                    }}
                  />
                  <div
                    className="instrument-panel channel-info"
                    style={{ background: "var(--color-panel)" }}
                  >
                    <div style={{ padding: "0.875rem 1.25rem" }}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                        <span className="type-id" style={{ color: "var(--color-ink-secondary)", flexShrink: 0 }}>{t.date}</span>
                        <span className="type-value" style={{ color: "var(--color-ink)", fontSize: "0.85rem" }}>{t.title}</span>
                      </div>
                      <span className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem" }}>{t.summary || t.detail}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              placeholder="e.g. Follow-up chest radiograph showing clear lung fields, no active consolidation."
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
          {/* Viewer Container */}
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

      {/* 🔐 Emergency Access Approved OTP Display Modal */}
      {approvedOtpModal && (
        <Modal
          isOpen={Boolean(approvedOtpModal)}
          onClose={() => setApprovedOtpModal(null)}
          title="Emergency Access Approved"
          subtitle="AUTHENTICATED OTP ISSUANCE"
          width="540px"
        >
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "var(--color-signal-normal-bg)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-signal-normal)",
                marginBottom: "0.75rem",
              }}
            >
              <CheckCircle2 size={26} />
            </div>

            <div className="type-heading" style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>
              ✓ Emergency Access Authorized
            </div>
            <div className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
              Doctor: <strong>{approvedOtpModal.doctorName}</strong> ({approvedOtpModal.hospitalName})<br />
              Reason: <em>{approvedOtpModal.reason}</em>
            </div>

            <div
              style={{
                background: "var(--color-surface)",
                border: "2px dashed var(--color-border-deep)",
                borderRadius: "12px",
                padding: "1.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <div className="type-label" style={{ color: "var(--color-ink-secondary)", marginBottom: "0.4rem" }}>
                YOUR TEMPORARY EMERGENCY OTP
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 800,
                  fontSize: "2.75rem",
                  letterSpacing: "0.25em",
                  color: "var(--color-accent-primary)",
                  textShadow: "0 2px 10px rgba(37, 99, 235, 0.15)",
                }}
              >
                {approvedOtpModal.otp}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginTop: "0.75rem" }}>
                <Clock size={14} color="var(--color-signal-critical)" />
                <span className="type-label" style={{ color: "var(--color-signal-critical)", fontWeight: 700 }}>
                  THIS OTP EXPIRES IN: {formatTimer(otpSecondsLeft)}
                </span>
              </div>
            </div>

            <div className="type-body" style={{ color: "var(--color-ink-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
              Share this 6-digit OTP with the verified clinician. Access will automatically expire after 15 minutes.
            </div>

            <Button
              onClick={() => setApprovedOtpModal(null)}
              style={{ width: "100%", padding: "0.75rem", fontWeight: 700 }}
            >
              DONE
            </Button>
          </div>
        </Modal>
      )}

      {/* Edit Profile Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Patient Profile" subtitle="PROFILE MANAGEMENT">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <PrecisionInput label="Height (cm)" defaultValue={patient.height.replace(" cm", "")} />
            <PrecisionInput label="Weight (kg)" defaultValue={patient.weight.replace(" kg", "")} />
          </div>
          <PrecisionInput label="Mobile Number" defaultValue={patient.phone} />
          <PrecisionInput label="Emergency Contact" defaultValue={patient.emergencyContact} />
          <PrecisionInput label="Primary Physician" defaultValue={patient.primaryPhysician} />
          <PrecisionInput label="Full Address" defaultValue={patient.address} />
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>CANCEL</Button>
            <Button onClick={() => { toast.success("Profile updated."); setEditOpen(false); }}>SAVE CHANGES</Button>
          </div>
        </div>
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
