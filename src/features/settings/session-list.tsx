"use client";

import { Laptop, LogOut } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { api, type RouterOutputs } from "~/trpc/react";

type Session = RouterOutputs["account"]["sessions"][number];

export function SessionList({ initialSessions }: { initialSessions: Session[] }) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const utils = api.useUtils();
  const { data: sessions = initialSessions } = api.account.sessions.useQuery(undefined, { initialData: initialSessions });
  const revoke = api.account.revokeSession.useMutation({ onSuccess: async () => { toast.success(t("sessionRevoked")); await utils.account.sessions.invalidate(); }, onError: (error) => toast.error(error.message) });
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  return <div className="divide-y divide-border-subtle rounded-md border border-border">{sessions.map((session) => <div key={session.id} className="flex items-start gap-3 p-4"><span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"><Laptop className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{session.userAgent ?? t("sessionUnknown")}</p><p className="mt-1 text-xs text-muted-foreground">{t("lastActive", { date: date.format(session.lastSeenAt) })}</p><p className="mt-0.5 text-xs text-muted-foreground">{t("expires", { date: date.format(session.expires) })}</p></div><Button size="sm" variant="ghost" loading={revoke.isPending && revoke.variables?.id === session.id} onClick={() => revoke.mutate({ id: session.id })}><LogOut />{t("revoke")}</Button></div>)}</div>;
}
