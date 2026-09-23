# Block Platform v2 Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the complete Free basic-block catalog and a separately categorized Adult Link that asks for 18+ confirmation before navigation.

**Architecture:** Extend the existing stable block discriminators with focused `FEATURED_LINK`, `BUTTON`, `SPACER`, and `ADULT_LINK` types while evolving legacy basic schemas through defaults. A shared serializable editor catalog drives discovery/defaults, strict server schemas remain authoritative, immutable snapshots drive public metadata, and a small client-only Adult Link component owns session-scoped consent and post-confirmation analytics.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict mode, Prisma/PostgreSQL, Zod, next-intl, Tailwind CSS, Radix dialog primitives, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-23-block-platform-v2-and-adult-links-design.md`

## Global Constraints

- All Basic blocks and Adult Link are available to Free users and consume the existing block-count entitlement only.
- Existing stored and published Link, Text, Heading, Divider, Image, and Socials JSON must continue to parse.
- User HTML, JavaScript, arbitrary iframe markup, and arbitrary remote fetches remain prohibited.
- Adult destinations are never fetched, unfurled, proxied, previewed, or prefetched by OlnkTR.
- Adult consent is session-only, versioned, and scoped to a profile; it is an age declaration, not legal identity verification.
- Draft or disabled Adult Links must not affect live metadata.
- English and Turkish message catalogs must remain key-compatible.
- Follow the repository's existing ownership, publication snapshot, analytics, feature-flag, moderation, and cache boundaries.

---

### Task 1: Versioned basic block schemas and database discriminators

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260923120000_block_platform_v2_phase_1/migration.sql`
- Modify: `src/server/page/block-schemas.ts`
- Test: `tests/domain/basic-blocks-v2.test.ts`

**Interfaces:**
- Produces: `basicIconSchema`, strict parsers for `FEATURED_LINK`, `BUTTON`, `SPACER`, and `ADULT_LINK` through the existing `parseBlockConfig(type, config)` API.
- Produces: backwards-compatible parsed defaults for existing `LINK`, `TEXT`, `DIVIDER`, `IMAGE`, and `SOCIALS` configurations.

- [ ] **Step 1: Write failing schema tests**

Cover legacy Link parsing, curated icons, Featured Link owned-asset references, button global/custom style, bounded Spacer values, Adult Link requiring `attestedAdult: true`, Image decorative-alt rules, Social provider normalization, and rejection of `javascript:`/unknown keys.

```ts
expect(parseBlockConfig("ADULT_LINK", {
  schemaVersion: 1,
  title: "Adults only",
  url: "https://example.com/adult",
  attestedAdult: true,
})).toMatchObject({ schemaVersion: 1, attestedAdult: true });
expect(() => parseBlockConfig("ADULT_LINK", {
  schemaVersion: 1,
  title: "Unsafe",
  url: "javascript:alert(1)",
  attestedAdult: true,
})).toThrow();
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm vitest run tests/domain/basic-blocks-v2.test.ts`  
Expected: FAIL because the new discriminators/schemas do not exist.

- [ ] **Step 3: Add enum values and migration**

Add `FEATURED_LINK`, `BUTTON`, `SPACER`, and `ADULT_LINK` to `BlockType`. The migration uses PostgreSQL `ALTER TYPE "BlockType" ADD VALUE ...` once per value.

- [ ] **Step 4: Implement strict schemas and legacy defaults**

Use schema version `1`, a closed icon enum, bounded strings/numbers, `safeExternalUrlSchema`, and `.strict()`. Extend `validateAssetOwnership` later for `FEATURED_LINK.assetId`; do not accept public asset URLs.

- [ ] **Step 5: Run schema and existing block tests**

Run: `pnpm vitest run tests/domain/basic-blocks-v2.test.ts tests/domain/blocks.test.ts tests/domain/advanced-blocks.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260923120000_block_platform_v2_phase_1/migration.sql src/server/page/block-schemas.ts tests/domain/basic-blocks-v2.test.ts
git commit -m "feat: add validated basic and adult block schemas"
```

### Task 2: Server ownership and publication compatibility

**Files:**
- Modify: `src/server/page/service.ts`
- Modify: `src/server/publishing/snapshot.ts`
- Test: `tests/integration/database.test.ts`
- Test: `tests/domain/publication.test.ts`

