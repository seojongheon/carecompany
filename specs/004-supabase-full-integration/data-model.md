# Data Model: Supabase 전체 연동

## Enumerations

- `app_role`: `customer`, `admin`, `super_admin`
- `case_status`: `private`, `published`, `deleted`
- `media_stage`: `before`, `process`, `after`, `detail`
- `upload_status`: `queued`, `uploading`, `ready`, `failed`
- `tag_type`: `space`, `contamination`, `scope`

## profiles

- `id uuid` primary key and foreign key to `auth.users(id)` with cascade delete
- `email text` normalized, not used as authorization identity
- `display_name text null`
- `role app_role not null default customer`
- `is_active boolean not null default true`
- `created_at`, `updated_at timestamptz`

Auth user creation inserts a customer profile. Users may read their own row and update only `display_name`. Admin fields change only through the role-management RPC.

## admin_role_audit_logs

- `id bigint generated always as identity`
- `actor_id uuid null` references profiles
- `target_id uuid not null` references profiles
- `previous_role`, `new_role app_role`
- `previous_active`, `new_active boolean`
- `reason text not null`
- `created_at timestamptz`

Insert occurs only inside trusted role changes. No client update/delete grants or policies exist.

## services

- `id uuid` primary key
- `key text unique` limited to four PRD service keys
- `name`, `slug unique`, `summary`, `description`, `cover_asset_key`
- `sort_order integer >= 0`, `active boolean`
- timestamps

Four canonical services are seeded with stable UUIDs.

## portfolio_cases

- `id uuid` primary key
- `service_id uuid` references services
- `slug text unique`
- title, summary, location display, space/work/result descriptions and SEO fields
- `work_date date`, `display_period text`
- `status case_status default private`
- `featured_rank integer null`
- `privacy_checklist jsonb` with the seven required boolean keys
- `published_at timestamptz null`
- `created_by`, `updated_by uuid null` references profiles
- timestamps

Transitions: new → private; private → published only through `publish_case`; published → private through `unpublish_case`; any non-deleted → deleted through soft delete. Deleted is terminal except direct database recovery operations.

## case_media

- `id uuid` primary key; `case_id` cascade reference
- `stage media_stage`, `sort_order integer >= 0`
- `is_cover`, `is_public boolean`
- alt text, caption, dimensions, MIME, byte size
- `upload_status upload_status`
- `storage_path text null`, `mock_asset_key text null`
- timestamps

Partial unique index permits one cover per case. Trigger rejects more than 69 rows. A published case requires one public ready cover and at least one public ready medium.

## case_videos

- `id uuid` primary key; `case_id` cascade reference
- YouTube ID, original URL, title, caption, sort order and public flag

Trigger rejects more than three rows per case. YouTube ID is unique within a case.

## tags / case_tags

`tags` belong to one service and have unique `(service_id, key)`. `case_tags` has a composite primary key and a validation trigger ensuring the tag and case belong to the same service.

## site_content

- fixed singleton `id boolean primary key default true check(id)`
- `draft jsonb`, `published jsonb`
- `version integer >= 1`
- `updated_by`, `published_by uuid null`
- `updated_at`, `published_at timestamptz`

No anonymous table grant exists. `get_published_site_content()` exposes only `published` and version metadata. `publish_site_content()` validates required paths, writes a version, and replaces the published document atomically.

## site_content_versions

- `id uuid` primary key
- `version integer unique`
- `content jsonb`
- `created_by uuid null`, `created_at timestamptz`

Only active admins can read. Writes occur through publication and restore functions.

## price_items

- `id uuid` primary key
- `service_key text` constrained to canonical keys
- name, price label, `conditions text[]`
- `visible boolean`, `sort_order integer >= 0`
- timestamps and editor reference

Anonymous users read visible rows. Active admins manage all rows.

## Trusted functions

- `private.current_role() -> app_role`
- `private.is_active_admin() -> boolean`
- `private.is_active_super_admin() -> boolean`
- `public.get_published_site_content() -> jsonb`
- `public.publish_case(case_id uuid) -> portfolio_cases`
- `public.unpublish_case(case_id uuid) -> portfolio_cases`
- `public.publish_site_content() -> jsonb`
- `public.restore_site_content_version(version_id uuid) -> jsonb`
- `public.set_user_admin_role(target_id uuid, new_role app_role, active boolean, reason text) -> profiles`

All security-definer functions set an explicit empty search path and schema-qualify referenced objects.
