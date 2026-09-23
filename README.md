# OlnkTR infrastructure

OlnkTR is a passwordless Link-in-Bio SaaS foundation built as a modular monolith: one Next.js web process, one BullMQ worker, PostgreSQL as source of truth, Redis for disposable cache/rate limits/queues, and provider-backed mail and storage.

## Start locally

1. Copy `.env.example` to `.env` and replace `AUTH_SECRET`, `BILLING_WEBHOOK_SECRET`, and `ANALYTICS_SALT`. Generate `INTEGRATION_ENCRYPTION_KEY` with `openssl rand -base64 32` before enabling Spotify.
2. Run `docker compose up -d postgres redis mailpit` (or `docker compose up --build` for the complete stack).
3. Run `pnpm install`, `pnpm db:migrate`, and `pnpm db:seed` when processes run on the host with reachable database/Redis URLs.
4. Run `pnpm dev` and, in another terminal, `pnpm worker`.

Mailpit is at <http://localhost:8025>. Request a magic link at `/login`, open the captured message, complete `/onboarding`, add a link at `/dashboard/content`, publish, then visit `/{username}`. Google appears only when both Google environment variables exist. Production never returns or logs magic-link tokens.

## Architecture and security

Auth.js uses its Prisma adapter, database sessions, expiring single-use verification-token rows, SMTP delivery, optional Google OAuth, and account-state checks on every protected tRPC call. Automatic cross-provider email linking is disabled. User, Profile, Page, Draft, version, and active publication are separate records. Public rendering reads one validated snapshot and Redis caches only this derived value.

Plans, features, relational plan entitlements, subscriptions, overrides, and usage counters provide centralized authorization. Feature flags are independent rollout controls. The development billing provider signs events; durable webhook rows are unique by provider/event ID and BullMQ applies normalized state transitions.

Uploads use generated keys, size limits, signature detection, private-by-default media records, and a local/S3 provider boundary. Image dimensions are validated and short MP4/WebM backgrounds are probed and asynchronously converted to a muted H.264 loop plus WebP poster by FFmpeg. Analytics requests return 202 after queueing and workers persist minimal metadata plus daily aggregates. Visitor identifiers are daily salted hashes; raw IPs are not persisted.

The page editor uses a versioned, provider-ready block platform. Free accounts can publish Link, Featured Link, Social Icons, Text, Heading, Divider, Image, Image Link, Button, Spacer, and Adult Link blocks within their normal block allowance. Every block is parsed by its own strict server schema before storage and again when a publication snapshot is read. Adult Link destinations are restricted to HTTP(S), are never fetched or previewed by OlnkTR, and require a per-profile browser-session age declaration before navigation. This declaration is a safety interstitial, not identity or legal-age verification.

Security headers, same-origin redirects, Zod validation, central URL scheme allowlisting, Redis rate limiting, server ownership checks, structured redacted logs, audited admin mutations, session revocation, moderation records, and deletion-state models are included. PostgreSQL is always authoritative.

Account deletion is a confirmed, queued workflow: a one-time token is emailed, confirmation immediately revokes sessions and changes the account state, and the maintenance worker removes profiles/assets and anonymizes the account after `ACCOUNT_DELETION_GRACE_DAYS`.

See [system architecture](docs/architecture/overview.md), [flows](docs/architecture/flows.md), [publication](docs/architecture/publication-flow.md), [premium and entitlements](docs/architecture/premium-entitlement-flow.md), [background jobs](docs/architecture/background-jobs.md), and [decisions](docs/architecture/decisions.md).

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
- Media: `FFMPEG_PATH`, `FFPROBE_PATH`, `MEDIA_VIDEO_MAX_DURATION_SECONDS`, and `MEDIA_VIDEO_MAX_DIMENSION`. Docker supplies both binaries; host workers must install them.
- Live integrations: optional `GITHUB_TOKEN`, `YOUTUBE_API_KEY`, and paired Twitch credentials. Spotify OAuth additionally requires paired Spotify credentials and a base64-encoded 32-byte `INTEGRATION_ENCRYPTION_KEY`.
- Security/platform: random `BILLING_WEBHOOK_SECRET`, rotatable `ANALYTICS_SALT`, `ACCOUNT_DELETION_GRACE_DAYS`, and optional `AUTH_TRUST_HOST=true` behind a trusted production proxy.
- Bootstrap: `ADMIN_EMAIL` promotes that address to `SUPER_ADMIN` during `pnpm db:seed`; remove it after seeding if it is no longer needed.

