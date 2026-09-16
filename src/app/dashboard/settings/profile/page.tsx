import { getTranslations } from "next-intl/server";

import { ProfileSettingsForm } from "~/features/settings/profile-settings-form";
import { api } from "~/trpc/server";

export default async function ProfileSettingsPage() {
  const [t, profiles] = await Promise.all([getTranslations("settings"), api.profile.mine()]);
  const profile = profiles[0];
  if (!profile) return null;
  return <div className="space-y-6"><div><h3 className="text-lg font-semibold">{t("profile")}</h3><p className="mt-1 text-sm text-muted-foreground">{t("profileDescription")}</p></div><ProfileSettingsForm profile={profile} /></div>;
}
