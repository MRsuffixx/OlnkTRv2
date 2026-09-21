import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "~/components/auth/auth-shell";
import { buttonVariants } from "~/components/ui/button";
import { privateRouteMetadata } from "~/lib/seo-metadata";

export const metadata: Metadata = privateRouteMetadata("Check your email");
export default async function VerifyRequestPage() { const t = await getTranslations("auth"); return <AuthShell><div className="text-center"><span className="mx-auto flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><MailCheck className="size-5" /></span><h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">{t("checkEmail")}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("checkEmailDescription")}</p><p className="mt-3 text-xs text-muted-foreground">{t("secureLink")}</p><Link href="/login" className={`${buttonVariants({ variant: "secondary" })} mt-6 w-full`}>{t("backToLogin")}</Link></div></AuthShell>; }
