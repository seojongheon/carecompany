# Research: 위생의 기술 프런트엔드 목업 포트폴리오

## Decision 1: Seeded server snapshot plus client hydration

**Decision**: Render stable public copy and seeded cases on the server, then hydrate a
client portfolio provider with versioned browser changes after mount.

**Rationale**: Core content remains present before client JavaScript, hydration remains
deterministic, and administrator changes can still be demonstrated in the same browser.
The client provider must use a stable server snapshot to avoid hydration mismatch.

**Alternatives considered**:

- Client-only public pages: rejected because core content would disappear from initial HTML.
- Fake API routes: rejected because they create a server contract outside this milestone.
- Store image blobs in browser persistence: rejected because quota and lifecycle behavior
  are unreliable and it would conceal the real Storage work still required.

## Decision 2: Typed repository contract with local adapter

**Decision**: Define a `PortfolioRepository` contract and a local adapter that owns schema
versioning, normalization, recovery, subscriptions, and JSON persistence.

**Rationale**: Components can use domain queries and commands without depending on a storage
vendor. A future Supabase adapter can preserve the same UI-facing operations while adding
server authorization, RLS, and remote persistence.

**Alternatives considered**:

- Direct `localStorage` calls in components: rejected because persistence concerns would be
  distributed across screens and difficult to replace.
- Global state library: rejected because the application can use React context and external
  store subscription without adding a new dependency.
- Service-worker database: rejected because cross-device persistence and security would
  still remain unsolved while increasing scope.

## Decision 3: Session-only selected files

**Decision**: Use Uppy Core for the in-browser queue and file restrictions without an upload
plugin. Create object URLs for previews and retain them only in memory for the current tab
session. Persist media metadata with a fallback mock asset key; revoke object URLs on
replacement, removal, and teardown. Add the TUS plugin only when a real storage target exists.

**Rationale**: This provides the full selection, count, progress, failure, classification,
and retry experience without pretending that browser persistence is production storage.

**Alternatives considered**:

- Base64/data URLs in `localStorage`: rejected due to size expansion and small browser quotas.
- IndexedDB blobs: rejected because it would add a temporary migration problem with no
  production benefit.
- Custom queue plus TUS now: rejected because Uppy Core can own queue behavior while the TUS
  transport remains correctly deferred until a real upload target exists.

## Decision 4: URL-owned browse state and intercepted detail route

**Decision**: Store filters in search parameters, use the canonical `/portfolio/[slug]`
path for both quick view and full detail, and use an intercepted parallel route for soft
navigation from lists.

**Rationale**: This matches the PRD's shareability and browser history requirements while
preserving the list context for quick exploration.

**Alternatives considered**:

- Local-state-only modal: rejected because refresh, forward/back, and shareable URLs fail.
- Separate `/quick-view` URL: rejected because it duplicates canonical content.
- Nested lightbox inside quick view: rejected because the PRD prohibits modal stacking.

## Decision 5: Small primitives, feature-owned components

**Decision**: Use shadcn/Radix primitives for accessibility-heavy controls and feature-owned
components for service cards, portfolio cards, upload items, publish checks, and galleries.
CSS variables in `globals.css` mirror the approved design tokens.

**Rationale**: The design can be implemented accurately without coupling domain behavior to
generic primitives or maintaining duplicated one-off components.

**Alternatives considered**:

- One large page component per route: rejected because state and accessibility behavior
  would be difficult to test in isolation.
- A custom component library package: rejected because there is only one application.

## Decision 6: Validation and completion evidence

**Decision**: Use Vitest for pure logic, React Testing Library for components, Playwright for
history/responsive/admin journeys, and run lint, typecheck, tests, E2E, and production build.
Capture responsive screenshots during final manual verification.

**Rationale**: This matches the local workflow's TDD requirement and verifies the risky
history, persistence, privacy, and upload-boundary behaviors at the correct levels.

**Alternatives considered**:

- E2E-only coverage: rejected because repository and validation edge cases need fast focused
  feedback.
- Snapshot-only component testing: rejected because behavior and accessibility matter more
  than static markup snapshots.
