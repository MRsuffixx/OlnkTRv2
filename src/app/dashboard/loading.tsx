import { Skeleton } from "~/components/ui/skeleton";
import { getTranslations } from "next-intl/server";

export default async function DashboardLoading() {
  const t = await getTranslations("common");
  return (
    <div className="mx-auto max-w-6xl space-y-8" aria-label={t("loading")}>
      <div className="space-y-2"><Skeleton className="h-7 w-44" /><Skeleton className="h-4 w-72" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-lg" />)}</div>
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}
