import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/cn";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "h-10 w-full appearance-none rounded-xl border border-border bg-surface px-3 pr-9 text-sm text-fg",
          "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 20 20' fill='none' stroke='currentColor' stroke-width='2'><path d='M6 8l4 4 4-4'/></svg>\")] bg-[length:12px_12px] bg-[right_12px_center] bg-no-repeat",
          "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        {...rest}
      >
        {children}
      </select>
    );
  }
);
