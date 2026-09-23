# OlnkTR Block Platform v2 and Adult Links Design

**Date:** 2026-09-23  
**Status:** Approved direction; pending implementation-plan review  
**Scope:** Adult-link consent, free basic blocks, provider-based media/contact/social/commerce/professional/gaming block families, publication safety, moderation, and staged delivery.

## 1. Goals

OlnkTR will grow from a link list into a composable creator page without weakening its validated block, draft, publication snapshot, analytics, entitlement, or moderation architecture.

This project will:

- add a distinct **18+** section to the block picker;
- require an explicit age confirmation before an adult destination opens;
- make every requested basic block available to Free users;
- model the larger catalog through focused, provider-aware block families instead of dozens of unrelated implementations;
- keep public pages lightweight and prevent third-party embeds from executing before they are needed;
- validate every configuration with Zod on save, publish, snapshot load, and public render;
- preserve existing blocks and published snapshots without destructive migration;
- provide English and Turkish editor, consent, empty, loading, and error states;
- add moderation signals suitable for adult links and user-submitted form content.

## 2. Delivery Boundaries

The requested catalog combines five different systems: static presentation blocks, remote embeds, live provider APIs, visitor submissions, and commerce links. Shipping them as one undifferentiated change would make validation and moderation unreliable. Delivery is therefore divided into compatible increments:

1. **Foundation, Basic, and 18+** — Block Platform v2 registry, all Free basic blocks, Adult Link, consent dialog, metadata, moderation, editor, preview, publication, and tests.
2. **Media and Embeds** — provider-based YouTube, Spotify, SoundCloud, Twitch, TikTok, Instagram, podcast, audio, video, gallery, GIF, and latest-content blocks.
3. **Contact and Forms** — contact actions, configurable forms, submission inbox, rate limiting, notification jobs, retention, and abuse controls.
4. **Commerce and Professional** — products, services, price cards, portfolio, resume, testimonials, FAQ, location, hours, and scheduling adapters.
5. **Social and Gaming** — static profile cards followed by credential-backed live data for supported providers.

Each increment must be complete and releasable. Disabled or unconfigured integrations render an honest unavailable state; production UI never contains fabricated provider data.

## 3. Architecture Decision

Three approaches were considered:

### One database enum per visible picker item

This is explicit but creates a very large Prisma enum and repeats schemas, inspectors, renderers, entitlement checks, and migrations for minor variations such as Link, Featured Link, Button, and Affiliate Link.

### One generic block with arbitrary JSON

This reduces migrations but weakens validation, makes public rendering branch on loosely structured data, and conflicts with OlnkTR's rule that database JSON is never trusted blindly.

### Typed block families with presentation presets — selected

Stable family discriminators own strict versioned schemas. The editor exposes friendly picker items that create a family with a safe preset. A registry maps each preset to its label, category, icon, default config, schema, editor, preview, public renderer, analytics behavior, entitlement, feature flag, and risk classification.

Examples:

- Link, Featured Link, Button, Affiliate Link, and Adult Link share link primitives while Adult Link retains an explicit risk discriminator.
- YouTube, Spotify, SoundCloud, Twitch, TikTok, Instagram, and Podcast use an `EMBED` family with a closed provider enum.
- WhatsApp, Telegram, Email, Phone, and SMS use a `CONTACT_ACTION` family.
- Instagram Profile, Steam Profile, and LinkedIn use a `SOCIAL_PROFILE` family with a closed provider enum.

This provides strict validation without turning every visual preset into a separate backend subsystem.

## 4. Block Registry

The registry is the single source of truth for editor discovery and shared policy. Each entry contains:

```ts
interface BlockDefinition<TConfig> {
  type: SupportedBlockType;
  preset: string;
  category: BlockCategory;
  schema: ZodType<TConfig>;
  defaultConfig: (locale: SupportedLocale) => TConfig;
  availability: "FREE" | "PREMIUM";
  feature?: FeatureKey;
  risk: "STANDARD" | "ADULT_DESTINATION" | "VISITOR_INPUT";
  analytics: "NONE" | "CLICK" | "INTERACTION";
}
```

The server owns schemas and policy. Client registry metadata contains only serializable labels, icons, categories, defaults, and presentation hints; server-only validation is never imported into the browser bundle.

The picker categories are:

- Basic
- Media
- Contact
- Social
- Monetization
- Professional
- Gaming
- 18+

Search includes localized title, description, provider name, and category. Category headings remain visible and keyboard navigable.

## 5. Phase 1 Free Basic Blocks

All blocks in this section are available to Free users and count only toward the existing block quantity limit.

### LINK

The existing Link schema gains optional curated `icon`, description, and a versioned visual preset. Existing `{title, url, description}` configurations migrate to `standard` without changing their appearance.

### FEATURED_LINK

A prominent card with title, description, safe URL, optional owned image asset, curated icon, and `compact`, `image`, or `spotlight` presentation. It records a normal block click.

### SOCIALS

The existing Social Icons block remains a compact list. Items gain a closed provider identifier plus an optional accessible label. Custom items remain possible through a generic globe icon and safe URL.

