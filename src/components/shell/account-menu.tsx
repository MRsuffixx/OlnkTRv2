"use client";

import { ChevronUp, CreditCard, LogOut, Settings2, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { signOutAction } from "~/app/actions/auth";
import { Avatar } from "~/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/cn";

export interface ShellAccount {
  name: string;
  email: string;
  image?: string | null;
  plan: string;
}

export function AccountMenu({ account, collapsed }: { account: ShellAccount; collapsed: boolean }) {
  const nav = useTranslations("navigation");
  const common = useTranslations("common");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn("flex w-full items-center rounded-sm p-1.5 text-left transition-[background-color] duration-150 hover:bg-sidebar-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none", collapsed ? "justify-center" : "md:justify-center lg:justify-start")}>
          <Avatar name={account.name} src={account.image} size="sm" />
          <span className={cn("ml-2 min-w-0 flex-1 md:hidden", !collapsed && "lg:block")}>
            <span className="block truncate text-xs font-medium text-sidebar-foreground">{account.name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{account.plan}</span>
          </span>
          <ChevronUp className={cn("size-3.5 text-muted-foreground md:hidden", !collapsed && "lg:block")} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate text-xs font-medium text-foreground">{account.name}</span>
          <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">{account.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/dashboard/settings/profile"><UserRound />{nav("account")}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/dashboard/settings"><Settings2 />{nav("settings")}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/dashboard/billing"><CreditCard />{nav("billing")}</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}><DropdownMenuItem asChild><button type="submit" className="w-full text-danger"><LogOut />{common("signOut")}</button></DropdownMenuItem></form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
