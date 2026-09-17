import { Activity, Eye, MousePointerClick, UsersRound } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Metric } from "~/components/dashboard/metric";
import { PageHeader } from "~/components/shell/page-header";
import { EmptyState } from "~/components/ui/empty-state";
import { BreakdownList } from "~/features/analytics/breakdown-list";
import { DateRangeFilter } from "~/features/analytics/date-range-filter";
import { PerformanceChart } from "~/features/analytics/performance-chart";
import { TopBlocks } from "~/features/analytics/top-blocks";
import { fillAnalyticsSeries } from "~/lib/analytics";
import { api } from "~/trpc/server";

const ranges = new Set([7, 30, 90, 365]);

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const requested = Number((await searchParams).days ?? 30);
  const days = ranges.has(requested) ? requested : 30;
  const [t, dashboard, locale, summary] = await Promise.all([
    getTranslations("analytics"),
    getTranslations("dashboard"),
    getLocale(),
    api.analytics.summary({ days }),
  ]);
  const formatter = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const series = fillAnalyticsSeries(summary.daily, summary.days);
  const hasAnalytics = summary.totals.views > 0 || summary.totals.clicks > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title={t("title")} description={t("subtitle")} actions={<DateRangeFilter active={summary.days} ariaLabel={t("dateRange")} labels={{ 7: t("last7Days"), 30: t("last30Days"), 90: t("last90Days"), 365: t("lastYear") }} />} />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={dashboard("views")} value={formatter.format(summary.totals.views)} icon={Eye} />
        <Metric label={dashboard("uniqueVisitors")} value={formatter.format(summary.totals.uniqueViews)} icon={UsersRound} />
        <Metric label={dashboard("clicks")} value={formatter.format(summary.totals.clicks)} icon={MousePointerClick} />
        <Metric label={dashboard("ctr")} value={new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(summary.totals.ctr)} icon={Activity} />
      </section>
      <section className="rounded-lg border border-border-subtle bg-card p-5 shadow-xs sm:p-6">
        <h3 className="text-sm font-semibold">{dashboard("performance")}</h3>
        <div className="mt-5">{hasAnalytics ? <PerformanceChart data={series} viewsLabel={dashboard("views")} clicksLabel={dashboard("clicks")} /> : <EmptyState icon={Activity} title={dashboard("noAnalyticsTitle")} description={dashboard("noAnalyticsDescription")} />}</div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-lg border border-border-subtle bg-card p-5 shadow-xs sm:p-6"><TopBlocks items={summary.topBlocks} title={t("topLinks")} emptyTitle={dashboard("noClicksTitle")} emptyDescription={dashboard("noClicksDescription")} /></section>
        <section className="grid gap-8 rounded-lg border border-border-subtle bg-card p-5 shadow-xs sm:p-6"><BreakdownList title={t("countries")} items={summary.breakdowns.countries} /><BreakdownList title={t("devices")} items={summary.breakdowns.devices} /><BreakdownList title={t("referrers")} items={summary.breakdowns.referrers} /></section>
      </div>
    </div>
  );
}
