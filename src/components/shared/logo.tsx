import Link from "next/link";

import { cn } from "~/lib/cn";

export function Logo({ compact = false, className, href = "/dashboard" }: { compact?: boolean; className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded-sm focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none", className)} aria-label="OlnkTR">
      <span className="relative flex size-7 items-center justify-center overflow-hidden rounded-[9px] bg-foreground text-background shadow-xs">
        <span className="absolute h-3.5 w-1.5 -rotate-45 rounded-full border-[1.5px] border-current" />
        <span className="absolute h-3.5 w-1.5 rotate-45 rounded-full border-[1.5px] border-current" />
      </span>
      {!compact ? <span className="text-[15px] font-semibold tracking-[-0.035em]">OlnkTR</span> : null}
    </Link>
  );
}
