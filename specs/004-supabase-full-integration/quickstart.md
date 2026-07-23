# Quickstart Validation: Supabase 전체 연동

## Prerequisites

- Linked Supabase project confirmed from local CLI state
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Database password available only to CLI execution
- Docker-compatible runtime for local pgTAP tests when available
- `SUPABASE_STORAGE_ENABLED=false`

## Database workflow

1. Install dependencies with `pnpm install`.
2. Confirm the linked target with `pnpm supabase projects list` and `pnpm supabase migration list`.
3. Run local SQL tests with `pnpm supabase test db` when Docker is available.
4. Preview remote changes with `pnpm supabase db push --linked --dry-run`.
5. Review the exact migration list and apply with `pnpm supabase db push --linked`.
6. Generate types with `pnpm supabase gen types typescript --linked > lib/supabase/database.types.ts` through the documented generation script.

Never run `db reset --linked` and never include seed on a production-like remote.

## Application validation

1. Run `pnpm lint`, `pnpm typecheck`, and `pnpm test`.
2. Start the app and create a new customer account.
3. Confirm the profile is `customer` and `/admin` is server-blocked.
4. Confirm public services, site content, and visible price rows come from Supabase.
5. Use an operations-created test admin to create a private case, then confirm it is absent publicly.
6. Complete the publish checklist and publish; confirm it appears publicly within five seconds.
7. Confirm a normal admin cannot open role management.
8. Confirm Storage controls show the disabled state and make no network upload.

## Production-readiness exclusions

- Initial super administrator creation is not executed by this feature.
- Storage activation SQL is not applied.
- Custom SMTP, CAPTCHA/rate limits, image processing, and production monitoring remain deployment gates.
