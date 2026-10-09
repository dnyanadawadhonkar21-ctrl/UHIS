import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Stethoscope,
  Award,
  DollarSign,
  ChevronRight,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import InstrumentPanel from "../ui/InstrumentPanel";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import StatusCode from "../ui/StatusCode";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";

export default function FindDoctorView({ onNavigateToAppointments }) {
  const toast = useToast();

  // Search & Filter State
  const [searchName, setSearchName] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("ALL");
  const [selectedHospital, setSelectedHospital] = useState("ALL");
  const [sortBy, setSortBy] = useState("experience");

  // Options State
  const [specializations, setSpecializations] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  // Results State
  const [doctors, setDoctors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Doctor Profile Modal State
  const [selectedDoctorForProfile, setSelectedDoctorForProfile] = useState(null);
  const [doctorProfileLoading, setDoctorProfileLoading] = useState(false);
  const [doctorProfileData, setDoctorProfileData] = useState(null);

  // Booking Flow State
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState("");
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1: Select Slot, 2: Review, 3: Success Confirmed
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);

  // Load specializations and hospitals on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [specsRes, hospsRes] = await Promise.all([
          api.get("/doctors/specializations"),
          api.get("/hospitals"),
        ]);
        if (specsRes.data?.success) {
          setSpecializations(specsRes.data.specializations || []);
        }
        if (hospsRes.data?.success) {
          setHospitals(hospsRes.data.hospitals || []);
        }
      } catch (err) {
        console.error("Error fetching filter options:", err);
      }
    };
    fetchFilterOptions();
  }, []);

  // Fetch doctors whenever search or filters change (with debounce on search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDoctors();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchName, selectedSpecialization, selectedHospital, sortBy]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (searchName.trim()) params.append("name", searchName.trim());
      if (selectedSpecialization !== "ALL") params.append("specialization", selectedSpecialization);
      if (selectedHospital !== "ALL") params.append("hospitalId", selectedHospital);
      if (sortBy) params.append("sortBy", sortBy);
      params.append("limit", "24");

      const res = await api.get(`/doctors/search?${params.toString()}`);
      if (res.data?.success) {
        setDoctors(res.data.doctors || []);
        setTotalCount(res.data.count || 0);
      } else {
        setError(res.data?.message || "Failed to load doctors.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reach UHIS doctor registry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Open Detailed Profile
  const handleOpenProfile = async (doc) => {
    setSelectedDoctorForProfile(doc);
    setDoctorProfileLoading(true);
    try {
      const res = await api.get(`/doctors/${doc.id}/profile`);
      if (res.data?.success) {
        setDoctorProfileData(res.data.doctor);
      }
    } catch (err) {
      toast.error("Could not load doctor profile details.");
    } finally {
      setDoctorProfileLoading(false);
    }
  };

  // Initiate Booking
  const handleStartBooking = async (doc) => {
    setBookingDoctor(doc);
    setSelectedDoctorForProfile(null);
    setBookingStep(1);
    setSelectedSlot(null);
    setReason("");
    setConfirmedBookingData(null);

    // Compute default date (today or tomorrow)
    const todayStr = new Date().toISOString().split("T")[0];
    setSelectedDate(todayStr);
    await fetchSlotsForDate(doc.id, todayStr);
  };

  // Fetch Slots for Date
  const fetchSlotsForDate = async (doctorId, dateStr) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const res = await api.get(`/doctors/${doctorId}/availability?date=${dateStr}`);
      if (res.data?.success) {
        setAvailableSlots(res.data.slots || []);
      } else {
        setAvailableSlots([]);
      }
    } catch (err) {
      setAvailableSlots([]);
      toast.error("Failed to load time slots for the selected date.");
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateChange = (dateStr) => {
    setSelectedDate(dateStr);
    if (bookingDoctor) {
      fetchSlotsForDate(bookingDoctor.id, dateStr);
    }
  };

  // Confirm and Submit Booking
  const handleConfirmBooking = async () => {
    if (!selectedSlot || !bookingDoctor) {
      toast.warning("Please select a date and an available time slot.");
      return;
    }

    try {
      setIsBookingSubmitting(true);
      const payload = {
        doctorId: bookingDoctor.id,
        hospitalId: bookingDoctor.hospital?.id || selectedSlot.hospitalId,
        slotId: selectedSlot.id,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot.startTime,
        reason: reason.trim() || "OPD Consultation",
      };

      const res = await api.post("/patients/appointments", payload);
      if (res.data?.success) {
        toast.success(`Appointment confirmed! Token: ${res.data.tokenNumber}`);
        setConfirmedBookingData(res.data);
        setBookingStep(3); // Success step
        // Notify Doctor Dashboard to refresh queue immediately
        localStorage.setItem('uhis_last_booking', Date.now().toString());
        window.dispatchEvent(new CustomEvent('uhis_booking_updated'));
      } else {
        toast.error(res.data?.message || "Booking failed.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to confirm appointment. Please try again.";
      toast.error(msg);
      if (err.response?.status === 409) {
        // Slot taken, refresh slots
        fetchSlotsForDate(bookingDoctor.id, selectedDate);
        setBookingStep(1);
      }
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  // Generate next 14 bookable days
  const upcomingDays = useMemo(() => {
    const days = [];
    const base = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString("en-US", { month: "short" });
      days.push({ iso, dayName, dayNum, monthName });
    }
    return days;
  }, []);

  const resetFilters = () => {
    setSearchName("");
    setSelectedSpecialization("ALL");
    setSelectedHospital("ALL");
    setSortBy("experience");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 1. Header Banner */}
      <div
        className="instrument-panel"
        style={{
          padding: "1.75rem",
          background: "linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(14,165,233,0.04) 100%)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
            <span
              style={{
                background: "var(--color-accent-primary)",
                color: "#fff",
                padding: "0.25rem 0.6rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              OPD Booking
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--color-ink-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <ShieldCheck size={14} color="#16A34A" /> ABDM & UHIS Verified Registry
            </span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>
            Find a Doctor
          </h1>
          <p style={{ margin: "0.35rem 0 0", color: "var(--color-ink-secondary)", fontSize: "0.95rem" }}>
            Find the right specialist, view availability, and book your consultation with automatic queue registration.
          </p>
        </div>

        {onNavigateToAppointments && (
          <Button
            variant="secondary"
            onClick={onNavigateToAppointments}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Calendar size={16} />
            View My Appointments
          </Button>
        )}
      </div>

      {/* 2. Search & Filter Bar */}
      <InstrumentPanel title="Search & Filter Specialists" subtitle="REAL-TIME DIRECTORY">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "0.75rem",
              alignItems: "center",
            }}
          >
            {/* Doctor Name Search */}
            <div style={{ position: "relative" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "0.85rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-ink-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Search doctor by name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 2.2rem 0.6rem 2.4rem",
                  fontSize: "0.875rem",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-ink)",
                  outline: "none",
                }}
              />
              {searchName && (
                <button
                  onClick={() => setSearchName("")}
                  style={{
                    position: "absolute",
                    right: "0.65rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-ink-muted)",
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Specialization Filter */}
            <div>
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  fontSize: "0.875rem",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-ink)",
                  cursor: "pointer",
                }}
              >
                <option value="ALL">All Specializations ({specializations.length})</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {/* Hospital Filter */}
            <div>
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  fontSize: "0.875rem",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-ink)",
                  cursor: "pointer",
                }}
              >
                <option value="ALL">All Associated Hospitals</option>
                {hospitals.map((hosp) => (
                  <option key={hosp.id} value={hosp.id}>
                    {hosp.name} {hosp.city ? `(${hosp.city})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting Filter */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  fontSize: "0.875rem",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-ink)",
                  cursor: "pointer",
                }}
              >
                <option value="experience">Sort by: Highest Experience</option>
                <option value="fee_asc">Sort by: Lowest Fee</option>
                <option value="fee_desc">Sort by: Highest Fee</option>
                <option value="name">Sort by: Doctor Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Filter Summary & Quick Reset */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "0.5rem",
              borderTop: "1px solid var(--color-border)",
              fontSize: "0.85rem",
              color: "var(--color-ink-muted)",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div>
              Showing <strong style={{ color: "var(--color-ink)" }}>{doctors.length}</strong> of{" "}
              <strong style={{ color: "var(--color-ink)" }}>{totalCount}</strong> verified clinicians
            </div>

            {(searchName || selectedSpecialization !== "ALL" || selectedHospital !== "ALL" || sortBy !== "experience") && (
              <button
                onClick={resetFilters}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-accent-primary)",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <RefreshCw size={12} /> Reset Filters
              </button>
            )}
          </div>
        </div>
      </InstrumentPanel>

      {/* 3. Doctors List / Grid */}
      {loading ? (
        <div
          style={{
            padding: "4rem 2rem",
            textAlign: "center",
            background: "var(--color-panel)",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <RefreshCw size={32} className="spin" style={{ color: "var(--color-accent-primary)", margin: "0 auto 1rem" }} />
          <p style={{ margin: 0, fontWeight: 500, color: "var(--color-ink-secondary)" }}>
            Searching UHIS Doctor Registry...
          </p>
        </div>
      ) : error ? (
        <div
          style={{
            padding: "2.5rem 2rem",
            textAlign: "center",
            background: "var(--color-signal-critical-bg)",
            border: "1px solid var(--color-signal-critical-border)",
            borderRadius: "12px",
            color: "var(--color-signal-critical)",
          }}
        >
          <AlertCircle size={32} style={{ margin: "0 auto 0.75rem" }} />
          <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>Error Loading Doctors</p>
          <p style={{ margin: "0 0 1rem", fontSize: "0.875rem" }}>{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchDoctors}>
            Retry Search
          </Button>
        </div>
      ) : doctors.length === 0 ? (
        <div
          style={{
            padding: "4rem 2rem",
            textAlign: "center",
            background: "var(--color-panel)",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <Stethoscope size={40} style={{ color: "var(--color-ink-muted)", margin: "0 auto 1rem" }} />
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", color: "var(--color-ink)" }}>
            No Doctors Found
          </h3>
          <p style={{ margin: "0 0 1.25rem", color: "var(--color-ink-secondary)", fontSize: "0.9rem" }}>
            No specialists match your current filter criteria. Try adjusting the doctor name or specialization.
          </p>
          <Button variant="secondary" size="sm" onClick={resetFilters}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {doctors.map((doc) => {
            const initials = doc.name
              .replace(/^Dr\.\s*/i, "")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={doc.id}
                className="instrument-panel hover-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-panel)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <div>
                  {/* Doctor Card Top */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
                    <div
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        flexShrink: 0,
                        boxShadow: "0 4px 10px rgba(37,99,235,0.2)",
                      }}
                    >
                      {initials}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          margin: "0 0 0.2rem",
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          color: "var(--color-ink)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {doc.name}
                      </h3>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "var(--color-accent-primary)",
                          marginBottom: "0.2rem",
                        }}
                      >
                        {doc.specialization}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-ink-muted)" }}>
                        {doc.qualification}
                      </div>
                    </div>
                  </div>

                  {/* Doctor Info Pill Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.5rem",
                      padding: "0.75rem",
                      background: "var(--color-surface)",
                      borderRadius: "8px",
                      marginBottom: "1rem",
                      fontSize: "0.8rem",
                    }}
                  >
                    <div>
                      <div style={{ color: "var(--color-ink-muted)", fontSize: "0.72rem", textTransform: "uppercase" }}>
                        Experience
                      </div>
                      <div style={{ fontWeight: 600, color: "var(--color-ink)", marginTop: "0.1rem" }}>
                        {doc.experienceYears > 0 ? `${doc.experienceYears} Years` : "Experienced"}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: "var(--color-ink-muted)", fontSize: "0.72rem", textTransform: "uppercase" }}>
                        Consultation Fee
                      </div>
                      <div style={{ fontWeight: 700, color: "#16A34A", marginTop: "0.1rem" }}>
                        ₹{doc.consultationFee}
                      </div>
                    </div>

                    <div style={{ gridColumn: "span 2" }}>
                      <div style={{ color: "var(--color-ink-muted)", fontSize: "0.72rem", textTransform: "uppercase" }}>
                        Hospital
                      </div>
                      <div
                        style={{
                          fontWeight: 500,
                          color: "var(--color-ink-secondary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          marginTop: "0.1rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Building2 size={12} />
                        {doc.hospital?.name || "UHIS Partner Hospital"}
                      </div>
                    </div>
                  </div>

                  {/* Earliest Availability Indicator */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.78rem",
                      color: "var(--color-ink-secondary)",
                      marginBottom: "1rem",
                    }}
                  >
                    <Clock size={13} color="var(--color-accent-primary)" />
                    <span>Next Slot: </span>
                    <strong style={{ color: "var(--color-ink)" }}>{doc.nextAvailable}</strong>
                  </div>
                </div>

                {/* Doctor Action Buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                  <Button variant="secondary" size="sm" onClick={() => handleOpenProfile(doc)}>
                    View Profile
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleStartBooking(doc)}>
                    Book Slot
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Doctor Profile Modal */}
      {selectedDoctorForProfile && (
        <Modal
          isOpen={!!selectedDoctorForProfile}
          onClose={() => setSelectedDoctorForProfile(null)}
          title={selectedDoctorForProfile.name}
          subtitle={selectedDoctorForProfile.specialization.toUpperCase()}
          width="620px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {doctorProfileLoading ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <RefreshCw size={24} className="spin" style={{ color: "var(--color-accent-primary)", margin: "0 auto 0.5rem" }} />
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-ink-muted)" }}>Loading clinician dossier...</p>
              </div>
            ) : (
              <>
                {/* Profile Header Block */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.25rem",
                    padding: "1rem",
                    background: "var(--color-surface)",
                    borderRadius: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "12px",
                      background: "var(--color-accent-primary)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.4rem",
                      fontWeight: 700,
                    }}
                  >
                    {selectedDoctorForProfile.name
                      .replace(/^Dr\.\s*/i, "")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-ink)" }}>
                      {selectedDoctorForProfile.name}
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-accent-primary)" }}>
                      {selectedDoctorForProfile.specialization} · {selectedDoctorForProfile.qualification}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-ink-secondary)", marginTop: "0.2rem" }}>
                      Experience: {selectedDoctorForProfile.experienceYears} Years · License:{" "}
                      {doctorProfileData?.licenseNumber || "NMC-VERIFIED"}
                    </div>
                  </div>
                </div>

                {/* Hospital & Location Details */}
                <div style={{ padding: "0.85rem", border: "1px solid var(--color-border)", borderRadius: "8px" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Building2 size={15} color="var(--color-accent-primary)" />
                    Associated Healthcare Facility
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-ink)" }}>
                    <strong>{selectedDoctorForProfile.hospital?.name || "UHIS Partner Hospital"}</strong>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-ink-secondary)", marginTop: "0.2rem" }}>
                    {selectedDoctorForProfile.hospital?.address || "Medical Campus"}, {selectedDoctorForProfile.hospital?.city || ""}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#16A34A", fontWeight: 600, marginTop: "0.4rem" }}>
                    Consultation Fee: ₹{selectedDoctorForProfile.consultationFee}
                  </div>
                </div>

                {/* Available Upcoming Dates Preview */}
                {doctorProfileData?.availableDates && doctorProfileData.availableDates.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--color-ink)" }}>
                      Upcoming Availability
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {doctorProfileData.availableDates.slice(0, 7).map((d) => (
                        <div
                          key={d.date}
                          style={{
                            padding: "0.4rem 0.65rem",
                            borderRadius: "6px",
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            fontSize: "0.75rem",
                            textAlign: "center",
                          }}
                        >
                          <div style={{ fontWeight: 600, color: "var(--color-ink)" }}>{d.date}</div>
                          <div style={{ color: "#16A34A", fontSize: "0.7rem" }}>{d.availableSlotsCount} slots</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <Button variant="secondary" onClick={() => setSelectedDoctorForProfile(null)}>
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      const doc = selectedDoctorForProfile;
                      handleStartBooking(doc);
                    }}
                  >
                    Proceed to Book Appointment
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* 5. Booking Flow Modal */}
      {bookingDoctor && (
        <Modal
          isOpen={!!bookingDoctor}
          onClose={() => setBookingDoctor(null)}
          title={
            bookingStep === 1
              ? `Select Slot · ${bookingDoctor.name}`
              : bookingStep === 2
              ? "Review & Confirm Appointment"
              : "Booking Confirmed"
          }
          subtitle={
            bookingStep === 1
              ? "STEP 1 OF 2 · SCHEDULE SELECTION"
              : bookingStep === 2
              ? "STEP 2 OF 2 · CLINICAL APPOINTMENT VERIFICATION"
              : "TOKEN ASSIGNED · AUTOMATIC QUEUE REGISTRATION"
          }
          width="640px"
        >
          {/* STEP 1: Select Date & Available Slot */}
          {bookingStep === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Doctor Mini Banner */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  background: "var(--color-surface)",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                }}
              >
                <div>
                  <strong>{bookingDoctor.name}</strong> ({bookingDoctor.specialization})
                  <div style={{ fontSize: "0.78rem", color: "var(--color-ink-secondary)" }}>
                    {bookingDoctor.hospital?.name} · Fee: ₹{bookingDoctor.consultationFee}
                  </div>
                </div>
              </div>

              {/* Date Carousel / Pill Selector */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "0.5rem" }}>
                  Select Consultation Date
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    overflowX: "auto",
                    paddingBottom: "0.5rem",
                  }}
                >
                  {upcomingDays.map((d) => {
                    const isSelected = selectedDate === d.iso;
                    return (
                      <button
                        key={d.iso}
                        onClick={() => handleDateChange(d.iso)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "8px",
                          border: isSelected ? "2px solid var(--color-accent-primary)" : "1px solid var(--color-border)",
                          background: isSelected ? "rgba(37,99,235,0.08)" : "var(--color-panel)",
                          cursor: "pointer",
                          minWidth: "64px",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span style={{ fontSize: "0.7rem", color: isSelected ? "var(--color-accent-primary)" : "var(--color-ink-muted)", fontWeight: 600 }}>
                          {d.dayName}
                        </span>
                        <span style={{ fontSize: "1.1rem", fontWeight: 700, color: isSelected ? "var(--color-accent-primary)" : "var(--color-ink)" }}>
                          {d.dayNum}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: isSelected ? "var(--color-accent-primary)" : "var(--color-ink-muted)" }}>
                          {d.monthName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Grid */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-ink)" }}>
                    Available Time Slots ({selectedDate})
                  </label>
                  {slotsLoading && <RefreshCw size={13} className="spin" color="var(--color-accent-primary)" />}
                </div>

                {slotsLoading ? (
                  <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-ink-muted)", fontSize: "0.85rem" }}>
                    Fetching available doctor slots...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div
                    style={{
                      padding: "1.5rem",
                      textAlign: "center",
                      background: "var(--color-surface)",
                      borderRadius: "8px",
                      border: "1px dashed var(--color-border)",
                      color: "var(--color-ink-secondary)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <Clock size={24} style={{ color: "var(--color-ink-muted)", margin: "0 auto 0.5rem" }} />
                    No appointments currently available for this date.
                    <div style={{ fontSize: "0.78rem", color: "var(--color-ink-muted)", marginTop: "0.2rem" }}>
                      Please select another date above to view open OPD consultation slots.
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                      gap: "0.5rem",
                      maxHeight: "180px",
                      overflowY: "auto",
                      paddingRight: "0.25rem",
                    }}
                  >
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            padding: "0.55rem 0.5rem",
                            borderRadius: "6px",
                            border: isSelected ? "2px solid var(--color-accent-primary)" : "1px solid var(--color-border)",
                            background: isSelected ? "var(--color-accent-primary)" : "var(--color-surface)",
                            color: isSelected ? "#fff" : "var(--color-ink)",
                            fontWeight: 600,
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {slot.startTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Chief Complaint / Consultation Reason */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "0.4rem" }}>
                  Reason for Visit / Symptoms (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Routine health checkup, persistent cough, follow-up..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem",
                    fontSize: "0.85rem",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-ink)",
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>

              {/* Step 1 Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <Button variant="secondary" onClick={() => setBookingDoctor(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={!selectedSlot}
                  onClick={() => setBookingStep(2)}
                >
                  Review Details <ArrowRight size={14} style={{ marginLeft: "0.3rem" }} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Review Booking Details */}
          {bookingStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div
                style={{
                  padding: "1.25rem",
                  background: "var(--color-surface)",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                  fontSize: "0.875rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.6rem" }}>
                  <span style={{ color: "var(--color-ink-muted)" }}>Doctor</span>
                  <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>
                    {bookingDoctor.name} ({bookingDoctor.specialization})
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.6rem" }}>
                  <span style={{ color: "var(--color-ink-muted)" }}>Healthcare Facility</span>
                  <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>
                    {bookingDoctor.hospital?.name}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.6rem" }}>
                  <span style={{ color: "var(--color-ink-muted)" }}>Date & Time</span>
                  <span style={{ fontWeight: 600, color: "var(--color-accent-primary)" }}>
                    {selectedDate} at {selectedSlot?.startTime}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.6rem" }}>
                  <span style={{ color: "var(--color-ink-muted)" }}>Reason</span>
                  <span style={{ fontWeight: 500, color: "var(--color-ink)" }}>
                    {reason.trim() || "OPD Clinical Consultation"}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.2rem" }}>
                  <span style={{ color: "var(--color-ink-muted)" }}>Consultation Fee</span>
                  <span style={{ fontWeight: 700, color: "#16A34A", fontSize: "1rem" }}>
                    ₹{bookingDoctor.consultationFee}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.8rem",
                  color: "var(--color-ink-secondary)",
                  background: "rgba(37,99,235,0.06)",
                  padding: "0.75rem",
                  borderRadius: "8px",
                }}
              >
                <ShieldCheck size={16} color="var(--color-accent-primary)" />
                <span>
                  By confirming, you will be issued an official OPD queue token number and registered in Dr. {bookingDoctor.name}'s daily consultation queue.
                </span>
              </div>

              {/* Step 2 Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <Button variant="secondary" disabled={isBookingSubmitting} onClick={() => setBookingStep(1)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  disabled={isBookingSubmitting}
                  onClick={handleConfirmBooking}
                  style={{ minWidth: "140px" }}
                >
                  {isBookingSubmitting ? (
                    <>
                      <RefreshCw size={14} className="spin" style={{ marginRight: "0.4rem" }} /> Reserving Slot...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Booking Confirmed Screen */}
          {bookingStep === 3 && confirmedBookingData && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "1rem 0" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "#F0FDF4",
                  border: "2px solid #BBF7D0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#16A34A",
                  marginBottom: "1rem",
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--color-ink)", margin: "0 0 0.35rem" }}>
                Appointment Confirmed!
              </h2>
              <p style={{ margin: "0 0 1.25rem", color: "var(--color-ink-secondary)", fontSize: "0.9rem" }}>
                Your appointment is recorded and you have been registered in the doctor's queue.
              </p>

              {/* Queue Token Badge */}
              <div
                style={{
                  padding: "1rem 1.75rem",
                  background: "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(14,165,233,0.08) 100%)",
                  border: "1.5px solid var(--color-accent-primary)",
                  borderRadius: "12px",
                  marginBottom: "1.25rem",
                  width: "100%",
                  maxWidth: "380px",
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-accent-primary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Your Assigned OPD Queue Token
                </div>
                <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--color-ink)", margin: "0.2rem 0" }}>
                  {confirmedBookingData.tokenNumber}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-ink-secondary)" }}>
                  Queue Position #{confirmedBookingData.queueNumber} · Status: <strong>BOOKED</strong>
                </div>
              </div>

              {/* Appointment Summary Box */}
              <div
                style={{
                  width: "100%",
                  maxWidth: "460px",
                  background: "var(--color-surface)",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  padding: "0.85rem 1rem",
                  fontSize: "0.82rem",
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <span style={{ color: "var(--color-ink-muted)" }}>Appointment Ref: </span>
                  <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{confirmedBookingData.appointment?.id}</span>
                </div>
                <div>
                  <span style={{ color: "var(--color-ink-muted)" }}>Clinician: </span>
                  <strong>{bookingDoctor.name}</strong> ({bookingDoctor.specialization})
                </div>
                <div>
                  <span style={{ color: "var(--color-ink-muted)" }}>Hospital: </span>
                  {bookingDoctor.hospital?.name}
                </div>
                <div>
                  <span style={{ color: "var(--color-ink-muted)" }}>Date & Time: </span>
                  <strong style={{ color: "var(--color-accent-primary)" }}>
                    {confirmedBookingData.slotDate} at {confirmedBookingData.timeSlot}
                  </strong>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.75rem", width: "100%", justifyContent: "center" }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setBookingDoctor(null);
                    fetchDoctors();
                  }}
                >
                  Find Another Doctor
                </Button>
                {onNavigateToAppointments && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setBookingDoctor(null);
                      onNavigateToAppointments();
                    }}
                  >
                    View My Appointments
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
