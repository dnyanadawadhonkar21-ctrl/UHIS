import React from "react";

interface PrecisionInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function PrecisionInput({ label, error, id, ...props }: PrecisionInputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label
        htmlFor={inputId}
        className="type-label"
      >
        {label}
      </label>
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
