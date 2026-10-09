import React from "react";

const DOT = {
  critical: "●",
  warning: "●",
  normal: "●",
  info: "●",
  muted: "●",
  purple: "●",
};

export default function StatusCode({
  status = "muted",
  label,
  pulse = false,
  style = {},
  className = "",
}) {
  return (
    <span
      className={`status-${status} ${className}`.trim()}
      style={{ display: "inline-flex", alignItems: "center", gap: "5px", ...style }}
    >
      <span
        className={pulse ? "pulse-signal" : ""}
        style={{ fontSize: "0.5rem", lineHeight: 1, display: "inline-block" }}
      >
        {DOT[status] || "●"}
      </span>
      <span>{label}</span>
    </span>
  );
}