**Interfaces:**
- Consumes: `parseBlockConfig(type, config)` from Task 1.
- Produces: `publicationContainsAdultLink(snapshot): boolean` in `src/server/publishing/snapshot.ts`.

- [ ] **Step 1: Write failing ownership and snapshot tests**

Prove that a Featured Link cannot reference another user's asset, legacy snapshots still parse, disabled Adult Links are absent from a built snapshot, and an enabled Adult Link makes `publicationContainsAdultLink` return true.

- [ ] **Step 2: Run the tests and verify RED**

Run: `pnpm vitest run tests/domain/publication.test.ts` plus the database test with `RUN_DB_TESTS=1`.  
Expected: FAIL for missing adult detection and Featured Link asset ownership.

- [ ] **Step 3: Generalize asset-reference validation**

Validate owned ready assets for `IMAGE.assetId` and optional `FEATURED_LINK.assetId`. Keep validation server-side and return `VALIDATION_ERROR` for unavailable assets.

- [ ] **Step 4: Add snapshot adult detection**

```ts
export function publicationContainsAdultLink(
  snapshot: Pick<PublicationSnapshot, "blocks">,
) {
  return snapshot.blocks.some((block) => block.type === "ADULT_LINK");
}
```

The helper receives only parsed active-snapshot blocks; never inspect draft tables from metadata generation.

- [ ] **Step 5: Run tests and verify GREEN**

Run the focused domain and database tests. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/server/page/service.ts src/server/publishing/snapshot.ts tests/domain/publication.test.ts tests/integration/database.test.ts
git commit -m "feat: enforce v2 block publication safety"
```

### Task 3: Serializable editor catalog and categorized picker

**Files:**
- Create: `src/features/editor/block-catalog.ts`
- Modify: `src/features/editor/block-picker.tsx`
- Modify: `src/features/editor/block-labels.ts`
- Modify: `src/features/editor/block-list.tsx`
- Modify: `messages/en.json`
- Modify: `messages/tr.json`
- Test: `tests/unit/editor/block-catalog.test.ts`
- Test: `tests/unit/i18n/catalogs.test.ts`

**Interfaces:**
- Produces: `blockCatalog`, `defaultBlockConfig(type, translate)`, `BlockCategory`, and `EditorBlockPreset`.
- The catalog exposes picker metadata only; Zod and server policy stay out of client bundles.

- [ ] **Step 1: Write a failing catalog test**

Assert unique preset IDs, all Free basic presets, a separate `adult` category, searchable provider/category terms, valid defaults for types that do not require a media selection, and EN/TR catalog parity.

- [ ] **Step 2: Run and verify RED**

Run: `pnpm vitest run tests/unit/editor/block-catalog.test.ts tests/unit/i18n/catalogs.test.ts`  
Expected: FAIL because the catalog and translations are missing.

- [ ] **Step 3: Extract catalog and defaults**

Create categories `basic`, `media`, `contact`, `social`, `monetization`, `professional`, `gaming`, and `adult`. Phase 1 shows implemented Basic and Adult entries; future entries are not rendered as dead controls.

- [ ] **Step 4: Refactor the picker**

Render localized category headings, searchable titles/descriptions/keywords, an `18+` badge, and the adult-policy note. Use explicit property transitions and preserve keyboard focus.

- [ ] **Step 5: Add English and Turkish copy**

Add every visible picker, field, warning, preview, dialog, and error string under `editor`/`publicProfile`; do not place translatable strings in the catalog.

- [ ] **Step 6: Run tests and verify GREEN**

Run the catalog and i18n tests. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/editor/block-catalog.ts src/features/editor/block-picker.tsx src/features/editor/block-labels.ts src/features/editor/block-list.tsx messages/en.json messages/tr.json tests/unit/editor/block-catalog.test.ts tests/unit/i18n/catalogs.test.ts
git commit -m "feat: add categorized v2 block picker"
```

### Task 4: Basic block inspectors and local preview

**Files:**
- Create: `src/features/editor/inspectors/basic-block-inspector.tsx`
- Create: `src/features/editor/preview/basic-block-preview.tsx`
- Modify: `src/features/editor/block-inspector.tsx`
- Modify: `src/features/editor/page-preview.tsx`
- Modify: `src/features/editor/block-card.tsx`
- Modify: `src/features/media/media-picker.tsx`
- Test: `tests/unit/editor/basic-block-ui.test.tsx`

