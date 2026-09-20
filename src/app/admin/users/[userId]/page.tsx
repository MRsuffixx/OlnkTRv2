import {
  Activity,
  ArrowLeft,
  CalendarPlus,
  ExternalLink,
  Gauge,
  KeyRound,
  MonitorSmartphone,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { FormSubmitButton } from "~/components/auth/form-submit-button";
import { Logo } from "~/components/shared/logo";
import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { auth } from "~/server/auth";
import { addUtcCalendarMonths } from "~/server/billing/manual-subscription";
import { hasRole } from "~/server/security/authorization";
import { api } from "~/trpc/server";

const roleOptions = ["USER", "MODERATOR", "ADMIN"] as const;

function isAssignableRole(value: string): value is (typeof roleOptions)[number] {
  return roleOptions.some((role) => role === value);
}

function formatBytes(bytes: bigint, locale: string) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1024 ** exponent)} ${units[exponent]}`;
}

export default async function AdminUserPage({
  params,
}: PageProps<"/admin/users/[userId]">) {
  const session = await auth();
  if (!session || !hasRole(session.user.role, "MODERATOR"))
    redirect("/dashboard");
  const [{ userId }, t, locale] = await Promise.all([
    params,
    getTranslations("admin"),
    getLocale(),
  ]);
  const detail = await api.admin.userDetail({ userId });
  const { user } = detail;
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const number = new Intl.NumberFormat(locale);
  const label = user.name ?? user.email ?? user.id;
  const usageMetrics: Array<{
    title: string;
    value: string;
    icon: LucideIcon;
  }> = [
    { title: t("views"), value: number.format(detail.usage.views), icon: Activity },
    {
      title: t("uniqueViews"),
      value: number.format(detail.usage.uniqueViews),
      icon: Gauge,
    },
    { title: t("clicks"), value: number.format(detail.usage.clicks), icon: Activity },
    {
      title: t("mediaUsage"),
      value: formatBytes(detail.usage.mediaBytes, locale),
      icon: Gauge,
    },
  ];

  async function updateSuspension(form: FormData) {
    "use server";
    await api.admin.setSuspended({
      userId,
      suspended: String(form.get("suspended")) === "true",
      reason: String(form.get("reason")),
      confirmation: "CONFIRM",
    });
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin");
  }

  async function updateProfileModeration(form: FormData) {
    "use server";
    await api.admin.setProfileHidden({
      profileId: String(form.get("profileId")),
      hidden: String(form.get("hidden")) === "true",
      reason: String(form.get("reason")),
      confirmation: "CONFIRM",
    });
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin");
  }

  async function updateRole(form: FormData) {
    "use server";
    const role = String(form.get("role"));
    if (!isAssignableRole(role)) return;
    await api.admin.setRole({
      userId,
      role,
      reason: String(form.get("reason")),
      confirmation: "CONFIRM",
    });
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin");
  }

  async function grantPremium(form: FormData) {
    "use server";
    await api.admin.grantPremiumMonths({
      userId,
      months: Number(form.get("months")),
      reason: String(form.get("reason")),
      confirmation: "CONFIRM",
    });
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin");
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Logo href="/admin" />
          <span className="hidden text-muted-foreground sm:inline">/</span>
          <span className="hidden max-w-64 truncate text-sm font-medium sm:inline">
            {label}
          </span>
          <Link
            href="/admin"
            className={`${buttonVariants({ variant: "ghost", size: "sm" })} ml-auto`}
          >
            <ArrowLeft />
            {t("backToUsers")}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <section className="flex flex-col gap-5 border-b border-border-subtle pb-8 sm:flex-row sm:items-center">
          <Avatar name={label} src={user.image} className="size-16 text-lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-[-0.03em]">
                {label}
              </h1>
              <Badge>{t(`roles.${user.role}`)}</Badge>
              <Badge variant={user.status === "ACTIVE" ? "success" : "danger"}>
                {t(`statuses.${user.status}`)}
              </Badge>
            </div>
            {user.name && user.email ? (
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              {t("userId")}: <span className="font-mono">{user.id}</span>
            </p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("usageOverview")}>
          {usageMetrics.map(({ title, value, icon: Icon }) => (
            <div key={title} className="rounded-md border border-border bg-surface-raised p-4 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">{title}</span>
                <Icon className="size-4 text-primary" />
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.75fr)]">
          <div className="space-y-8">
            <section className="space-y-4" aria-labelledby="account-overview-title">
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-primary" />
                <h2 id="account-overview-title" className="text-base font-semibold">
                  {t("accountOverview")}
                </h2>
              </div>
              <dl className="grid overflow-hidden rounded-md border border-border bg-surface-raised sm:grid-cols-2">
                {[
                  [t("email"), user.email ?? t("notAvailable")],
                  [t("emailVerification"), user.emailVerified ? date.format(user.emailVerified) : t("notVerified")],
                  [t("onboarding"), t(`onboardingStatuses.${user.onboardingStatus}`)],
                  [t("language"), user.locale.toUpperCase()],
                  [t("timezone"), user.timezone],
                  [t("joined"), date.format(user.createdAt)],
                  [t("lastUpdated"), date.format(user.updatedAt)],
                ].map(([term, value]) => (
                  <div key={term} className="border-b border-border-subtle p-4 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-child(odd)]:border-r">
                    <dt className="text-xs font-medium text-muted-foreground">{term}</dt>
                    <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="space-y-4" aria-labelledby="profiles-title">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <h2 id="profiles-title" className="text-base font-semibold">
                  {t("profiles")}
                </h2>
              </div>
              {detail.profiles.length ? (
                <div className="space-y-3">
                  {detail.profiles.map((profile) => {
                    const held = profile.status === "MODERATION_HOLD";
                    return (
                      <article key={profile.id} className="rounded-md border border-border bg-surface-raised p-4 shadow-xs">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-sm font-semibold">{profile.displayName}</h3>
                              {profile.verified ? <Badge variant="primary">{t("verified")}</Badge> : null}
                              <Badge variant={profile.status === "ACTIVE" ? "success" : held ? "danger" : "warning"}>
                                {t(`profileStatuses.${profile.status}`)}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">@{profile.username}</p>
                          </div>
                          <Link href={`/${profile.username}`} target="_blank" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                            {t("viewProfile")}
                            <ExternalLink />
                          </Link>
                        </div>
                        <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                          <span>{t("blocksCount", { count: profile.page?._count.blocks ?? 0 })}</span>
                          <span>{t("domainsCount", { count: profile._count.customDomains })}</span>
                          <span>{t("reportsCount", { count: profile._count.reports })}</span>
                          <span>{profile.page?.publication ? t("publishedVersion", { version: profile.page.publication.version.version }) : t("notPublished")}</span>
                        </div>
                        {detail.capabilities.canModerate ? (
                          <details className="mt-4 border-t border-border-subtle pt-3">
                            <summary className="cursor-pointer text-sm font-medium text-danger marker:text-muted-foreground">
                              {held ? t("restoreProfile") : t("forceHideProfile")}
                            </summary>
                            <form action={updateProfileModeration} className="mt-3 grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
                              <input type="hidden" name="profileId" value={profile.id} />
                              <input type="hidden" name="hidden" value={String(!held)} />
                              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                                {t("actionReason")}
                                <Textarea className="min-h-20" name="reason" minLength={3} maxLength={500} required />
                              </label>
                              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                                {t("confirmation")}
                                <Input name="confirmation" pattern="CONFIRM" placeholder={t("typeConfirm")} required />
                              </label>
                              <FormSubmitButton variant={held ? "secondary" : "outlineDanger"}>
                                {held ? t("restore") : t("forceHide")}
                              </FormSubmitButton>
                            </form>
                          </details>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t("noProfiles")}</p>
              )}
            </section>

            <section className="space-y-4" aria-labelledby="security-activity-title">
              <div className="flex items-center gap-2">
                <MonitorSmartphone className="size-4 text-primary" />
                <h2 id="security-activity-title" className="text-base font-semibold">{t("securityAndActivity")}</h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-md border border-border bg-surface-raised">
                  <div className="border-b border-border-subtle px-4 py-3">
                    <h3 className="text-sm font-semibold">{t("activeSessions", { count: detail.activeSessions.length })}</h3>
                  </div>
                  {detail.activeSessions.length ? (
                    <div className="divide-y divide-border-subtle">
                      {detail.activeSessions.map((sessionItem) => (
                        <div key={sessionItem.id} className="p-4">
                          <p className="truncate text-xs font-medium">{sessionItem.userAgent ?? t("unknownDevice")}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{t("lastSeen", { date: date.format(sessionItem.lastSeenAt) })}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="p-4 text-sm text-muted-foreground">{t("noActiveSessions")}</p>}
                </div>
                <div className="rounded-md border border-border bg-surface-raised">
                  <div className="border-b border-border-subtle px-4 py-3">
                    <h3 className="text-sm font-semibold">{t("securityEvents")}</h3>
                  </div>
                  {detail.securityEvents.length ? (
                    <div className="max-h-80 divide-y divide-border-subtle overflow-y-auto">
                      {detail.securityEvents.map((event) => (
                        <div key={event.id} className="flex items-start justify-between gap-3 p-4">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">{event.type}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">{date.format(event.createdAt)}</p>
                          </div>
                          <Badge variant={event.severity === "WARNING" ? "warning" : event.severity === "ERROR" ? "danger" : "neutral"}>{event.severity}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : <p className="p-4 text-sm text-muted-foreground">{t("noSecurityEvents")}</p>}
                </div>
              </div>
            </section>

            <section className="space-y-4" aria-labelledby="audit-title">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                <h2 id="audit-title" className="text-base font-semibold">{t("userAuditTrail")}</h2>
              </div>
              {detail.audit.length ? (
                <div className="divide-y divide-border-subtle overflow-hidden rounded-md border border-border bg-surface-raised">
                  {detail.audit.map((entry) => (
                    <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{entry.action}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{entry.targetType} · {entry.actorType}</p>
                      </div>
                      <time className="text-xs text-muted-foreground">{date.format(entry.createdAt)}</time>
                    </div>
                  ))}
                </div>
              ) : <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">{t("noAuditEntries")}</p>}
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            {detail.capabilities.canModerate ? (
              <section className="rounded-md border border-danger/25 bg-danger-soft/35 p-4" aria-labelledby="moderation-controls-title">
                <div className="flex items-center gap-2 text-danger">
                  <ShieldAlert className="size-4" />
                  <h2 id="moderation-controls-title" className="text-sm font-semibold">{t("moderationControls")}</h2>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("moderationDescription")}</p>
                {user.status === "ACTIVE" || user.status === "SUSPENDED" ? (
                  <form action={updateSuspension} className="mt-4 space-y-3">
                    <input type="hidden" name="suspended" value={String(user.status !== "SUSPENDED")} />
                    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                      {t("actionReason")}
                      <Textarea name="reason" minLength={3} maxLength={500} required placeholder={t("actionReasonPlaceholder")} />
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                      {t("confirmation")}
                      <Input name="confirmation" pattern="CONFIRM" placeholder={t("typeConfirm")} required />
                    </label>
                    <FormSubmitButton className="w-full" variant={user.status === "SUSPENDED" ? "secondary" : "danger"}>
                      {user.status === "SUSPENDED" ? t("restoreAccount") : t("suspendAccount")}
                    </FormSubmitButton>
                  </form>
                ) : <p className="mt-4 text-xs text-muted-foreground">{t("accountStateNotModeratable")}</p>}
              </section>
            ) : null}

            {detail.capabilities.canAssignRole ? (
              <section className="rounded-md border border-border bg-surface-raised p-4 shadow-xs" aria-labelledby="role-management-title">
                <div className="flex items-center gap-2">
                  <KeyRound className="size-4 text-primary" />
                  <h2 id="role-management-title" className="text-sm font-semibold">{t("roleManagement")}</h2>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("roleManagementDescription")}</p>
                <form action={updateRole} className="mt-4 space-y-3">
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    {t("role")}
                    <select name="role" defaultValue={user.role} className="h-9 rounded-sm border border-border bg-surface px-3 text-sm text-foreground shadow-xs focus:border-primary focus:ring-3 focus:ring-primary/12 focus:outline-none">
                      {roleOptions.map((role) => <option key={role} value={role}>{t(`roles.${role}`)}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    {t("actionReason")}
                    <Textarea name="reason" minLength={3} maxLength={500} required />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    {t("confirmation")}
                    <Input name="confirmation" pattern="CONFIRM" placeholder={t("typeConfirm")} required />
                  </label>
                  <FormSubmitButton className="w-full" variant="secondary">{t("updateRole")}</FormSubmitButton>
                </form>
              </section>
            ) : null}

            <section className="rounded-md border border-border bg-surface-raised p-4 shadow-xs" aria-labelledby="subscriptions-title">
              <div className="flex items-center gap-2">
                <CalendarPlus className="size-4 text-primary" />
                <h2 id="subscriptions-title" className="text-sm font-semibold">{t("subscriptions")}</h2>
              </div>
              {detail.subscriptions.length ? (
                <div className="mt-3 space-y-2">
                  {detail.subscriptions.map((subscription) => (
                    <div key={subscription.id} className="rounded-sm border border-border-subtle bg-surface p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">{subscription.plan.name}</span>
                        <Badge variant={subscription.status === "ACTIVE" || subscription.status === "TRIALING" ? "success" : "neutral"}>{subscription.status}</Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">{subscription.provider}{subscription.currentPeriodEnd ? ` · ${t("untilDate", { date: date.format(subscription.currentPeriodEnd) })}` : ""}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-3 text-sm text-muted-foreground">{t("noSubscriptions")}</p>}

              {detail.capabilities.canGrantPremium ? (
                <details className="mt-4 border-t border-border-subtle pt-3">
                  <summary className="cursor-pointer text-sm font-medium marker:text-muted-foreground">{t("manualPremium")}</summary>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("manualPremiumDescription")}</p>
                  <form action={grantPremium} className="mt-3 space-y-3">
                    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                      {t("months")}
                      <select name="months" defaultValue="1" className="h-9 rounded-sm border border-border bg-surface px-3 text-sm text-foreground shadow-xs focus:border-primary focus:ring-3 focus:ring-primary/12 focus:outline-none">
                        {Array.from({ length: 24 }, (_, index) => {
                          const months = index + 1;
                          const manual = detail.subscriptions.find((item) => item.provider === "manual");
                          const now = new Date();
                          const base = manual?.currentPeriodEnd && manual.currentPeriodEnd > now ? manual.currentPeriodEnd : now;
                          return <option key={months} value={months}>{t("monthOption", { count: months, date: date.format(addUtcCalendarMonths(base, months)) })}</option>;
                        })}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                      {t("reason")}
                      <Textarea name="reason" minLength={3} maxLength={300} required placeholder={t("manualPremiumReason")} />
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                      {t("confirmation")}
                      <Input name="confirmation" pattern="CONFIRM" placeholder={t("typeConfirm")} required />
                    </label>
                    <FormSubmitButton className="w-full">{t("grantPremium")}</FormSubmitButton>
                  </form>
                </details>
              ) : null}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
