import { cn } from "@/lib/utils";

export function statusTone(status: number): "success" | "info" | "warning" | "error" | "neutral" {
  if (status >= 200 && status < 300) return "success";
  if (status === 301 || status === 308) return "info";
  if (status >= 300 && status < 400) return "warning";
  if (status >= 400) return "error";
  return "neutral";
}

const toneClasses: Record<string, string> = {
  success: "bg-success/12 text-success border-success/30",
  info: "bg-info/12 text-info border-info/30",
  warning: "bg-warning/15 text-warning-foreground border-warning/40",
  error: "bg-destructive/12 text-destructive border-destructive/30",
  neutral: "bg-muted text-muted-foreground border-hairline",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: number;
  label?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums tracking-tight",
        toneClasses[statusTone(status)],
        className,
      )}
    >
      {status}
      {label ? <span className="font-sans font-medium opacity-80">{label}</span> : null}
    </span>
  );
}
