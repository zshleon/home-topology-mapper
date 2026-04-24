import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-50 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand/90 active:bg-brand shadow-soft",
  secondary:
    "bg-surface text-fg border border-border hover:bg-bg-soft",
  ghost:
    "bg-transparent text-muted hover:bg-bg-soft hover:text-fg",
  danger:
    "bg-danger text-white hover:bg-danger/90"
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base"
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...rest}
      />
    );
  }
);
