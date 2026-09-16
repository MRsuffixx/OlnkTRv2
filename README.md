# OlnkTR infrastructure

OlnkTR is a passwordless Link-in-Bio SaaS foundation built as a modular monolith: one Next.js web process, one BullMQ worker, PostgreSQL as source of truth, Redis for disposable cache/rate limits/queues, and provider-backed mail and storage.

## Start locally

1. Copy `.env.example` to `.env` and replace `AUTH_SECRET`, `BILLING_WEBHOOK_SECRET`, and `ANALYTICS_SALT`.
2. Run `docker compose up -d postgres redis mailpit` (or `docker compose up --build` for the complete stack).
3. Run `pnpm install`, `pnpm db:migrate`, and `pnpm db:seed` when processes run on the host with reachable database/Redis URLs.
4. Run `pnpm dev` and, in another terminal, `pnpm worker`.

Mailpit is at <http://localhost:8025>. Request a magic link at `/login`, open the captured message, complete `/onboarding`, add a link at `/dashboard/content`, publish, then visit `/{username}`. Google appears only when both Google environment variables exist. Production never returns or logs magic-link tokens.

## Architecture and security

Auth.js uses its Prisma adapter, database sessions, expiring single-use verification-token rows, SMTP delivery, optional Google OAuth, and account-state checks on every protected tRPC call. Automatic cross-provider email linking is disabled. User, Profile, Page, Draft, version, and active publication are separate records. Public rendering reads one validated snapshot and Redis caches only this derived value.

Plans, features, relational plan entitlements, subscriptions, overrides, and usage counters provide centralized authorization. Feature flags are independent rollout controls. The development billing provider signs events; durable webhook rows are unique by provider/event ID and BullMQ applies normalized state transitions.

Uploads use generated keys, size limits, signature detection, private-by-default media records, and a local/S3 provider boundary. Analytics requests return 202 after queueing and workers persist minimal metadata plus daily aggregates. Visitor identifiers are daily salted hashes; raw IPs are not persisted.

Security headers, same-origin redirects, Zod validation, central URL scheme allowlisting, Redis rate limiting, server ownership checks, structured redacted logs, audited admin mutations, session revocation, moderation records, and deletion-state models are included. PostgreSQL is always authoritative.

Account deletion is a confirmed, queued workflow: a one-time token is emailed, confirmation immediately revokes sessions and changes the account state, and the maintenance worker removes profiles/assets and anonymizes the account after `ACCOUNT_DELETION_GRACE_DAYS`.

See [system architecture](docs/architecture/overview.md), [flows](docs/architecture/flows.md), and [decisions](docs/architecture/decisions.md).

## Commands

- `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm worker`
- `pnpm db:generate`, `pnpm db:migrate:dev`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio`
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:coverage`, `pnpm test:e2e`
- Database integration tests: `RUN_DB_TESTS=1 DATABASE_URL=<isolated-test-db> pnpm vitest run tests/integration/database.test.ts`

## Environment

- Core: `DATABASE_URL`, `REDIS_URL`, `APP_URL`, and a random `AUTH_SECRET` of at least 32 characters.
- Mail: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, optional paired `SMTP_USER`/`SMTP_PASSWORD`, `MAIL_FROM`, and `MAIL_FROM_NAME`. Without SMTP, email login and email-confirmed deletion return a safe configuration error; Google login can remain available.
- OAuth: paired `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Omit both to disable Google.
- Storage: `STORAGE_PROVIDER=local` with `LOCAL_STORAGE_PATH`/`STORAGE_PUBLIC_URL`, or `s3` with `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`.
- Security/platform: random `BILLING_WEBHOOK_SECRET`, rotatable `ANALYTICS_SALT`, `ACCOUNT_DELETION_GRACE_DAYS`, and optional `AUTH_TRUST_HOST=true` behind a trusted production proxy.
- Bootstrap: `ADMIN_EMAIL` promotes that address to `SUPER_ADMIN` during `pnpm db:seed`; remove it after seeding if it is no longer needed.

Production startup rejects development billing/analytics secrets, partially configured Google/SMTP credentials, and incomplete S3 configuration. See `.env.example` for a copyable configuration.

## Development integrations

- Mailpit captures magic links at <http://localhost:8025>; no development endpoint returns authentication tokens.
- The Billing dashboard exposes a development-only, server-signed checkout. Its callback persists an idempotent webhook and lets the billing worker activate Premium. The endpoint returns 404 in production.
- Local uploads use the same `StorageProvider` contract as S3 and are mounted in the shared `uploads` Docker volume.
- Admin APIs and `/admin` require an `ADMIN`/`SUPER_ADMIN` database role. Sensitive actions require typing `CONFIRM` and create audit records.

## External services

SMTP and Google OAuth require real credentials outside local Mailpit. S3 mode requires endpoint/region/bucket credentials. Only the signed development billing adapter is implemented; production payment adapters must implement `BillingProvider`. DNS/SSL automation, automatic media variants/virus scanning, and a production geo-IP source are intentionally outside this foundation. The current UI is deliberately utilitarian and does not expose every moderation API or every block type.
