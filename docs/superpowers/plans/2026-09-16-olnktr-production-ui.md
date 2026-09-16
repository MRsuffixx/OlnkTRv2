# OlnkTR Production UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a polished, responsive, multilingual production interface for every existing OlnkTR product flow without replacing its backend architecture.

**Architecture:** Preserve App Router Server Components for layouts and data reads, then add focused client islands for interactive shell controls, charts, overlays, uploads, and the editor. Extend the backend only with ownership-checked draft, media, and domain procedures required by the UI, while publishing and entitlements remain server-authoritative.

**Tech Stack:** Next.js 16.3 App Router, React 19.3, TypeScript 5.9 strict mode, Tailwind CSS 4, next-intl, tRPC, Prisma, Radix UI, Lucide, dnd-kit, Recharts, next-themes, cmdk, Sonner, Vitest, and Playwright.

**Spec:** `docs/superpowers/specs/2026-09-16-olnktr-production-ui-design.md`

## Global Constraints

- Read relevant installed Next.js 16.3 documentation before using App Router APIs.
- Preserve Auth.js, entitlement, billing, publishing, storage, worker, and analytics-ingestion behavior.
- Pages and layouts remain Server Components unless browser state or event handling requires a client boundary.
- All authenticated mutations re-check session, account state, ownership, validation, and entitlement on the server.
- All significant application copy is present in both English and Turkish catalogs.
- No production fixture metrics, fake activity, fake billing history, or inert controls.
- Light, dark, system, reduced-motion, keyboard, mobile, tablet, and desktop states are first-class.
- Never use arbitrary user JavaScript or unsanitized HTML.

---

### Task 1: Dependency and framework baseline

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/lib/cn.ts`
- Create: `tests/unit/ui/cn.test.ts`

**Interfaces:**
- Consumes: the existing Tailwind 4 and App Router configuration.
- Produces: `cn(...inputs: ClassValue[]): string` and installed UI dependencies for later tasks.

- [ ] **Step 1: Verify package guidance**

Read the installed Next.js documentation for layouts, loading UI, Server/Client Components, forms, linking, and lazy loading. Check the official package documentation and stable releases for Radix primitives, Lucide, dnd-kit, Recharts, next-themes, cmdk, Sonner, class-variance-authority, clsx, and tailwind-merge.

- [ ] **Step 2: Write the failing utility test**

```ts
import { describe, expect, it } from "vitest";
import { cn } from "~/lib/cn";

describe("cn", () => {
  it("merges semantic utilities and resolves Tailwind conflicts", () => {
    expect(cn("px-2 text-sm", false && "hidden", "px-4")).toBe(
      "text-sm px-4",
    );
  });
});
```

- [ ] **Step 3: Run the test and confirm the missing module failure**

Run: `pnpm vitest run tests/unit/ui/cn.test.ts`

- [ ] **Step 4: Install the reviewed dependencies and implement `cn`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Verify the utility and dependency graph**

Run: `pnpm vitest run tests/unit/ui/cn.test.ts && pnpm typecheck`

### Task 2: Semantic design system and providers

**Files:**
- Modify: `src/styles/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/components/providers/app-providers.tsx`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/avatar.tsx`
- Create: `src/components/ui/skeleton.tsx`
- Create: `src/components/ui/empty-state.tsx`
- Create: `src/components/ui/separator.tsx`
- Create: `src/components/ui/progress.tsx`
- Create: `src/components/ui/field.tsx`
- Create: `tests/unit/ui/button-variants.test.ts`

**Interfaces:**
- Consumes: `cn` from Task 1.
- Produces: semantic CSS variables, `AppProviders`, and stable UI primitives used by every screen.

- [ ] **Step 1: Write failing variant tests**

