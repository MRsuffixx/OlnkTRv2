"use client";

import { useSyncExternalStore } from "react";

import { CommandPalette } from "./command-palette";
import { MobileNavigation } from "./mobile-navigation";
import { Sidebar } from "./sidebar";
import { getServerSidebarPreference, getSidebarPreference, setSidebarPreference, subscribeSidebarPreference } from "./shell-state";
import { TopBar } from "./top-bar";
import type { ShellAccount } from "./account-menu";

export function DashboardShell({ children, account, profileUrl }: { children: React.ReactNode; account: ShellAccount; profileUrl?: string }) {
  const collapsed = useSyncExternalStore(
    subscribeSidebarPreference,
    getSidebarPreference,
    getServerSidebarPreference,
  );

  function toggleSidebar() {
    setSidebarPreference(!collapsed);
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} account={account} />
      <div className="min-w-0 flex-1">
        <MobileNavigation account={account} />
        <TopBar />
        <main className="animate-enter px-4 py-6 sm:px-6 md:px-8 md:py-8">{children}</main>
      </div>
      <CommandPalette profileUrl={profileUrl} />
    </div>
  );
}
