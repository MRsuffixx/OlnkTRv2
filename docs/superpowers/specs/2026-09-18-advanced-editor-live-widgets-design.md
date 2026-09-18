# OlnkTR Advanced Editor and Live Widgets Design

**Date:** 2026-09-18  
**Status:** Proposed for implementation  
**Scope:** Advanced visual customization, media backgrounds, profile presentation, live integration blocks, interactive blocks, manual Premium grants, and reliable locale switching.

## 1. Goals

This project extends the existing OlnkTR editor without replacing its authentication, ownership, entitlement, publishing, storage, analytics, or worker architecture. The result must let creators build expressive pages while preserving a lightweight published renderer and strict server-side enforcement.

The implementation will:

- expand free and Premium visual customization;
- support safe image and short-video backgrounds;
- add advanced avatar and profile layouts;
- add announcement, countdown, live integration, visitor counter, support, and poll blocks;
- provide real live-data adapters with graceful degraded states;
- preserve draft-only changes until explicit publication;
- preserve Premium configuration when entitlement is inactive;
- add audited manual month-based Premium grants;
- repair locale switching for anonymous and authenticated users;
- remain accessible, responsive, multilingual, and respectful of reduced-motion preferences.

## 2. Non-goals and Safety Boundaries

- No arbitrary user JavaScript, CSS, iframe HTML, or remote script injection.
- No arbitrary server-side URL fetching. Provider hosts are fixed in server adapters.
- No unreviewed font URLs. Google fonts are a curated, build-time bundled catalog.
- No direct payment processing for support blocks. They link to validated provider URLs or display creator-supplied payment instructions.
- No fake live data. Missing credentials or provider outages render explicit unavailable/stale states.
- No autoplay audio. Background video is muted, looping, inline, and reduced-motion aware.
- No user-controlled verified badge. Verification remains an administrative profile property.

## 3. Entitlement Matrix

### Free

- solid and multi-stop gradient backgrounds;
- a limited animated-gradient preset set;
- background images with overlay and positioning;
- classic centered and left-profile layouts;
- avatar size, shape, border, shadow, and basic gradient ring;
- curated base font pairs;
- separate text, button, button-text, border, and shadow colors;
- solid, outline, transparent, soft, pill, sharp, and brutalist button styles;
- basic hover color/scale effects;
- highlight, countdown, social placement, visitor counter, and support blocks;
- light, dark, and system page modes;
- a restrained star or snow background layer;
- standard theme palettes.

### Premium

- short looping background video;
- glass surface controls with blur and opacity;
- advanced animated gradients and wave layers;
- neon, glow, pulse, light-leak, and advanced hover effects;
- separate expanded heading/body font catalogs;
- premium theme palettes;
- large cover/banner profile layout;
- neon and multi-color avatar frames;
- Discord, Spotify, GitHub, YouTube, and Twitch live integrations;
- digital-rain and advanced vibe layers;
- branding removal;
- advanced live-widget refresh and presentation options.

Premium draft values remain stored when a subscription expires. The editor may preview them, but publication validates entitlements on the server and returns the exact unavailable features. Existing published snapshots are re-evaluated when subscription state changes so Premium-only output becomes inactive without deleting its saved configuration.

## 4. Theme Configuration v2

`ThemeConfig` becomes a versioned v2 schema. A deterministic migrator converts every stored v1 draft or publication into v2 defaults before validation. No existing page is invalidated.

The v2 structure contains:

- `mode`: light, dark, system, or scheduled;
- `colors`: page, text, muted text, accent, button, button text, border, and shadow;
- `background`: solid, gradient, animated gradient, image, or video;
- `background.overlay`: color, opacity, blur, and glass intensity;
- `layout`: alignment, width, padding, block gap, profile layout, and social placement;
- `avatar`: size, shape, border width/color, ring style/colors, shadow, and crop position;
- `typography`: heading family/weight/scale and body family/weight/scale/line height;
- `buttons`: visual style, shape, height, radius, border, shadow, glass opacity, and hover effect;
- `effects`: layer, density, speed, intensity, and reduced-motion fallback;
- `branding`: visibility preference;
- `schemaVersion: 2`.

Every field has bounded Zod validation. Asset references are media IDs rather than arbitrary URLs. Publication verifies asset ownership, readiness, type, and entitlements before generating a normalized snapshot.

## 5. Editor UX

The current three-pane editor remains the foundation. Existing autosave, preview, drag/reorder, and explicit publish behavior remain intact.

Editor navigation expands to:

- Content
- Profile
- Themes
- Background
- Typography
- Buttons
- Effects
- Socials
- SEO

Controls use progressive disclosure. Only settings relevant to the selected background, layout, effect, or block appear. Premium controls remain previewable and carry a restrained `PRO` badge. Selecting a media-backed option opens the reusable media picker, which supports upload and existing-asset selection.

The publish action first flushes the current local document, then performs server validation. Entitlement failures return a structured list of feature keys and localized names. Validation never removes configuration.

## 6. Background Media Pipeline

