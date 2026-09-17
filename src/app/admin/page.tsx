import {
  Activity,
  ArrowLeft,
  Flag,
  Search,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { Logo } from "~/components/shared/logo";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { auth } from "~/server/auth";
import { hasRole } from "~/server/security/authorization";
import { api } from "~/trpc/server";

function confirmed(form: FormData) {
  return String(form.get("confirmation")) === "CONFIRM";
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const session = await auth();
  if (!session || !hasRole(session.user.role, "ADMIN")) redirect("/dashboard");
  const [t, common, locale, params] = await Promise.all([
    getTranslations("admin"),
    getTranslations("common"),
    getLocale(),
    searchParams,
  ]);
  const query = typeof params.q === "string" ? params.q : "";
  const [users, flags, reserved, catalog, jobs, audit] = await Promise.all([
    api.admin.users({ query }),
    api.admin.flags(),
    api.admin.reservedUsernames(),
    api.admin.catalog(),
    api.admin.jobs(),
    api.admin.audit(),
  ]);
  async function suspend(form: FormData) {
    "use server";
    if (!confirmed(form)) return;
    await api.admin.setSuspended({
      userId: String(form.get("userId")),
      suspended: String(form.get("suspended")) === "true",
      confirmation: "CONFIRM",
    });
    revalidatePath("/admin");
  }
  async function hide(form: FormData) {
    "use server";
    if (!confirmed(form)) return;
    await api.admin.setProfileHidden({
      profileId: String(form.get("profileId")),
      hidden: String(form.get("hidden")) === "true",
      confirmation: "CONFIRM",
    });
    revalidatePath("/admin");
  }
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
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <UserRoundCog className="size-4 text-primary" />
            <h2 className="text-base font-semibold">{t("users")}</h2>
          </div>
          <form className="flex max-w-lg gap-2">
            <Input
              name="q"
              defaultValue={query}
              placeholder={t("searchUsers")}
            />
            <Button variant="secondary">
              <Search />
              {t("search")}
            </Button>
          </form>
          {users.length ? (
            <div className="space-y-3">
              {users.map((user) => (
                <article
                  key={user.id}
                  className="rounded-md border border-border bg-surface-raised p-4 shadow-xs"
                >
                  <div className="flex flex-wrap items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {user.email ?? user.name ?? user.id}
                      </p>
                      <div className="mt-1 flex gap-1">
                        <Badge
                          variant={
                            user.status === "ACTIVE" ? "success" : "danger"
                          }
                        >
                          {user.status}
                        </Badge>
                        <Badge>{user.role}</Badge>
                        {user.subscriptions[0] ? (
                          <Badge variant="primary">
                            {user.subscriptions[0].plan.name}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <form
                      action={suspend}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <input
                        type="hidden"
                        name="suspended"
                        value={String(user.status !== "SUSPENDED")}
                      />
                      <Input
                        className="w-32"
                        name="confirmation"
                        placeholder={t("typeConfirm")}
                        pattern="CONFIRM"
                        required
                      />
                      <Button
                        size="sm"
                        variant={
                          user.status === "SUSPENDED"
                            ? "secondary"
                            : "outlineDanger"
                        }
                      >
                        {user.status === "SUSPENDED"
                          ? t("unsuspend")
                          : t("suspend")}
                      </Button>
                    </form>
                  </div>
                  {user.profiles.length ? (
                    <div className="mt-4 divide-y divide-border-subtle border-t border-border-subtle">
                      {user.profiles.map((profile) => (
                        <div
                          key={profile.id}
                          className="flex flex-wrap items-center gap-2 py-3"
                        >
                          <span className="min-w-0 flex-1 text-sm">
                            olnk.tr/{profile.username}
                          </span>
                          <Badge
                            variant={
                              profile.status === "ACTIVE"
                                ? "success"
                                : "warning"
                            }
                          >
                            {profile.status}
                          </Badge>
                          <form
                            action={hide}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="hidden"
                              name="profileId"
                              value={profile.id}
                            />
                            <input
                              type="hidden"
                              name="hidden"
                              value={String(profile.status !== "HIDDEN")}
                            />
                            <Input
                              className="w-32"
                              name="confirmation"
                              placeholder={t("typeConfirm")}
                              pattern="CONFIRM"
                              required
                            />
                            <Button size="sm" variant="secondary">
                              {profile.status === "HIDDEN"
                                ? t("unhide")
                                : t("hide")}
                            </Button>
                          </form>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t("noUsers")}
            </p>
          )}
        </section>
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
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
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
          </div>
          <div className="space-y-4">
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
          </div>
        </section>
      </div>
    </main>
  );
}
