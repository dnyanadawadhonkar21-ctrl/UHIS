import React from "react";

const SIZE_STYLES = {
  sm: { height: "32px", padding: "0 0.75rem", fontSize: "0.8125rem" },
  md: { height: "38px", padding: "0 1rem", fontSize: "0.875rem" },
  lg: { height: "44px", padding: "0 1.5rem", fontSize: "0.9375rem" },
};

const CLASS_MAP = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline: "btn-outline",
  ghost: "btn-ghost",
  critical: "btn-signal-critical",
};

export default function Button({
  variant = "primary",
  size = "md",
  children,
  style,
  className = "",
  ...props
}) {
  const baseClass = CLASS_MAP[variant] || "btn-primary";
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <button
      className={`${baseClass} ${className}`.trim()}
      style={{ ...sizeStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
