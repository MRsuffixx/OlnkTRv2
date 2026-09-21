import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MarketingShell } from "~/components/marketing/marketing-shell";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { env } from "~/env";
import { marketingMetadata } from "~/lib/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing");
  return marketingMetadata({
    title: t("pricingTitle"),
    description: t("pricingDescription"),
    path: "/pricing",
    appUrl: env.APP_URL,
  });
}
export default async function PricingPage() {
  const [t, common] = await Promise.all([
    getTranslations("marketing"),
    getTranslations("common"),
  ]);
  const plans = [
    {
      name: t("freePlan"),
      summary: t("freeSummary"),
      features: t("freeFeatures").split("|"),
      premium: false,
    },
    {
      name: t("premiumPlan"),
      summary: t("premiumSummary"),
      features: t("premiumFeatures").split("|"),
      premium: true,
    },
  ];
  return (
    <MarketingShell>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            {t("pricingTitle")}
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            {t("pricingDescription")}
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <section
              key={plan.name}
              className={`rounded-xl border p-6 sm:p-8 ${plan.premium ? "border-primary/30 bg-primary/5 shadow-md" : "border-border bg-surface-raised shadow-xs"}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                {plan.premium ? (
                  <Badge variant="primary">{common("pro")}</Badge>
                ) : null}
              </div>
              <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
                {plan.summary}
              </p>
              <p className="mt-6 text-2xl font-semibold tracking-[-0.03em]">
                {plan.premium ? t("currentPrice") : t("freePlan")}
              </p>
              <Link
                href="/login"
                className={`${buttonVariants({ variant: plan.premium ? "primary" : "secondary", size: "lg" })} mt-6 w-full`}
              >
                {t("createPage")}
              </Link>
              <div className="mt-7 border-t border-border-subtle pt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("included")}
                </p>
                <ul className="mt-4 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="size-4 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      </main>
    </MarketingShell>
  );
}