```ts
import { describe, expect, it } from "vitest";
import { buttonVariants } from "~/components/ui/button";

describe("buttonVariants", () => {
  it("uses semantic primary styles and an explicit focus ring", () => {
    const classes = buttonVariants({ variant: "primary", size: "md" });
    expect(classes).toContain("bg-primary");
    expect(classes).toContain("focus-visible:ring-focus");
    expect(classes).not.toContain("transition-all");
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails because the component is absent**

Run: `pnpm vitest run tests/unit/ui/button-variants.test.ts`

- [ ] **Step 3: Implement tokens and primitives**

Define light and dark semantic tokens for background, foreground, surfaces, borders, primary states, feedback colors, sidebar colors, radii, shadows, focus, and motion. Implement variants with class-variance-authority and property-specific transitions.

- [ ] **Step 4: Add theme and toast providers**

```tsx
"use client";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster richColors={false} position="bottom-right" />
    </ThemeProvider>
  );
}
```

- [ ] **Step 5: Verify tokens and primitives**

Run: `pnpm vitest run tests/unit/ui && pnpm lint && pnpm typecheck`

### Task 3: Accessible overlay and control primitives

**Files:**
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/alert-dialog.tsx`
- Create: `src/components/ui/sheet.tsx`
- Create: `src/components/ui/dropdown-menu.tsx`
- Create: `src/components/ui/tooltip.tsx`
- Create: `src/components/ui/popover.tsx`
- Create: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/switch.tsx`
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/slider.tsx`
- Create: `src/components/ui/segmented-control.tsx`
- Create: `src/components/ui/icon-button.tsx`
- Create: `tests/e2e/ui-primitives.spec.ts`

**Interfaces:**
- Consumes: Task 2 tokens and button/field primitives.
- Produces: accessible overlays and controls with consistent animation and mobile behavior.

- [ ] **Step 1: Write failing browser coverage**

```ts
test("dialog traps focus and closes with Escape", async ({ page }) => {
  await page.goto("/test/ui");
  await page.getByRole("button", { name: "Open dialog" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});
```

- [ ] **Step 2: Run the focused E2E and confirm the test route is missing**

Run: `pnpm playwright test tests/e2e/ui-primitives.spec.ts`

- [ ] **Step 3: Implement Radix-based primitives and a development-only test route**

Use Radix focus management, portals, labels, and keyboard behavior. Style all overlays through semantic tokens. Remove the test route after the interaction suite is migrated to production screens.

- [ ] **Step 4: Verify keyboard and reduced-motion behavior**

Run: `pnpm playwright test tests/e2e/ui-primitives.spec.ts && pnpm typecheck`

### Task 4: Translation catalog and locale/theme controls

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/tr.json`
- Create: `src/lib/navigation.ts`
- Create: `src/components/shared/locale-menu.tsx`
- Create: `src/components/shared/theme-menu.tsx`
- Create: `src/app/actions/preferences.ts`
- Create: `tests/unit/ui/navigation.test.ts`

**Interfaces:**
- Consumes: the existing `olnk-locale` cookie convention.
- Produces: `dashboardNavigation`, authenticated locale persistence, and reusable appearance controls.

- [ ] **Step 1: Write failing navigation tests**

```ts
import { describe, expect, it } from "vitest";
import { dashboardNavigation, isNavigationItemActive } from "~/lib/navigation";

