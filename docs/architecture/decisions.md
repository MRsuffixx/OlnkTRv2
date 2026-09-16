# Architecture decisions

- Passwordless authentication removes password storage/reset risk; Auth.js owns cryptographic verification tokens and their one-time database consumption.
- User and Profile are separate because account identity, billing, and security have different lifecycle and cardinality from public brands.
- Entitlements replace scattered plan checks so new plans, limits, overrides, and expiration behavior remain data-driven.
- Drafts and published versions are separate so incomplete editing can never leak. The snapshot makes public reads stable, cacheable, and one-query.
- Storage and billing use provider interfaces to keep business logic independent from vendors. Development billing remains signed and server-normalized.
- Redis is never authoritative: cache entries, rate windows, and queued derived work can be reconstructed from PostgreSQL.
- Arbitrary user JavaScript is prohibited because it defeats CSP, creates account-takeover and visitor-safety risks, and prevents reliable sanitization.
