import { cn } from "../lib/cn";

interface BrandMarkProps {
  className?: string;
  size?: number;
}

/**
 * Minimal network glyph: 5 circles + 4 connecting lines.
 * Gradient ID uses a stable name so inline CSS can target it.
 */
export function BrandMark({ className, size = 24 }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="homeweb-brand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(var(--brand))" />
          <stop offset="100%" stopColor="rgb(var(--info))" />
        </linearGradient>
      </defs>
      <g stroke="url(#homeweb-brand)" strokeWidth="1.6" strokeLinecap="round">
        <line x1="16" y1="16" x2="6"  y2="6"  />
        <line x1="16" y1="16" x2="26" y2="6"  />
        <line x1="16" y1="16" x2="6"  y2="26" />
        <line x1="16" y1="16" x2="26" y2="26" />
      </g>
      <g fill="url(#homeweb-brand)">
        <circle cx="16" cy="16" r="4.2" />
        <circle cx="6"  cy="6"  r="2.4" />
        <circle cx="26" cy="6"  r="2.4" />
        <circle cx="6"  cy="26" r="2.4" />
        <circle cx="26" cy="26" r="2.4" />
      </g>
    </svg>
  );
}

interface BrandBlockProps {
  name: string;
  tagline?: string;
  className?: string;
}

export function BrandBlock({ name, tagline, className }: BrandBlockProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-info shadow-soft">
        <BrandMark className="text-white" size={22} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-base font-semibold text-fg">{name}</div>
        {tagline && (
          <div className="truncate text-xs text-muted">{tagline}</div>
        )}
      </div>
    </div>
  );
}
