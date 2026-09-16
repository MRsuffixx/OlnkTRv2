import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "~/lib/cn";

const badgeVariants = cva("inline-flex h-5 items-center gap-1 rounded-xs border px-1.5 text-[11px] font-medium tracking-[0.01em]", {
  variants: {
    variant: {
      neutral: "border-border bg-muted text-muted-foreground",
      primary: "border-primary/20 bg-primary/10 text-primary",
      success: "border-success/20 bg-success-soft text-success",
      warning: "border-warning/20 bg-warning-soft text-warning",
      danger: "border-danger/20 bg-danger-soft text-danger",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export function Badge({ className, variant, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
