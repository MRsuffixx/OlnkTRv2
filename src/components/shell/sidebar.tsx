"use client";

import { BarChart3, ChevronsLeft, ChevronsRight, CircleHelp, CreditCard, Globe2, ImageIcon, LayoutDashboard, Palette, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LocaleMenu } from "~/components/shared/locale-menu";
import { Logo } from "~/components/shared/logo";
import { ThemeMenu } from "~/components/shared/theme-menu";
import { IconButton } from "~/components/ui/icon-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import { dashboardNavigation, isNavigationItemActive, type NavigationIcon } from "~/lib/navigation";
import { cn } from "~/lib/cn";
import { AccountMenu, type ShellAccount } from "./account-menu";

const icons: Record<NavigationIcon, typeof LayoutDashboard> = {
  overview: LayoutDashboard,
  page: Palette,
  analytics: BarChart3,
  media: ImageIcon,
  domains: Globe2,
  billing: CreditCard,
  settings: Settings2,
};

export function Sidebar({ collapsed, onToggle, account }: { collapsed: boolean; onToggle: () => void; account: ShellAccount }) {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const common = useTranslations("common");

  return (
    <TooltipProvider delayDuration={250}>
      <aside data-testid="dashboard-sidebar" data-collapsed={collapsed} className={cn("sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-product md:flex md:w-[68px]", collapsed ? "lg:w-[68px]" : "lg:w-[248px]")}> 
        <div className="flex h-16 items-center justify-between px-5 md:justify-center lg:justify-between">
          <Logo compact={collapsed} className={cn("md:[&>span:last-child]:hidden", !collapsed && "lg:[&>span:last-child]:inline")} />
          <IconButton label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={onToggle} className={cn("hidden size-7 lg:inline-flex", collapsed && "lg:hidden")}>
            <ChevronsLeft />
          </IconButton>
        </div>
        <nav className="flex-1 overflow-y-auto px-2.5 py-3" aria-label={t("overview")}>
          {dashboardNavigation.map((group, groupIndex) => (
            <div key={group.labelKey ?? "overview"} className={cn(groupIndex > 0 && "mt-5")}>
              {group.labelKey ? <p className={cn("mb-1.5 px-2 text-[10px] font-semibold tracking-[0.11em] text-muted-foreground uppercase md:hidden", !collapsed && "lg:block")}>{t(group.labelKey)}</p> : null}
              <div className="grid gap-0.5">
                {group.items.map((item) => {
                  const Icon = icons[item.icon];
                  const active = isNavigationItemActive(pathname, item.href);
                  const link = (
                    <Link href={item.href} aria-current={active ? "page" : undefined} className={cn("group flex h-9 items-center gap-3 rounded-sm px-2.5 text-[13px] font-medium text-muted-foreground transition-[color,background-color] duration-150 hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none", active && "bg-sidebar-active text-sidebar-foreground", collapsed ? "justify-center" : "md:justify-center lg:justify-start")}>
                      <Icon aria-hidden="true" className="size-[17px] shrink-0" />
                      <span className={cn("truncate md:hidden", !collapsed && "lg:block")}>{t(item.labelKey)}</span>
                    </Link>
                  );
                  return collapsed ? <Tooltip key={item.href}><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{t(item.labelKey)}</TooltipContent></Tooltip> : <div key={item.href}>{link}</div>;
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-2.5">
          <div className={cn("mb-2 flex items-center", collapsed ? "flex-col gap-1" : "md:flex-col md:gap-1 lg:flex-row lg:justify-between")}>
            <Tooltip><TooltipTrigger asChild><Link href="/support" className="flex size-9 items-center justify-center rounded-sm text-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground"><CircleHelp className="size-4" /><span className="sr-only">{common("help")}</span></Link></TooltipTrigger><TooltipContent side="right">{common("help")}</TooltipContent></Tooltip>
            <div className="flex items-center"><LocaleMenu /><ThemeMenu /></div>
          </div>
          <AccountMenu account={account} collapsed={collapsed} />
          {collapsed ? <IconButton label="Expand sidebar" onClick={onToggle} className="mt-2 hidden w-full lg:inline-flex"><ChevronsRight /></IconButton> : null}
        </div>
      </aside>
    </TooltipProvider>
  );
}