**Interfaces:**
- Consumes: Task 1 config shapes and Task 3 label keys.
- Produces: focused inspector/preview components so the parent editor files remain orchestration boundaries.

- [ ] **Step 1: Write failing component tests**

Test editing Featured Link, Button, Spacer, Adult Link attestation, legacy Link icons, Divider styles, decorative Image semantics, and Social provider rows. Assert changes call `onChange` with complete strict-schema-compatible configs.

- [ ] **Step 2: Run and verify RED**

Run: `pnpm vitest run tests/unit/editor/basic-block-ui.test.tsx`  
Expected: FAIL because focused components do not exist.

- [ ] **Step 3: Implement focused inspectors**

Use existing `Field`, `Input`, `Textarea`, `Select` conventions. Use `MediaPicker` for Image/Featured Link asset selection; never create an Image block with a fake asset ID.

- [ ] **Step 4: Implement instant previews**

Render every Phase 1 basic block from reducer state. Adult previews show a non-interactive 18+ treatment; they do not open external URLs inside the editor.

- [ ] **Step 5: Keep the picker/media flow valid**

For Image and Image Link presets, select/upload a ready asset before calling `onCreate`. Canceling media selection creates nothing.

- [ ] **Step 6: Run tests and verify GREEN**

Run component tests plus `tests/unit/editor/editor-reducer.test.ts`. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/editor/inspectors/basic-block-inspector.tsx src/features/editor/preview/basic-block-preview.tsx src/features/editor/block-inspector.tsx src/features/editor/page-preview.tsx src/features/editor/block-card.tsx src/features/media/media-picker.tsx tests/unit/editor/basic-block-ui.test.tsx
git commit -m "feat: add basic block editing and previews"
```

### Task 5: Public basic renderer and Adult Link consent

**Files:**
- Create: `src/features/public/basic-block.tsx`
- Create: `src/features/public/adult-link-block.tsx`
- Create: `src/features/public/adult-consent.ts`
- Modify: `src/components/public/public-profile.tsx`
- Modify: `src/app/[username]/analytics-beacon.tsx`
- Test: `tests/unit/public/adult-consent.test.ts`
- Test: `tests/unit/public/basic-block.test.tsx`

**Interfaces:**
- Produces: `adultConsentKey(profileId): string`, `hasAdultConsent(storage, profileId): boolean`, and `AdultLinkBlock`.
- Extends `PublicTrackedLink` with optional `rel` and `referrerPolicy` while preserving existing analytics behavior.

- [ ] **Step 1: Write failing consent and renderer tests**

Cover versioned/profile-scoped keys, storage denial fallback, visible 18+ labeling, no eager anchor to the destination before consent, Cancel with zero click events, Confirm with one click event, `nofollow noreferrer noopener`, and focus restoration.

- [ ] **Step 2: Run and verify RED**

Run: `pnpm vitest run tests/unit/public/adult-consent.test.ts tests/unit/public/basic-block.test.tsx`  
Expected: FAIL because public components/helpers are missing.

- [ ] **Step 3: Extract basic public rendering**

Move only Phase 1 basic branches from the large `PublicBlock` function into a focused component. Preserve server rendering for ordinary blocks.

- [ ] **Step 4: Implement Adult Link client boundary**

Render a button before consent. On confirm, write session consent if possible, emit exactly one `BLOCK_CLICK`, and open the validated URL in a new tab using `window.open(url, "_blank", "noopener,noreferrer")`; if blocked, perform same-tab navigation after consent. Never emit on dialog open/cancel.

- [ ] **Step 5: Run tests and verify GREEN**

Run focused tests and existing analytics/publication tests. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/public/basic-block.tsx src/features/public/adult-link-block.tsx src/features/public/adult-consent.ts src/components/public/public-profile.tsx 'src/app/[username]/analytics-beacon.tsx' tests/unit/public/adult-consent.test.ts tests/unit/public/basic-block.test.tsx
git commit -m "feat: gate adult links behind session consent"
```

### Task 6: Published adult metadata and cache correctness

**Files:**
- Modify: `src/app/[username]/page.tsx`
- Modify: `src/server/seo/policy.ts`
- Test: `tests/unit/seo/metadata.test.ts`
- Test: `tests/integration/database.test.ts`

**Interfaces:**
- Consumes: `publicationContainsAdultLink(snapshot)` from Task 2.
- Produces: `adultRatingMetadata(snapshot)` returning `{ rating: "adult" } | undefined` for Next Metadata `other`.

