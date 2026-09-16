import { Skeleton } from "~/components/ui/skeleton";

export default function MediaLoading() {
  return <div className="space-y-6"><div className="space-y-2"><Skeleton className="h-7 w-36" /><Skeleton className="h-4 w-72" /></div><div className="flex justify-between"><Skeleton className="h-9 w-80" /><Skeleton className="h-9 w-24" /></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="aspect-square rounded-md" />)}</div></div>;
}
