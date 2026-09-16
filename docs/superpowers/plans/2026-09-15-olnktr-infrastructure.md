# OlnkTR Infrastructure Implementation Plan

> **For agentic workers:** Execute inline in dependency order. Each behavioral task begins with a failing Vitest or Playwright test and ends with focused plus full verification.

**Goal:** Deliver the production-oriented infrastructure foundation described in the OlnkTR product specification.

**Architecture:** A Next.js modular monolith owns synchronous domain workflows while a BullMQ worker handles email, analytics, billing, media, and maintenance jobs. PostgreSQL remains authoritative; Redis, SMTP, and object storage are accessed through narrow adapters.

**Tech Stack:** Next.js 16, TypeScript, tRPC 11, Auth.js 5, Prisma 7/PostgreSQL, Redis/BullMQ, next-intl, Tailwind 4, Vitest, Playwright, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-09-15-olnktr-infrastructure-design.md`

## Global constraints

- Passwordless authentication only; no password fields or hashes.
- User, Profile, and Page remain separate relational entities.
- All ownership, role, account-state, entitlement, and upload checks execute server-side.
- Published pages read immutable snapshots, never editing tables.
- Secrets and raw authentication tokens never enter logs or browser bundles.
- PostgreSQL is the source of truth; Redis contains disposable derived state.

## Delivery tasks

- [ ] Foundation: pin compatible dependencies; strict environment groups; Prisma 7 client; Redis, logging, normalized errors, security headers, health endpoints, Docker services, and worker bootstrap.
- [ ] Identity: schema and migration for Auth.js; SMTP mail provider and templates; magic link plus optional Google; database sessions; account-state guard; onboarding transaction; session APIs.
- [ ] Core domain: username policy and reservation table; Profile/Page ownership; typed block schemas and CRUD/reorder; versioned theme and SEO schemas; custom-domain foundation.
- [ ] SaaS platform: Plan/Feature/Entitlement/Subscription/Usage models; centralized resolver; feature flags; development billing provider; normalized idempotent webhook pipeline.
- [ ] Publishing: draft validation, atomic monotonic versions, entitlement filtering, active publication pointer, cache invalidation, rollback-ready versions, cached public resolver.
- [ ] Platform services: local and S3 storage adapters; signature-aware media validation; BullMQ queues; privacy-conscious analytics ingestion and aggregation; audit/security events; deletion jobs.
- [ ] Administration: permissions, user/profile moderation, plan/feature/flag/reservation management, reports and moderation cases, and immutable audit writes.
- [ ] Minimal UI: login/verify/onboarding/dashboard sections/admin/public renderer using domain APIs and English/Turkish catalogs.
- [ ] Verification and operations: deterministic seed, clean migration, unit/integration/e2e coverage, lint/typecheck/build, app and worker health, Docker image/Compose checks, README/architecture/ADR documentation.

Each task is accepted only with a fresh command proving its tests and compilation state. External-provider flows additionally require documented credentials and a graceful disabled state.
