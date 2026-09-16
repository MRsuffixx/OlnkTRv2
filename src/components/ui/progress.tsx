import { cn } from "~/lib/cn";

export function Progress({ value, className }: { value: number; className?: string }) {
  const normalized = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={normalized}>
      <div className="h-full rounded-full bg-primary transition-[width] duration-200 ease-product" style={{ width: `${normalized}%` }} />
    </div>
  );
}
