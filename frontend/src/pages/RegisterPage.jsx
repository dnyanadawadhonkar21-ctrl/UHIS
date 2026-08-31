import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Button from "../components/ui/Button";
import PrecisionInput from "../components/ui/PrecisionInput";

const STEPS = ["Account Setup", "Medical Profile", "ABHA Verification"];

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
  const { demoLogin } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("patient");
  const [otp, setOtp] = useState("");
  const [generatedOtp] = useState("847291");
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    dob: "", gender: "", bloodGroup: "", height: "", weight: "",
    address: "", emergencyContact: "",
    medRegNo: "", specialization: "", experience: "", facility: "",
  });

  const set = (k) => (e) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleNext = () => {
    if (step === 0 && (!form.name || !form.email || !form.password)) {
      toast.error("Complete all required fields.");
      return;
    }
    setStep((s) => s + 1);
  };

  const handleSendOtp = () => {
    setOtpSent(true);
    toast.info(`OTP sent · Demo code: ${generatedOtp}`);
  };

  const handleVerify = () => {
    if (otp === generatedOtp) {
      setVerified(true);
      toast.success("ABHA ID verified and assigned.");
    } else {
      toast.error("Incorrect OTP. Use the demo code shown.");
    }
  };

  const handleComplete = () => {
    demoLogin(role);
    toast.success("Registration complete. Redirecting...");
    setTimeout(() => navigate(role === "patient" ? "/patient" : `/${role}`), 800);
  };

  const [ABHA_GENERATED] = useState(
    () => `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
  );
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
          <span style={{ fontSize: "0.75rem", color: "var(--color-ink-muted)" }}>· Registration</span>
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

        {/* Step 0 */}
        {step === 0 && (
          <div className="instrument-panel fade-in">
            <div className="panel-header">
              <div className="type-label" style={{ marginBottom: "0.2rem" }}>Step 1 of 3</div>
              <div className="type-heading">Account & Role</div>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <div className="type-label" style={{ marginBottom: "0.625rem" }}>Select your role</div>
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
                    Registering as: {selectedRole.label}
                  </div>
                )}
              </div>
              <PrecisionInput label="Full Name" value={form.name} onChange={set("name")} placeholder="As per Aadhaar" />
              <PrecisionInput label="Email Address" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
              <PrecisionInput label="Mobile Number" type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 XXXXX XXXXX" />
              <PrecisionInput label="Password" type="password" value={form.password} onChange={set("password")} placeholder="Min. 8 characters" />
              <Button onClick={handleNext} style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem" }}>
                Continue →
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
                {role === "patient" ? "Patient Medical Profile" : "Professional Details"}
              </div>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {role === "patient" ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <PrecisionInput label="Date of Birth" type="date" value={form.dob} onChange={set("dob")} />
                    <div>
                      <div className="type-label" style={{ marginBottom: "0.4rem" }}>Gender</div>
                      <select className="precision-input" value={form.gender} onChange={set("gender")}>
                        <option value="">Select</option>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                    <div>
                      <div className="type-label" style={{ marginBottom: "0.4rem" }}>Blood Group</div>
                      <select className="precision-input" value={form.bloodGroup} onChange={set("bloodGroup")}>
                        <option value="">Select</option>
                        {["A+","A−","B+","B−","O+","O−","AB+","AB−"].map((b) => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <PrecisionInput label="Height (cm)" type="number" value={form.height} onChange={set("height")} placeholder="170" />
                    <PrecisionInput label="Weight (kg)" type="number" value={form.weight} onChange={set("weight")} placeholder="68" />
                  </div>
                  <PrecisionInput label="Emergency Contact" value={form.emergencyContact} onChange={set("emergencyContact")} placeholder="Name · +91 XXXXX XXXXX" />
                  <PrecisionInput label="Full Address" value={form.address} onChange={set("address")} placeholder="House, Street, City, PIN" />
                </>
              ) : (
                <>
                  <PrecisionInput label="Medical Registration No." value={form.medRegNo} onChange={set("medRegNo")} placeholder="MCI / NMC / Licence Number" />
                  <PrecisionInput label="Specialization / Department" value={form.specialization} onChange={set("specialization")} placeholder="Internal Medicine / Cardiology..." />
                  <PrecisionInput label="Years of Experience" type="number" value={form.experience} onChange={set("experience")} placeholder="8" />
                  <PrecisionInput label="Primary Facility / Hospital" value={form.facility} onChange={set("facility")} placeholder="Apollo Hospitals, New Delhi" />
                </>
              )}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
                <Button onClick={handleNext} style={{ flex: 1, justifyContent: "center" }}>Continue →</Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="instrument-panel fade-in">
            <div className="panel-header">
              <div className="type-label" style={{ marginBottom: "0.2rem" }}>Step 3 of 3</div>
              <div className="type-heading">ABHA Verification & ID Assignment</div>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {!verified ? (
                <>
                  <p className="type-body" style={{ lineHeight: 1.7 }}>
                    An OTP will be sent to your registered mobile number to verify and generate your ABHA Health ID.
                  </p>
                  {!otpSent ? (
                    <Button onClick={handleSendOtp} style={{ width: "100%", justifyContent: "center" }}>
                      Send OTP →
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
                          OTP sent · Demo code: <strong>{generatedOtp}</strong>
                        </span>
                      </div>
                      <PrecisionInput
                        label="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="6-digit code"
                        maxLength={6}
                      />
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
                        <Button onClick={handleVerify} style={{ flex: 1, justifyContent: "center" }}>Verify OTP</Button>
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
                        ABHA ID Verified
                      </div>
                      <div className="type-micro">Your Ayushman Bharat Digital Health ID has been assigned.</div>
                    </div>
                  </div>
                  <div className="instrument-panel">
                    <div className="panel-header">
                      <div className="type-label">Your ABHA ID</div>
                    </div>
                    <div style={{ padding: "1.25rem" }}>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                          fontSize: "1.5rem",
                          color: "var(--color-ink)",
                          letterSpacing: "0.06em",
                          marginBottom: "0.4rem",
                        }}
                      >
                        {ABHA_GENERATED}
                      </div>
                      <div className="type-micro">
                        ABHA Address: {form.name.toLowerCase().replace(/\s+/g, ".") || "your.name"}@abdm
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleComplete} style={{ width: "100%", justifyContent: "center" }}>
                    Enter UHIS Portal →
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
