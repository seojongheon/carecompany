# Operations contracts
Every private call revalidates current active role server-side and in RLS. Public inputs use Zod and bounded strings/arrays. Query errors are visible, not zero or seed fallback. Default list size20. IDs are UUID except stable document keys; existing case slugs immutable after first publication. CAS mismatch yields conflict with reload/compare action, not overwrite. Publishing returns complete committed version or leaves old publication unchanged. Restore copies into draft.

Public routes: /inquiry, /account/inquiries, /announcements, /announcements/[slug], /faq. Admin: /admin, /admin/inquiries, /admin/portfolio, /admin/services, /admin/site, /admin/media, /admin/users, /admin/analytics, /admin/settings. Existing login redirect stays /.

Notifications: channel=email|sms|kakao, provider=null until connected; enable rejected while disconnected. No historical queue backfill. In-app recipient IDs never determine authorization to linked records.
