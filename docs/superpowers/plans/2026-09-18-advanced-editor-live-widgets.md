# Advanced Editor and Live Widgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend OlnkTR with versioned advanced page customization, safe media backgrounds, richer profile presentation, real interactive/live blocks, reliable locale switching, and audited manual Premium grants.

**Architecture:** Preserve the modular Next.js monolith and published-snapshot renderer. Persist creator intent in validated v2 draft JSON, enforce ownership and entitlements during publication, normalize live providers behind same-origin cached adapters, and keep interactive state such as poll votes relational.

**Tech Stack:** Next.js 16.3 App Router, React 19.3, TypeScript 5.9 strict mode, tRPC 11, Prisma 7/PostgreSQL, Redis/BullMQ, Zod 4, next-intl 4, Tailwind CSS 4, Auth.js 5, Vitest 5, Playwright 1.63, S3-compatible/local storage, and FFmpeg-backed media jobs.

**Spec:** `docs/superpowers/specs/2026-09-18-advanced-editor-live-widgets-design.md`

## Global Constraints

- Existing Auth.js, User/Profile/Page ownership, subscription, publishing, storage, analytics, and queue boundaries remain authoritative.
- No arbitrary JavaScript, CSS, HTML, iframe embed, remote font URL, or user-selected server fetch URL.
- Every persisted configuration format has strict Zod validation and an explicit schema version.
- Premium configuration remains stored when inactive; publication and public rendering enforce entitlements server-side.
- Every sensitive admin mutation writes an audit log inside the same transaction.
- All new user-facing strings exist in English and Turkish.
- Public effects honor reduced motion and public live widgets fail independently.
- Every behavior change begins with a failing focused test.

---

### Task 1: Repair locale persistence and provider refresh

**Files:**
- Create: `src/i18n/config.ts`
- Modify: `src/i18n/request.ts`
- Modify: `src/app/actions/preferences.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/shared/locale-menu.tsx`
- Modify: `src/components/shell/command-palette.tsx`
- Test: `tests/unit/i18n/locale.test.ts`
- Test: `tests/e2e/locale-switching.spec.ts`

**Interfaces:**
- Produces: `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `LOCALE_COOKIE_NAME`, `parseLocale(value)`.
- Produces: `setLocalePreference(value): Promise<{ locale: SupportedLocale }>`.

- [x] **Step 1: Write the failing locale unit test**

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, parseLocale } from "~/i18n/config";

describe("locale configuration", () => {
  it("accepts supported locales and falls back safely", () => {
    expect(parseLocale("tr")).toBe("tr");
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("de")).toBe(DEFAULT_LOCALE);
    expect(LOCALE_COOKIE_NAME).toBe("olnk-locale");
  });
});
```

- [x] **Step 2: Run the unit test and confirm the missing-module failure**

Run: `pnpm vitest run tests/unit/i18n/locale.test.ts`

- [x] **Step 3: Implement shared locale configuration**

```ts
export const SUPPORTED_LOCALES = ["en", "tr"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "en";
export const LOCALE_COOKIE_NAME = "olnk-locale";
export function parseLocale(value: unknown): SupportedLocale {
  return value === "tr" || value === "en" ? value : DEFAULT_LOCALE;
}
```

- [x] **Step 4: Make the root provider explicit and make client switching reliable**

Pass `locale={locale}` and `key={locale}` to `NextIntlClientProvider`. After the server action persists the cookie and user preference, locale controls use `window.location.assign(window.location.href)` so the persistent root layout cannot retain the old provider.

- [x] **Step 5: Write and run Playwright locale coverage**

```ts
test("switches English and Turkish across a hard navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Language" }).click();
  await page.getByRole("menuitemradio", { name: "Türkçe" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(page.getByRole("link", { name: "Giriş yap" })).toBeVisible();
});
```

Run: `pnpm vitest run tests/unit/i18n tests/unit/i18n/catalogs.test.ts && PLAYWRIGHT_EXTERNAL_SERVER=1 pnpm playwright test tests/e2e/locale-switching.spec.ts`

### Task 2: Add audited manual month-based Premium grants

**Files:**
- Create: `src/server/billing/manual-subscription.ts`
- Modify: `src/server/api/routers/admin.ts`
- Modify: `src/server/entitlements/service.ts`
- Modify: `src/app/admin/page.tsx`
- Modify: `messages/en.json`
- Modify: `messages/tr.json`
- Test: `tests/domain/manual-subscription.test.ts`
- Test: `tests/integration/database.test.ts`

