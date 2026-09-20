import { redirect } from "next/navigation";

import { DashboardShell } from "~/components/shell/dashboard-shell";
import { api } from "~/trpc/server";
import { auth } from "~/server/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.onboardingStatus !== "COMPLETED") redirect("/onboarding");

  const [profiles, entitlements] = await Promise.all([
    api.profile.mine(),
    api.subscription.entitlements(),
  ]);
  const profile = profiles[0];
  const account = {
    name: profile?.displayName ?? session.user.name ?? session.user.email ?? "OlnkTR creator",
    email: session.user.email ?? "",
    image: session.user.image,
    plan: entitlements.plan === "FREE" ? "OlnkTR Free" : `OlnkTR ${entitlements.plan}`,
    role: session.user.role,
  };

  return (
    <DashboardShell account={account} profileUrl={profile ? `/${profile.username}` : undefined} pageId={profile?.page?.id}>
      {children}
    </DashboardShell>
  );
}
