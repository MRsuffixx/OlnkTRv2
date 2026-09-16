# OlnkTR Production UI Design

## Status

Approved in conversation on 2026-09-16. This specification translates the approved direction into implementation boundaries for the existing OlnkTR modular monolith.

## Objective

Build the complete production-facing OlnkTR interface around the existing authentication, profile, page, block, publishing, entitlement, billing, storage, analytics, moderation, and administration systems. The result must feel like a calm, polished creator application while preserving server-side authorization and the existing backend domain model.

The dashboard is the primary product. Marketing pages follow the application experience and reuse its visual language. Public profiles remain visually independent because their presentation belongs to each creator.

## Product Principles

- The dashboard behaves like a desktop application through persistent nested layouts, fast prefetched navigation, local interaction state, and contextual loading.
- Server Components remain the default. Client Components are narrow islands for interactions that require browser state.
- User-visible values come from existing application services. Missing information produces an honest empty state, never a production fixture.
- Premium is communicated quietly. Users can inspect or preview premium controls, while server-side publishing and mutations remain the authority.
- Every significant label is translated in English and Turkish.
- Accessibility, reduced motion, keyboard operation, and mobile usability are acceptance requirements rather than later polish.

## Visual Language

OlnkTR uses a restrained “quiet ink and electric iris” system:

- Warm-neutral application backgrounds and layered surfaces.
- Indigo-violet as the single primary accent for actions, selection, focus, and chart emphasis.
- Geist for compact, highly legible interface typography.
- Hairline borders, low-contrast dividers, and small controlled shadows.
- Rounded corners are consistent and moderate rather than pill-shaped by default.
- Motion uses opacity, small translations, and subtle scale at 100–240 ms.
- Light and dark themes have separately authored semantic tokens.

CSS exposes semantic color, radius, shadow, typography, and motion tokens. Product components consume semantic utilities instead of embedding neutral color scales.

## Application Architecture

### Server and Client Boundaries

Pages and layouts fetch authenticated data directly through the existing server-side tRPC caller. Independent reads start together and resolve through `Promise.all` or separate Suspense boundaries.

Interactive features receive the smallest serializable initial state possible:

- Shell client islands: collapsed state, mobile drawer, theme menu, locale menu, and command palette.
- Editor client island: local draft, selection, preview viewport, optimistic block operations, and save/publish status.
- Chart client island: visualization of server-fetched analytics series.
- Focused overlays: dialogs, sheets, dropdown menus, and toasts.

Authentication and authorization continue to execute on the server for every action. Client state is never treated as entitlement or ownership evidence.

### Frontend Organization

```text
src/
├── app/
│   ├── (marketing)/
│   ├── dashboard/
│   ├── login/
│   ├── onboarding/
│   └── [username]/
├── components/
│   ├── ui/
│   ├── shell/
│   ├── dashboard/
│   └── shared/
├── features/
│   ├── editor/
│   ├── analytics/
│   ├── media/
│   ├── domains/
│   ├── billing/
│   ├── settings/
│   └── auth/
├── hooks/
└── lib/
```

Files are grouped by product responsibility. UI primitives contain no business rules. Feature modules translate domain data into interface behavior without duplicating server authorization or entitlement logic.

## Design System

Tailwind CSS remains the styling engine. Accessible primitives use Radix where behavior is non-trivial, while OlnkTR-specific variants and CSS tokens define appearance. Lucide is the sole icon library.

Foundation components include buttons, icon buttons, fields, text areas, selects, switches, tabs, badges, avatars, skeletons, empty states, dialogs, alert dialogs, sheets, dropdown menus, tooltips, popovers, command menus, segmented controls, sliders, tables, progress indicators, and toast notifications.

Each component defines default, hover, pressed, focus-visible, disabled, loading, and invalid states where applicable. Focus rings are visible in both themes. Animations are property-specific and disabled or simplified through `prefers-reduced-motion`.

## Persistent Dashboard Shell

`/dashboard/layout.tsx` stays a Server Component that validates the session and onboarding state. It renders a persistent shell containing:

- Expanded desktop sidebar at approximately 248 px.
- Collapsed tablet/desktop sidebar at approximately 68 px.
- Remembered sidebar state stored in a small versioned local-storage record.
- Mobile top bar and navigation sheet rather than a compressed icon rail.
- Contextual page heading and actions.
- Account menu, theme selection, language selection, and sign out.
- Command palette opened with Command/Ctrl+K.