describe("dashboardNavigation", () => {
  it("matches nested settings routes without activating dashboard root", () => {
    expect(isNavigationItemActive("/dashboard/settings/security", "/dashboard/settings")).toBe(true);
    expect(isNavigationItemActive("/dashboard/analytics", "/dashboard")).toBe(false);
    expect(dashboardNavigation.flatMap((group) => group.items)).toHaveLength(7);
  });
});
```

- [ ] **Step 2: Run the test and confirm the helper is missing**

Run: `pnpm vitest run tests/unit/ui/navigation.test.ts`

- [ ] **Step 3: Implement navigation metadata, locale action, and menus**

The locale action accepts only `en` or `tr`, updates the cookie, updates the authenticated user preference when present, and refreshes the current route. Theme state is stored by next-themes and exposes Light, Dark, and System.

- [ ] **Step 4: Expand both catalogs with identical namespace keys**

Add `common`, `navigation`, `dashboard`, `editor`, `analytics`, `media`, `domains`, `billing`, `settings`, `auth`, `marketing`, and `errors`. Verify key parity with a unit test that recursively compares both JSON structures.

- [ ] **Step 5: Verify translations**

Run: `pnpm vitest run tests/unit/ui/navigation.test.ts tests/unit/i18n/catalogs.test.ts`

### Task 5: Persistent responsive dashboard shell

**Files:**
- Modify: `src/app/dashboard/layout.tsx`
- Create: `src/components/shell/dashboard-shell.tsx`
- Create: `src/components/shell/sidebar.tsx`
- Create: `src/components/shell/mobile-navigation.tsx`
- Create: `src/components/shell/top-bar.tsx`
- Create: `src/components/shell/account-menu.tsx`
- Create: `src/components/shell/command-palette.tsx`
- Create: `src/app/dashboard/loading.tsx`
- Create: `src/app/dashboard/error.tsx`
- Create: `tests/e2e/dashboard-shell.spec.ts`

**Interfaces:**
- Consumes: authenticated session/profile/entitlement summaries plus Tasks 2–4.
- Produces: a persistent responsive shell and command registry for all dashboard routes.

- [ ] **Step 1: Write failing shell E2E coverage**

```ts
test("sidebar stays mounted and remembers collapse state", async ({ page }) => {
  await signInTestUser(page);
  await page.goto("/dashboard");
  const sidebar = page.getByTestId("dashboard-sidebar");
  await sidebar.getByRole("button", { name: "Collapse sidebar" }).click();
  await page.getByRole("link", { name: "Analytics" }).click();
  await expect(sidebar).toHaveAttribute("data-collapsed", "true");
});
```

- [ ] **Step 2: Run the E2E and observe the missing shell behavior**

Run: `pnpm playwright test tests/e2e/dashboard-shell.spec.ts`

- [ ] **Step 3: Implement the server layout and focused client islands**

Fetch session, first profile, and entitlements in parallel. Pass only display identity, username, plan key, and role to the shell. Keep children as server-rendered content.

- [ ] **Step 4: Implement command palette commands**

Register navigation plus Add Link, Upload Media, Preview, Publish, Copy Profile URL, Theme, and Language. Commands unavailable in the current route remain absent rather than inert.

- [ ] **Step 5: Verify desktop, keyboard, and mobile navigation**

Run: `pnpm playwright test tests/e2e/dashboard-shell.spec.ts --project=chromium`

### Task 6: Dashboard overview and analytics presentation

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/analytics/page.tsx`
- Modify: `src/server/api/routers/analytics.ts`
- Create: `src/components/dashboard/metric.tsx`
- Create: `src/components/dashboard/profile-summary.tsx`
- Create: `src/features/analytics/performance-chart.tsx`
- Create: `src/features/analytics/date-range-filter.tsx`
- Create: `src/features/analytics/top-blocks.tsx`
- Create: `src/lib/analytics.ts`
- Create: `tests/unit/ui/analytics.test.ts`

**Interfaces:**
- Consumes: `analytics.summary`, profiles, and publications.
- Produces: `fillAnalyticsSeries(rows, days, now)` and real overview/analytics screens.

- [ ] **Step 1: Write the failing series test**

```ts
it("fills missing UTC days with zeroes", () => {
  expect(fillAnalyticsSeries([], 3, new Date("2026-09-16T12:00:00Z"))).toEqual([
    { date: "2026-09-14", views: 0, uniqueViews: 0, clicks: 0 },
    { date: "2026-09-15", views: 0, uniqueViews: 0, clicks: 0 },
    { date: "2026-09-16", views: 0, uniqueViews: 0, clicks: 0 },
  ]);
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `pnpm vitest run tests/unit/ui/analytics.test.ts`

- [ ] **Step 3: Implement normalized analytics display data and real screens**

Use Recharts only inside the chart client component. Dynamic-import the chart from its route. Use locale-aware formatters and a single accent series. Render an actionable empty state when every metric is zero.

- [ ] **Step 4: Add privacy-safe breakdown reads when retained events exist**

Extend the analytics query response with grouped `country`, `deviceCategory`, and `referrerHost` counts scoped to the authenticated user and selected retention period. Do not expose IP hashes or raw user-agent strings.

- [ ] **Step 5: Verify analytics**

Run: `pnpm vitest run tests/unit/ui/analytics.test.ts tests/integration/analytics.test.ts && pnpm typecheck`

### Task 7: Draft/theme API and schema compatibility

**Files:**
- Modify: `src/server/publishing/snapshot.ts`
- Modify: `src/server/page/service.ts`
- Modify: `src/server/api/routers/page.ts`
- Create: `src/features/editor/theme-schema.ts`
- Create: `tests/unit/publishing/theme-config.test.ts`
- Create: `tests/integration/page-draft.test.ts`

**Interfaces:**
- Consumes: existing `PageDraft`, publication snapshot, and page ownership rules.
- Produces: `normalizeThemeConfig`, `getOwnedDraft`, and `updateDraft` with version-1-compatible optional presentation fields.

- [ ] **Step 1: Write failing backward-compatibility tests**

```ts
it("adds defaults to the original minimal version-one theme", () => {
  expect(normalizeThemeConfig({
    schemaVersion: 1,
    colors: { background: "#ffffff", text: "#111111" },
  }).layout.alignment).toBe("center");
});
```

- [ ] **Step 2: Run unit and integration tests and confirm missing behavior**

Run: `pnpm vitest run tests/unit/publishing/theme-config.test.ts tests/integration/page-draft.test.ts`

- [ ] **Step 3: Implement the compatible schema and ownership-checked service**

The update input accepts page title, description, visibility, validated theme configuration, and validated SEO configuration. A transaction updates `Page` and `PageDraft`; it cannot change profile ownership or publication rows.

- [ ] **Step 4: Add protected tRPC queries and mutations**

```ts
draft: protectedProcedure
  .input(z.object({ pageId: z.string().cuid() }))
  .query(({ ctx, input }) => getOwnedDraft(ctx.session.user.id, input.pageId)),
