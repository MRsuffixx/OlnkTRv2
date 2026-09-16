import { getTranslations } from "next-intl/server";
import { AccountSettings } from "~/features/settings/account-settings";
import { api } from "~/trpc/server";
export default async function AccountPage() { const [t, account] = await Promise.all([getTranslations("settings"), api.account.me()]); if (!account) return null; return <div className="space-y-6"><div><h3 className="text-lg font-semibold">{t("account")}</h3><p className="mt-1 text-sm text-muted-foreground">{t("accountDescription")}</p></div><AccountSettings account={account} /></div>; }
