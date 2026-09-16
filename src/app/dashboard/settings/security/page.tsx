import { getTranslations } from "next-intl/server";
import { SessionList } from "~/features/settings/session-list";
import { api } from "~/trpc/server";
export default async function SecuritySettingsPage() { const [t, sessions] = await Promise.all([getTranslations("settings"), api.account.sessions()]); return <div className="space-y-6"><div><h3 className="text-lg font-semibold">{t("security")}</h3><p className="mt-1 text-sm text-muted-foreground">{t("securityDescription")}</p></div><div><h4 className="mb-3 text-sm font-semibold">{t("sessions")}</h4><SessionList initialSessions={sessions} /></div></div>; }