- [ ] **Step 1: Write failing metadata tests**

Prove active published Adult Links emit `<meta name="rating" content="adult">`; ordinary profiles do not; draft, disabled, removed, or unpublished Adult Links do not affect live metadata.

- [ ] **Step 2: Run and verify RED**

Run the SEO test and relevant database publication test. Expected: FAIL for absent adult metadata.

- [ ] **Step 3: Implement snapshot-derived metadata**

Add `other: adult ? { rating: "adult" } : undefined` to public metadata. Do not query draft blocks or change sitemap indexability automatically.

- [ ] **Step 4: Run and verify GREEN**

Run focused SEO/integration tests. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/[username]/page.tsx' src/server/seo/policy.ts tests/unit/seo/metadata.test.ts tests/integration/database.test.ts
git commit -m "feat: label published adult-link profiles"
```

### Task 7: Moderation reasons and feature rollout control

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/migrations/20260923120000_block_platform_v2_phase_1/migration.sql`
- Modify: `src/server/api/routers/moderation.ts`
- Modify: `prisma/seed.ts`
- Modify: `src/server/page/service.ts`
- Test: `tests/domain/moderation.test.ts`
- Test: `tests/integration/database.test.ts`

**Interfaces:**
- Adds report reasons `ADULT_CONTENT`, `EXPLOITATION`, `MINOR_SAFETY`.
- Adds feature flag key `ADULT_LINKS`; block creation/update/publication checks rollout independently of entitlement.

- [ ] **Step 1: Write failing moderation and flag tests**

Test accepted reasons, priority ordering (`MINOR_SAFETY` highest), block/profile ownership, and server rejection when `ADULT_LINKS` is disabled.

- [ ] **Step 2: Run and verify RED**

Run focused domain/integration tests. Expected: FAIL for missing enum values and flag enforcement.

- [ ] **Step 3: Add enum migration, router validation, priority, and seed**

Use PostgreSQL enum additions in the same migration. Seed the flag enabled in development and configurable through the existing database flag administration UI.

- [ ] **Step 4: Enforce the flag server-side**

Creation, update-to-type, and publication of Adult Link call the centralized feature-flag service. Existing saved configuration remains intact when disabled.

- [ ] **Step 5: Run tests and verify GREEN**

Run focused tests and `pnpm prisma validate`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260923120000_block_platform_v2_phase_1/migration.sql prisma/seed.ts src/server/api/routers/moderation.ts src/server/page/service.ts tests/domain/moderation.test.ts tests/integration/database.test.ts
git commit -m "feat: add adult-content moderation controls"
```

### Task 8: End-to-end flow and production verification

**Files:**
- Create: `tests/e2e/adult-link-block.spec.ts`
- Modify: `tests/e2e/advanced-editor.spec.ts`
- Modify: `README.md`
- Modify: `docs/architecture/publication-flow.md`

**Interfaces:**
- Verifies the complete editor → draft → publish → public consent → navigation contract.

- [ ] **Step 1: Write the failing Playwright flow**

Authenticate through the existing Mailpit flow, add an Adult Link from the 18+ category, edit/attest, publish, visit the public profile, cancel once, confirm once, verify a single analytics request, verify same-profile session reuse, and verify another profile is not consented.

- [ ] **Step 2: Run and verify RED**

Run: `pnpm playwright test tests/e2e/adult-link-block.spec.ts` against the documented Docker development stack. Expected: FAIL before final wiring.

- [ ] **Step 3: Complete integration wiring and documentation**

Document Free availability, session consent, SafeSearch rating, moderation limits, migration, and the fact that declaration is not identity verification.

- [ ] **Step 4: Run the full verification matrix**

Run:

```bash
pnpm prisma validate
pnpm prisma generate
pnpm lint
pnpm typecheck
pnpm test
pnpm playwright test tests/e2e/adult-link-block.spec.ts tests/e2e/advanced-editor.spec.ts tests/e2e/seo.spec.ts tests/e2e/locale-switching.spec.ts
pnpm build
docker compose build app worker
```

Expected: every command exits 0. Inspect `/dashboard/page` and a published profile at 390px, 768px, 1280px, in English/Turkish and light/dark mode, with no browser or Next.js runtime errors.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/adult-link-block.spec.ts tests/e2e/advanced-editor.spec.ts README.md docs/architecture/publication-flow.md
git commit -m "test: verify adult link publishing flow"
```
