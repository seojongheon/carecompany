create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('customer', 'admin', 'super_admin');
create type public.case_status as enum ('private', 'published', 'deleted');
create type public.media_stage as enum ('before', 'process', 'after', 'detail');
create type public.upload_status as enum ('queued', 'uploading', 'ready', 'failed');
create type public.tag_type as enum ('space', 'contamination', 'scope');

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  display_name text,
  role public.app_role not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_normalized check (email = lower(trim(email)))
);

create table public.admin_role_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  target_id uuid not null references public.profiles(id) on delete restrict,
  previous_role public.app_role not null,
  new_role public.app_role not null,
  previous_active boolean not null,
  new_active boolean not null,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint admin_role_audit_reason_present check (char_length(trim(reason)) between 3 and 500)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  slug text not null unique,
  summary text not null,
  description text not null,
  cover_asset_key text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_canonical_key check (key in ('bathroom', 'aircon', 'apartment-window', 'commercial-window')),
  constraint services_slug_safe check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.portfolio_cases (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete restrict,
  slug text not null unique,
  title text not null,
  summary text not null default '',
  location_display text not null default '',
  space_type text not null default '',
  work_date date,
  display_period text not null default '',
  problem_description text not null default '',
  work_description text not null default '',
  result_description text not null default '',
  seo_title text,
  seo_description text,
  status public.case_status not null default 'private',
  featured_rank integer check (featured_rank is null or featured_rank >= 0),
  privacy_checklist jsonb not null default jsonb_build_object(
    'noIdentifiablePeople', false,
    'noVehiclePlates', false,
    'noDetailedAddressOrContact', false,
    'noPrivateDocumentsOrBelongings', false,
    'publicMediaReviewed', false,
    'requiredMetadataComplete', false,
    'hasPublicReadyMedia', false
  ),
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_cases_slug_safe check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint portfolio_cases_publish_timestamp check ((status = 'published' and published_at is not null) or (status <> 'published' and published_at is null)),
  constraint portfolio_cases_privacy_object check (jsonb_typeof(privacy_checklist) = 'object')
);

create table public.case_media (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.portfolio_cases(id) on delete cascade,
  stage public.media_stage not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_cover boolean not null default false,
  is_public boolean not null default false,
  alt_text text not null default '',
  caption text not null default '',
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif')),
  size_bytes bigint not null check (size_bytes > 0),
  upload_status public.upload_status not null default 'queued',
  storage_path text,
  mock_asset_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint case_media_source_present check (storage_path is not null or mock_asset_key is not null),
  constraint case_media_public_ready check (not is_public or upload_status = 'ready')
);

create unique index case_media_one_cover_per_case on public.case_media(case_id) where is_cover;
create index case_media_case_order_idx on public.case_media(case_id, sort_order, id);

create table public.case_videos (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.portfolio_cases(id) on delete cascade,
  youtube_video_id text not null,
  original_url text not null,
  title text not null default '',
  caption text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(case_id, youtube_video_id),
  constraint case_videos_youtube_id check (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  constraint case_videos_url_https check (original_url ~ '^https://')
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  key text not null,
  name text not null,
  type public.tag_type not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(service_id, key),
  constraint tags_key_safe check (key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.case_tags (
  case_id uuid not null references public.portfolio_cases(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(case_id, tag_id)
);

create table public.site_content (
  id boolean primary key default true check (id),
  draft jsonb not null,
  published jsonb not null,
  version integer not null default 1 check (version >= 1),
  updated_by uuid references public.profiles(id) on delete set null,
  published_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  published_at timestamptz not null default now()
);

create table public.site_content_versions (
  id uuid primary key default gen_random_uuid(),
  version integer not null unique,
  content jsonb not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint site_content_versions_content_object check (jsonb_typeof(content) = 'object')
);

create table public.price_items (
  id uuid primary key default gen_random_uuid(),
  service_key text not null,
  name text not null,
  price_label text not null,
  conditions text[] not null default '{}',
  visible boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(service_key),
  constraint price_items_service_key check (service_key in ('bathroom', 'aircon', 'apartment-window', 'commercial-window'))
);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles for each row execute function private.touch_updated_at();
create trigger services_touch_updated_at before update on public.services for each row execute function private.touch_updated_at();
create trigger portfolio_cases_touch_updated_at before update on public.portfolio_cases for each row execute function private.touch_updated_at();
create trigger case_media_touch_updated_at before update on public.case_media for each row execute function private.touch_updated_at();
create trigger case_videos_touch_updated_at before update on public.case_videos for each row execute function private.touch_updated_at();
create trigger tags_touch_updated_at before update on public.tags for each row execute function private.touch_updated_at();
create trigger price_items_touch_updated_at before update on public.price_items for each row execute function private.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, role, is_active)
  values (
    new.id,
    lower(trim(coalesce(new.email, ''))),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''),
    'customer'::public.app_role,
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function private.enforce_case_media_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.case_media where case_id = new.case_id and id <> new.id) >= 69 then
    raise exception using errcode = '23514', message = 'case_media_limit_exceeded';
  end if;
  return new;
end;
$$;

create trigger limit_case_media_count before insert or update of case_id on public.case_media for each row execute function private.enforce_case_media_limit();

create or replace function private.enforce_case_video_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.case_videos where case_id = new.case_id and id <> new.id) >= 3 then
    raise exception using errcode = '23514', message = 'case_video_limit_exceeded';
  end if;
  return new;
end;
$$;

create trigger limit_case_video_count before insert or update of case_id on public.case_videos for each row execute function private.enforce_case_video_limit();

create or replace function private.enforce_case_tag_service()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.portfolio_cases c
    join public.tags t on t.id = new.tag_id and t.service_id = c.service_id
    where c.id = new.case_id
  ) then
    raise exception using errcode = '23514', message = 'case_tag_service_mismatch';
  end if;
  return new;
