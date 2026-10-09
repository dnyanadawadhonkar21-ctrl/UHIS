import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  Stethoscope,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Hash,
  FileText,
  User,
} from "lucide-react";
import InstrumentPanel from "../ui/InstrumentPanel";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import StatusCode from "../ui/StatusCode";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";

export default function MyAppointmentsView({ onBookNewAppointment }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("upcoming"); // upcoming, past, cancelled
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState({
    upcoming: [],
    past: [],
    cancelled: [],
  });

  // Cancel Appointment Confirmation Modal State
  const [selectedApptForCancel, setSelectedApptForCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/patients/appointments");
      if (res.data?.success && res.data.grouped) {
        setAppointments(res.data.grouped);
      }
    } catch (err) {
      console.error("Failed to fetch patient appointments:", err);
      toast.error("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedApptForCancel) return;
    try {
      setIsCancelling(true);
      const res = await api.put(`/patients/appointments/${selectedApptForCancel.id}/cancel`);
      if (res.data?.success) {
        toast.success("Appointment cancelled successfully and slot released.");
        setSelectedApptForCancel(null);
        await fetchAppointments();
        // Notify Doctor Dashboard to refresh queue immediately
        localStorage.setItem('uhis_last_booking', Date.now().toString());
        window.dispatchEvent(new CustomEvent('uhis_booking_updated'));
      } else {
        toast.error(res.data?.message || "Failed to cancel appointment.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to cancel appointment.");
    } finally {
      setIsCancelling(false);
    }
  };

  const currentList = appointments[activeTab] || [];

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
              My Consultations
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--color-ink-muted)" }}>
              Patient Portal OPD Tracking
            </span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>
            My Appointments
          </h1>
          <p style={{ margin: "0.35rem 0 0", color: "var(--color-ink-secondary)", fontSize: "0.95rem" }}>
            View your scheduled doctor visits, live OPD queue tokens, and consultation history.
          </p>
        </div>

        {onBookNewAppointment && (
          <Button
            variant="primary"
            onClick={onBookNewAppointment}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Plus size={16} />
            Book New Appointment
          </Button>
        )}
      </div>

      {/* 2. Tabs Selector */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem" }}>
        <button
          onClick={() => setActiveTab("upcoming")}
          style={{
            padding: "0.6rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: "8px",
            border: "none",
            background: activeTab === "upcoming" ? "var(--color-accent-primary)" : "transparent",
            color: activeTab === "upcoming" ? "#fff" : "var(--color-ink-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            transition: "all 0.15s ease",
          }}
        >
          Upcoming ({appointments.upcoming?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("past")}
          style={{
            padding: "0.6rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: "8px",
            border: "none",
            background: activeTab === "past" ? "var(--color-accent-primary)" : "transparent",
            color: activeTab === "past" ? "#fff" : "var(--color-ink-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            transition: "all 0.15s ease",
          }}
        >
          Past / Completed ({appointments.past?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("cancelled")}
          style={{
            padding: "0.6rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: "8px",
            border: "none",
            background: activeTab === "cancelled" ? "var(--color-accent-primary)" : "transparent",
            color: activeTab === "cancelled" ? "#fff" : "var(--color-ink-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            transition: "all 0.15s ease",
          }}
        >
          Cancelled ({appointments.cancelled?.length || 0})
        </button>
      </div>

      {/* 3. Appointments List */}
      {loading ? (
        <div
          style={{
            padding: "3rem",
            textAlign: "center",
            background: "var(--color-panel)",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <RefreshCw size={28} className="spin" style={{ color: "var(--color-accent-primary)", margin: "0 auto 0.75rem" }} />
          <p style={{ margin: 0, color: "var(--color-ink-muted)", fontSize: "0.9rem" }}>Loading appointments...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div
          style={{
            padding: "3.5rem 2rem",
            textAlign: "center",
            background: "var(--color-panel)",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <Calendar size={36} style={{ color: "var(--color-ink-muted)", margin: "0 auto 0.75rem" }} />
          <h3 style={{ margin: "0 0 0.4rem", fontSize: "1.05rem", color: "var(--color-ink)" }}>
            No {activeTab} appointments found
          </h3>
          <p style={{ margin: "0 0 1.25rem", color: "var(--color-ink-secondary)", fontSize: "0.875rem" }}>
            {activeTab === "upcoming"
              ? "You have no upcoming consultations scheduled."
              : activeTab === "past"
              ? "No past consultations recorded on this account."
              : "No cancelled appointments on record."}
          </p>
          {activeTab === "upcoming" && onBookNewAppointment && (
            <Button variant="primary" size="sm" onClick={onBookNewAppointment}>
              Find a Doctor & Book
            </Button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {currentList.map((appt) => {
            const isCancelled = appt.status === "CANCELLED";
            const isCompleted = appt.status === "COMPLETED";

            return (
              <div
                key={appt.id}
                className="instrument-panel"
                style={{
                  padding: "1.25rem",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-panel)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                  {/* Doctor Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        background: isCancelled ? "var(--color-surface-alt)" : "rgba(37,99,235,0.1)",
                        color: isCancelled ? "var(--color-ink-muted)" : "var(--color-accent-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "1rem",
                      }}
                    >
                      <Stethoscope size={20} />
                    </div>

                    <div>
                      <h3 style={{ margin: "0 0 0.15rem", fontSize: "1.05rem", fontWeight: 700, color: "var(--color-ink)" }}>
                        {appt.doctor?.name}
                      </h3>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-accent-primary)" }}>
                        {appt.doctor?.specialization} · {appt.doctor?.qualification}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-ink-muted)", marginTop: "0.15rem" }}>
                        {appt.doctor?.hospitalName}
                      </div>
                    </div>
                  </div>

                  {/* Token & Status Badges */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {appt.tokenNumber && !isCancelled && (
                      <div
                        style={{
                          padding: "0.35rem 0.75rem",
                          borderRadius: "8px",
                          background: "rgba(37,99,235,0.1)",
                          border: "1px solid rgba(37,99,235,0.25)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          fontWeight: 700,
                          fontSize: "0.875rem",
                          color: "var(--color-accent-primary)",
                        }}
                      >
                        <Hash size={13} />
                        Token: {appt.tokenNumber}
                      </div>
                    )}

                    <span
                      style={{
                        padding: "0.3rem 0.65rem",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        background: isCancelled
                          ? "var(--color-signal-critical-bg)"
                          : isCompleted
                          ? "var(--color-signal-normal-bg)"
                          : "var(--color-signal-info-bg)",
                        color: isCancelled
                          ? "var(--color-signal-critical)"
                          : isCompleted
                          ? "var(--color-signal-normal)"
                          : "var(--color-signal-info)",
                        border: isCancelled
                          ? "1px solid var(--color-signal-critical-border)"
                          : isCompleted
                          ? "1px solid var(--color-signal-normal-border)"
                          : "1px solid var(--color-signal-info-border)",
                      }}
                    >
                      {appt.status}
                    </span>
                  </div>
                </div>

                {/* Details Bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.5rem",
                    padding: "0.6rem 0.85rem",
                    background: "var(--color-surface)",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    color: "var(--color-ink-secondary)",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Calendar size={14} color="var(--color-accent-primary)" />
                    <span>Date: <strong>{appt.date}</strong></span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Clock size={14} color="var(--color-accent-primary)" />
                    <span>Time: <strong>{appt.timeSlot}</strong></span>
                  </div>

                  {appt.reason && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <FileText size={14} color="var(--color-ink-muted)" />
                      <span>Reason: {appt.reason}</span>
                    </div>
                  )}

                  {appt.doctor?.consultationFee && (
                    <div style={{ marginLeft: "auto", fontWeight: 600, color: "#16A34A" }}>
                      Fee: ₹{appt.doctor.consultationFee}
                    </div>
                  )}
                </div>

                {/* Footer Action Bar */}
                {appt.canCancel && (
                  <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.25rem" }}>
                    <button
                      onClick={() => setSelectedApptForCancel(appt)}
                      style={{
                        background: "none",
                        border: "1px solid var(--color-signal-critical-border)",
                        color: "var(--color-signal-critical)",
                        padding: "0.35rem 0.75rem",
                        borderRadius: "6px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <XCircle size={13} />
                      Cancel Appointment
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Cancel Appointment Confirmation Modal */}
      {selectedApptForCancel && (
        <Modal
          isOpen={!!selectedApptForCancel}
          onClose={() => setSelectedApptForCancel(null)}
          title="Cancel Appointment"
          subtitle="CONFIRMATION REQUIRED"
          width="480px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-ink-secondary)" }}>
              Are you sure you want to cancel your appointment with{" "}
              <strong>{selectedApptForCancel.doctor?.name}</strong> on{" "}
              <strong>{selectedApptForCancel.date}</strong> at{" "}
              <strong>{selectedApptForCancel.timeSlot}</strong>?
            </p>

            <div
              style={{
                padding: "0.75rem",
                borderRadius: "8px",
                background: "var(--color-signal-warning-bg)",
                border: "1px solid var(--color-signal-warning-border)",
                fontSize: "0.8rem",
                color: "var(--color-signal-warning)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <AlertCircle size={15} />
              Cancelling will release your OPD queue token and free this slot for other patients.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button variant="secondary" disabled={isCancelling} onClick={() => setSelectedApptForCancel(null)}>
                Keep Appointment
              </Button>
              <Button
                variant="critical"
                disabled={isCancelling}
                onClick={handleCancelAppointment}
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel Appointment"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
