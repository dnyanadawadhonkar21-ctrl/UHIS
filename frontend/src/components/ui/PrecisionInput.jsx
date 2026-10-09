import React from "react";

export default function PrecisionInput({
  label,
  error,
  id,
  style = {},
  containerStyle = {},
  className = "",
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        ...containerStyle,
      }}
    >
      {label && (
        <label
          htmlFor={inputId}
          className="type-label"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`precision-input ${className}`.trim()}
        style={{
          ...(error ? { borderColor: "var(--color-signal-critical)" } : {}),
          ...style,
        }}
        {...props}
      />
      {error && (
        <span
          className="type-micro"
          style={{ color: "var(--color-signal-critical)", fontWeight: 500 }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
