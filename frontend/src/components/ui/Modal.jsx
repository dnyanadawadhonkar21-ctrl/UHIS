import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, title, subtitle, children, width = "560px" }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="instrument-panel fade-in"
        style={{ width: "100%", maxWidth: width, maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        <div
          className="panel-header"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}
        >
          <div>
            {subtitle && (
              <div className="type-label" style={{ marginBottom: "0.2rem" }}>
                {subtitle}
              </div>
            )}
            <div className="type-heading">{title}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-ink-muted)",
              padding: "0.35rem",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: "1.5rem", overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
