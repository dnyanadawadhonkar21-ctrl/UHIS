import React from "react";

export default function DataRow({ label, value, highlight }) {
  return (
    <div
      className="data-row"
      style={highlight ? { background: "var(--color-surface-alt)" } : {}}
    >
      <span className="type-label" style={{ flexShrink: 0 }}>
        {label}
      </span>
      <span className="type-value" style={{ textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}