### TEXT and HEADING

Text gains optional title and alignment but remains plain text—no raw HTML or Markdown execution. Heading retains semantic H1/H2/H3 selection. The editor warns when a creator introduces multiple H1 blocks but does not corrupt older pages.

### DIVIDER and SPACER

Divider gains line style, thickness, width, and accessible decorative semantics. Spacer is a separate bounded block with small, medium, large, or custom spacing from 4–160 pixels. It cannot create an unbounded page.

### IMAGE and IMAGE_LINK

Both use owned `MediaAsset` IDs. Image Link is an editor preset that enables the existing safe destination field. Alt text is required unless the image is explicitly marked decorative. Public rendering uses the media route and never a user-supplied storage URL.

### BUTTON

A classic CTA with title, optional description, safe URL, curated icon, and style override. It inherits the page button design unless `useGlobalStyle` is disabled.

## 6. Adult Link and Consent

`ADULT_LINK` is a distinct stable type, not a styling flag on a normal Link. Its schema contains:

- title;
- optional neutral description;
- safe destination URL;
- curated icon;
- optional platform label;
- required creator attestation that the destination is intended only for adults;
- schema version.

The editor places it only in the **18+** category and displays a restrained warning explaining that illegal content, exploitation, non-consensual material, and any sexual content involving minors are prohibited. OlnkTR does not proxy, thumbnail, scrape, unfurl, or preload adult destinations.

On the public page:

1. The block is visibly marked `18+` without exposing remote content.
2. Activating it opens an accessible confirmation dialog.
3. The dialog explains that the destination may contain adult content and asks the visitor to confirm they are at least 18 and legally permitted to view it.
4. Cancel returns focus to the block and performs no analytics click.
5. Confirm stores consent in `sessionStorage` under a versioned key scoped to the profile, records the click, and opens the validated destination.
6. Later adult links on the same profile open without another prompt during that browser tab session. Closing the browser session clears consent.

The confirmation is an age declaration, not identity or legal age verification. It must never be described as proof of age.

Adult destinations use `rel="nofollow noreferrer noopener"` and a no-referrer policy. The public page adds `<meta name="rating" content="adult">` when an enabled Adult Link is present in the active snapshot, following Google's explicit-content guidance. The snapshot remains eligible for ordinary indexing unless the creator separately selects `noindex`; SafeSearch can classify the page appropriately.

## 7. Provider-Based Media and Embed Model

`EMBED` uses a closed provider enum and provider-specific normalized config:

- YouTube video/channel;
- Spotify track, album, playlist, or podcast;
- SoundCloud track or playlist;
- Twitch channel or video;
- TikTok post;
- Instagram post or reel;
- podcast episode/feed.

Provider adapters implement URL recognition, canonicalization, embed URL generation, CSP requirements, consent/loading strategy, and fallback links. Arbitrary iframe markup, script tags, HTML, and unknown hosts are rejected.

Video, Audio Player, Gallery/Carousel, and GIF use owned media assets and the storage pipeline. `LATEST_CONTENT` uses server-side provider adapters, Redis caching, rate limits, and optional application credentials. It is never implemented by scraping arbitrary creator URLs.

Embeds load after interaction or when near the viewport. A privacy placeholder is shown before loading providers that set cookies or execute third-party code.

## 8. Contact and Form Model

`CONTACT_ACTION` covers WhatsApp, Telegram, Discord, Email, Phone, and SMS through provider-specific parsers. Values become normalized `https`, `mailto`, `tel`, or `sms` destinations. Raw JavaScript and unsupported schemes remain forbidden.

`FORM` supports Contact Form, Feedback, Anonymous Message, Ask Me Anything, and Newsletter presets. Creators choose from bounded field definitions:

- name;
- email;
- subject;
- short text;
- long message;
- consent checkbox.

Creators may mark supported fields required, rename labels, and reorder them. They cannot inject HTML, scripts, hidden fields, or arbitrary server destinations.

Submissions are stored in a relational inbox with profile ownership, status, timestamps, privacy-conscious abuse hash, and structured field values. They are protected with rate limits, honeypot/timing checks, payload limits, and optional CAPTCHA adapter. Notification email is queued; SMTP failure never loses the stored submission. Newsletter consent text and timestamp are stored explicitly. Retention is configurable and documentation must avoid claiming automatic legal compliance.

## 9. Social and Gaming Providers

`SOCIAL_PROFILE` and `GAMING_PROFILE` separate static destination cards from live integrations.

Static cards accept a validated account identifier or provider URL and are Free. Enriched cards can show public provider data only through a server adapter with a fixed host, normalized payload, Redis cache, timeout, circuit-breaker behavior, and honest stale/unavailable states.

Initial providers cover Instagram, TikTok, YouTube, Twitch, GitHub, Discord Server, Steam, Last.fm, LinkedIn, X, Minecraft Server/Skin, Xbox, PlayStation, and Epic Games where an official or explicitly supported API exists. Providers without a reliable permitted API remain static link cards; OlnkTR will not scrape private pages or invent data.

Existing Discord, GitHub, YouTube, Twitch, and Spotify blocks remain backward compatible and may internally adopt the registry adapters without changing stored discriminator values.

