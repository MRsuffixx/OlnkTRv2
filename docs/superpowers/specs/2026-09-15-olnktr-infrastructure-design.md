# OlnkTR Infrastructure Design

## Scope

OlnkTR is a modular monolith composed of a Next.js application, a BullMQ worker, PostgreSQL as the source of truth, Redis for cache/rate limits/queues, and provider abstractions for mail, storage, and billing. The UI is intentionally utilitarian and consumes the same server-side services exposed through domain tRPC routers.

## Boundaries

- Identity owns Auth.js configuration, database sessions, account state checks, session revocation, onboarding, and security events.
- Profiles own public identity and usernames. Pages own editable content; blocks own validated typed configuration.
- Publishing validates a draft and writes an immutable, versioned JSON snapshot in one transaction. Public rendering reads only the active snapshot, optionally through Redis.
- Plans and features are relational data. Entitlements resolve active subscriptions and limits centrally; feature flags only control rollout.
- Billing normalizes provider events before idempotent persistence and asynchronous application.
- Storage owns generated object keys and metadata. Media owns validation and usage accounting.
- Analytics ingestion queues privacy-preserving events; the worker updates append-only events and daily aggregates.
- Admin and moderation call the same domain services with centralized permissions and always emit audit records.

## Security model

Authentication is passwordless. Verification tokens are database-backed, hashed by Auth.js, expiring, and consumed once. Database sessions are checked against account state on every protected request. OAuth accounts are linked only by provider identity; dangerous email auto-linking is disabled. Inputs are parsed with Zod, URLs use a central allowlist, uploads are signature checked, redirects are same-origin, public responses receive defensive headers, and sensitive values are redacted from structured logs.

## Operational model

PostgreSQL is authoritative. Redis failures degrade cache and non-critical ingestion where safe but make readiness fail. Queue jobs have bounded exponential retries and deterministic identifiers where idempotency matters. Health endpoints reveal only status. Local development uses Mailpit, local object storage, and a signed development billing adapter; production providers are selected exclusively by validated environment variables.

## Data lifecycle

Draft edits never change a published snapshot. Subscription expiration preserves premium configuration while entitlement evaluation deactivates it. Account deletion transitions the account, revokes sessions, and schedules cleanup. Webhook payloads and audit logs are retained as operational records with redacted metadata.

## Internationalization

Application locale comes from the authenticated preference or locale cookie without a locale URL prefix, preventing collisions with `/{username}`. English and Turkish catalogs are loaded by next-intl.

## Deployment

One multi-stage image supplies the non-root web and worker processes. Compose supplies app, worker, PostgreSQL, Redis, Mailpit, and persistent local assets. Migrations are a separate explicit deployment command.

