import { getTranslations } from "next-intl/server";

import { IntegrationSettings } from "~/features/settings/integration-settings";
import { api } from "~/trpc/server";

export default async function IntegrationSettingsPage() {
  const [t, status] = await Promise.all([
    getTranslations("settings"),
    api.integration.status(),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t("integrations")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("integrationsDescription")}
        </p>
      </div>
      <IntegrationSettings spotify={status.spotify} />
    </div>
  );
}
