import React from "react";

export default function PrecisionInput({ label, error, id, ...props }) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {label && (
        <label
          htmlFor={inputId}
          className="type-label"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className="precision-input"
        style={error ? { borderColor: "var(--color-signal-critical)" } : {}}
        {...props}
      />
      {error && (
        <span className="type-micro" style={{ color: "var(--color-signal-critical)" }}>{error}</span>
      )}
    </div>
  );
}
