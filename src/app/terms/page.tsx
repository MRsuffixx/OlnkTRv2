import { getTranslations } from "next-intl/server";
import { MarketingShell } from "~/components/marketing/marketing-shell";
export default async function TermsPage() {
  const t = await getTranslations("marketing");
  return (
    <MarketingShell>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">
          {t("termsTitle")}
        </h1>
        <p className="mt-6 rounded-md border border-warning/20 bg-warning-soft p-4 text-sm text-warning">
          {t("legalPlaceholder")}
        </p>
      </main>
    </MarketingShell>
  );
}
