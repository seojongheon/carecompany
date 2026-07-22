# Frontend Visual Review

**Reviewed:** 2026-07-22  
**Authority:** `hygiene-technology-portfolio-prd.md` over `design/` on conflicts

## Reference captures

- `screenshots/home-1440x900.png`
- `screenshots/home-390x844.png`
- `screenshots/admin-1440x900.png`
- `screenshots/admin-edit-390x844.png`

The captures were generated at the PRD reference widths and inspected against the supplied
design PDFs. The implementation follows the design folder's restrained navy/blue palette,
rounded cards, clear typography hierarchy, generous section spacing, and compact administrator
surface while retaining PRD-required content and behavior.

## Review result

- No horizontal clipping was visible at 390px or 1440px.
- Header, mobile menu affordance, floating estimate action, and admin sticky save action did not
  overlap primary content at the inspected viewport positions.
- Public cards keep consistent image ratios and readable Korean line lengths.
- Admin desktop navigation and mobile edit controls remain available without hiding form fields.
- Focus styles, non-color status text, minimum 44px interactive controls, safe-area padding, and reduced-motion rules
  are present in the shared UI/CSS.
- Placeholders are explicitly presented as sample/mock content; no fabricated business metrics
  were introduced.

The black Next.js development indicator visible in local development captures is framework-only
debug chrome and is absent from production builds.

## Adjustments made during review

- Restored client hydration and interaction by allowing the Playwright loopback dev origin.
- Removed the recovery-notice server/client mismatch with a stable server snapshot.
- Added hydration waits before screenshot capture so test-only caret hiding cannot race React.
- Kept the floating estimate action below dialogs/lightboxes and applied mobile safe-area spacing.
- Marked only the first visible portfolio card image for eager loading; remaining images stay lazy.

Production imagery, final logo, approved prices, and verified business/privacy copy remain tracked
in `docs/project/deferred-backend-integration.md`.
