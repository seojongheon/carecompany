---
name: verify_og_metadata
description: A check for verifying Open Graph (OG) metadata implementation in the project and recommending custom metadata for sub-pages.
---

# Verify Open Graph (OG) Metadata Skill

This skill provides repeatable instructions to analyze the implementation of Open Graph (OG) metadata tags in the Next.js project and suggest custom, independent metadata configurations for specific sub-pages.

## Use Cases

- When new page routes are added, or existing layout metadata definitions are altered.
- Before production deployments, to ensure social sharing links display the correct titles, descriptions, and preview images.

## Instructions & Checklists

### 1. Root Layout OG Audit

Verify the root `layout.tsx` for core metadata configuration:

- Check if the `openGraph` and `twitter` objects are exported correctly inside the `Metadata` export.
- Verify the existence of the following mandatory fields:
  - `title` and `description` (both text and fallback/template).
  - `url` and `siteName`.
  - `images` array (with `url`, `width`, `height`, and `alt`).
  - `locale` and `type` (e.g., 'website').
- Confirm that the referenced OG image asset (e.g., `/og-image.png`) actually exists inside the `public/` directory.

### 2. Identify Pages Benefiting from Independent OG Metadata

Scan the directory structure under `src/app/` to identify distinct routes. Assess whether they require distinct (overridden) OG metadata for social sharing:

- **Authentication Page (`/auth`)**: Check if a distinct title (e.g., "Login / Sign Up") is set.
- **Workspace/Editor Page (`/note` or `/note/[id]`)**: Assess if note titles or workspace contexts should be dynamically injected into OG tags.
- **Dashboard Page (`/dashboard`)**: Determine if subscription management or my-page info should have non-generic titles.
- **Payment Page (`/payment`)**: Check if subscription plans have specific OG marketing tags.

### 3. Generate Recommendations

For any pages lacking custom metadata, recommend code changes:

- Suggest exact static `metadata` objects for static routes.
- Suggest `generateMetadata` function structures for dynamic routes (e.g., notes that load content from Supabase).

