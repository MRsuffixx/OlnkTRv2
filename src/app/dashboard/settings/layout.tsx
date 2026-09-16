import { getTranslations } from "next-intl/server";

import { SettingsNav } from "~/components/settings/settings-nav";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("settings");
  return <div className="mx-auto w-full max-w-5xl space-y-6"><div><h2 className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl">{t("title")}</h2></div><div className="flex flex-col gap-6 md:flex-row md:gap-8"><SettingsNav /><div className="min-w-0 flex-1">{children}</div></div></div>;
}
