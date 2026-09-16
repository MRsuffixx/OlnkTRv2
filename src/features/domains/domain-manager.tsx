"use client";

import { CheckCircle2, Clipboard, Globe2, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { EmptyState } from "~/components/ui/empty-state";
import { Field } from "~/components/ui/field";
import { IconButton } from "~/components/ui/icon-button";
import { Input } from "~/components/ui/input";
import { api, type RouterOutputs } from "~/trpc/react";

type Domain = RouterOutputs["domain"]["list"][number];

function DnsRecord({ type, name, value }: { type: string; name: string; value: string }) {
  const t = useTranslations("domains");
  async function copy() {
    await navigator.clipboard.writeText(value);
    toast.success(t("copied"));
  }
  return <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-2 rounded-sm border border-border-subtle bg-muted/55 p-2.5 text-xs"><span className="font-mono font-semibold text-primary">{type}</span><div className="min-w-0"><p className="truncate font-mono text-foreground">{name}</p><p className="truncate font-mono text-muted-foreground">{value}</p></div><IconButton label={t("copied")} onClick={() => void copy()}><Clipboard /></IconButton></div>;
}

export function DomainManager({ initialDomains, profileId, enabled, configuration }: { initialDomains: Domain[]; profileId: string; enabled: boolean; configuration: { cnameTarget: string; txtNamePrefix: string } }) {
  const t = useTranslations("domains");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [hostname, setHostname] = useState("");
  const utils = api.useUtils();
  const { data: domains = initialDomains } = api.domain.list.useQuery(undefined, { initialData: initialDomains });
  const add = api.domain.add.useMutation({ onSuccess: async () => { setOpen(false); setHostname(""); await utils.domain.list.invalidate(); }, onError: (error) => toast.error(error.message) });
  const verify = api.domain.verify.useMutation({ onSuccess: async (result) => { toast[result.active ? "success" : "error"](result.active ? t("verified") : t("notReady")); await utils.domain.list.invalidate(); }, onError: (error) => toast.error(error.message) });
  const remove = api.domain.remove.useMutation({ onSuccess: async () => utils.domain.list.invalidate(), onError: (error) => toast.error(error.message) });

  const addAction = enabled ? (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>{t("addDomain")}</Button></DialogTrigger>
      <DialogContent><DialogHeader><DialogTitle>{t("addDomain")}</DialogTitle><DialogDescription>{t("addDescription")}</DialogDescription></DialogHeader><Field label={t("hostname")} htmlFor="hostname"><Input id="hostname" value={hostname} onChange={(event) => setHostname(event.target.value)} placeholder={t("hostnamePlaceholder")} autoComplete="off" /></Field><DialogFooter><Button variant="secondary" onClick={() => setOpen(false)}>{common("cancel")}</Button><Button loading={add.isPending} disabled={!hostname.trim()} onClick={() => add.mutate({ profileId, hostname })}>{t("addDomain")}</Button></DialogFooter></DialogContent>
    </Dialog>
  ) : <Link href="/dashboard/billing" className={buttonVariants({ variant: "secondary" })}>{t("upgrade")}</Link>;

  if (!domains.length) return <EmptyState icon={Globe2} title={t("emptyTitle")} description={enabled ? t("emptyDescription") : t("premiumRequired")} action={addAction} />;

  return <div className="space-y-4"><div className="flex justify-end">{addAction}</div>{domains.map((domain) => <article key={domain.id} className="rounded-lg border border-border bg-surface-raised shadow-xs"><div className="flex items-center gap-3 border-b border-border-subtle p-4"><span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground"><Globe2 className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{domain.hostname}</p><Badge className="mt-1" variant={domain.status === "ACTIVE" ? "success" : "warning"}>{domain.status === "ACTIVE" ? <CheckCircle2 className="size-3" /> : null}{domain.status === "ACTIVE" ? t("active") : t("pending")}</Badge></div><AlertDialog><DropdownMenu><DropdownMenuTrigger asChild><IconButton label={common("openMenu")}><MoreHorizontal /></IconButton></DropdownMenuTrigger><DropdownMenuContent align="end"><AlertDialogTrigger asChild><DropdownMenuItem className="text-danger" onSelect={(event) => event.preventDefault()}><Trash2 />{common("delete")}</DropdownMenuItem></AlertDialogTrigger></DropdownMenuContent></DropdownMenu><AlertDialogContent><AlertDialogTitle>{t("removeTitle")}</AlertDialogTitle><AlertDialogDescription>{t("removeDescription")}</AlertDialogDescription><div className="mt-5 flex justify-end gap-2"><AlertDialogCancel asChild><Button variant="secondary">{common("cancel")}</Button></AlertDialogCancel><AlertDialogAction asChild><Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate({ id: domain.id })}>{common("delete")}</Button></AlertDialogAction></div></AlertDialogContent></AlertDialog></div>{domain.status !== "ACTIVE" ? <div className="space-y-3 p-4"><div><h3 className="text-sm font-semibold">{t("dnsTitle")}</h3><p className="mt-1 text-xs text-muted-foreground">{t("dnsDescription")}</p></div><DnsRecord type="CNAME" name={domain.hostname} value={configuration.cnameTarget} /><DnsRecord type="TXT" name={`${configuration.txtNamePrefix}.${domain.hostname}`} value={domain.verificationToken} /><Button variant="secondary" loading={verify.isPending} onClick={() => verify.mutate({ id: domain.id })}><RefreshCw />{t("checkAgain")}</Button></div> : null}</article>)}</div>;
}
