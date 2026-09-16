"use client";

import { ShieldCheck, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export function AccountSettings({ account }: { account: { email: string | null; emailVerified: Date | null; status: string } }) {
  const t = useTranslations("settings");
  const common = useTranslations("common");
  const deletion = api.account.requestDeletion.useMutation({ onSuccess: () => toast.success(t("deletionSent")), onError: (error) => toast.error(error.message) });
  return <div className="space-y-8"><section className="space-y-4"><div className="grid gap-1"><p className="text-sm font-medium">{t("email")}</p><div className="flex flex-wrap items-center gap-2"><span className="text-sm text-muted-foreground">{account.email}</span>{account.emailVerified ? <Badge variant="success"><ShieldCheck />{t("verified")}</Badge> : null}</div></div><div className="grid gap-1"><p className="text-sm font-medium">{t("accountStatus")}</p><Badge variant="success" className="w-fit">{account.status}</Badge></div></section><div className="h-px bg-border-subtle" /><section className="space-y-3"><div><h4 className="text-sm font-semibold text-danger">{t("deleteAccount")}</h4><p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("deleteWarning")}</p></div><AlertDialog><AlertDialogTrigger asChild><Button variant="outlineDanger"><Trash2 />{t("deleteAccount")}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogTitle>{t("deleteAccount")}</AlertDialogTitle><AlertDialogDescription>{t("deleteWarning")}</AlertDialogDescription><div className="mt-5 flex justify-end gap-2"><AlertDialogCancel asChild><Button variant="secondary">{common("cancel")}</Button></AlertDialogCancel><AlertDialogAction asChild><Button variant="danger" loading={deletion.isPending} onClick={() => deletion.mutate()}>{t("deleteConfirmation")}</Button></AlertDialogAction></div></AlertDialogContent></AlertDialog></section></div>;
}