The sidebar remains mounted during child-route navigation. `loading.tsx` files render only route-content skeletons. Links use App Router prefetching where appropriate.

## Route Model

Canonical authenticated routes are:

- `/dashboard`
- `/dashboard/page`
- `/dashboard/analytics`
- `/dashboard/media`
- `/dashboard/domains`
- `/dashboard/billing`
- `/dashboard/settings/profile`
- `/dashboard/settings/account`
- `/dashboard/settings/security`
- `/dashboard/settings/notifications`
- `/dashboard/settings/appearance`

Existing `/dashboard/content`, `/dashboard/profile`, `/dashboard/settings`, and `/dashboard/security` URLs remain compatible through redirects or shared route implementations. The sidebar displays only the primary navigation hierarchy.

Public and marketing routes include `/`, `/features`, `/pricing`, `/login`, `/verify-request`, `/onboarding`, legal placeholders, and `/{username}`.

## Dashboard Overview

The overview combines real analytics, current publication state, profile identity, and top blocks. It uses restrained metric panels and a compact performance visualization. With no events, it shows a share-oriented empty state rather than zero-value decorative charts.

The profile card links to the public page only when a publication exists. Draft and live status are explained separately.

## Page Editor

### Desktop Layout

The editor uses a tool layout with:

- Left section navigation and content controls.
- Central responsive live preview.
- Right contextual inspector.
- Top bar with save state, preview, and publish actions.

The dashboard sidebar yields additional space for the editor but remains structurally stable. Mobile uses a preview-first layout with bottom navigation and full-height editing sheets.

### State and Data Flow

```text
Server-loaded draft and blocks
  → editor-local state
  → immediate preview render
  → debounced authenticated save
  → draft persistence
  → explicit publish
  → immutable published snapshot
```

The editor store is domain-specific. It owns only the current draft, block ordering, selected block, active section, preview device, zoom, dirty state, and save status. Authentication, analytics, subscription information, and unrelated application state remain outside it.

Optimistic updates preserve a last confirmed state. Failed saves mark the editor as unsaved and expose a retry action. Autosave does not produce success toasts. Publishing produces a meaningful toast and updates the displayed publication version.

### Blocks

The initial picker exposes the block types already supported by backend validation: Link, Text, Heading, Divider, Image, and Socials. Future registered types may appear disabled with an explanatory availability state but cannot create unsupported data.

Reordering uses dnd-kit with pointer and keyboard sensors. Each block also exposes visible move and overflow actions so drag-and-drop is not the only control. Editing validates against the same configuration rules used by the server.

### Appearance and Preview

Theme configuration remains schema-versioned. Version 1 gains backward-compatible optional fields for layout, typography, background, and global button styling. Existing minimal snapshots continue to parse through defaults.

The initial production controls include layout width/alignment, background color or gradient, primary text typography, avatar shape, spacing, and global button style. Premium-only controls may be previewed locally but publishing remains governed by existing entitlements.

The preview renders the same normalized presentation model as the public renderer. Mobile, tablet, and desktop modes change the viewport rather than simulating an ornate device shell.

### Publish

Save and publish remain distinct. Publishing calls the existing publication service, which validates ownership, blocks, theme, and entitlements before atomically creating a snapshot. Entitlement failures are translated into a focused upgrade explanation without discarding draft configuration.

## Product Screens

### Analytics

Analytics supports 7-, 30-, 90-, and 365-day ranges constrained by the user’s retention entitlement. It shows real views, unique views, clicks, CTR, daily performance, and top blocks. Country, device, and referrer sections use real event aggregates when available and otherwise show a truthful empty state.

### Media

Media provides authenticated listing, filtering, upload progress, details, and deletion for owned assets. File validation and storage limits stay in the existing upload service. Direct raw storage keys are never exposed as trusted user input.

### Domains

Domains display persisted custom-domain state and DNS instructions. Adding a domain is server validated, normalized, ownership checked, feature-flag checked, and entitlement checked. The UI never claims verification until backend state is `ACTIVE`.

### Billing

Billing displays the current plan, normalized subscription status, usage entitlements, and development checkout only outside production. It avoids fabricated invoices when the backend has no invoice model.

