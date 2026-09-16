"use client";

import { Command as CommandIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { dashboardNavigation, isNavigationItemActive } from "~/lib/navigation";

export function TopBar() {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const item = dashboardNavigation.flatMap((group) => group.items).find((candidate) => isNavigationItemActive(pathname, candidate.href));

  return (
    <header className="hidden h-16 items-center justify-between border-b border-border-subtle px-6 md:flex lg:px-8">
      <h1 className="text-sm font-semibold tracking-[-0.01em]">{item ? t(item.labelKey) : t("overview")}</h1>
      <button type="button" className="flex h-8 items-center gap-2 rounded-sm border border-border bg-surface px-2.5 text-xs text-muted-foreground shadow-xs hover:bg-surface-hover" aria-label={t("commandPalette")} onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}>
        <span>{t("searchCommands")}</span><kbd className="flex items-center gap-0.5 rounded-xs border border-border bg-surface-raised px-1.5 py-0.5 text-[10px]"><CommandIcon className="size-2.5" />K</kbd>
      </button>
    </header>
  );
}
