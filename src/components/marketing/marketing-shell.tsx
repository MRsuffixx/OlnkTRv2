import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LocaleMenu } from "~/components/shared/locale-menu";
import { Logo } from "~/components/shared/logo";
import { ThemeMenu } from "~/components/shared/theme-menu";
import { buttonVariants } from "~/components/ui/button";
import { auth } from "~/server/auth";

export async function MarketingShell({ children }: { children: React.ReactNode }) {
  const [t, session] = await Promise.all([getTranslations("marketing"), auth()]);
  return <div className="min-h-dvh bg-background"><header className="sticky top-0 z-40 border-b border-border-subtle bg-background/85 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6"><Logo href="/" /><nav className="ml-auto hidden items-center gap-1 sm:flex"><Link href="/features" className={buttonVariants({ variant: "ghost", size: "sm" })}>{t("features")}</Link><Link href="/pricing" className={buttonVariants({ variant: "ghost", size: "sm" })}>{t("pricing")}</Link></nav><div className="ml-auto flex items-center gap-1 sm:ml-3"><LocaleMenu /><ThemeMenu /><Link href={session ? "/dashboard" : "/login"} className={buttonVariants({ size: "sm" })}>{session ? t("dashboard") : t("login")}<ArrowRight /></Link></div></div></header>{children}<footer className="border-t border-border-subtle"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6"><span>© {new Date().getFullYear()} OlnkTR</span><div className="flex gap-4 sm:ml-auto"><Link href="/terms" className="hover:text-foreground">{t("termsTitle")}</Link><Link href="/privacy" className="hover:text-foreground">{t("privacyTitle")}</Link></div></div></footer></div>;
}
