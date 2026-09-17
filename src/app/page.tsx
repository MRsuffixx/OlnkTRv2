import { ArrowRight, BarChart3, Layers3, Paintbrush, Send } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { MarketingShell } from "~/components/marketing/marketing-shell";
import { ProductPreview } from "~/components/marketing/product-preview";
import { buttonVariants } from "~/components/ui/button";

export default async function HomePage() {
  const t = await getTranslations("marketing");
  const features = [
    [Layers3, "buildTitle", "buildDescription"],
    [Paintbrush, "customizeTitle", "customizeDescription"],
    [BarChart3, "analyticsTitle", "analyticsDescription"],
    [Send, "publishTitle", "publishDescription"],
  ] as const;
  return (
    <MarketingShell>
      <main id="main-content" tabIndex={-1}>
        <section className="relative overflow-hidden px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28 sm:pb-16">
          <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[480px] max-w-4xl bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_65%)]" />
          <div className="relative mx-auto max-w-4xl">
            <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              {t("productEyebrow")}
            </p>
            <h1 className="mx-auto mt-5 max-w-3xl text-4xl leading-[1.06] font-semibold tracking-[-0.055em] text-balance sm:text-6xl">
              {t("headline")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {t("subheadline")}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/login" className={buttonVariants({ size: "lg" })}>
                {t("createPage")}
                <ArrowRight />
              </Link>
              <Link
                href="#product"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                {t("viewExample")}
              </Link>
            </div>
          </div>
        </section>
        <section className="px-4 pb-24 sm:px-6">
          <ProductPreview />
        </section>
        <section className="border-y border-border-subtle bg-surface px-4 py-20 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-x-16 gap-y-12 md:grid-cols-2">
            {features.map(([Icon, title, description]) => (
              <article key={title} className="max-w-lg">
                <span className="flex size-9 items-center justify-center rounded-md border border-border bg-surface-raised text-primary shadow-xs">
                  <Icon className="size-4" />
                </span>
                <h2 className="mt-5 text-xl font-semibold tracking-[-0.025em]">
                  {t(title)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(description)}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="px-4 py-24 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {t("finalTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            {t("finalDescription")}
          </p>
          <Link
            href="/login"
            className={`${buttonVariants({ size: "lg" })} mt-7`}
          >
            {t("createPage")}
            <ArrowRight />
          </Link>
        </section>
      </main>
    </MarketingShell>
  );
}