## 10. Monetization and Professional Blocks

Donation, Support Me, Product, Digital Product, Service, Price Card, Affiliate Link, Shop Grid, Membership, and Wishlist are presentation and outbound-action blocks. OlnkTR does not claim payment success unless a future Billing/Commerce provider reports a verified event.

Affiliate blocks require a visible affiliate disclosure field. Product and service prices are display values with ISO currency codes where applicable. IBAN data remains opt-in creator content and is never treated as verified account ownership.

Professional blocks use typed schemas for Meeting, Calendar, Availability, Portfolio Project, Experience, Education, Skills, Resume, Download, Client Logos, Testimonials, FAQ, Location, and Business Hours. Downloads reference scanned/validated owned assets. Meeting and calendar integrations use allowlisted providers or future authenticated adapters, not arbitrary embed code.

## 11. Publishing, SEO, and Analytics

Publishing continues to validate ownership, schema, assets, entitlements, and feature flags before creating an immutable snapshot. Draft changes do not affect the live page.

Snapshot parsing supports legacy blocks and versioned v2 family configs. Unknown or invalid blocks reject publication rather than silently emitting unsafe output. Effective-publication filtering preserves Premium configuration in drafts while disabling unavailable public behavior.

Adult Link presence is derived exclusively from enabled blocks in the active snapshot. Draft adult links do not change live metadata. Adding or removing the last published Adult Link invalidates the profile cache and route metadata.

Analytics records block impressions only where already supported and records clicks only after a confirmed navigation. Form submissions, poll answers, and adult-consent state are not analytics metadata. No raw visitor IP is retained.

## 12. Moderation and Administration

Report reasons expand with `ADULT_CONTENT`, `EXPLOITATION`, and `MINOR_SAFETY`. Minor-safety reports receive the highest moderation priority. Staff can inspect the block type and sanitized configuration, hide the profile, disable the offending block through a moderation action, or suspend the account according to existing role permissions.

Every staff mutation remains permission-checked, rate-limited, confirmed, transactional where needed, and audited. Adult-link creation itself does not imply wrongdoing; enforcement targets policy violations.

## 13. Entitlements and Feature Flags

- Every Phase 1 basic block is Free.
- Adult Link is Free but may be disabled globally or per environment by a dedicated feature flag.
- Standard provider embeds are Free within block limits.
- Live/automatic provider data uses the existing `LIVE_INTEGRATIONS` entitlement because it consumes external API and worker capacity.
- Static contact, social, gaming, commerce, and professional cards are Free.
- Higher form limits, long retention, product grids, dynamic availability, and enriched live cards may use numerical or boolean entitlements defined in the database, never component-level plan checks.

## 14. Accessibility, Performance, and Privacy

- The consent dialog uses the existing accessible dialog primitive, traps focus, supports Escape, restores focus, and has explicit Cancel/Continue actions.
- Adult status is expressed in visible text, not color alone.
- Keyboard activation follows button/link semantics.
- Provider embeds are dynamically loaded and do not expand the base public-page bundle.
- Reduced motion applies to galleries and media controls.
- Public assets retain useful alt text and aspect-ratio placeholders.
- Session consent contains only a boolean/version/profile key and is never synchronized to the server.
- No adult destination is fetched from OlnkTR servers for preview generation.

## 15. Error Handling

- Invalid URLs and configs show localized field-level editor errors.
- Disabled providers preserve configuration but show an unavailable state.
- Failed remote data displays the canonical outbound link when safe.
- Missing or deleted media blocks publication with an actionable asset error.
- Storage or notification failure does not expose secrets or raw provider payloads.
- Consent storage failure falls back to asking on the next adult-link click; it never prevents the current confirmed navigation.

## 16. Testing and Acceptance

Phase 1 requires:

- schema tests for every new/extended basic block and unsafe URL rejection;
- migration/default tests for legacy Link, Image, Divider, Text, and Socials configs;
- publication tests proving disabled/draft Adult Links do not affect live metadata;
- public renderer tests for Adult Link labeling and link attributes;
- consent interaction tests for cancel, confirm, same-profile reuse, cross-profile isolation, keyboard focus, and unavailable storage;
- analytics tests proving cancel does not record a click and confirm records exactly one;
- moderation reason and permission tests;
- English/Turkish catalog parity;
- responsive editor picker and public-page Playwright coverage;
- lint, strict typecheck, unit/integration suites, production build, and live browser inspection.

Later increments add provider-contract tests, CSP tests, upload/media tests, form spam/ownership tests, notification queue tests, and integration-specific degraded-state tests.

## 17. External and Legal Limitations

An age-confirmation dialog is not robust age verification. Provider terms, adult-content laws, platform obligations, and data-retention requirements vary by jurisdiction and require legal review before production launch. The implementation supplies technical controls and auditability but does not claim legal compliance.

Google recommends marking pages with explicit content using an adult rating tag, and notes that links to explicit destinations can be a SafeSearch signal. OlnkTR therefore labels published pages containing Adult Links without exposing draft configuration or forcing all non-adult profiles into the same classification.
