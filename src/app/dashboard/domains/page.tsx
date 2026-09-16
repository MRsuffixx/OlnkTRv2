import { getTranslations } from "next-intl/server";

import { PageHeader } from "~/components/shell/page-header";
import { DomainManager } from "~/features/domains/domain-manager";
import { api } from "~/trpc/server";

export default async function DomainsPage() {
  const [t, domains, profiles, entitlements, configuration] = await Promise.all([getTranslations("domains"), api.domain.list(), api.profile.mine(), api.subscription.entitlements(), api.domain.configuration()]);
  const profile = profiles[0];
  if (!profile) return null;
  return <div className="mx-auto w-full max-w-4xl space-y-6"><PageHeader title={t("title")} description={t("subtitle")} /><DomainManager initialDomains={domains} profileId={profile.id} enabled={entitlements.grants.some((grant) => grant.featureKey === "CUSTOM_DOMAIN" && grant.enabled)} configuration={configuration} /></div>;
}
