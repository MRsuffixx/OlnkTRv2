"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "~/lib/cn";

const items = [
  ["profile", "/dashboard/settings/profile"],
  ["account", "/dashboard/settings/account"],
  ["security", "/dashboard/settings/security"],
  ["notifications", "/dashboard/settings/notifications"],
  ["appearance", "/dashboard/settings/appearance"],
  ["integrations", "/dashboard/settings/integrations"],
] as const;

export function SettingsNav() {
  const pathname = usePathname();
  const t = useTranslations("settings");
  return <nav aria-label={t("title")} className="flex gap-1 overflow-x-auto border-b border-border md:w-48 md:shrink-0 md:flex-col md:border-r md:border-b-0 md:pr-5">{items.map(([key, href]) => <Link key={key} href={href} className={cn("shrink-0 rounded-sm px-3 py-2 text-sm font-medium transition-[color,background-color]", pathname === href ? "bg-surface-active text-foreground" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground")}>{t(key)}</Link>)}</nav>;
}
