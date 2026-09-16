"use client";

import { BarChart3, CreditCard, Globe2, ImageIcon, LayoutDashboard, Menu, Palette, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "~/components/shared/logo";
import { ThemeMenu } from "~/components/shared/theme-menu";
import { Avatar } from "~/components/ui/avatar";
import { IconButton } from "~/components/ui/icon-button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import { dashboardNavigation, isNavigationItemActive, type NavigationIcon } from "~/lib/navigation";
import { cn } from "~/lib/cn";
import type { ShellAccount } from "./account-menu";

const icons: Record<NavigationIcon, typeof LayoutDashboard> = { overview: LayoutDashboard, page: Palette, analytics: BarChart3, media: ImageIcon, domains: Globe2, billing: CreditCard, settings: Settings2 };

export function MobileNavigation({ account }: { account: ShellAccount }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const common = useTranslations("common");

  return (
    <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild><IconButton label={common("openMenu")}><Menu /></IconButton></SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <SheetHeader><SheetTitle><Logo /></SheetTitle></SheetHeader>
          <nav className="flex-1 overflow-y-auto p-3">
            {dashboardNavigation.flatMap((group) => group.items).map((item) => {
              const Icon = icons[item.icon];
              const active = isNavigationItemActive(pathname, item.href);
              return <SheetClose asChild key={item.href}><Link href={item.href} aria-current={active ? "page" : undefined} className={cn("flex h-11 items-center gap-3 rounded-sm px-3 text-sm font-medium text-muted-foreground hover:bg-sidebar-hover hover:text-foreground", active && "bg-sidebar-active text-foreground")}><Icon className="size-[18px]" />{t(item.labelKey)}</Link></SheetClose>;
            })}
          </nav>
          <div className="border-t border-border p-4"><div className="flex items-center gap-3"><Avatar name={account.name} src={account.image} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{account.name}</span><span className="block truncate text-xs text-muted-foreground">{account.plan}</span></span></div></div>
        </SheetContent>
      </Sheet>
      <Logo />
      <ThemeMenu />
    </div>
  );
}
