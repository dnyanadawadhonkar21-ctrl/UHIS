import React from "react";

export default function InstrumentPanel({
  title,
  subtitle,
  channel = "muted",
  action,
  children,
  className = "",
  noPadding = false,
  style = {},
  ...props
}) {
  return (
    <div
      className={`instrument-panel channel-${channel} fade-in ${className}`.trim()}
      style={{ marginBottom: "1.25rem", ...style }}
      {...props}
    >
      {title && (
        <div
          className="panel-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
        >
          <div>
            {subtitle && (
              <div className="type-label" style={{ marginBottom: "0.25rem" }}>
                {subtitle}
              </div>
            )}
            <div className="type-heading">{title}</div>
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
      )}
      <div style={noPadding ? {} : { padding: "1.25rem" }}>{children}</div>
    </div>
  );
}
