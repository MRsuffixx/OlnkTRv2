import type { LucideIcon } from "lucide-react";

export function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-center justify-between gap-3 text-muted-foreground"><span className="text-xs font-medium">{label}</span><Icon aria-hidden="true" className="size-4" /></div>
      <p className="mt-4 text-[28px] leading-none font-semibold tracking-[-0.04em] text-card-foreground">{value}</p>
    </div>
  );
}