end;
$$;

create trigger enforce_case_tag_service before insert or update on public.case_tags for each row execute function private.enforce_case_tag_service();

insert into public.services (id, key, name, slug, summary, description, cover_asset_key, sort_order, active)
values
  ('11111111-1111-4111-8111-111111111111', 'bathroom', '화장실 청소', 'bathroom', '물때와 곰팡이, 틈새 오염까지 공간 상태에 맞춰 정리합니다.', '바닥·벽면·도기·수전의 재질과 오염 정도를 확인하고 필요한 범위를 구역별로 작업합니다.', 'bathroom', 1, true),
  ('22222222-2222-4222-8222-222222222222', 'aircon', '에어컨 청소', 'aircon', '분해 가능한 부품과 열교환기 상태를 확인해 꼼꼼하게 세척합니다.', '기기 형태와 설치 환경을 먼저 확인하고 오염이 다시 남지 않도록 세척과 건조 순서를 지킵니다.', 'aircon', 2, true),
  ('33333333-3333-4333-8333-333333333333', 'apartment-window', '아파트 유리창 청소', 'apartment-window', '창틀 먼지와 유리 얼룩을 함께 정리해 밝은 시야를 되찾습니다.', '세대 구조와 창호 상태, 안전한 접근 범위를 확인한 뒤 유리와 창틀을 순서대로 관리합니다.', 'apartment-window', 3, true),
  ('44444444-4444-4444-8444-444444444444', 'commercial-window', '상가 유리창 청소', 'commercial-window', '매장의 첫인상을 좌우하는 전면 유리와 프레임을 정돈합니다.', '영업 동선과 외부 환경을 고려해 작업 구역을 나누고 유리 자국과 프레임 오염을 관리합니다.', 'commercial-window', 4, true);

