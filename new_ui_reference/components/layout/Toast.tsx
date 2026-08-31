import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: "var(--color-signal-normal-bg)",
    border: "var(--color-signal-normal-border)",
    iconColor: "var(--color-signal-normal)",
  },
  error: {
    icon: AlertCircle,
    bg: "var(--color-signal-critical-bg)",
    border: "var(--color-signal-critical-border)",
    iconColor: "var(--color-signal-critical)",
  },
  warning: {
    icon: AlertTriangle,
    bg: "var(--color-signal-warning-bg)",
    border: "var(--color-signal-warning-border)",
    iconColor: "var(--color-signal-warning)",
  },
  info: {
    icon: Info,
    bg: "var(--color-signal-info-bg)",
    border: "var(--color-signal-info-border)",
    iconColor: "var(--color-signal-info)",
  },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="toast-container">
      {toasts.map((t) => {
        const cfg = TOAST_CONFIG[t.type];
        const Icon = cfg.icon;
        return (
          <div
            key={t.id}
            className="fade-in"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              padding: "0.875rem 1rem",
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <Icon size={16} style={{ color: cfg.iconColor, flexShrink: 0, marginTop: "1px" }} />
            <span
              style={{
                flex: 1,
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.875rem",
                color: "var(--color-ink)",
                lineHeight: 1.5,
              }}
            >
              {t.message}
            </span>
            <button
              onClick={() => dismiss(t.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-ink-muted)",
                padding: "1px",
                flexShrink: 0,
                display: "flex",
                borderRadius: "4px",
              }}
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
