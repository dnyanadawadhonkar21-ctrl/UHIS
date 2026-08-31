import React from "react";

const DOT = {
  critical: "●",
  warning: "●",
  normal: "●",
  info: "●",
  muted: "●",
  purple: "●",
};

export default function StatusCode({ status = "muted", label, pulse = false }) {
  return (
    <span className={`status-${status}`}>
      <span className={pulse ? "pulse-signal" : ""} style={{ fontSize: "0.55rem" }}>
        {DOT[status] || "●"}
      </span>
      {label}
    </span>
  );
}
