import { MousePointerClick } from "lucide-react";

import { EmptyState } from "~/components/ui/empty-state";
import { blockDisplayName } from "~/lib/analytics";

interface TopBlock { clicks: number; block: { id: string; type: string; config: unknown } | null }

export function TopBlocks({ items, title, emptyTitle, emptyDescription }: { items: TopBlock[]; title: string; emptyTitle: string; emptyDescription: string }) {
  if (!items.length) return <EmptyState icon={MousePointerClick} title={emptyTitle} description={emptyDescription} />;
  const max = Math.max(...items.map((item) => item.clicks), 1);
  return <section><h3 className="text-sm font-semibold">{title}</h3><div className="mt-4 divide-y divide-border-subtle">{items.map((item, index) => <div key={item.block?.id ?? index} className="flex items-center gap-4 py-3 first:pt-0"><span className="w-5 text-xs tabular-nums text-muted-foreground">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-4"><p className="truncate text-sm font-medium">{blockDisplayName(item.block)}</p><span className="text-xs tabular-nums text-muted-foreground">{item.clicks}</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(item.clicks / max) * 100}%` }} /></div></div></div>)}</div></section>;
}
