# Contract: Routes, history, and visibility

## Customer routes

| Route | Direct navigation | Soft navigation from a case list |
|---|---|---|
| `/` | Home page | Same |
| `/services/[service]` | Full service page | Same |
| `/portfolio` | Full public case list | Same |
| `/portfolio/[slug]` | Full detail or generic 404 | Intercepted quick-view modal over originating list |
| `/pricing` | Full price page | Same |
| `/process` | Full process page | Same |
| `/about` | Full about page | Same |
| `/privacy` | Full privacy template | Same |

## Administrator routes

| Route | Behavior in this milestone |
|---|---|
| `/admin` | Dashboard without authentication |
| `/admin/portfolio` | Search/filter mock case list |
| `/admin/portfolio/new` | Create a private draft |
| `/admin/portfolio/[id]/edit` | Edit metadata, media, videos, and publish state |

## History rules

1. Opening a case from a filtered list pushes `/portfolio/[slug]` and keeps list state mounted.
2. Browser Back closes quick view before leaving the list.
3. Browser Forward reopens the same quick view when the case remains publicly visible.
4. Close restores focus to the triggering card and preserves scroll position.
5. `전체 사례 보기` performs a full navigation to the non-intercepted detail page.
6. Previous/next uses only the active filtered, public ordering.

## Visibility rules

- Private, deleted, invalid, or public-without-ready-media cases return the same customer 404.
- Private media never creates a customer placeholder, count gap, thumbnail, or lightbox item.
- Modal and lightbox are never open together.
- The estimate FAB is hidden while mobile menu, quick view, or lightbox is open.
- Filter query parameters are canonicalized in stable key order and do not create separate
  indexable content in the future backend milestone.
