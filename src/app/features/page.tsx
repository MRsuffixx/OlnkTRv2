import { Blocks, Globe2, Paintbrush, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingShell } from "~/components/marketing/marketing-shell";
import { env } from "~/env";
import { marketingMetadata } from "~/lib/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing");
  return marketingMetadata({
    title: t("featurePageTitle"),
    description: t("featurePageDescription"),
    path: "/features",
    appUrl: env.APP_URL,
  });
}
export default async function FeaturesPage() {
  const t = await getTranslations("marketing");
  const features = [
    [Blocks, "contentFeature", "contentFeatureDescription"],
    [Paintbrush, "designFeature", "designFeatureDescription"],
    [ShieldCheck, "securityFeature", "securityFeatureDescription"],
    [Globe2, "globalFeature", "globalFeatureDescription"],
  ] as const;
  return (
    <MarketingShell>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            {t("featurePageTitle")}
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            {t("featurePageDescription")}
          </p>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
          {features.map(([Icon, title, description]) => (
            <article key={title} className="bg-background p-7 sm:p-9">
              <Icon className="size-5 text-primary" />
              <h2 className="mt-8 text-lg font-semibold">{t(title)}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(description)}
              </p>
            </article>
          ))}
        </div>
      </main>
    </MarketingShell>
  );
}