Image and video media continue through `StorageProvider` and `MediaAsset`.

### Images

- accepted source types: PNG, JPEG, WebP, and GIF;
- server signature validation and generated object keys;
- image dimensions recorded when available;
- publication exposes only assets referenced by an active snapshot;
- editor supports cover/contain, focal position, overlay, opacity, and blur.

### Videos

- accepted source types: MP4 and WebM with signature/container validation;
- strict upload and duration limits;
- media worker probes duration and dimensions;
- worker produces a muted, web-safe looping variant and poster image;
- processing status is visible in the media library;
- unprocessed or failed video cannot be published;
- public renderer uses `autoplay muted loop playsinline`, a poster, and a reduced-motion still fallback.

The worker uses a configurable FFmpeg executable. Production Docker images include FFmpeg. Errors are recorded as media job failures without exposing command output or filesystem paths to clients.

## 7. Profile and Avatar System

Profile settings gain:

- avatar upload;
- selection from owned media;
- avatar removal;
- crop focal position and zoom metadata;
- live preview;
- richer display-name and bio editing;
- verification state display;
- cover/banner asset selection when the chosen layout supports it.

Avatar mutations verify account ownership, `READY` status, supported image MIME, and storage limits. The profile stores identity references; visual size, frame, crop, and layout remain presentation data in the page draft. This preserves the User/Profile/Page separation.

## 8. New Block Types

Each block has an independent Zod schema, ownership checks, preview component, public renderer, analytics behavior, and localized editor form.

### HIGHLIGHT

An announcement or campaign card with title, description, optional safe URL, icon, color treatment, and optional start/end schedule.

### COUNTDOWN

A timezone-aware target date, title, completion message, and display style. The public client calculates remaining time without changing the source snapshot.

### DISCORD_STATUS

Accepts a numeric Discord user ID. It displays presence, custom status, Spotify activity with progress, and game activity. The server adapter uses Lanyard through a fixed endpoint and Redis cache. The client refreshes through a same-origin OlnkTR endpoint. A disconnected or unknown user produces an explicit unavailable state.

### SPOTIFY_RECENT

Uses a user-authorized Spotify connection. Access and refresh tokens are encrypted at rest with a required integration encryption key. The worker refreshes tokens and caches normalized recent-play data. The public block never receives provider tokens.

### GITHUB_ACTIVITY

Accepts a validated GitHub username and display mode. A server adapter retrieves public recent activity and repositories from fixed GitHub API endpoints, using an optional server token for higher rate limits. Results are cached and may display the last successful refresh timestamp.

### VIDEO_FEED

Supports YouTube channel and Twitch channel modes. Provider adapters use server credentials, normalize recent-video or live-stream state, and cache results. The public widget links to the canonical provider page and never accepts arbitrary embed HTML.

### VISITOR_COUNTER

Reads real aggregated profile analytics. Creators choose total, today, or compact badge presentation. Counts may be delayed by the analytics worker and never expose raw visitor identifiers.

### SUPPORT

Supports validated external support URLs and an optional creator-entered IBAN/Papara instruction panel. It does not claim or verify payment completion.

### POLL

Contains one question and 2–6 options. Votes are stored relationally and rate-limited by rotating privacy-preserving visitor hash. A visitor can vote once per poll rotation. Results are returned as aggregate counts only.

## 9. Live Integration Architecture

Live providers implement a common internal contract:

```ts
interface LiveWidgetProvider<TConfig, TPayload> {
  validateConfig(input: unknown): TConfig;
  fetch(config: TConfig, connection?: IntegrationConnection): Promise<TPayload>;
  normalize(raw: unknown): TPayload;
  cacheTtlSeconds: number;
}
```

Public widgets call same-origin, rate-limited route handlers. A request returns fresh Redis data when available, otherwise stale successful data while a background refresh is enqueued. PostgreSQL stores provider connections and durable refresh metadata; Redis is never the only copy of credentials or configuration.

Provider failures are normalized into `AVAILABLE`, `STALE`, `UNAVAILABLE`, and `MISCONFIGURED` states. Logs include provider, operation, and safe error code but never access tokens or complete provider payloads.

## 10. Integration Connections

A new relational `IntegrationConnection` model stores user ownership, provider, provider account identity, encrypted credential payload, scopes, expiry, status, and timestamps. Spotify uses OAuth with state validation, PKCE where supported, safe redirects, and account-owner verification.

GitHub, YouTube, Twitch, and Lanyard public-data blocks do not require creator tokens unless the provider requires application credentials. Application credentials remain environment-only.

## 11. Poll Persistence

Poll configuration stays in the block JSON snapshot. Durable votes use relational rows tied to the stable Block ID, selected option key, privacy-preserving visitor hash, and rotation period. Unique constraints enforce one vote per visitor and period. Deleting the block intentionally cascades its vote data.

## 12. Page Modes and Effects

System mode uses `prefers-color-scheme`. Scheduled mode uses creator timezone and bounded day/night start values. It must not depend on visitor geolocation.

