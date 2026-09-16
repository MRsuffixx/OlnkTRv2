import type { TextareaHTMLAttributes } from "react";

import { cn } from "~/lib/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-y rounded-sm border border-border bg-surface-raised px-3 py-2 text-sm text-foreground shadow-xs transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-muted-foreground/70 focus:border-primary focus:ring-3 focus:ring-primary/12 focus:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-65 aria-invalid:border-danger aria-invalid:ring-danger/10",
        className,
      )}
      {...props}
    />
  );
}