updateDraft: protectedProcedure
  .input(updateDraftInputSchema)
  .mutation(({ ctx, input }) => updateDraft(ctx.session.user.id, input)),
```

- [ ] **Step 5: Verify old snapshots and new drafts**

Run: `pnpm vitest run tests/unit/publishing tests/integration/page-draft.test.ts tests/integration/publishing.test.ts`

### Task 8: Professional page editor

**Files:**
- Create: `src/app/dashboard/page/page.tsx`
- Modify: `src/app/dashboard/content/page.tsx`
- Create: `src/features/editor/editor.tsx`
- Create: `src/features/editor/editor-reducer.ts`
- Create: `src/features/editor/editor-header.tsx`
- Create: `src/features/editor/editor-navigation.tsx`
- Create: `src/features/editor/block-list.tsx`
- Create: `src/features/editor/block-card.tsx`
- Create: `src/features/editor/block-picker.tsx`
- Create: `src/features/editor/block-inspector.tsx`
- Create: `src/features/editor/appearance-inspector.tsx`
- Create: `src/features/editor/page-preview.tsx`
- Create: `src/features/editor/actions.ts`
- Create: `tests/unit/editor/editor-reducer.test.ts`
- Modify: `tests/e2e/application-flow.spec.ts`

**Interfaces:**
- Consumes: Task 7 draft API, existing block services, publication service, media data, and entitlements.
- Produces: immediate local preview, debounced autosave, accessible reordering, block CRUD, preview devices, and explicit publishing.

- [ ] **Step 1: Write failing reducer tests**

```ts
it("marks a local edit dirty without changing the confirmed snapshot", () => {
  const next = editorReducer(initialState, {
    type: "block.updated",
    blockId: "block-1",
    config: { title: "Portfolio", url: "https://example.com" },
  });
  expect(next.saveStatus).toBe("dirty");
  expect(next.confirmed.blocks[0]?.config).not.toEqual(next.draft.blocks[0]?.config);
});
```

- [ ] **Step 2: Run reducer tests and confirm failure**

Run: `pnpm vitest run tests/unit/editor/editor-reducer.test.ts`

- [ ] **Step 3: Implement the editor reducer and server-action bridge**

Actions authenticate independently and return discriminated results:

```ts
type EditorActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: string; message: string };
```

Autosave debounces draft-level edits, marks `saving`, promotes server-confirmed state to `saved`, and keeps local state on failure.

- [ ] **Step 4: Implement block picker, list, inspector, and drag controls**

Render only registered block types. Pointer and keyboard sensors update local order immediately and persist the full ordered ID list. Visible overflow actions provide Edit, Duplicate, Hide/Show, Analytics, and Delete.

- [ ] **Step 5: Implement responsive preview and appearance controls**

Preview uses normalized theme defaults and the same block renderer as public pages. Device selection is Mobile, Tablet, or Desktop; zoom supports Fit, 75%, 100%, and 125%.

- [ ] **Step 6: Preserve the legacy content URL**

Make `/dashboard/content` redirect to `/dashboard/page` while updating existing Playwright expectations to use the canonical route.

- [ ] **Step 7: Verify editor behavior**

Run: `pnpm vitest run tests/unit/editor tests/unit/publishing && pnpm playwright test tests/e2e/application-flow.spec.ts`

### Task 9: Media library and upload UX

**Files:**
- Create: `src/server/media/service.ts`
- Create: `src/server/api/routers/media.ts`
- Modify: `src/server/api/root.ts`
- Create: `src/app/dashboard/media/page.tsx`
- Create: `src/features/media/media-library.tsx`
- Create: `src/features/media/upload-zone.tsx`
- Create: `src/features/media/media-details.tsx`
- Create: `tests/integration/media-library.test.ts`
- Create: `tests/e2e/media.spec.ts`

**Interfaces:**
- Consumes: existing upload route, `MediaAsset`, storage provider, and entitlement enforcement.
- Produces: paginated owned-asset listing, deletion, filtering, selection, and real upload progress.

- [ ] **Step 1: Write failing ownership integration tests**

```ts
it("does not list or delete another user's media asset", async () => {
  const page = await listMedia(ownerA.id, { cursor: undefined, kind: "ALL" });
  expect(page.items).not.toContainEqual(expect.objectContaining({ ownerId: ownerB.id }));
  await expect(deleteMedia(ownerA.id, ownerBAsset.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
});
```

- [ ] **Step 2: Run the focused integration test and confirm missing service failure**

Run: `pnpm vitest run tests/integration/media-library.test.ts`

- [ ] **Step 3: Implement listing and deletion services**

Delete storage objects through `StorageProvider.deleteObject` before marking the asset `DELETED`. Return only ready owned assets, stable cursor pagination, MIME category, size, dimensions, timestamps, and application media URLs.

- [ ] **Step 4: Implement media UI and XHR upload progress**

Use the existing `/api/media/upload` endpoint. Reject unsupported files before network transfer while preserving server signature validation as authority.

- [ ] **Step 5: Verify upload, selection, and deletion**

Run: `pnpm vitest run tests/integration/media-library.test.ts && pnpm playwright test tests/e2e/media.spec.ts`

### Task 10: Custom domains and billing

**Files:**
- Create: `src/server/domains/service.ts`
- Create: `src/server/api/routers/domains.ts`
- Modify: `src/server/api/root.ts`
- Create: `src/app/dashboard/domains/page.tsx`
- Create: `src/features/domains/domain-list.tsx`
- Modify: `src/app/dashboard/billing/page.tsx`
- Create: `src/features/billing/plan-summary.tsx`
- Create: `src/features/billing/usage-list.tsx`
- Create: `tests/integration/domains.test.ts`

**Interfaces:**
- Consumes: `CustomDomain`, feature flags, entitlements, subscription, and development billing.
- Produces: safe domain normalization/list/add/remove and accurate billing/usage presentation.

- [ ] **Step 1: Write failing domain validation and entitlement tests**

```ts
it("rejects private, URL-shaped, and unentitled custom domains", async () => {
  await expect(addDomain(freeUser.id, profile.id, "https://example.com/path"))
    .rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  await expect(addDomain(freeUser.id, profile.id, "example.com"))
    .rejects.toMatchObject({ code: "FEATURE_NOT_AVAILABLE" });
});
```

- [ ] **Step 2: Run the test and confirm missing service failure**

Run: `pnpm vitest run tests/integration/domains.test.ts`

- [ ] **Step 3: Implement ownership, normalization, flags, entitlements, and audit events**

Normalize hostnames using the URL parser with an artificial HTTPS scheme, reject credentials/ports/paths/IP literals/local hostnames, lowercase and IDNA-normalize, and rely on the unique database constraint for races.

- [ ] **Step 4: Implement domains and billing screens**

Render persisted status only. Pending domains show actual expected CNAME instructions. Development checkout is labeled and rendered only outside production. Missing invoice history is not simulated.

- [ ] **Step 5: Verify domain and billing behavior**

Run: `pnpm vitest run tests/integration/domains.test.ts tests/unit/entitlements && pnpm typecheck`

### Task 11: Settings, sessions, profile, and account safety

**Files:**
- Create: `src/app/dashboard/settings/layout.tsx`
- Modify: `src/app/dashboard/settings/page.tsx`
- Create: `src/app/dashboard/settings/profile/page.tsx`
- Create: `src/app/dashboard/settings/account/page.tsx`
- Create: `src/app/dashboard/settings/security/page.tsx`
- Create: `src/app/dashboard/settings/notifications/page.tsx`
- Create: `src/app/dashboard/settings/appearance/page.tsx`
- Modify: `src/app/dashboard/profile/page.tsx`
- Modify: `src/app/dashboard/security/page.tsx`
- Create: `src/features/settings/settings-navigation.tsx`
- Create: `src/features/settings/profile-form.tsx`
- Create: `src/features/settings/session-list.tsx`
- Create: `src/features/settings/delete-account-dialog.tsx`
- Create: `tests/e2e/settings.spec.ts`

**Interfaces:**
- Consumes: existing account, profile, session, and deletion procedures.
- Produces: structured settings flows with confirmation and localized action feedback.

- [ ] **Step 1: Write failing E2E behavior for profile and session actions**

```ts
test("profile validation remains adjacent and session revocation updates the list", async ({ page }) => {
  await signInTestUser(page);
  await page.goto("/dashboard/settings/profile");
  await page.getByLabel("Display name").fill("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Display name is required")).toBeVisible();
});
```

- [ ] **Step 2: Run the focused E2E and confirm the routes are missing**

Run: `pnpm playwright test tests/e2e/settings.spec.ts`

- [ ] **Step 3: Implement settings layout and forms**

Use React Hook Form with Zod for interactive validation. Server actions remain authoritative and return field errors. Destructive actions use AlertDialog and type-specific confirmation text.

- [ ] **Step 4: Redirect legacy profile and security routes**

Use App Router `redirect` to canonical settings URLs and preserve bookmarks without duplicating screen implementations.

- [ ] **Step 5: Verify settings**

Run: `pnpm playwright test tests/e2e/settings.spec.ts && pnpm typecheck`

### Task 12: Passwordless authentication and onboarding UI

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/verify-request/page.tsx`
- Modify: `src/app/onboarding/page.tsx`
- Create: `src/features/auth/auth-card.tsx`
- Create: `src/features/auth/login-form.tsx`
- Create: `src/features/auth/onboarding-form.tsx`
- Create: `src/features/auth/username-field.tsx`
- Modify: `tests/e2e/application-flow.spec.ts`

**Interfaces:**
- Consumes: existing Auth.js magic-link/Google actions, username availability, and transactional onboarding service.
- Produces: polished enumeration-safe authentication and responsive onboarding.

- [ ] **Step 1: Add failing E2E expectations for accessible auth fields and onboarding progress**

```ts
await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
await expect(page.getByLabel("Email address")).toBeEditable();
await expect(page.getByText("Step 1 of 2")).toBeVisible();
```

- [ ] **Step 2: Run the authentication flow and confirm copy/layout expectations fail**

Run: `pnpm playwright test tests/e2e/application-flow.spec.ts`

- [ ] **Step 3: Implement translated authentication and onboarding screens**

Keep sign-in actions on the server. Disable duplicate submissions with `useActionState` and `useFormStatus`. Preserve the generic verification response for every email.

- [ ] **Step 4: Verify new/existing user flows and suspended denial**

Run: `pnpm playwright test tests/e2e/application-flow.spec.ts && pnpm vitest run tests/integration/auth.test.ts`

### Task 13: Public renderer and application error states

**Files:**
- Modify: `src/app/[username]/page.tsx`
- Create: `src/features/public-profile/block-renderer.tsx`
- Create: `src/features/public-profile/public-profile.tsx`
- Create: `src/app/not-found.tsx`
- Create: `src/app/global-error.tsx`
- Create: `src/app/dashboard/not-found.tsx`
- Create: `src/app/dashboard/page/loading.tsx`
- Create: `src/app/dashboard/analytics/loading.tsx`
- Create: `src/app/dashboard/media/loading.tsx`
- Create: `src/app/dashboard/billing/loading.tsx`
- Create: `tests/unit/ui/public-profile.test.ts`

**Interfaces:**
- Consumes: normalized publication snapshots and analytics beacons.
- Produces: lightweight renderers for all supported published blocks and branded error/loading states.

- [ ] **Step 1: Write failing block-renderer mapping tests**

```ts
it.each(["LINK", "TEXT", "HEADING", "DIVIDER", "IMAGE", "SOCIALS"])(
  "registers the %s public block",
  (type) => expect(publicBlockRenderers.has(type)).toBe(true),
);
```

- [ ] **Step 2: Run the focused test and confirm missing registry failure**

Run: `pnpm vitest run tests/unit/ui/public-profile.test.ts`

- [ ] **Step 3: Implement shared preview/public block renderers**

Render sanitized validated snapshot values only. Continue click analytics for actionable blocks. Images use owned media URLs and dimensions when available.

- [ ] **Step 4: Implement route-level loading, not-found, and error UI**

Use skeletons matching final dimensions. Error boundaries expose retry but not internal messages or stack traces.

- [ ] **Step 5: Verify public rendering and metadata**

Run: `pnpm vitest run tests/unit/ui/public-profile.test.ts tests/integration/publishing.test.ts && pnpm build`

### Task 14: Marketing site and legal routes

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/features/page.tsx`
- Create: `src/app/pricing/page.tsx`
- Create: `src/app/legal/privacy/page.tsx`
- Create: `src/app/legal/terms/page.tsx`
- Create: `src/components/marketing/marketing-header.tsx`
- Create: `src/components/marketing/product-preview.tsx`
- Create: `src/components/marketing/feature-section.tsx`
- Create: `src/components/marketing/pricing-section.tsx`
- Create: `tests/e2e/marketing.spec.ts`

**Interfaces:**
- Consumes: design tokens, translation catalogs, and database-backed plan information where available.
- Produces: coherent public marketing, feature, pricing, and legal entry points.

- [ ] **Step 1: Write failing marketing navigation tests**

```ts
test("marketing navigation reaches features, pricing, and passwordless login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("One beautiful link");
  await expect(page.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "/pricing");
});
```

- [ ] **Step 2: Run the E2E and confirm missing routes/copy**

Run: `pnpm playwright test tests/e2e/marketing.spec.ts`

- [ ] **Step 3: Implement marketing pages from real product capabilities**

Use semantic HTML, compact responsive product previews, and restrained motion. Pricing reads seeded active plans and entitlements on the server rather than duplicating feature truth in React constants.

- [ ] **Step 4: Verify marketing routes and responsive behavior**

Run: `pnpm playwright test tests/e2e/marketing.spec.ts`

### Task 15: Full interaction, accessibility, and visual audit

**Files:**
- Modify: files identified by the audit only.
- Modify: `tests/e2e/application-flow.spec.ts`
- Create: `tests/e2e/responsive-ui.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: all preceding tasks.
- Produces: verified production UI, documented frontend architecture, and recorded limitations.

- [ ] **Step 1: Start the real development stack**

Run PostgreSQL and Redis, apply migrations, seed the database, start the worker, and start `next dev --turbopack`. Preserve the running `.next` directory throughout runtime inspection.

- [ ] **Step 2: Verify Next.js runtime introspection**

Use `/_next/mcp` to confirm `get_compilation_issues`, Turbopack availability, route inventory, runtime errors, and page metadata.

- [ ] **Step 3: Run agent-browser interaction audits**

Inspect authenticated and public routes at 375, 390, 768, 1024, 1280, and 1440 pixels in English/Turkish and light/dark. Exercise sidebar persistence, mobile sheet, command palette, editor selection, drag/reorder, autosave, publishing, upload, dialogs, menus, settings, and sign out.

- [ ] **Step 4: Run the current Web Interface Guidelines review**

Fetch the latest rules from the Vercel guideline source, audit changed UI files, and fix every applicable high-confidence accessibility or interaction issue.

- [ ] **Step 5: Run fresh complete verification**

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

- [ ] **Step 6: Update documentation with exact verified commands and external limitations**

Document theme behavior, translations, frontend structure, media limitations, domain verification limitations, and any integration that still requires SMTP, Google OAuth, S3, or external DNS infrastructure.
