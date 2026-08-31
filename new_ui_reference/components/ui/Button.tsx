import React from "react";

type Variant = "primary" | "secondary" | "critical" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const SIZE_STYLES: Record<string, React.CSSProperties> = {
  sm: { padding: "0.3rem 0.75rem", fontSize: "0.8rem" },
  md: { padding: "0.55rem 1.25rem", fontSize: "0.875rem" },
  lg: { padding: "0.7rem 1.75rem", fontSize: "1rem" },
};

const CLASS_MAP: Record<Variant, string> = {
  primary:   "btn-primary",
  secondary: "btn-secondary",
  critical:  "btn-signal-critical",
  ghost:     "btn-secondary",
};

export default function Button({ variant = "primary", size = "md", children, style, ...props }: ButtonProps) {
  return (
    <button
      className={CLASS_MAP[variant]}
      style={{ ...SIZE_STYLES[size], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