**Interfaces:**
- Produces: `addUtcCalendarMonths(base: Date, months: number): Date`.
- Produces: `grantManualPremium({ actorId, userId, months, reason }): Promise<Subscription>`.
- Produces: `admin.grantPremiumMonths` requiring `PLAN_MANAGE` and confirmation `CONFIRM`.

- [x] **Step 1: Write failing calendar arithmetic tests**

```ts
import { describe, expect, it } from "vitest";
import { addUtcCalendarMonths } from "~/server/billing/manual-subscription";

describe("manual subscription month arithmetic", () => {
  it("clamps month-end dates instead of overflowing", () => {
    expect(addUtcCalendarMonths(new Date("2026-01-31T12:00:00Z"), 1).toISOString())
      .toBe("2026-02-28T12:00:00.000Z");
  });
});
```

- [x] **Step 2: Run the focused test and confirm the missing implementation**

Run: `pnpm vitest run tests/domain/manual-subscription.test.ts`

- [x] **Step 3: Implement the transactional billing service**

Use a serializable Prisma transaction. Read the target user and Premium plan, find the `manual` subscription, choose `base = max(now, currentPeriodEnd)`, add 1–24 UTC calendar months, upsert the subscription as `ACTIVE`, append `SubscriptionEvent(type: "manual.granted")`, and append `AuditLog(action: "SUBSCRIPTION_MANUAL_GRANT")`. Retry serialization conflicts up to three times.

- [x] **Step 4: Add the protected admin procedure and UI**

The procedure schema is:

```ts
z.object({
  userId: z.string().cuid(),
  months: z.number().int().min(1).max(24),
  reason: z.string().trim().min(3).max(300),
  confirmation: z.literal("CONFIRM"),
})
```

The user detail row receives a month selector, required reason, calculated explanation, and confirmed submit action. The current expiry and resulting expiry render with `Intl.DateTimeFormat`.

- [x] **Step 5: Add concurrency and coexistence database tests**

Run two simultaneous one-month grants and assert the final manual expiry contains both months, two subscription events exist, and an unrelated external active subscription is unchanged.

Run: `RUN_DB_TESTS=1 pnpm vitest run tests/integration/database.test.ts tests/domain/manual-subscription.test.ts`

### Task 3: Introduce ThemeConfig v2 and entitlement requirements

**Files:**
- Create: `src/server/publishing/theme-v2.ts`
- Create: `src/server/publishing/theme-entitlements.ts`
- Modify: `src/server/publishing/snapshot.ts`
- Modify: `src/server/publishing/service.ts`
- Modify: `src/features/editor/editor-reducer.ts`
- Modify: `src/features/editor/appearance-inspector.tsx`
- Modify: `src/features/editor/editor-navigation.tsx`
- Modify: `src/features/editor/page-preview.tsx`
- Modify: `messages/en.json`
- Modify: `messages/tr.json`
- Test: `tests/unit/publishing/theme-v2.test.ts`
- Test: `tests/domain/publication.test.ts`

**Interfaces:**
- Produces: `themeConfigV2Schema`, `ThemeConfigV2`, `migrateThemeConfig(value)`.
- Produces: `requiredThemeFeatures(theme): FeatureKey[]`.
- Produces: `validateThemeEntitlements(userId, theme): Promise<void>`.

- [x] **Step 1: Write failing migration tests**

```ts
it("migrates a v1 theme without changing its visible colors", () => {
  const migrated = migrateThemeConfig(v1Fixture);
  expect(migrated.schemaVersion).toBe(2);
  expect(migrated.colors.background).toBe(v1Fixture.colors.background);
  expect(migrated.typography.heading.family).toBe("geist");
  expect(migrated.effects.layer).toBe("none");
});
```

- [x] **Step 2: Run and confirm the missing v2 module failure**

Run: `pnpm vitest run tests/unit/publishing/theme-v2.test.ts`

- [x] **Step 3: Implement strict v2 schema and migration**

Model bounded unions for page mode, background, overlays, profile layouts, avatar frames, heading/body typography, button shape/style/effect, vibe layer, and branding. Asset-backed backgrounds store media IDs only. Export a single default theme used by onboarding and migration.

- [x] **Step 4: Map Premium configuration to database feature keys**

Map video to `BACKGROUND_VIDEO`, advanced effects to `ADVANCED_ANIMATIONS`, expanded fonts to `CUSTOM_FONT`, Premium palettes/glass to `PREMIUM_THEMES`, branding removal to `REMOVE_BRANDING`, and live widgets to `LIVE_INTEGRATIONS`. Seed the new feature deterministically.

- [x] **Step 5: Enforce configuration during publication**

