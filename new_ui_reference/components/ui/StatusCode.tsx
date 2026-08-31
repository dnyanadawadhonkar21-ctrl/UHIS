interface StatusCodeProps {
  status: "critical" | "warning" | "normal" | "info" | "muted" | "purple";
  label: string;
  pulse?: boolean;
}

const DOT: Record<string, string> = {
  critical: "●",
  warning:  "●",
  normal:   "●",
  info:     "●",
  muted:    "●",
  purple:   "●",
};

export default function StatusCode({ status, label, pulse }: StatusCodeProps) {
  return (
    <span className={`status-${status}`}>
      <span className={pulse ? "pulse-signal" : ""} style={{ fontSize: "0.55rem" }}>
        {DOT[status]}
      </span>
      {label}
    </span>
  );
}
