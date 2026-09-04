-- The tenant root. Every business row eventually traces back to one of these
-- via organization_id.
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        citext not null unique,
  logo_url    text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index organizations_deleted_at_idx on public.organizations (deleted_at) where deleted_at is null;

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- One row per auth.users row, auto-created by the trigger in
-- 014_auth_hook_and_trigger.sql. active_organization_id is which workspace
-- the user is currently "in" — the custom access token hook reads it to
-- decide what to put in the JWT claim every RLS policy checks.
create table public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  email                   citext not null,
  full_name               text,
  avatar_url              text,
  active_organization_id  uuid references public.organizations(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
