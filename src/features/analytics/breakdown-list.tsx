import { cn } from "~/lib/cn";

export function BreakdownList({ title, items }: { title: string; items: Array<{ value: string; count: number }> }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return (
    <section className="min-w-0">
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length ? <div className="mt-4 grid gap-3">{items.map((item) => {
        const share = total ? item.count / total : 0;
        return <div key={item.value}><div className="flex items-center justify-between gap-3 text-xs"><span className="truncate text-foreground">{item.value}</span><span className="tabular-nums text-muted-foreground">{new Intl.NumberFormat().format(item.count)}</span></div><div className="mt-1.5 h-1 rounded-full bg-muted"><div className={cn("h-full rounded-full bg-primary")} style={{ width: `${Math.max(3, share * 100)}%` }} /></div></div>;
      })}</div> : <p className="mt-4 text-sm text-muted-foreground">—</p>}
    </section>
  );
}
