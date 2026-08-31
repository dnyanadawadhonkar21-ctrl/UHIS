import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, LogOut, ChevronDown, HeartPulse, X, LayoutGrid } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

interface Tab {
  id: string;
  label: string;
  path?: string;
}

interface AppHeaderProps {
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  patient:      "Patient",
  doctor:       "Clinician",
  admin:        "Hospital Admin",
  superadmin:   "System Admin",
  lab:          "Lab",
  pharmacy:     "Pharmacy",
  receptionist: "Reception",
};

const ROLE_COLORS: Record<string, string> = {
  patient:      "#16A34A",
  doctor:       "#2563EB",
  admin:        "#D97706",
  superadmin:   "#7C3AED",
  lab:          "#0EA5E9",
  pharmacy:     "#DC2626",
  receptionist: "#0F766E",
};

export default function AppHeader({ tabs, activeTab, onTabChange }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info("You have been signed out.");
    navigate("/");
  };

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const roleColor = user ? (ROLE_COLORS[user.role] || "#2563EB") : "#2563EB";

  return (
    <header
      style={{
        background: "var(--color-panel)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Main nav bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          height: "58px",
          gap: "1rem",
        }}
      >
        {/* Wordmark */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexShrink: 0, cursor: "pointer" }}
          onClick={() => navigate(user ? "/dashboard" : "/")}
        >
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
            <HeartPulse size={16} color="white" />
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
        </div>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: "340px" }}>
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
                style={{ paddingLeft: "2.25rem", paddingRight: "2.25rem" }}
                placeholder="Search records, patients, ICD codes..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onBlur={() => { setSearchOpen(false); setSearchValue(""); }}
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchValue(""); }}
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
                border: "1.5px solid var(--color-border)",
                borderRadius: "8px",
                padding: "0.45rem 0.875rem",
                cursor: "pointer",
                width: "100%",
              }}
            >
              <Search size={13} style={{ color: "var(--color-ink-muted)" }} />
              <span className="type-body" style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)" }}>
                Search records...
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.65rem",
                  color: "var(--color-ink-muted)",
                  background: "var(--color-panel)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  padding: "0.1rem 0.35rem",
                }}
              >
                ⌘/
              </span>
            </button>
          )}
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          {/* Notification */}
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-ink-secondary)",
              position: "relative",
              padding: "0.375rem",
              borderRadius: "8px",
              display: "flex",
            }}
          >
            <Bell size={18} />
            <span
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                background: "var(--color-signal-warning)",
                color: "white",
                fontSize: "9px",
                width: "14px",
                height: "14px",
                borderRadius: "99px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                border: "1.5px solid var(--color-panel)",
              }}
            >
              3
            </span>
          </button>

          {/* User menu */}
          {user && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--color-surface-alt)",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: "8px",
                  padding: "0.3rem 0.625rem 0.3rem 0.35rem",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "6px",
                    background: roleColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "1px" }}>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      color: "var(--color-ink)",
                      lineHeight: 1,
                    }}
                  >
                    {user.name.split(" ")[0]}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.65rem",
                      color: roleColor,
                      fontWeight: 500,
                      lineHeight: 1,
                    }}
                  >
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
                <ChevronDown size={13} style={{ color: "var(--color-ink-muted)", marginLeft: "2px" }} />
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
                  }}
                >
                  <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--color-border)" }}>
                    <div
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        color: "var(--color-ink)",
                        marginBottom: "2px",
                      }}
                    >
                      {user.name}
                    </div>
                    <div className="type-micro">{user.email}</div>
                    <div style={{ marginTop: "6px" }}>
                      <span
                        className="status-info"
                        style={{ fontSize: "0.65rem" }}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: "0.375rem" }}>
                    <button
                      onClick={() => { navigate("/dashboard"); setUserMenuOpen(false); }}
                      style={{
                        display: "flex",
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        gap: "0.5rem",
                        alignItems: "center",
                        borderRadius: "6px",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.85rem",
                        color: "var(--color-ink-secondary)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-alt)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <LayoutGrid size={14} />
                      Switch Portal
                    </button>
                    <button
                      onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                      style={{
                        display: "flex",
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        gap: "0.5rem",
                        alignItems: "center",
                        borderRadius: "6px",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.85rem",
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

      {/* Tab strip */}
      {tabs && tabs.length > 0 && (
        <div
          style={{
            display: "flex",
            borderTop: "1px solid var(--color-border)",
            overflowX: "auto",
            padding: "0 1.5rem",
            background: "var(--color-panel)",
            gap: "0.25rem",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={activeTab === tab.id ? "channel-tab-active" : "channel-tab-inactive"}
              style={{
                padding: "0.65rem 0.875rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.82rem",
                fontWeight: activeTab === tab.id ? 600 : 500,
                transition: "all 120ms ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