Vibe layers are first-party renderers:

- animated gradient;
- gentle wave;
- snow;
- stars;
- digital rain.

Layers have strict density limits, run behind interactive content, ignore pointer events, pause when the document is hidden, and become a static fallback under `prefers-reduced-motion`. Public pages load an effect bundle only when the active snapshot requires it.

## 13. Manual Premium Grants

The admin user detail UI supports granting 1–24 calendar months of Premium with a required reason/reference and explicit confirmation.

The billing service:

1. verifies `PLAN_MANAGE` authorization;
2. locks or serializes the target user's manual subscription transition;
3. starts from the later of the current manual expiry or the current time;
4. adds calendar months in UTC;
5. creates or updates a `manual` provider subscription;
6. creates a `SubscriptionEvent` containing months, prior expiry, new expiry, reason, and actor;
7. invalidates entitlement state;
8. creates an immutable audit entry.

Manual subscriptions remain separate from Stripe, Paddle, or other future provider rows. Entitlement resolution accepts any valid active subscription and falls back correctly when one provider expires.

## 14. Locale Repair

Supported locales and the locale cookie name move to one shared module. Locale changes persist to the cookie and authenticated user record. The root provider receives an explicit locale and is keyed by locale. Client locale actions perform a reliable document navigation after the server action so the persistent App Router shell cannot retain an old translation provider.

Tests cover English-to-Turkish and Turkish-to-English switching on marketing, dashboard, editor, and settings routes, including HTML `lang`, persisted cookie, and translated visible text.

## 15. Publishing and Subscription Transitions

Publishing performs:

1. ownership validation;
2. v1-to-v2 configuration migration;
3. block-schema validation;
4. asset ownership and readiness validation;
5. live-integration configuration validation;
6. feature-flag validation;
7. entitlement collection and enforcement;
8. sanitization and normalized snapshot creation;
9. atomic version activation;
10. Redis and Next route-cache invalidation.

Subscription activation or expiry enqueues a publication-entitlement refresh for affected profiles. The job produces an effective snapshot state without deleting the richer saved draft. Restoring Premium and republishing reactivates the original configuration.

## 16. Security and Privacy

- Provider credentials are encrypted with authenticated encryption and versioned key metadata.
- OAuth state is single-use, expiring, and stored server-side.
- External provider URLs are constants; user input is an ID, username, or validated provider URL.
- Live endpoints have per-IP and per-profile rate limits.
- Poll votes use rotating salted hashes rather than raw IP storage.
- Media validation uses content signatures, not client MIME alone.
- User text is rendered as text, never raw HTML.
- CSP changes list only required media/connect hosts and avoid wildcard sources.
- Integration disconnect deletes credentials and invalidates provider caches.

## 17. Failure Behavior

- A live provider outage never prevents the whole public page from rendering.
- Stale successful data may be shown with a timestamp.
- Missing production credentials disable only the affected provider and show configuration guidance in the editor.
- Failed video processing leaves the original private and marks the derivative failed.
- Publish errors identify the exact block, asset, or entitlement requiring attention.
- Locale persistence failure leaves the current locale intact and shows an actionable error.
- Manual grant failures roll back subscription, event, and audit writes together.

## 18. Testing Strategy

### Unit

- theme v1-to-v2 migration and strict validation;
- entitlement requirements for every Premium theme field and block;
- calendar-month subscription extension, including month-end behavior;
- provider response normalization and degraded states;
- live block config schemas;
- poll vote validation;
- locale parsing and cookie configuration;
- media duration/type limits.

### Database integration

- concurrent manual grants do not lose months;
- manual and external subscriptions coexist correctly;
- manual grants create subscription events and audit entries;
- avatar/background assets enforce ownership;
- poll uniqueness and aggregate counts;
- Premium expiry preserves draft configuration;
- publication activates one valid v2 snapshot atomically.

### Playwright

- locale switching in both directions;
- avatar upload, selection, and profile save;
- free visual customization, autosave, publish, and public rendering;
- Premium preview and Free publish rejection;
- admin monthly Premium grant and resulting entitlement;
- Premium video/background/effect publication;
- countdown and poll interaction;
- live-widget loading, stale, and unavailable states;
- desktop, tablet, and mobile editor smoke coverage;
- light, dark, system, English, and Turkish rendering.

### Final gates

- lint;
- strict TypeScript typecheck;
- unit and database integration tests;
- Playwright critical flows;
- production Next.js build;
- app and worker Docker builds;
- runtime health and worker processing checks.

## 19. Delivery Order

1. Locale repair and manual Premium grants.
2. Theme v2 migration, entitlement mapping, and expanded free controls.
3. Avatar/profile media workflow.
4. Background image/video pipeline and Premium controls.
5. Highlight, countdown, visitor counter, support, and poll blocks.
6. Live provider framework and provider-specific adapters.
7. Page modes, effects, and dynamic loading.
8. End-to-end polish, compatibility, accessibility, and documentation.

Each stage must compile and pass its focused tests before the next stage begins.
