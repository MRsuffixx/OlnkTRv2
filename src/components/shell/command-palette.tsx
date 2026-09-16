"use client";

import { BarChart3, CreditCard, Globe2, ImageIcon, LayoutDashboard, Link2, Palette, Search, Settings2 } from "lucide-react";
import { Command } from "cmdk";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";

const commands = [
  { key: "overview", href: "/dashboard", icon: LayoutDashboard },
  { key: "myPage", href: "/dashboard/page", icon: Palette },
  { key: "analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { key: "media", href: "/dashboard/media", icon: ImageIcon },
  { key: "domains", href: "/dashboard/domains", icon: Globe2 },
  { key: "billing", href: "/dashboard/billing", icon: CreditCard },
  { key: "settings", href: "/dashboard/settings", icon: Settings2 },
] as const;

export function CommandPalette({ profileUrl }: { profileUrl?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("navigation");
  const dashboard = useTranslations("dashboard");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{t("commandPalette")}</DialogTitle>
        <Command className="bg-surface-raised text-foreground" loop>
          <div className="flex h-12 items-center gap-3 border-b border-border-subtle px-4">
            <Search aria-hidden="true" className="size-4 text-muted-foreground" />
            <Command.Input autoFocus placeholder={t("searchCommands")} className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            <kbd className="rounded-xs border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-3 py-10 text-center text-sm text-muted-foreground">{t("noCommands")}</Command.Empty>
            <Command.Group heading="Navigation" className="text-xs text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {commands.map((item) => {
                const Icon = item.icon;
                return <Command.Item key={item.href} value={t(item.key)} onSelect={() => navigate(item.href)} className="flex h-9 cursor-default items-center gap-3 rounded-sm px-2 text-sm text-foreground outline-none data-[selected=true]:bg-surface-hover"><Icon className="size-4 text-muted-foreground" />{t(item.key)}</Command.Item>;
              })}
            </Command.Group>
            {profileUrl ? <Command.Group heading="Page" className="mt-1 border-t border-border-subtle pt-1 text-xs text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"><Command.Item value={dashboard("viewPage")} onSelect={() => { setOpen(false); window.open(profileUrl, "_blank", "noopener,noreferrer"); }} className="flex h-9 cursor-default items-center gap-3 rounded-sm px-2 text-sm text-foreground outline-none data-[selected=true]:bg-surface-hover"><Link2 className="size-4 text-muted-foreground" />{dashboard("viewPage")}</Command.Item></Command.Group> : null}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
