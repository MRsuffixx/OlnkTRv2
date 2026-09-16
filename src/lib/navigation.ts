export type NavigationIcon = "overview" | "page" | "analytics" | "media" | "domains" | "billing" | "settings";

export interface NavigationItem {
  href: string;
  labelKey: string;
  icon: NavigationIcon;
  shortcut?: string;
}

export interface NavigationGroup {
  labelKey?: string;
  items: NavigationItem[];
}

export const dashboardNavigation: NavigationGroup[] = [
  { items: [{ href: "/dashboard", labelKey: "overview", icon: "overview", shortcut: "G O" }] },
  {
    labelKey: "create",
    items: [
      { href: "/dashboard/page", labelKey: "myPage", icon: "page", shortcut: "G P" },
      { href: "/dashboard/analytics", labelKey: "analytics", icon: "analytics", shortcut: "G A" },
    ],
  },
  {
    labelKey: "manage",
    items: [
      { href: "/dashboard/media", labelKey: "media", icon: "media" },
      { href: "/dashboard/domains", labelKey: "domains", icon: "domains" },
    ],
  },
  {
    labelKey: "account",
    items: [
      { href: "/dashboard/billing", labelKey: "billing", icon: "billing" },
      { href: "/dashboard/settings", labelKey: "settings", icon: "settings" },
    ],
  },
];

export function isNavigationItemActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
