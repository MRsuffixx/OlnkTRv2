import type { ReactNode } from "react";

import { cn } from "~/lib/cn";

interface FieldProps {
  label: string;
  htmlFor: string;
  description?: string;
  error?: string;
  optional?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, description, error, optional, children, className }: FieldProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">{label}</label>
        {optional ? <span className="text-xs text-muted-foreground">{optional}</span> : null}
      </div>
      {children}
      {error ? <p id={`${htmlFor}-error`} className="text-xs text-danger" role="alert">{error}</p> : null}
      {!error && description ? <p id={`${htmlFor}-description`} className="text-xs leading-5 text-muted-foreground">{description}</p> : null}
    </div>
  );
}
