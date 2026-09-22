# Google SEO and Admin Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 100-row server pagination to the admin user directory and ship correct sitemap, robots, canonical metadata, Search Console verification, and deployment documentation.

**Architecture:** The admin tRPC query returns a typed pagination envelope produced from a shared page-size contract. SEO URL and indexability policy lives in a focused server module consumed by Next.js metadata routes, keeping the database as the source of truth and publication snapshots as the public SEO authority.

**Tech Stack:** Next.js 16 App Router metadata routes, TypeScript, tRPC, Prisma/PostgreSQL, Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-21-google-seo-design.md`

## Global Constraints

- Use `APP_URL` as the trusted canonical origin; never derive canonical URLs from request headers.
- Display exactly 100 users per admin directory page.
- Never index drafts, unlisted/private pages, hidden/moderated profiles, suspended accounts, or snapshots marked `noindex,nofollow`.
- Do not expose secrets or Google verification values to logs.
- Follow the installed Next.js 16.3 metadata route conventions.

---

### Task 1: Admin user pagination

**Files:**
- Modify: `src/server/api/routers/admin.ts`
- Modify: `src/app/admin/page.tsx`
- Create: `src/server/admin/user-pagination.ts`
- Test: `tests/unit/admin/user-pagination.test.ts`

**Interfaces:**
- Produces: `ADMIN_USERS_PAGE_SIZE = 100`, `normalizeAdminUsersPage(page, total)`, and a tRPC result `{ items, page, pageSize, total, pageCount }`.
- Consumes: existing role/status/search filters and Prisma `skip`/`take` pagination.

- [ ] Write failing unit tests for the 100-row contract, page clamping, and previous/next link query preservation.
- [ ] Run `pnpm vitest run tests/unit/admin/user-pagination.test.ts` and confirm failure.
- [ ] Implement pagination helpers, the paginated query envelope, and accessible navigation controls.
- [ ] Re-run the targeted test and confirm success.

### Task 2: SEO policy and metadata routes

**Files:**
- Create: `src/server/seo/policy.ts`
- Create: `src/app/sitemap.xml/route.ts`
- Create: `src/app/sitemaps/[shard]/route.ts`
- Create: `src/server/seo/sitemap.ts`
- Create: `src/app/robots.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/[username]/page.tsx`
- Test: `tests/unit/seo/policy.test.ts`
- Test: `tests/unit/seo/routes.test.ts`
- Test: `tests/unit/seo/sitemap.test.ts`

**Interfaces:**
- Produces: canonical URL helpers, `isSnapshotIndexable`, static sitemap entries, Next.js `MetadataRoute.Sitemap`, and `MetadataRoute.Robots`.
- Consumes: `APP_URL`, active publication rows, account/profile/page status, and validated publication snapshots.

- [ ] Write failing tests for URL normalization, robots exclusions, static entries, and snapshot indexability.
- [ ] Run the targeted SEO tests and confirm failure.
- [ ] Implement the policy module and Next.js metadata routes.
- [ ] Harden public profile metadata with canonical, robots, Open Graph, and Twitter values.
- [ ] Re-run targeted tests and confirm success.

### Task 3: Indexing boundaries and page metadata

**Files:**
- Create: `src/app/admin/layout.tsx`
- Modify: `src/app/dashboard/layout.tsx`
- Create or modify metadata exports for `src/app/features/page.tsx`, `src/app/pricing/page.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/login/page.tsx`, `src/app/onboarding/page.tsx`, and `src/app/verify-request/page.tsx`
- Modify: `src/env.js`
- Modify: `.env.example`
- Test: `tests/unit/env-values.test.ts`

**Interfaces:**
- Produces: optional `GOOGLE_SITE_VERIFICATION`, unique route metadata, and inherited `noindex` metadata for private route trees.
- Consumes: Next.js server-component metadata exports and existing English/Turkish UI catalogs.

- [ ] Add a failing environment/metadata contract test.
- [ ] Add route-specific titles, descriptions, canonicals, and private-route noindex boundaries.
- [ ] Verify each indexable route retains one H1 and logical subordinate headings.

### Task 4: Operations documentation and verification

**Files:**
- Modify: `README.md`
- Create: `docs/seo/google-search-console.md`

**Interfaces:**
- Produces: deployment checklist for HTTPS, Search Console verification, sitemap submission, URL inspection, and PageSpeed/mobile checks.

- [ ] Document exact environment and Google Search Console steps without claiming external registration.
- [ ] Run targeted tests, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- [ ] Start the production app and inspect `/robots.txt`, `/sitemap.xml`, public metadata, and mobile layouts.
- [ ] Review the final diff for secrets, accidental indexing, and unrelated changes.
