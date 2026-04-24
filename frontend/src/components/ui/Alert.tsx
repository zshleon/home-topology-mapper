import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "../../lib/cn";

type Tone = "info" | "success" | "warn" | "danger";

const toneStyle: Record<Tone, string> = {
  info:    "bg-info/5 border-info/30 text-info",
  success: "bg-success/5 border-success/30 text-success",
  warn:    "bg-warn/5 border-warn/30 text-warn",
  danger:  "bg-danger/5 border-danger/30 text-danger"
};

const toneIcon: Record<Tone, ReactNode> = {
  info:    <Info className="h-4 w-4" />,
  success: <CheckCircle2 className="h-4 w-4" />,
  warn:    <AlertTriangle className="h-4 w-4" />,
  danger:  <XCircle className="h-4 w-4" />
};

interface AlertProps {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Alert({ tone = "info", title, children, className }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        toneStyle[tone],
        className
      )}
    >
      <span className="mt-0.5 flex-shrink-0">{toneIcon[tone]}</span>
      <div className="min-w-0 flex-1">
        {title && <div className="font-medium">{title}</div>}
        {children && (
          <div className={cn("text-fg/90", title && "mt-1")}>{children}</div>
        )}
      </div>
    </div>
  );
}
