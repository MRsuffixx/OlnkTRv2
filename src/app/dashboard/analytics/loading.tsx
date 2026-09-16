import { Skeleton } from "~/components/ui/skeleton";

export default function AnalyticsLoading() {
  return <div className="mx-auto max-w-6xl space-y-8"><div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-96 max-w-full" /></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-lg" />)}</div><Skeleton className="h-96 rounded-lg" /></div>;
}
