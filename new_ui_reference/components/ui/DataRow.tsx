import React from "react";

interface DataRowProps {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}

export default function DataRow({ label, value, highlight }: DataRowProps) {
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