Production startup rejects development billing/analytics secrets, partially configured Google/SMTP credentials, and incomplete S3 configuration. See `.env.example` for a copyable configuration.

## Search publication and SEO

Next.js serves a generated `/robots.txt` and a sharded sitemap index at `/sitemap.xml` from the trusted `APP_URL`. The sitemap index separates marketing routes from bounded profile shards and includes only active, published, indexable profiles; private, unlisted, moderated, suspended, and explicitly `noindex` pages are excluded. Marketing and public-profile routes provide canonical, Open Graph, Twitter, title, and description metadata, while dashboard, admin, onboarding, and authentication surfaces are marked `noindex`.

Set production `APP_URL` to the public HTTPS origin. URL-prefix Search Console verification can use the optional `GOOGLE_SITE_VERIFICATION` token; Domain-property DNS verification requires no application secret. Follow the complete [Google Search publication checklist](docs/seo/google-search-console.md) after deployment to verify ownership, submit the sitemap, inspect the live URL, and request indexing.

Docker also passes `APP_URL` as a build argument because Next.js resolves root metadata during the production build. Set it before `docker compose build`; custom image pipelines should pass `--build-arg APP_URL=https://your-domain.example`. Runtime `APP_URL` must match the same canonical origin.

## Development integrations

- Mailpit captures magic links at <http://localhost:8025>; no development endpoint returns authentication tokens.
- The Billing dashboard exposes a development-only, server-signed checkout. Its callback persists an idempotent webhook and lets the billing worker activate Premium. The endpoint returns 404 in production.
- Administrators with `PLAN_MANAGE` can grant 1–24 calendar months of Premium after an offline/IBAN payment. Grants extend from the later of now or the existing manual expiry, coexist with external subscriptions, append a subscription event, and write an audit record in the same serializable transaction.
- Local uploads use the same `StorageProvider` contract as S3 and are mounted in the shared `uploads` Docker volume.
- Admin APIs and `/admin` require an `ADMIN`/`SUPER_ADMIN` database role. Sensitive actions require typing `CONFIRM` and create audit records.
- The seeded `ADULT_LINKS` feature flag is independent of plan entitlements and can disable new Adult Link creation and publication without deleting saved configuration. Adult-content, exploitation, and minor-safety reports are accepted by the moderation API; urgent safety reasons receive the highest review priority.
- Spotify's redirect URI is `${APP_URL}/api/integrations/spotify/callback`. OAuth state is single-use in Redis; access and refresh tokens are AES-256-GCM encrypted at rest and never returned through tRPC.
- GitHub, YouTube, Twitch, and Spotify public widgets read normalized Redis data. Cache misses enqueue provider refreshes; provider failures retain last-known data as stale instead of delaying or breaking the public page. Discord presence connects client-side to Lanyard with bounded reconnect and heartbeat handling.

## External services

SMTP and Google OAuth require real credentials outside local Mailpit. S3 mode requires endpoint/region/bucket credentials. YouTube/Twitch enriched widgets and Spotify recent listening require their respective provider credentials. Only the signed development billing adapter and audited manual/offline grants are implemented; a production card-payment adapter must implement `BillingProvider`. DNS/SSL automation, antivirus scanning, and a production geo-IP source remain external deployment responsibilities.