insert into public.site_content (id, draft, published)
values (
  true,
  jsonb_build_object(
    'home', jsonb_build_object(
      'eyebrow', '천안·아산 청소 포트폴리오',
      'title', '말보다 현장으로 보여드리는 청소',
      'description', '화장실부터 에어컨, 아파트와 상가 유리창까지. 공개 전 개인정보를 확인한 작업 사례로 필요한 서비스를 살펴보세요.',
      'primaryCtaLabel', '작업 사례 보기',
      'primaryCtaHref', '/portfolio',
      'heroImageAlt', '청소 결과를 상징하는 파란색 그래픽',
      'heroAssetKey', 'commercial-window.svg'
    ),
    'pricingLead', '아래 내용은 안내용 기준이며 실제 견적은 작업 범위 확인 후 안내합니다.',
    'processSteps', jsonb_build_array(
      jsonb_build_object('id', 'process-1', 'title', '요청 내용 확인', 'description', '필요한 서비스와 공간, 불편한 점을 먼저 확인합니다.', 'visible', true, 'sortOrder', 1),
      jsonb_build_object('id', 'process-2', 'title', '사진과 범위 확인', 'description', '재질과 오염 상태를 보고 작업 가능 범위를 나눕니다.', 'visible', true, 'sortOrder', 2),
      jsonb_build_object('id', 'process-3', 'title', '결과 안내', 'description', '작업한 범위와 관리 시 주의할 점을 정리해 안내합니다.', 'visible', true, 'sortOrder', 3)
    ),
    'about', jsonb_build_object(
      'title', '보이는 결과와 확인 가능한 과정',
      'description', '위생의 기술은 천안·아산을 중심으로 현장을 살피고 필요한 범위를 정직하게 안내합니다.',
      'values', jsonb_build_array(
        jsonb_build_object('id', 'value-1', 'title', '필요한 범위부터', 'description', '과도한 약속보다 현장 상태와 가능한 작업 범위를 먼저 확인합니다.'),
        jsonb_build_object('id', 'value-2', 'title', '과정이 남도록', 'description', '작업 전·과정·후 사진을 구분해 결과를 쉽게 비교합니다.'),
        jsonb_build_object('id', 'value-3', 'title', '공개는 조심스럽게', 'description', '개인정보가 없는 자료만 공개합니다.')
      )
    ),
    'settings', jsonb_build_object(
      'businessName', '위생의 기술',
      'footerDescription', '천안·아산을 중심으로 현장을 살피고 필요한 범위를 정직하게 안내하는 청소 서비스입니다.',
      'contactLabel', '작업 사례 보기',
      'contactHref', '/portfolio'
    )
  ),
  jsonb_build_object(
    'home', jsonb_build_object(
      'eyebrow', '천안·아산 청소 포트폴리오',
      'title', '말보다 현장으로 보여드리는 청소',
      'description', '화장실부터 에어컨, 아파트와 상가 유리창까지. 공개 전 개인정보를 확인한 작업 사례로 필요한 서비스를 살펴보세요.',
      'primaryCtaLabel', '작업 사례 보기',
      'primaryCtaHref', '/portfolio',
      'heroImageAlt', '청소 결과를 상징하는 파란색 그래픽',
      'heroAssetKey', 'commercial-window.svg'
    ),
    'pricingLead', '아래 내용은 안내용 기준이며 실제 견적은 작업 범위 확인 후 안내합니다.',
    'processSteps', jsonb_build_array(
      jsonb_build_object('id', 'process-1', 'title', '요청 내용 확인', 'description', '필요한 서비스와 공간, 불편한 점을 먼저 확인합니다.', 'visible', true, 'sortOrder', 1),
      jsonb_build_object('id', 'process-2', 'title', '사진과 범위 확인', 'description', '재질과 오염 상태를 보고 작업 가능 범위를 나눕니다.', 'visible', true, 'sortOrder', 2),
      jsonb_build_object('id', 'process-3', 'title', '결과 안내', 'description', '작업한 범위와 관리 시 주의할 점을 정리해 안내합니다.', 'visible', true, 'sortOrder', 3)
    ),
    'about', jsonb_build_object(
      'title', '보이는 결과와 확인 가능한 과정',
      'description', '위생의 기술은 천안·아산을 중심으로 현장을 살피고 필요한 범위를 정직하게 안내합니다.',
      'values', jsonb_build_array(
        jsonb_build_object('id', 'value-1', 'title', '필요한 범위부터', 'description', '과도한 약속보다 현장 상태와 가능한 작업 범위를 먼저 확인합니다.'),
        jsonb_build_object('id', 'value-2', 'title', '과정이 남도록', 'description', '작업 전·과정·후 사진을 구분해 결과를 쉽게 비교합니다.'),
        jsonb_build_object('id', 'value-3', 'title', '공개는 조심스럽게', 'description', '개인정보가 없는 자료만 공개합니다.')
      )
    ),
    'settings', jsonb_build_object(
      'businessName', '위생의 기술',
      'footerDescription', '천안·아산을 중심으로 현장을 살피고 필요한 범위를 정직하게 안내하는 청소 서비스입니다.',
      'contactLabel', '작업 사례 보기',
      'contactHref', '/portfolio'
    )
  )
);

insert into public.price_items (id, service_key, name, price_label, conditions, visible, sort_order)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bathroom', '화장실 청소', '현장 확인 후 범위 안내', array['공간 크기와 도기 수', '물때·곰팡이의 범위'], true, 1),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'aircon', '에어컨 청소', '기기 형태별 안내', array['벽걸이·스탠드 등 기기 형태', '분해 가능한 범위'], true, 2),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'apartment-window', '아파트 유리창 청소', '창 구조 확인 후 안내', array['창 개수와 구조', '내·외창 접근 가능 범위'], true, 3),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'commercial-window', '상가 유리창 청소', '면적과 안전 조건 확인', array['전면 유리 면적', '외부 작업 높이'], true, 4);
