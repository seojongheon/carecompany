# Research: Supabase 전체 연동

## SSR authentication

- **Decision**: Use `@supabase/ssr` browser/server clients, cookie-backed PKCE sessions, and Next.js `proxy.ts` to refresh tokens with `getClaims()`.
- **Rationale**: Supabase's current Next.js guidance requires separate browser and server clients and a proxy because Server Components cannot write refreshed cookies. Authorization never trusts `getSession()` alone.
- **Alternatives considered**: Browser-only localStorage sessions were rejected because server routes cannot verify them. A custom cookie implementation was rejected in favor of the supported package.
- **Source**: [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs)

## RLS authorization

- **Decision**: Enable RLS on every exposed table; use explicit `TO anon`/`TO authenticated`; wrap stable identity helpers in `select`; place security-definer role helpers in a non-exposed `private` schema with fixed empty `search_path`.
- **Rationale**: This follows Supabase's RLS security and performance guidance and avoids user-editable metadata for authorization.
- **Alternatives considered**: JWT `user_metadata` roles were rejected because users can edit them. Repeating profile joins in each policy was rejected due recursion and performance risk.
- **Source**: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Migration workflow

- **Decision**: Install the CLI as a project development dependency, inspect linked migration history, run `db push --dry-run`, then apply only pending reviewed migrations with `db push`.
- **Rationale**: The official workflow tracks applied versions remotely and explicitly recommends dry-run previews. No linked reset is permitted.
- **Alternatives considered**: Dashboard-only SQL was rejected because it is not reproducible. Global CLI installation was rejected to keep versions project-local.
- **Source**: [Local development workflow](https://supabase.com/docs/guides/local-development/cli-workflows)

## Public site content boundary

- **Decision**: Revoke public table access to draft-bearing `site_content`; expose only a stable security-definer read function returning the published JSON document.
- **Rationale**: RLS is row-level and cannot safely hide the draft column from a row that anonymous users can select.
- **Alternatives considered**: A public SELECT policy on the combined row was rejected because callers could request the draft column. Separate draft/publication tables remain a viable future refactor but would add unnecessary write coordination now.

## Storage deferral

- **Decision**: Keep bucket creation and `storage.objects` policies outside automatic migrations in `supabase/storage/enable-storage.sql`; default `SUPABASE_STORAGE_ENABLED=false`.
- **Rationale**: The user requires database/auth integration now without remote Storage activation. Supabase Storage denies operations without RLS policies, so the future package must install buckets and policies together.
- **Alternatives considered**: Creating empty buckets now was rejected because it constitutes activation. Keeping no preparation was rejected because upgrade-time activation should require no application rewrite.
- **Source**: [Storage access control](https://supabase.com/docs/guides/storage/security/access-control)

## Authentication responses

- **Decision**: Preserve generic customer credential and password-reset responses; use SSR-compatible email confirmation and recovery redirects.
- **Rationale**: Supabase Auth may intentionally obscure account existence, and production email flows require configured redirect URLs and SMTP review.
- **Alternatives considered**: Returning raw provider errors was rejected because it leaks account state and produces inconsistent Korean UI copy.
- **Sources**: [Password-based Auth](https://supabase.com/docs/guides/auth/passwords), [Password reset](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
