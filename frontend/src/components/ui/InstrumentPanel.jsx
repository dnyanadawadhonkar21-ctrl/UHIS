import React from "react";

export default function InstrumentPanel({
  title,
  subtitle,
  channel = "muted",
  action,
  children,
  className = "",
  noPadding = false,
}) {
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
