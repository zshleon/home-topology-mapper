import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warn"
  | "danger"
  | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-bg-soft text-muted border-border",
  brand:   "bg-brand/10 text-brand border-brand/30",
  success: "bg-success/10 text-success border-success/30",
  warn:    "bg-warn/10 text-warn border-warn/30",
  danger:  "bg-danger/10 text-danger border-danger/30",
  info:    "bg-info/10 text-info border-info/30"
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...rest}
    >
      {dot && (
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full",
            tone === "success" && "bg-success",
            tone === "danger" && "bg-danger",
            tone === "warn" && "bg-warn",
            tone === "info" && "bg-info",
            tone === "brand" && "bg-brand",
            tone === "neutral" && "bg-muted"
          )}
        />
      )}
      {children}
    </span>
  );
}
