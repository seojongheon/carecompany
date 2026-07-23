# Content Operations Contract

## Public reads

- `listPublicCases(query)` returns only published cases with public ready cover media.
- `getPublicCaseBySlug(slug)` returns the published projection or null.
- `getPublishedSiteContent()` returns only the published JSON document and version metadata.
- `listVisiblePrices()` returns visible rows in stable sort order.

## Administrative operations

All operations require a verified active admin profile and return `{ ok: true, data }` or `{ ok: false, code, message }`.

- Create and update private case metadata.
- Replace case tag, video, and media-metadata collections within database constraints.
- Publish, unpublish, and soft-delete through trusted database functions.
- Update site-content draft, publish it, and restore a previous version to draft.
- Create, update, hide, reorder, and delete price items.

Publication failures are atomic and return stable issue codes. Storage-disabled upload requests return `storage_disabled` without creating ready or public media records.
