import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Card({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border border-border bg-surface text-fg shadow-soft",
          className
        )}
        {...rest}
      />
    );
  }
);

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function CardHeader({
  title,
  description,
  actions,
  className,
  children,
  ...rest
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-border px-6 py-4",
        className
      )}
      {...rest}
    >
      <div className="min-w-0">
        {title && (
          <h3 className="text-base font-semibold text-fg">{title}</h3>
        )}
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...rest} />;
}
