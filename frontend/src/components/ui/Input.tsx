import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, leadingIcon, trailing, ...rest }, ref) {
    if (leadingIcon || trailing) {
      return (
        <div className="relative">
          {leadingIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              "h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-fg placeholder:text-subtle",
              "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30",
              "disabled:cursor-not-allowed disabled:opacity-60",
              leadingIcon && "pl-9",
              trailing && "pr-9",
              className
            )}
            {...rest}
          />
          {trailing && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle">
              {trailing}
            </span>
          )}
        </div>
      );
    }
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-fg placeholder:text-subtle",
          "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        {...rest}
      />
    );
  }
);
