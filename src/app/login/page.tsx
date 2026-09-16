import { ArrowRight, Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AuthShell } from "~/components/auth/auth-shell";
import { FormSubmitButton } from "~/components/auth/form-submit-button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { env } from "~/env";
import { auth, signIn } from "~/server/auth";
import { rateLimit } from "~/server/security/rate-limit";

async function requestIp() { const incoming = await headers(); return incoming.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"; }

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await auth()) redirect("/dashboard");
  const t = await getTranslations("auth");
  const params = await searchParams;
  async function email(form: FormData) { "use server"; const value = String(form.get("email") ?? "").trim().toLowerCase(); if (!(await rateLimit("magic-link-ip", await requestIp(), 10, 900)).allowed) redirect("/verify-request"); if (value) await signIn("email", { email: value, redirectTo: "/dashboard" }); }
  async function google() { "use server"; if (!(await rateLimit("oauth-ip", await requestIp(), 20, 3600)).allowed) redirect("/login?rateLimited=1"); await signIn("google", { redirectTo: "/dashboard" }); }
  const hasEmail = Boolean(env.SMTP_HOST);
  const hasGoogle = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  return <AuthShell><div className="text-center"><h1 className="text-2xl font-semibold tracking-[-0.03em]">{t("welcomeBack")}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("loginDescription")}</p></div>{params.rateLimited ? <p role="alert" className="mt-5 rounded-sm border border-warning/20 bg-warning-soft p-3 text-sm text-warning">{t("rateLimited")}</p> : null}<div className="mt-6 space-y-4">{hasEmail ? <form action={email} className="space-y-3"><Field label={t("email")} htmlFor="email"><Input id="email" type="email" name="email" placeholder={t("emailPlaceholder")} autoComplete="email" required /></Field><FormSubmitButton className="w-full"><Mail />{t("continueEmail")}<ArrowRight className="ml-auto" /></FormSubmitButton></form> : <p className="rounded-sm border border-border bg-muted p-3 text-sm text-muted-foreground">{t("emailDisabled")}</p>}{hasEmail && hasGoogle ? <div className="flex items-center gap-3"><span className="h-px flex-1 bg-border-subtle" /><span className="text-xs text-muted-foreground">{t("or")}</span><span className="h-px flex-1 bg-border-subtle" /></div> : null}{hasGoogle ? <form action={google}><FormSubmitButton variant="secondary" className="w-full"><span className="font-semibold">G</span>{t("continueGoogle")}</FormSubmitButton></form> : null}{!hasEmail && !hasGoogle ? <p className="text-center text-sm text-danger">{t("noProviders")}</p> : null}</div><p className="mt-6 text-center text-xs leading-5 text-muted-foreground">{t("terms")}</p></AuthShell>;
}
