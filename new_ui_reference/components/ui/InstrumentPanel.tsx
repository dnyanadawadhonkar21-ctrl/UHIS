import React from "react";

interface InstrumentPanelProps {
  title?: string;
  subtitle?: string;
  channel?: "critical" | "warning" | "normal" | "info" | "muted" | "purple";
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function InstrumentPanel({
  title,
  subtitle,
  channel = "muted",
  action,
  children,
  className = "",
  noPadding = false,
}: InstrumentPanelProps) {
  return (
    <div
      className={`instrument-panel channel-${channel} fade-in ${className}`}
      style={{ marginBottom: "1.25rem" }}
    >
      {title && (
        <div className="panel-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            {subtitle && (
              <div className="type-label" style={{ marginBottom: "0.2rem" }}>
                {subtitle}
              </div>
            )}
            <div className="type-heading">
              {title}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={noPadding ? {} : { padding: "1.25rem" }}>{children}</div>
    </div>
  );
}