Collect missing grants before the publication transaction and throw `AppError("FEATURE_NOT_AVAILABLE", ..., { features })`. Draft JSON remains unchanged. Validate background/cover/avatar asset ownership and readiness.

- [x] **Step 6: Build the expanded editor controls and preview**

Add Profile and Effects sections, palette presets, multi-stop/animated gradient controls, glass controls, profile layouts, avatar frames, separate heading/body typography, button styles/effects, page mode, and vibe layers. Keep client preview immediate and autosave debounced.

- [x] **Step 7: Verify schema, editor reducer, and publication gates**

Run: `pnpm vitest run tests/unit/publishing tests/unit/editor tests/domain/publication.test.ts && pnpm typecheck`

### Task 4: Add advanced avatar, background image, and video media workflows

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/*_advanced_media/migration.sql`
- Create: `src/server/media/probe.ts`
- Create: `src/server/media/processing.ts`
- Modify: `src/server/storage/validation.ts`
- Modify: `src/app/api/media/upload/route.ts`
- Modify: `src/server/api/routers/profile.ts`
- Modify: `src/server/api/routers/media.ts`
- Modify: `src/features/media/media-library.tsx`
- Create: `src/features/media/media-picker.tsx`
- Modify: `src/features/settings/profile-settings-form.tsx`
- Modify: `worker/index.ts`
- Modify: `Dockerfile`
- Modify: `.env.example`
- Test: `tests/domain/storage.test.ts`
- Test: `tests/integration/database.test.ts`

**Interfaces:**
- Produces: `profile.setAvatar({ profileId, assetId | null })`.
- Produces: `MediaPicker` returning an owned ready `MediaAsset`.
- Produces: media job `process-video` generating a loop-safe derivative and poster.

- [ ] **Step 1: Write failing avatar ownership and video validation tests**

```ts
it("rejects another user's image as an avatar", async () => {
  await expect(setProfileAvatar(owner.id, profile.id, foreignAsset.id))
    .rejects.toMatchObject({ code: "VALIDATION_ERROR" });
});

it("rejects video over the configured duration", async () => {
  expect(() => validateVideoProbe({ durationSeconds: 31, width: 1280, height: 720 }))
    .toThrow("VIDEO_DURATION_EXCEEDED");
});
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `pnpm vitest run tests/domain/storage.test.ts`

- [ ] **Step 3: Extend media validation and metadata**

Add MP4/WebM upload kinds, processing state, source/derivative relations, duration, and poster asset metadata. Keep generated object keys and signature validation. Add migration and regenerate Prisma Client.

- [ ] **Step 4: Implement the media worker pipeline**

Probe with configured FFmpeg/FFprobe, enforce duration and dimensions, generate a muted H.264 MP4 plus WebP poster, upload through `StorageProvider`, and atomically mark the derivative ready. Record safe failure codes in `JobFailure`.

- [ ] **Step 5: Implement avatar/background media selection UI**

Reuse the media list query and upload endpoint. Filter the picker by image/video purpose, show processing states, allow avatar removal, and update preview immediately. Persist only after ownership-checked mutations.

- [ ] **Step 6: Verify storage, database, worker, and Docker behavior**

Run: `pnpm db:generate && pnpm vitest run tests/domain/storage.test.ts && RUN_DB_TESTS=1 pnpm vitest run tests/integration/database.test.ts && pnpm typecheck`

### Task 5: Add static, interactive, and analytics-backed blocks

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/*_interactive_blocks/migration.sql`
- Modify: `src/server/page/block-schemas.ts`
- Modify: `src/features/editor/block-picker.tsx`
- Modify: `src/features/editor/block-inspector.tsx`
- Modify: `src/features/editor/page-preview.tsx`
- Modify: `src/components/public/public-profile.tsx`
- Create: `src/features/public/countdown-block.tsx`
- Create: `src/features/public/poll-block.tsx`
- Create: `src/server/polls/service.ts`
- Create: `src/app/api/public/polls/[blockId]/route.ts`
- Modify: `messages/en.json`
- Modify: `messages/tr.json`
- Test: `tests/domain/advanced-blocks.test.ts`
- Test: `tests/integration/database.test.ts`

**Interfaces:**
- Adds stable block types: `HIGHLIGHT`, `COUNTDOWN`, `VISITOR_COUNTER`, `SUPPORT`, `POLL`.
- Produces: `submitPollVote(blockId, optionKey, visitorHash)` and aggregate result DTO.

- [ ] **Step 1: Write failing config-schema tests for every new block**

```ts
it("rejects countdown dates without timezone offsets", () => {
  expect(() => parseBlockConfig("COUNTDOWN", { title: "Launch", target: "2026-12-01" }))
    .toThrow();
});

it("requires polls to have 2–6 unique options", () => {
  expect(() => parseBlockConfig("POLL", { question: "Pick", options: ["One"] }))
    .toThrow();
});
```

- [ ] **Step 2: Run and confirm unsupported block failures**

Run: `pnpm vitest run tests/domain/advanced-blocks.test.ts`

- [ ] **Step 3: Add block schemas, editor forms, and previews**

Use safe URL validation for highlight/support links, ISO datetimes for countdown, explicit display modes for counters, and stable generated option keys for polls.

- [ ] **Step 4: Add relational poll votes and protected ingestion**

Store block ID, option key, period, and rotating visitor hash. Add a unique database constraint on `(blockId, visitorHash, periodStart)`. Rate-limit the route and return aggregate counts only.

- [ ] **Step 5: Add public renderers and real analytics counters**

Visitor counters read aggregate analytics rather than incrementing separate fake counters. Countdown hydrates a small client island. Support content renders as text and validated links.

- [ ] **Step 6: Verify block and database behavior**

Run: `pnpm vitest run tests/domain/advanced-blocks.test.ts && RUN_DB_TESTS=1 pnpm vitest run tests/integration/database.test.ts`

### Task 6: Add live integration connection and provider framework

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/*_integration_connections/migration.sql`
- Create: `src/server/integrations/types.ts`
- Create: `src/server/integrations/crypto.ts`
- Create: `src/server/integrations/service.ts`
- Create: `src/server/integrations/providers/lanyard.ts`
- Create: `src/server/integrations/providers/spotify.ts`
- Create: `src/server/integrations/providers/github.ts`
- Create: `src/server/integrations/providers/youtube.ts`
- Create: `src/server/integrations/providers/twitch.ts`
- Create: `src/app/api/integrations/spotify/connect/route.ts`
- Create: `src/app/api/integrations/spotify/callback/route.ts`
- Create: `src/app/api/public/widgets/[blockId]/route.ts`
- Modify: `src/server/queues/index.ts`
- Modify: `worker/index.ts`
- Modify: `src/env.js`
- Modify: `.env.example`
- Test: `tests/domain/integrations.test.ts`

**Interfaces:**
- Produces: `LiveWidgetProvider<TConfig, TPayload>`.
- Produces normalized widget states `AVAILABLE | STALE | UNAVAILABLE | MISCONFIGURED`.
- Produces encrypted `IntegrationConnection` credentials and Spotify connect/disconnect flow.

- [ ] **Step 1: Write failing encryption and normalization tests**

```ts
it("round-trips credentials without storing plaintext", () => {
  const encrypted = encryptCredentials({ accessToken: "secret" }, key);
  expect(encrypted.ciphertext).not.toContain("secret");
  expect(decryptCredentials(encrypted, key)).toEqual({ accessToken: "secret" });
});

it("normalizes an offline Lanyard response", () => {
  expect(lanyardProvider.normalize(offlineFixture).presence).toBe("offline");
});
```

- [ ] **Step 2: Run tests and confirm missing integration modules**

Run: `pnpm vitest run tests/domain/integrations.test.ts`

- [ ] **Step 3: Implement authenticated credential encryption and connection storage**

Use AES-256-GCM with versioned nonce, ciphertext, and auth tag. Require a 32-byte production `INTEGRATION_ENCRYPTION_KEY`. Never return credential payloads from tRPC.

- [ ] **Step 4: Implement fixed-host provider adapters**

Validate only IDs/usernames/channel handles. Use timeouts, response-size limits, Zod response parsing, safe error codes, and provider-specific TTLs. No adapter accepts a user-supplied origin.

- [ ] **Step 5: Implement Spotify OAuth and refresh**

Store single-use OAuth state in Redis, validate callback ownership, encrypt tokens, enqueue refresh before expiry, and support disconnect with credential deletion and audit logging.

- [ ] **Step 6: Implement stale-while-refresh widget delivery**

The public route returns cached normalized data. Missing/freshness-expired data enqueues an idempotent refresh job. Provider failures preserve the last successful payload as `STALE`.

- [ ] **Step 7: Verify provider contracts and environment validation**

Run: `pnpm vitest run tests/domain/integrations.test.ts && pnpm lint && pnpm typecheck`

### Task 7: Add live block UX, page modes, and vibe layers

**Files:**
- Modify: `src/server/page/block-schemas.ts`
- Modify: `src/features/editor/block-picker.tsx`
- Modify: `src/features/editor/block-inspector.tsx`
- Modify: `src/features/editor/page-preview.tsx`
- Modify: `src/components/public/public-profile.tsx`
- Create: `src/features/public/live-widget.tsx`
- Create: `src/features/public/vibe-layer.tsx`
- Create: `src/features/public/background-media.tsx`
- Create: `src/features/settings/integration-settings.tsx`
- Create: `src/app/dashboard/settings/integrations/page.tsx`
- Modify: `src/app/dashboard/settings/layout.tsx`
- Modify: `messages/en.json`
- Modify: `messages/tr.json`
- Test: `tests/unit/editor/live-blocks.test.tsx`
- Test: `tests/e2e/advanced-editor.spec.ts`

**Interfaces:**
- Adds block types `DISCORD_STATUS`, `SPOTIFY_RECENT`, `GITHUB_ACTIVITY`, `VIDEO_FEED`.
- Produces lazy client islands for live widgets and visual effect layers.

- [ ] **Step 1: Write failing editor/public rendering tests**

Assert each live block has a searchable picker entry, validated form, preview placeholder, public loading state, stale state, unavailable state, and keyboard-accessible canonical provider link.

Run: `pnpm vitest run tests/unit/editor/live-blocks.test.tsx`

- [ ] **Step 2: Implement categorized live block editor controls**

Discord accepts numeric user ID; GitHub accepts username; video feed accepts provider plus channel ID; Spotify requires an owned active connection. Display configuration guidance when a provider is disabled.

- [ ] **Step 3: Implement public widget client islands**

Fetch only same-origin routes, poll at bounded intervals while visible, pause in background tabs, and render provider-normalized payloads. Spotify progress is calculated locally between refreshes.

- [ ] **Step 4: Implement mode and vibe renderers**

Use CSS for gradients/waves/stars/snow and a dynamically imported bounded canvas for digital rain. All layers are pointer-inert, pause on hidden documents, and render static fallbacks for reduced motion.

- [ ] **Step 5: Verify editor, public renderer, accessibility, and responsive behavior**

Run: `pnpm vitest run tests/unit/editor tests/unit/publishing && PLAYWRIGHT_EXTERNAL_SERVER=1 pnpm playwright test tests/e2e/advanced-editor.spec.ts`

### Task 8: Subscription-transition enforcement, documentation, and final verification

**Files:**
- Modify: `src/server/billing/service.ts`
- Modify: `worker/index.ts`
- Modify: `src/server/publishing/service.ts`
- Modify: `README.md`
- Modify: `docs/architecture/publication-flow.md`
- Modify: `docs/architecture/premium-entitlement-flow.md`
- Modify: `docs/architecture/background-jobs.md`
- Modify: `.env.example`
- Modify: `tests/e2e/core-flow.spec.ts`

**Interfaces:**
- Produces idempotent job `refresh-publication-entitlements:{userId}`.
- Documents provider setup, encryption keys, FFmpeg, manual grants, media limits, and degraded modes.

- [ ] **Step 1: Write a failing Premium-expiry integration test**

Create a Premium draft using a video background, publish it, expire the subscription, process the entitlement-refresh job, and assert the draft still references the video while the effective public snapshot no longer activates it.

- [ ] **Step 2: Implement idempotent entitlement refresh**

Billing transitions enqueue one job per user and transition timestamp. The worker regenerates effective publication state for active profiles without mutating draft JSON, then invalidates public caches.

- [ ] **Step 3: Update developer and architecture documentation**

Document all new environment variables, provider enablement behavior, OAuth callback URLs, media limits, FFmpeg requirements, entitlement mapping, manual-grant semantics, migrations, queues, and tests.

- [ ] **Step 4: Run clean-database and seed verification**

Run migrations against a fresh PostgreSQL database, run `pnpm db:seed`, and verify Free/Premium/LIVE_INTEGRATIONS entitlements and default flags.

- [ ] **Step 5: Run all code-quality gates**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`

- [ ] **Step 6: Run application compatibility gates**

Run: `RUN_DB_TESTS=1 pnpm vitest run tests/integration/database.test.ts`  
Run: `pnpm test:e2e`  
Run: `docker compose build app worker`  
Run app, worker, PostgreSQL, Redis, and Mailpit; verify readiness, one background media job, one analytics event, one manual grant, and the critical publish flow.

- [ ] **Step 7: Perform visual and accessibility audits**

Inspect English/Turkish, light/dark/system, reduced motion, keyboard operation, and 375/390/768/1024/1280/1440 widths. Confirm there are no dead controls, untranslated significant strings, horizontal page overflow, inaccessible dialogs, or public-page console errors.
