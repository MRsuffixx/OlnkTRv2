import Link from "next/link";

import { cn } from "~/lib/cn";

export function DateRangeFilter({ active, labels, ariaLabel }: { active: number; labels: Record<7 | 30 | 90 | 365, string>; ariaLabel: string }) {
  return <div className="inline-flex rounded-sm bg-muted p-1" aria-label={ariaLabel}>{([7, 30, 90, 365] as const).map((days) => <Link key={days} href={`/dashboard/analytics?days=${days}`} aria-current={active === days ? "true" : undefined} className={cn("flex h-7 min-w-9 items-center justify-center rounded-xs px-2 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none", active === days && "bg-surface-raised text-foreground shadow-xs")}>{labels[days]}</Link>)}</div>;
}
