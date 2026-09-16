import { Skeleton } from "~/components/ui/skeleton";

export default function EditorLoading() {
  return <div className="-mx-4 -my-6 grid min-h-[calc(100dvh-3.5rem)] grid-rows-[3.5rem_1fr] overflow-hidden sm:-mx-6 md:-mx-8 md:-my-8 md:h-[calc(100dvh-4rem)]"><Skeleton className="rounded-none border-b border-border" /><div className="grid grid-cols-[11rem_1fr_21rem]"><Skeleton className="rounded-none" /><div className="flex items-center justify-center bg-muted/40"><Skeleton className="h-[70%] w-[min(80%,375px)] rounded-xl" /></div><Skeleton className="rounded-none" /></div></div>;
}
