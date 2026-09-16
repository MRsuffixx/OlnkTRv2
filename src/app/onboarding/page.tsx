import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AuthShell } from "~/components/auth/auth-shell";
import { OnboardingForm } from "~/features/onboarding/onboarding-form";
import { auth } from "~/server/auth";
export default async function OnboardingPage() { const session = await auth(); if (!session) redirect("/login"); if (session.user.onboardingStatus === "COMPLETED") redirect("/dashboard"); const t = await getTranslations("auth"); return <AuthShell><div className="mb-6 text-center"><h1 className="text-2xl font-semibold tracking-[-0.03em]">{t("onboardingTitle")}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("onboardingDescription")}</p></div><OnboardingForm initialDisplayName={session.user.name ?? ""} /></AuthShell>; }
