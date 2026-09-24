import {
  Activity,
  ArrowLeft,
  ChevronRight,
  Flag,
  KeyRound,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { Logo } from "~/components/shared/logo";
import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { auth } from "~/server/auth";
import { adminUsersPageHref } from "~/server/admin/user-pagination";
import {
  hasPermission,
  hasRole,
} from "~/server/security/authorization";
import { api } from "~/trpc/server";

function confirmed(form: FormData) {
  return String(form.get("confirmation")) === "CONFIRM";
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const session = await auth();
  if (!session || !hasRole(session.user.role, "MODERATOR"))
    redirect("/dashboard");
  const [t, common, locale, params] = await Promise.all([
    getTranslations("admin"),
    getTranslations("common"),
    getLocale(),
    searchParams,
  ]);
  const query = typeof params.q === "string" ? params.q : "";
  const role = ["USER", "MODERATOR", "ADMIN"].includes(String(params.role))
    ? (String(params.role) as "USER" | "MODERATOR" | "ADMIN")
    : undefined;
  const status = ["ACTIVE", "SUSPENDED", "DISABLED", "DELETION_PENDING"].includes(
    String(params.status),
  )
    ? (String(params.status) as
        | "ACTIVE"
        | "SUSPENDED"
        | "DISABLED"
        | "DELETION_PENDING")
    : undefined;
  const parsedPage =
    typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const canConfigure = hasPermission(session.user.role, "FLAG_MANAGE");
  const canManagePlans = hasPermission(session.user.role, "PLAN_MANAGE");
  const canReadAudit = hasPermission(session.user.role, "AUDIT_READ");
  const canInspectJobs = hasRole(session.user.role, "ADMIN");
  const [users, permissionMatrix, moderationQueue, flags, reserved, catalog, jobs, audit] =
    await Promise.all([
      api.admin.users({ query, role, status, page }),
      api.admin.permissionMatrix(),
      api.moderation.queue(),
      canConfigure ? api.admin.flags() : Promise.resolve([]),
      canConfigure ? api.admin.reservedUsernames() : Promise.resolve([]),
      canManagePlans ? api.admin.catalog() : Promise.resolve([]),
      canInspectJobs ? api.admin.jobs() : Promise.resolve([]),
      canReadAudit ? api.admin.audit() : Promise.resolve([]),
  ]);
  async function flag(form: FormData) {
    "use server";
    await api.admin.setFlag({
      key: String(form.get("key")),
      enabled: String(form.get("enabled")) === "true",
    });
    revalidatePath("/admin");
  }
  async function reserve(form: FormData) {
    "use server";
    await api.admin.reserveUsername({
      username: String(form.get("username")),
      reason: String(form.get("reason")),
    });
    revalidatePath("/admin");
  }
  async function release(form: FormData) {
    "use server";
    if (!confirmed(form)) return;
    await api.admin.releaseUsername({
      username: String(form.get("username")),
      confirmation: "CONFIRM",
    });
    revalidatePath("/admin");
  }
  async function entitlement(form: FormData) {
    "use server";
    if (!confirmed(form)) return;
    const raw = String(form.get("limit"));
    await api.admin.setPlanEntitlement({
      planKey: String(form.get("planKey")),
      featureKey: String(form.get("featureKey")),
      enabled: String(form.get("enabled")) === "true",
      limit: raw === "" ? null : Number(raw),
      confirmation: "CONFIRM",
    });
    revalidatePath("/admin");
  }
  async function openModerationCase(form: FormData) {
    "use server";
    await api.moderation.openCase({ reportId: String(form.get("reportId")) });
    revalidatePath("/admin");
  }
  async function moderate(form: FormData) {
    "use server";
    if (!confirmed(form)) return;
    const type = String(form.get("type"));
    if (!["HIDE_PROFILE", "RESTORE_PROFILE", "DISABLE_BLOCK", "RESOLVE", "DISMISS"].includes(type)) return;
    await api.moderation.act({
      caseId: String(form.get("caseId")),
      type: type as "HIDE_PROFILE" | "RESTORE_PROFILE" | "DISABLE_BLOCK" | "RESOLVE" | "DISMISS",
      reason: String(form.get("reason")),
      confirmation: "CONFIRM",
    });
    revalidatePath("/admin");
  }
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh bg-background">
      <header className="border-b border-border-subtle bg-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Logo href="/admin" />
          <Badge variant="danger">{t("title")}</Badge>
          <Link
            href="/dashboard"
            className={`${buttonVariants({ variant: "ghost", size: "sm" })} ml-auto`}
          >
            <ArrowLeft />
            {common("back")}
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <section className="space-y-4" aria-labelledby="user-directory-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <UserRoundCog className="size-4 text-primary" />
                <h2 id="user-directory-title" className="text-base font-semibold">
                  {t("users")}
                </h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("userDirectoryDescription")}
              </p>
            </div>
            <Badge variant="primary">{t(`roles.${session.user.role}`)}</Badge>
          </div>
          <form className="grid gap-2 rounded-md border border-border bg-surface-raised p-3 shadow-xs md:grid-cols-[minmax(14rem,1fr)_11rem_12rem_auto_auto]">
            <Input name="q" defaultValue={query} placeholder={t("searchUsers")} />
            <label className="sr-only" htmlFor="admin-role-filter">
              {t("filterRole")}
            </label>
            <select
              id="admin-role-filter"
              name="role"
              defaultValue={role ?? ""}
              className="h-9 rounded-sm border border-border bg-surface px-3 text-sm text-foreground shadow-xs focus:border-primary focus:ring-3 focus:ring-primary/12 focus:outline-none"
            >
              <option value="">{t("allRoles")}</option>
              {(["USER", "MODERATOR", "ADMIN"] as const).map((item) => (
                <option key={item} value={item}>
                  {t(`roles.${item}`)}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="admin-status-filter">
              {t("filterStatus")}
            </label>
            <select
              id="admin-status-filter"
              name="status"
              defaultValue={status ?? ""}
              className="h-9 rounded-sm border border-border bg-surface px-3 text-sm text-foreground shadow-xs focus:border-primary focus:ring-3 focus:ring-primary/12 focus:outline-none"
            >
              <option value="">{t("allStatuses")}</option>
              {(["ACTIVE", "SUSPENDED", "DISABLED", "DELETION_PENDING"] as const).map(
                (item) => (
                  <option key={item} value={item}>
                    {t(`statuses.${item}`)}
                  </option>
                ),
              )}
            </select>
            <Button variant="secondary">
              <Search />
              {t("search")}
            </Button>
            <Link
              href="/admin"
              className={buttonVariants({ variant: "ghost", size: "md" })}
            >
              {t("clearFilters")}
            </Link>
          </form>
          {users.items.length ? (
            <div className="overflow-hidden rounded-md border border-border bg-surface-raised shadow-xs">
              <div className="hidden grid-cols-[minmax(16rem,1.5fr)_minmax(10rem,1fr)_9rem_8rem_auto] gap-4 border-b border-border-subtle bg-muted/50 px-4 py-2.5 text-xs font-medium text-muted-foreground lg:grid">
                <span>{t("account")}</span>
                <span>{t("profiles")}</span>
                <span>{t("plan")}</span>
                <span>{t("joined")}</span>
                <span className="sr-only">{t("manageUser")}</span>
              </div>
              <div className="divide-y divide-border-subtle">
                {users.items.map((user) => {
                  const label = user.name ?? user.email ?? user.id;
                  const profile = user.profiles[0];
                  const subscription = user.subscriptions[0];
                  return (
                    <article
                      key={user.id}
                      className="grid gap-3 px-4 py-4 transition-colors duration-150 hover:bg-surface-hover lg:grid-cols-[minmax(16rem,1.5fr)_minmax(10rem,1fr)_9rem_8rem_auto] lg:items-center lg:gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={label} src={user.image} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{label}</p>
                          {user.name && user.email ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          ) : null}
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            <Badge>{t(`roles.${user.role}`)}</Badge>
                            <Badge
                              variant={
                                user.status === "ACTIVE" ? "success" : "danger"
                              }
                            >
                              {t(`statuses.${user.status}`)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0 text-sm">
                        {profile ? (
                          <>
                            <p className="truncate font-medium">@{profile.username}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {profile.displayName}
                            </p>
                          </>
                        ) : (
                          <span className="text-muted-foreground">{t("noProfiles")}</span>
                        )}
                      </div>
                      <div>
                        {subscription ? (
                          <Badge variant="primary">{subscription.plan.name}</Badge>
                        ) : (
                          <Badge>{t("freePlan")}</Badge>
                        )}
                      </div>
                      <time className="text-xs text-muted-foreground">
                        {date.format(user.createdAt)}
                      </time>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className={buttonVariants({ variant: "secondary", size: "sm" })}
                      >
                        {t("manageUser")}
                        <ChevronRight />
                      </Link>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t("noUsers")}
            </p>
          )}
          {users.total > 0 ? (
            <nav
              aria-label={t("userPagination")}
              className="flex flex-col gap-3 rounded-md border border-border-subtle bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-xs text-muted-foreground">
                {t("userResults", {
                  start: (users.page - 1) * users.pageSize + 1,
                  end: Math.min(users.page * users.pageSize, users.total),
                  total: users.total,
                })}
              </p>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                {users.page > 1 ? (
                  <Link
                    href={adminUsersPageHref({
                      page: users.page - 1,
                      query,
                      role,
                      status,
                    })}
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    {t("previousPage")}
                  </Link>
                ) : (
                  <span className={buttonVariants({ variant: "secondary", size: "sm", className: "pointer-events-none opacity-45" })}>
                    {t("previousPage")}
                  </span>
                )}
                <span className="min-w-24 text-center text-xs font-medium text-muted-foreground">
                  {t("pageOf", { page: users.page, total: users.pageCount })}
                </span>
                {users.page < users.pageCount ? (
                  <Link
                    href={adminUsersPageHref({
                      page: users.page + 1,
                      query,
                      role,
                      status,
                    })}
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    {t("nextPage")}
                  </Link>
                ) : (
                  <span className={buttonVariants({ variant: "secondary", size: "sm", className: "pointer-events-none opacity-45" })}>
                    {t("nextPage")}
                  </span>
                )}
              </div>
            </nav>
          ) : null}
        </section>

        <section className="space-y-4" aria-labelledby="moderation-queue-title">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 size-4 text-warning" />
            <div>
              <h2 id="moderation-queue-title" className="text-base font-semibold">
                {t("moderationQueue")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("moderationQueueDescription")}
              </p>
            </div>
          </div>
          {moderationQueue.length ? (
            <div className="space-y-3">
              {moderationQueue.map((report) => (
                <article key={report.id} className="rounded-md border border-border bg-surface-raised p-4 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={report.priority >= 80 ? "danger" : report.priority >= 40 ? "warning" : "neutral"}>{report.reason}</Badge>
                        <Badge>{report.status}</Badge>
                        <span className="text-sm font-semibold">@{report.profile.username}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{report.details || t("noReportDetails")}</p>
                    </div>
                    <time className="text-xs text-muted-foreground">{date.format(report.createdAt)}</time>
                  </div>
                  {report.block ? (
                    <details className="mt-3 rounded-sm border border-border-subtle bg-surface p-3">
                      <summary className="cursor-pointer text-xs font-semibold">
                        {t("reportedBlock", { type: report.block.type })}
                      </summary>
                      <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-all text-xs text-muted-foreground">
                        {JSON.stringify(report.block.config, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                  {report.moderationCase ? (
                    <form action={moderate} className="mt-4 grid gap-2 md:grid-cols-[11rem_minmax(14rem,1fr)_9rem_auto]">
                      <input type="hidden" name="caseId" value={report.moderationCase.id} />
                      <select name="type" className="h-9 rounded-sm border border-border bg-surface px-3 text-sm" defaultValue={report.block ? "DISABLE_BLOCK" : "HIDE_PROFILE"}>
                        {report.block ? <option value="DISABLE_BLOCK">{t("disableReportedBlock")}</option> : null}
                        <option value="HIDE_PROFILE">{t("hideReportedProfile")}</option>
                        {report.profile.status === "MODERATION_HOLD" ? <option value="RESTORE_PROFILE">{t("restoreReportedProfile")}</option> : null}
                        <option value="RESOLVE">{t("resolveReport")}</option>
                        <option value="DISMISS">{t("dismissReport")}</option>
                      </select>
                      <Input name="reason" minLength={3} maxLength={500} placeholder={t("actionReasonPlaceholder")} required />
                      <Input name="confirmation" placeholder={t("typeConfirm")} pattern="CONFIRM" required />
                      <Button variant="danger">{t("applyModerationAction")}</Button>
                    </form>
                  ) : (
                    <form action={openModerationCase} className="mt-4">
                      <input type="hidden" name="reportId" value={report.id} />
                      <Button size="sm" variant="secondary">{t("openModerationCase")}</Button>
                    </form>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t("moderationQueueEmpty")}
            </p>
          )}
        </section>

        <section className="space-y-4" aria-labelledby="permissions-title">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            <h2 id="permissions-title" className="text-base font-semibold">
              {t("permissions")}
            </h2>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {t("permissionsDescription")}
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {permissionMatrix.roles.map((item) => (
              <div
                key={item.role}
                className="rounded-md border border-border bg-surface-raised p-4 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{t(`roles.${item.role}`)}</h3>
                  {item.role === permissionMatrix.currentRole ? (
                    <Badge variant="primary">{t("yourRole")}</Badge>
                  ) : null}
                </div>
                <ul className="mt-3 space-y-2">
                  {permissionMatrix.permissions.map((permission) => {
                    const allowed = item.permissions.includes(permission);
                    return (
                      <li
                        key={permission}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="text-muted-foreground">
                          {t(`permissionLabels.${permission}`)}
                        </span>
                        <Badge variant={allowed ? "success" : "neutral"}>
                          {allowed ? t("allowed") : t("notAllowed")}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
        {canConfigure ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Flag className="size-4 text-primary" />
              <h2 className="text-base font-semibold">{t("flags")}</h2>
            </div>
            <div className="divide-y divide-border-subtle rounded-md border border-border">
              {flags.map((item) => (
                <form
                  action={flag}
                  key={item.id}
                  className="flex items-center gap-3 p-3"
                >
                  <input type="hidden" name="key" value={item.key} />
                  <input
                    type="hidden"
                    name="enabled"
                    value={String(!item.enabled)}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {item.key}
                  </span>
                  <Badge variant={item.enabled ? "success" : "neutral"}>
                    {item.enabled ? t("enabled") : t("disabled")}
                  </Badge>
                  <Button size="sm" variant="ghost">
                    {t("toggle")}
                  </Button>
                </form>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <h2 className="text-base font-semibold">{t("reserved")}</h2>
            </div>
            <form
              action={reserve}
              className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
            >
              <Input name="username" placeholder="username" required />
              <Input name="reason" placeholder={t("reason")} required />
              <Button>{t("reserve")}</Button>
            </form>
            <div className="max-h-80 divide-y divide-border-subtle overflow-y-auto rounded-md border border-border">
              {reserved.map((item) => (
                <form
                  action={release}
                  className="flex items-center gap-2 p-3"
                  key={item.username}
                >
                  <input type="hidden" name="username" value={item.username} />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {item.username}
                  </span>
                  <Input
                    className="w-32"
                    name="confirmation"
                    placeholder={t("typeConfirm")}
                    pattern="CONFIRM"
                    required
                  />
                  <Button size="sm" variant="ghost">
                    {t("release")}
                  </Button>
                </form>
              ))}
            </div>
          </div>
        </section>
        ) : null}
        {canManagePlans ? (
        <section className="space-y-4">
          <h2 className="text-base font-semibold">{t("plans")}</h2>
          <div className="space-y-3">
            {catalog.map((plan) => (
              <details
                key={plan.id}
                className="rounded-md border border-border bg-surface-raised"
              >
                <summary className="cursor-pointer p-4 text-sm font-semibold">
                  {plan.name}
                </summary>
                <div className="divide-y divide-border-subtle border-t border-border-subtle">
                  {plan.entitlements.map((item) => (
                    <form
                      action={entitlement}
                      className="grid items-center gap-2 p-3 sm:grid-cols-[1fr_auto_6rem_8rem_auto]"
                      key={item.id}
                    >
                      <input type="hidden" name="planKey" value={plan.key} />
                      <input
                        type="hidden"
                        name="featureKey"
                        value={item.feature.key}
                      />
                      <input
                        type="hidden"
                        name="enabled"
                        value={String(!item.enabled)}
                      />
                      <span className="text-sm">{item.feature.key}</span>
                      <Badge variant={item.enabled ? "success" : "neutral"}>
                        {item.enabled ? t("enabled") : t("disabled")}
                      </Badge>
                      <Input
                        name="limit"
                        aria-label={t("limit")}
                        type="number"
                        min="0"
                        defaultValue={item.limit ?? ""}
                      />
                      <Input
                        name="confirmation"
                        placeholder={t("typeConfirm")}
                        pattern="CONFIRM"
                        required
                      />
                      <Button size="sm" variant="secondary">
                        {t("update")}
                      </Button>
                    </form>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
        ) : null}
        {canInspectJobs || canReadAudit ? (
        <section className="grid gap-6 lg:grid-cols-2">
          {canInspectJobs ? <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <h2 className="text-base font-semibold">
                {t("jobs")} ({jobs.length})
              </h2>
            </div>
            {jobs.length ? (
              <div className="divide-y divide-border-subtle rounded-md border border-border">
                {jobs.map((job) => (
                  <div key={job.id} className="p-3">
                    <p className="text-sm font-medium">
                      {job.queue} · {job.jobName}
                    </p>
                    <p className="mt-1 truncate text-xs text-danger">
                        {job.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                {t("noFailures")}
              </p>
            )}
          </div> : null}
          {canReadAudit ? <div className="space-y-4">
            <h2 className="text-base font-semibold">{t("audit")}</h2>
            <div className="max-h-96 divide-y divide-border-subtle overflow-y-auto rounded-md border border-border">
              {audit.map((entry) => (
                <div key={entry.id} className="p-3">
                  <p className="text-sm font-medium">{entry.action}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("target")}: {entry.targetType}
                    {entry.targetId ? ` · ${entry.targetId}` : ""}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {date.format(entry.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div> : null}
        </section>
        ) : null}
      </div>
    </main>
  );
}
