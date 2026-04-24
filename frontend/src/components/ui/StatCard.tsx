import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type Tone = "neutral" | "brand" | "success" | "warn" | "danger" | "info";

const toneBorder: Record<Tone, string> = {
  neutral: "from-border/60",
  brand:   "from-brand/40",
  success: "from-success/40",
  warn:    "from-warn/40",
  danger:  "from-danger/40",
  info:    "from-info/40"
};

const toneIconBg: Record<Tone, string> = {
  neutral: "bg-bg-soft text-muted",
  brand:   "bg-brand/10 text-brand",
  success: "bg-success/10 text-success",
  warn:    "bg-warn/10 text-warn",
  danger:  "bg-danger/10 text-danger",
  info:    "bg-info/10 text-info"
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  className
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-soft",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent",
          toneBorder[tone]
        )}
      />
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-subtle">
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              toneIconBg[tone]
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 text-3xl font-semibold text-fg">{value}</div>
      {hint && <div className="mt-1 text-sm text-muted">{hint}</div>}
    </div>
  );
}
