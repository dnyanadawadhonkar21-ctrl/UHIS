import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  UserCheck,
  Calendar,
  FileText,
  AlertTriangle,
  Activity,
  Pill,
  FlaskConical,
  Clock,
  Syringe,
  FileSpreadsheet,
  Scan,
  AlertCircle,
  Sparkles,
  User,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Lock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Map tab IDs to Lucide icons
const TAB_ICONS = {
  overview: LayoutDashboard,
  queue: Users,
  consultation: Stethoscope,
  "find-doctor": UserCheck,
  appointments: Calendar,
  records: FileText,
  emergency: AlertTriangle,
  conditions: Activity,
  medications: Pill,
  labs: FlaskConical,
  visits: Clock,
  vaccinations: Syringe,
  symptom: Activity,
  explainer: FileSpreadsheet,
  ddi: AlertCircle,
  ocr: Scan,
  analytics: Activity,
  settings: LayoutGrid,
  audit: ShieldCheck,
  hospitals: Building2,
};

// Clean emoji out of tab labels
function sanitizeLabel(label) {
  if (!label) return "";
  return label
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ""
    )
    .trim();
}

export default function AppSidebar({
  isCollapsed,
  onToggleCollapse,
  tabs,
  activeTab,
  onTabChange,
}) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  // Platform portals
  const portalLinks = [
    { name: "Patient Portal", path: "/patient-dashboard", icon: User },
    { name: "Doctor OPD", path: "/doctor-dashboard", icon: Stethoscope },
    { name: "AI Clinical Suite", path: "/ai-suite", icon: Sparkles },
    { name: "Medical Records", path: "/medical-records", icon: FileText },
    { name: "Portal Switcher", path: "/dashboard", icon: LayoutGrid },
  ];

  return (
    <aside
      className={`uhis-sidebar ${isCollapsed ? "is-collapsed" : "is-expanded"}`}
      style={{
        width: isCollapsed ? "64px" : "240px",
        minWidth: isCollapsed ? "64px" : "240px",
        transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        background: "var(--color-panel)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        userSelect: "none",
        zIndex: 50,
      }}
      aria-label="Navigation Sidebar"
    >
      <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden", flex: 1 }}>
        {/* Section 1: Active Workspace Tabs */}
        {tabs && tabs.length > 0 && (
          <div style={{ padding: isCollapsed ? "0.75rem 0.35rem" : "1rem 0.75rem" }}>
            {!isCollapsed && (
              <div
                className="type-label"
                style={{
                  padding: "0 0.5rem 0.5rem",
                  color: "var(--color-ink-muted)",
                  fontSize: "0.6875rem",
                  letterSpacing: "0.06em",
                }}
              >
                Workspace Navigation
              </div>
            )}
            <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {tabs.map((tab) => {
                const IconComponent = TAB_ICONS[tab.id] || FileText;
                const isActive = activeTab === tab.id;
                const labelClean = sanitizeLabel(tab.label);
                const isEmergency = tab.id === "emergency";

                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    title={isCollapsed ? labelClean : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: isCollapsed ? 0 : "0.75rem",
                      justifyContent: isCollapsed ? "center" : "flex-start",
                      padding: isCollapsed ? "0.65rem 0" : "0.55rem 0.75rem",
                      borderRadius: "6px",
                      border: "none",
                      background: isActive
                        ? isEmergency
                          ? "var(--color-signal-critical-bg)"
                          : "var(--color-accent-soft)"
                        : "transparent",
                      color: isActive
                        ? isEmergency
                          ? "var(--color-signal-critical)"
                          : "var(--color-accent-primary)"
                        : "var(--color-ink-secondary)",
                      borderLeft: isActive
                        ? `3px solid ${isEmergency ? "var(--color-signal-critical)" : "var(--color-accent-primary)"}`
                        : "3px solid transparent",
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.8125rem",
                      fontWeight: isActive ? 600 : 500,
                      textAlign: "left",
                      width: "100%",
                      transition: "all 120ms ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "var(--color-surface-alt)";
                        e.currentTarget.style.color = "var(--color-ink)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--color-ink-secondary)";
                      }
                    }}
                  >
                    <IconComponent
                      size={16}
                      style={{
                        flexShrink: 0,
                        color: isActive
                          ? isEmergency
                            ? "var(--color-signal-critical)"
                            : "var(--color-accent-primary)"
                          : isEmergency
                          ? "var(--color-signal-critical)"
                          : "var(--color-ink-muted)",
                      }}
                    />
                    {!isCollapsed && (
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {labelClean}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Section 2: Clinical Portals */}
        <div
          style={{
            padding: isCollapsed ? "0.75rem 0.35rem" : "0.75rem",
            borderTop: tabs && tabs.length > 0 ? "1px solid var(--color-border)" : "none",
          }}
        >
          {!isCollapsed && (
            <div
              className="type-label"
              style={{
                padding: "0 0.5rem 0.5rem",
                color: "var(--color-ink-muted)",
                fontSize: "0.6875rem",
                letterSpacing: "0.06em",
              }}
            >
              Portals & Tools
            </div>
          )}
          <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {portalLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPath === link.path;

              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  title={isCollapsed ? link.name : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: isCollapsed ? 0 : "0.75rem",
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    padding: isCollapsed ? "0.65rem 0" : "0.55rem 0.75rem",
                    borderRadius: "6px",
                    textDecoration: "none",
                    background: isActive ? "var(--color-accent-soft)" : "transparent",
                    color: isActive ? "var(--color-accent-primary)" : "var(--color-ink-secondary)",
                    borderLeft: isActive ? "3px solid var(--color-accent-primary)" : "3px solid transparent",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.8125rem",
                    fontWeight: isActive ? 600 : 500,
                    transition: "all 120ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "var(--color-surface-alt)";
                      e.currentTarget.style.color = "var(--color-ink)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--color-ink-secondary)";
                    }
                  }}
                >
                  <Icon
                    size={16}
                    style={{
                      flexShrink: 0,
                      color: isActive ? "var(--color-accent-primary)" : "var(--color-ink-muted)",
                    }}
                  />
                  {!isCollapsed && (
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {link.name}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div
        style={{
          padding: isCollapsed ? "0.75rem 0.35rem" : "0.75rem",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          background: "var(--color-panel)",
        }}
      >
        {!isCollapsed && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0 0.5rem",
              fontSize: "0.6875rem",
              color: "var(--color-ink-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--color-signal-normal)",
                flexShrink: 0,
              }}
            />
            <span>UHIS Clinical v2.4</span>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            padding: "0.45rem 0.65rem",
            background: "var(--color-surface-alt)",
            border: "1px solid var(--color-border)",
            borderRadius: "6px",
            color: "var(--color-ink-secondary)",
            cursor: "pointer",
            fontSize: "0.75rem",
            fontFamily: "var(--font-sans)",
            fontWeight: 500,
            width: "100%",
            transition: "all 120ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-ink)";
            e.currentTarget.style.borderColor = "var(--color-border-deep)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-ink-secondary)";
            e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        >
          {!isCollapsed && <span>Collapse Sidebar</span>}
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
