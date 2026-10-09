import React from "react";

export default function DataRow({
  label,
  value,
  highlight,
  style = {},
  className = "",
  children,
}) {
  return (
    <div
      className={`data-row ${className}`.trim()}
      style={{
        background: highlight ? "var(--color-surface-alt)" : undefined,
        ...style,
      }}
    >
      <span className="type-label" style={{ flexShrink: 0 }}>
        {label}
      </span>
      {children || (
        <span className="type-value" style={{ textAlign: "right" }}>
          {value}
        </span>
      )}
    </div>
  );
}