### Settings and Security

Settings use a persistent sub-navigation and clean divided sections. Profile, account locale/timezone, appearance, notifications foundation, sessions, and account deletion are separated. Destructive actions use explicit confirmation. Session revocation reflects actual database state.

### Authentication and Onboarding

Login remains passwordless and uses existing Auth.js server actions. The interface presents SMTP and Google availability without exposing configuration. Verification messaging remains enumeration safe.

Onboarding is a short guided flow for username and profile identity, with responsive validation and a clear completion state. Final creation remains one transactional server operation, so partially submitted browser state cannot create inconsistent domain records.

### Marketing

Marketing pages reuse design tokens but permit larger typography and product-preview compositions. They focus on the real editor, customization, analytics, publishing, and plans. No production metrics or creator content is fabricated as live data.

## Internationalization

English and Turkish catalogs use these namespaces:

- `common`
- `navigation`
- `dashboard`
- `editor`
- `analytics`
- `media`
- `domains`
- `billing`
- `settings`
- `auth`
- `marketing`
- `errors`

The locale cookie continues to avoid locale-prefixed paths, preserving `/{username}`. Layouts use flexible widths, logical properties where practical, and localized number/date formatting. The architecture remains ready for RTL without claiming current RTL language support.

## Minimal Backend Additions

Three narrow integrations are required:

1. Page draft procedures to fetch and update owned theme, SEO, page metadata, and visibility.
2. Media procedures to list and delete owned assets through the existing storage abstraction.
3. Custom-domain procedures to list, add, and remove owned domains with existing entitlement and feature-flag enforcement.

Analytics may gain read-only grouping procedures for country, device, and referrer if the existing event table contains sufficient retained data. No authentication, billing, publication, storage, or analytics-ingestion redesign is permitted.

## Error Handling

- Expected server errors map to localized, actionable form or inline messages.
- Autosave failures preserve edits and offer retry.
- Rate limits state when the user can retry without exposing internal keys.
- Route-level failures render within the persistent shell.
- Public unpublished, hidden, moderated, or absent profiles use a branded 404 without status disclosure.
- Error boundaries log safely and never render raw database or provider exceptions.

## Accessibility

- Semantic landmarks and heading order.
- Accessible names for icon-only controls.
- Native controls where they provide the best semantics.
- Keyboard navigation and focus management for menus, dialogs, sheets, and command palette.
- Keyboard alternatives for block ordering.
- Visible focus indicators and adequate contrast in both themes.
- Reduced-motion behavior for every non-essential animation.
- Live regions only for meaningful asynchronous status such as saving, upload, and publishing.

## Performance

- Parallel server reads and granular Suspense boundaries avoid waterfalls.
- Heavy editor, chart, and drag-and-drop code loads only on relevant routes.
- Icons are imported directly.
- Public profiles do not inherit dashboard providers or editor bundles.
- Client props are minimized and normalized.
- Hidden editor panels are not mounted until selected.
- Large media collections use pagination and browser-native image loading.

## Testing and Audit

Implementation follows test-first cycles for new business behavior and state reducers. Verification includes:

- Unit tests for editor state, theme normalization, navigation mapping, and display formatters.
- Integration tests for draft ownership, media ownership, domain entitlement, and publish compatibility.
- Playwright coverage for authentication, onboarding, shell navigation, editor block operations, autosave, publishing, themes, language switching, and mobile navigation.
- Browser inspection at 375, 390, 768, 1024, 1280, and 1440 pixels.
- Light, dark, English, Turkish, keyboard, reduced-motion, loading, empty, and error-state audits.
- Fresh lint, typecheck, Vitest, Playwright, and production-build runs before completion claims.

## Non-Goals

- Replacing Auth.js, tRPC, Prisma, billing, storage, queues, or publishing architecture.
- Full DNS or certificate automation.
- Unsupported billing invoice history.
- Arbitrary user CSS or JavaScript.
- Loading an unbounded web-font catalog.
- Automatic AI-generated content or design.
- A sophisticated public theme marketplace.

## Completion Criteria

The work is complete when the primary application routes consume real services, the dashboard shell stays stable during navigation, the editor provides optimistic editing and explicit publishing, light/dark and English/Turkish modes are intentional, major flows work at mobile and desktop sizes, no controls are inert, and all automated and runtime verification passes.
