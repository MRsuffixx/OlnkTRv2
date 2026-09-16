import { Activity, Eye, MousePointerClick, UsersRound } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Metric } from "~/components/dashboard/metric";
import { ProfileSummary } from "~/components/dashboard/profile-summary";
import { PageHeader } from "~/components/shell/page-header";
import { EmptyState } from "~/components/ui/empty-state";
import { PerformanceChart } from "~/features/analytics/performance-chart";
import { TopBlocks } from "~/features/analytics/top-blocks";
import { fillAnalyticsSeries } from "~/lib/analytics";
import { env } from "~/env";
import { api } from "~/trpc/server";

function greetingKey(timezone: string | undefined) {
  try {
    const hour = Number(new Intl.DateTimeFormat("en", { hour: "numeric", hour12: false, timeZone: timezone ?? "UTC" }).format(new Date()));
    if (hour < 12) return "greetingMorning" as const;
    if (hour < 18) return "greetingAfternoon" as const;
  } catch {
    return "greetingAfternoon" as const;
  }
  return "greetingEvening" as const;
}

export default async function DashboardPage() {
  const [t, locale, profiles, summary, me] = await Promise.all([
    getTranslations("dashboard"),
    getLocale(),
    api.profile.mine(),
    api.analytics.summary({ days: 30 }),
    api.account.me(),
  ]);
  const profile = profiles[0];
  const formatter = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const series = fillAnalyticsSeries(summary.daily, summary.days);
  const hasAnalytics = summary.totals.views > 0 || summary.totals.clicks > 0;
  const name = profile?.displayName.split(/\s+/)[0] ?? me?.name?.split(/\s+/)[0] ?? "Creator";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title={t(greetingKey(me?.timezone), { name })} description={t("subtitle")} />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={t("views")} value={formatter.format(summary.totals.views)} icon={Eye} />
        <Metric label={t("uniqueVisitors")} value={formatter.format(summary.totals.uniqueViews)} icon={UsersRound} />
        <Metric label={t("clicks")} value={formatter.format(summary.totals.clicks)} icon={MousePointerClick} />
        <Metric label={t("ctr")} value={new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(summary.totals.ctr)} icon={Activity} />
      </section>
      <section className="rounded-lg border border-border-subtle bg-card p-5 shadow-xs sm:p-6">
        <h3 className="text-sm font-semibold">{t("performance")}</h3>
        <div className="mt-5">
          {hasAnalytics ? <PerformanceChart data={series} viewsLabel={t("views")} clicksLabel={t("clicks")} /> : <EmptyState icon={Activity} title={t("noAnalyticsTitle")} description={t("noAnalyticsDescription")} />}
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
        <section className="rounded-lg border border-border-subtle bg-card p-5 shadow-xs sm:p-6">
          <TopBlocks items={summary.topBlocks} title={t("topLinks")} emptyTitle={t("noAnalyticsTitle")} emptyDescription={t("noAnalyticsDescription")} />
        </section>
        {profile ? <ProfileSummary username={profile.username} pageUrl={`${env.APP_URL}/${profile.username}`} published={Boolean(profile.page?.publication)} labels={{ title: t("yourPage"), published: t("published"), draft: t("draft"), edit: t("editPage"), view: t("viewPage"), copy: t("copyPageLink"), copied: t("copyPageLink") }} /> : null}
      </div>
    </div>
  );
}
