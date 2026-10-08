import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Button from "../components/ui/Button";
import PrecisionInput from "../components/ui/PrecisionInput";
import api from "../services/api";

const STEPS = ["Account Setup", "Basic Profile", "ABHA Verification"];

const ROLES = [
  { id: "patient", label: "Patient", color: "#16A34A" },
  { id: "doctor", label: "Clinician", color: "#2563EB" },
  { id: "admin", label: "Hospital Admin", color: "#D97706" },
  { id: "lab", label: "Lab", color: "#0EA5E9" },
  { id: "pharmacy", label: "Pharmacy", color: "#DC2626" },
  { id: "receptionist", label: "Reception", color: "#0F766E" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("patient");
  const [otp, setOtp] = useState("");
  const [generatedOtp] = useState("847291");
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdUser, setCreatedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    dob: "",
    gender: "Male",
    bloodGroup: "O+",
    height: "",
    weight: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    medRegNo: "",
    specialization: "",
    experience: "",
    facility: "",
  });

  const set = (k) => (e) => {
    setErrorMessage("");
    setForm((prev) => ({ ...prev, [k]: e.target.value }));
  };

  const handleNext = () => {
    setErrorMessage("");
    if (step === 0) {
      if (!form.name.trim() || !form.email.trim() || !form.password) {
        setErrorMessage("Please complete all required fields (Full Name, Email, Password).");
        toast.error("Complete all required fields.");
        return;
      }
      if (form.password.length < 6) {
        setErrorMessage("Password must be at least 6 characters.");
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleSendOtp = () => {
    setOtpSent(true);
    toast.info(`OTP sent · Demo code: ${generatedOtp}`);
  };

  const handleVerify = async () => {
    if (otp !== generatedOtp) {
      toast.error("Incorrect OTP. Use the demo code shown: 847291");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // Register with the backend API
      const payload = {
        fullName: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phoneNumber: form.phone ? form.phone.trim() : null,
        role: role.toUpperCase(),
        gender: form.gender ? form.gender.toUpperCase() : "MALE",
        dateOfBirth: form.dob ? form.dob : null,
        bloodGroup: form.bloodGroup || "O+",
        height: form.height ? `${form.height} cm` : null,
        weight: form.weight ? `${form.weight} kg` : null,
        address: form.address || null,
        emergencyContact: form.emergencyContact || null,
        emergencyPhone: form.emergencyPhone || null,
      };

      const user = await register(payload);
      setCreatedUser(user);
      setVerified(true);
      toast.success("Account created and ABHA ID assigned successfully!");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Registration failed. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const [ABHA_GENERATED] = useState(
    () => `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
  );

  const handleComplete = async () => {
    setLoading(true);
    try {
      if (role === "patient") {
        await api.post("/auth/register", {
          fullName: form.name,
          email: form.email,
          password: form.password,
          role: "PATIENT",
          phoneNumber: form.phone,
          gender: form.gender ? form.gender.toUpperCase() : "MALE",
          dateOfBirth: form.dob || "1995-01-01",
          bloodGroup: form.bloodGroup || "O+",
          height: form.height ? `${form.height} cm` : undefined,
          weight: form.weight ? `${form.weight} kg` : undefined,
          address: form.address,
          emergencyContact: form.emergencyContact,
          abhaId: ABHA_GENERATED,
        }).catch((err) => {
          if (err.response && err.response.data && err.response.data.message) {
            throw err;
          }
          // offline fallback
        });
      }
      demoLogin(role);
      toast.success(`Registration complete with unique ABHA ID: ${ABHA_GENERATED}. Redirecting...`);
      setTimeout(() => navigate(role === "patient" ? "/patient" : `/${role}`), 800);
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please check your details.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find((r) => r.id === role);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-surface)", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <nav
        style={{
          background: "var(--color-panel)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 2rem",
          height: "60px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer" }} onClick={() => navigate("/")}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: "var(--color-accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HeartPulse size={15} color="white" />
          </div>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              letterSpacing: "-0.02em",
              color: "var(--color-ink)",
            }}
          >
            UHIS
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--color-ink-muted)" }}>· Patient Registration</span>
        </div>
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.85rem",
            fontWeight: 500,
            color: "var(--color-ink-secondary)",
          }}
        >
          ← Back to Sign In
        </button>
      </nav>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        {/* Step progress */}
        <div style={{ display: "flex", marginBottom: "2.5rem" }}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                padding: "0.75rem 0.5rem",
                textAlign: "center",
                borderBottom: `2px solid ${step === i ? "var(--color-accent-primary)" : step > i ? "var(--color-signal-normal)" : "var(--color-border)"}`,
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: step === i ? "var(--color-ink)" : step > i ? "var(--color-signal-normal)" : "var(--color-ink-muted)",
                }}
              >
                {step > i ? "✓ " : `${i + 1}. `}{s}
              </span>
            </div>
          ))}
        </div>

        {errorMessage && (
          <div
            style={{
              background: "var(--color-signal-critical-bg)",
              border: "1px solid var(--color-signal-critical-border)",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              color: "var(--color-signal-critical)",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 0 */}
        {step === 0 && (
          <div className="instrument-panel fade-in">
            <div className="panel-header">
              <div className="type-label" style={{ marginBottom: "0.2rem" }}>Step 1 of 3</div>
              <div className="type-heading">Account & Role</div>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <div className="type-label" style={{ marginBottom: "0.625rem" }}>Registering as</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      style={{
                        padding: "0.4rem 0.875rem",
                        borderRadius: "99px",
                        border: `1.5px solid ${role === r.id ? r.color : "var(--color-border-deep)"}`,
                        background: role === r.id ? r.color + "15" : "var(--color-panel)",
                        color: role === r.id ? r.color : "var(--color-ink-secondary)",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.8rem",
                        fontWeight: role === r.id ? 600 : 500,
                        cursor: "pointer",
                        transition: "all 150ms ease",
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                {selectedRole && (
                  <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: selectedRole.color, fontWeight: 500 }}>
                    Selected: {selectedRole.label} Account
                  </div>
                )}
              </div>
              <PrecisionInput label="Full Name *" value={form.name} onChange={set("name")} placeholder="e.g. Aboli Joshi" required />
              <PrecisionInput label="Email Address *" type="email" value={form.email} onChange={set("email")} placeholder="aboli.joshi@example.com" required />
              <PrecisionInput label="Mobile Number" type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
              <PrecisionInput label="Password *" type="password" value={form.password} onChange={set("password")} placeholder="Min. 6 characters" required />
              <Button onClick={handleNext} style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem" }}>
                Continue to Profile Details →
              </Button>
            </div>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="instrument-panel fade-in">
            <div className="panel-header">
              <div className="type-label" style={{ marginBottom: "0.2rem" }}>Step 2 of 3</div>
              <div className="type-heading">
                {role === "patient" ? "Basic Patient Information" : "Professional Details"}
              </div>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p className="type-body" style={{ fontSize: "0.825rem", color: "var(--color-ink-muted)", marginBottom: "0.25rem" }}>
                Basic demographic profile. Detailed medical records, prescriptions, and diagnostics can be added anytime after login.
              </p>
              {role === "patient" ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <PrecisionInput label="Date of Birth" type="date" value={form.dob} onChange={set("dob")} />
                    <div>
                      <div className="type-label" style={{ marginBottom: "0.4rem" }}>Gender</div>
                      <select className="precision-input" value={form.gender} onChange={set("gender")}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <div className="type-label" style={{ marginBottom: "0.4rem" }}>Blood Group</div>
                      <select className="precision-input" value={form.bloodGroup} onChange={set("bloodGroup")}>
                        {["A+", "A−", "B+", "B−", "O+", "O−", "AB+", "AB−"].map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <PrecisionInput label="Height (cm)" type="number" value={form.height} onChange={set("height")} placeholder="165" />
                    <PrecisionInput label="Weight (kg)" type="number" value={form.weight} onChange={set("weight")} placeholder="60" />
                  </div>
                  <PrecisionInput label="Emergency Contact Name" value={form.emergencyContact} onChange={set("emergencyContact")} placeholder="e.g. Ramesh Joshi" />
                  <PrecisionInput label="Full Address" value={form.address} onChange={set("address")} placeholder="e.g. Flat 302, Shivaji Nagar, Pune" />
                </>
              ) : (
                <>
                  <PrecisionInput label="Medical Registration No." value={form.medRegNo} onChange={set("medRegNo")} placeholder="MCI / NMC / Licence Number" />
                  <PrecisionInput label="Specialization / Department" value={form.specialization} onChange={set("specialization")} placeholder="Internal Medicine / Cardiology..." />
                  <PrecisionInput label="Years of Experience" type="number" value={form.experience} onChange={set("experience")} placeholder="8" />
                  <PrecisionInput label="Primary Facility / Hospital" value={form.facility} onChange={set("facility")} placeholder="AIIMS New Delhi" />
                </>
              )}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
                <Button onClick={handleNext} style={{ flex: 1, justifyContent: "center" }}>Continue to Verification →</Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="instrument-panel fade-in">
            <div className="panel-header">
              <div className="type-label" style={{ marginBottom: "0.2rem" }}>Step 3 of 3</div>
              <div className="type-heading">ABHA ID Verification & Creation</div>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {!verified ? (
                <>
                  <p className="type-body" style={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
                    An OTP will be verified to create your secure UHIS account and assign your unique Ayushman Bharat Digital Health ID (ABHA).
                  </p>
                  {!otpSent ? (
                    <Button onClick={handleSendOtp} style={{ width: "100%", justifyContent: "center" }}>
                      Send Verification OTP →
                    </Button>
                  ) : (
                    <>
                      <div
                        style={{
                          background: "var(--color-signal-info-bg)",
                          border: "1px solid var(--color-signal-info-border)",
                          borderRadius: "8px",
                          padding: "0.875rem 1rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span style={{ width: "6px", height: "6px", borderRadius: "99px", background: "var(--color-signal-info)", flexShrink: 0 }} />
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", fontWeight: 500, color: "var(--color-signal-info)" }}>
                          OTP sent · Verification code: <strong>{generatedOtp}</strong>
                        </span>
                      </div>
                      <PrecisionInput
                        label="Enter 6-Digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="847291"
                        maxLength={6}
                      />
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <Button variant="secondary" onClick={() => setStep(1)} disabled={loading}>← Back</Button>
                        <Button onClick={handleVerify} disabled={loading} style={{ flex: 1, justifyContent: "center" }}>
                          {loading ? "Creating Account..." : "Verify & Create Account"}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div
                    style={{
                      background: "var(--color-signal-normal-bg)",
                      border: "1px solid var(--color-signal-normal-border)",
                      borderRadius: "8px",
                      padding: "1rem",
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "flex-start",
                    }}
                  >
                    <CheckCircle size={18} style={{ color: "var(--color-signal-normal)", flexShrink: 0, marginTop: "1px" }} />
                    <div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "var(--color-signal-normal)", marginBottom: "0.2rem" }}>
                        Account Created Successfully
                      </div>
                      <div className="type-micro">
                        Welcome, {createdUser?.fullName || form.name}! Your unique ABHA Health record has been registered.
                      </div>
                    </div>
                  </div>
                  <div className="instrument-panel">
                    <div className="panel-header">
                      <div className="type-label">Your Universal Health ID</div>
                    </div>
                    <div style={{ padding: "1.25rem" }}>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                          fontSize: "1.35rem",
                          color: "var(--color-ink)",
                          letterSpacing: "0.06em",
                          marginBottom: "0.4rem",
                        }}
                      >
                        {createdUser?.abhaId || "91-XXXX-XXXX-XXXX"}
                      </div>
                      <div className="type-micro">
                        Linked Email: {form.email}
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleComplete} style={{ width: "100%", justifyContent: "center" }}>
                    Open My Patient Dashboard →
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
