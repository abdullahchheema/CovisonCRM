create type public.org_role as enum ('owner', 'admin', 'manager', 'member', 'viewer');

create table public.organization_members (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  role             public.org_role not null default 'member',
  invited_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_members_user_idx on public.organization_members (user_id, organization_id);
create index organization_members_org_role_idx on public.organization_members (organization_id, role);

create trigger organization_members_set_updated_at
  before update on public.organization_members
  for each row execute function public.set_updated_at();

-- token_hash is sha256(raw_token) — the raw token exists only in the
-- invitation email, never stored. Mandatory expiry is the direct fix for the
-- legacy app's permanent, unexpiring reset/verification tokens.
create table public.organization_invitations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  email            citext not null,
  role             public.org_role not null default 'member',
  token_hash       text not null unique,
  invited_by       uuid references auth.users(id) on delete set null,
  expires_at       timestamptz not null,
  accepted_at      timestamptz,
  revoked_at       timestamptz,
  created_at       timestamptz not null default now()
);

-- Only one live (unaccepted, unrevoked) invitation per email per org at a time.
create unique index organization_invitations_pending_idx
  on public.organization_invitations (organization_id, email)
  where accepted_at is null and revoked_at is null;

create index organization_invitations_org_idx on public.organization_invitations (organization_id);
