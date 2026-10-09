import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  LogOut,
  ChevronDown,
  HeartPulse,
  X,
  LayoutGrid,
  Sun,
  Moon,
  PanelLeft,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useTheme } from "../../context/ThemeContext";

const ROLE_LABELS = {
  patient: "Patient",
  doctor: "Clinician",
  admin: "Hospital Admin",
  superadmin: "System Admin",
  lab: "Lab Specialist",
  pharmacy: "Pharmacist",
  receptionist: "Receptionist",
};

const ROLE_COLORS = {
  patient: "#16A34A",
  doctor: "#2563EB",
  admin: "#D97706",
  superadmin: "#7C3AED",
  lab: "#0EA5E9",
  pharmacy: "#DC2626",
  receptionist: "#0F766E",
};

function sanitizeLabel(label) {
  if (!label) return "";
  return label
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ""
    )
    .trim();
}

export default function AppHeader({
  tabs,
  activeTab,
  onTabChange,
  isSidebarCollapsed,
  onToggleSidebar,
}) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "/" || e.key === "k")) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    toast.info("You have been signed out.");
    navigate("/");
  };

  const displayName = user?.name || user?.fullName || "User";
  const initials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const userRole = (user?.role || "patient").toLowerCase();
  const roleColor = user ? ROLE_COLORS[userRole] || "#2563EB" : "#2563EB";

  const notifications = [
    { id: 1, title: "Lab Report Ready", time: "10m ago", type: "normal" },
    { id: 2, title: "OPD Appointment Confirmed", time: "1h ago", type: "info" },
    { id: 3, title: "Due Immunization Reminder", time: "1d ago", type: "warning" },
  ];

  return (
    <header
      style={{
        background: "var(--color-panel)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "var(--shadow-xs)",
      }}
    >
      {/* Main navigation bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.25rem",
          height: "56px",
          gap: "1rem",
        }}
      >
        {/* Left: Sidebar toggle + Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                padding: "0.4rem",
                color: "var(--color-ink-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 120ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-surface-alt)";
                e.currentTarget.style.color = "var(--color-ink)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--color-ink-secondary)";
              }}
            >
              <PanelLeft size={16} />
            </button>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              cursor: "pointer",
            }}
            onClick={() => navigate(user ? "/dashboard" : "/")}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "var(--color-accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <HeartPulse size={16} color="white" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: "1rem",
                  letterSpacing: "-0.02em",
                  color: "var(--color-ink)",
                }}
              >
                UHIS
              </span>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  fontSize: "0.625rem",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--color-ink-muted)",
                }}
              >
                Healthcare
              </span>
            </div>
          </div>
        </div>

        {/* Center: Global Search */}
        <div style={{ flex: 1, maxWidth: "380px" }}>
          {searchOpen ? (
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-ink-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                autoFocus
                className="precision-input"
                style={{ paddingLeft: "2.25rem", paddingRight: "2.25rem", height: "36px" }}
                placeholder="Search patient, ID, records, ICD..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onBlur={() => {
                  setSearchOpen(false);
                  setSearchValue("");
                }}
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchValue("");
                }}
                style={{
                  position: "absolute",
                  right: "0.625rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-ink-muted)",
                  padding: 0,
                  display: "flex",
                }}
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "var(--color-surface-alt)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                padding: "0.4rem 0.75rem",
                cursor: "pointer",
                width: "100%",
                height: "36px",
                transition: "all 120ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-border-deep)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            >
              <Search size={14} style={{ color: "var(--color-ink-muted)", flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.8125rem",
                  color: "var(--color-ink-muted)",
                }}
              >
                Search records, patients...
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  color: "var(--color-ink-muted)",
                  background: "var(--color-panel)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  padding: "0.1rem 0.35rem",
                }}
              >
                Ctrl /
              </span>
            </button>
          )}
        </div>

        {/* Right actions: Portals, Theme, Notifications, User */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          {/* Switch Portal Button */}
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "var(--color-surface-alt)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              padding: "0.4rem 0.75rem",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--color-ink-secondary)",
              height: "36px",
              transition: "all 120ms ease",
            }}
            title="Switch Healthcare Portal"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-panel)";
              e.currentTarget.style.borderColor = "var(--color-border-deep)";
              e.currentTarget.style.color = "var(--color-ink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-surface-alt)";
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.color = "var(--color-ink-secondary)";
            }}
          >
            <LayoutGrid size={14} />
            <span>Portals</span>
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? "Light" : "Dark"} mode`}
            title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              padding: "0.4rem",
              color: "var(--color-ink-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "36px",
              width: "36px",
              transition: "all 120ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-surface-alt)";
              e.currentTarget.style.color = "var(--color-ink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-ink-secondary)";
            }}
          >
            {isDark ? <Sun size={15} color="#F59E0B" /> : <Moon size={15} />}
          </button>

          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                padding: "0.4rem",
                color: "var(--color-ink-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "36px",
                width: "36px",
                position: "relative",
                transition: "all 120ms ease",
              }}
              aria-label="Notifications"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-surface-alt)";
                e.currentTarget.style.color = "var(--color-ink)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--color-ink-secondary)";
              }}
            >
              <Bell size={15} />
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  background: "var(--color-accent-primary)",
                  color: "white",
                  fontSize: "8px",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontFamily: "var(--font-sans)",
                }}
              >
                3
              </span>
            </button>

            {notificationsOpen && (
              <div
                className="instrument-panel fade-in"
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  minWidth: "280px",
                  zIndex: 200,
                  boxShadow: "var(--shadow-dropdown)",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span className="type-heading" style={{ fontSize: "0.85rem" }}>
                    Notifications
                  </span>
                  <span className="status-info" style={{ fontSize: "0.65rem" }}>
                    3 Updates
                  </span>
                </div>
                <div>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: "0.75rem 1rem",
                        borderBottom: "1px solid var(--color-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
                      <span className="type-value" style={{ fontSize: "0.8125rem" }}>
                        {n.title}
                      </span>
                      <span className="type-micro">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User profile menu */}
          {user && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--color-surface-alt)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  padding: "0.25rem 0.625rem 0.25rem 0.35rem",
                  cursor: "pointer",
                  height: "36px",
                  transition: "all 120ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-border-deep)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "4px",
                    background: roleColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    fontFamily: "var(--font-heading)",
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.1 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      color: "var(--color-ink)",
                    }}
                  >
                    {displayName.split(" ")[0]}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.65rem",
                      color: roleColor,
                      fontWeight: 500,
                    }}
                  >
                    {ROLE_LABELS[userRole] || userRole}
                  </span>
                </div>
                <ChevronDown size={12} style={{ color: "var(--color-ink-muted)", marginLeft: "2px" }} />
              </button>

              {userMenuOpen && (
                <div
                  className="instrument-panel fade-in"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    minWidth: "220px",
                    zIndex: 200,
                    boxShadow: "var(--shadow-dropdown)",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--color-border)" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "var(--color-ink)",
                        marginBottom: "2px",
                      }}
                    >
                      {displayName}
                    </div>
                    <div className="type-micro">{user.email}</div>
                    <div style={{ marginTop: "6px" }}>
                      <span className="status-info" style={{ fontSize: "0.6875rem" }}>
                        {ROLE_LABELS[userRole] || userRole}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: "0.375rem" }}>
                    <button
                      onClick={() => {
                        navigate("/dashboard");
                        setUserMenuOpen(false);
                      }}
                      style={{
                        display: "flex",
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        gap: "0.5rem",
                        alignItems: "center",
                        borderRadius: "4px",
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.8125rem",
                        color: "var(--color-ink-secondary)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-alt)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <LayoutGrid size={14} />
                      Switch Portal
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setUserMenuOpen(false);
                      }}
                      style={{
                        display: "flex",
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        gap: "0.5rem",
                        alignItems: "center",
                        borderRadius: "4px",
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.8125rem",
                        color: "var(--color-signal-critical)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-signal-critical-bg)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Secondary desktop tab strip for direct quick access */}
      {tabs && tabs.length > 0 && (
        <div
          style={{
            display: "flex",
            borderTop: "1px solid var(--color-border)",
            overflowX: "auto",
            padding: "0 1.25rem",
            background: "var(--color-panel)",
            gap: "0.25rem",
            scrollbarWidth: "none",
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isEmergency = tab.id === "emergency";
            const clean = sanitizeLabel(tab.label);

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={isActive ? "channel-tab-active" : "channel-tab-inactive"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.6rem 0.75rem",
                  background: "none",
                  border: "none",
                  borderBottom: isActive
                    ? `2px solid ${isEmergency ? "var(--color-signal-critical)" : "var(--color-accent-primary)"}`
                    : "2px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.8125rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive
                    ? isEmergency
                      ? "var(--color-signal-critical)"
                      : "var(--color-accent-primary)"
                    : "var(--color-ink-secondary)",
                  transition: "all 120ms ease",
                }}
              >
                {isEmergency && <AlertTriangle size={13} style={{ color: "var(--color-signal-critical)" }} />}
                {clean}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
