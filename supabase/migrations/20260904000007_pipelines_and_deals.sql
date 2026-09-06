-- An organization can run multiple pipelines (e.g. "New Business" vs
-- "Renewals"), each with its own ordered stages. This replaces the legacy
-- app's six hardcoded deal-stage enum values.
create table public.pipelines (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  is_default       boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (id, organization_id)
);

create trigger pipelines_set_updated_at
  before update on public.pipelines
  for each row execute function public.set_updated_at();

create table public.pipeline_stages (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  pipeline_id      uuid not null,
  name             text not null,
  position         int not null default 0,
  probability      int,
  color            text,
  is_won           boolean not null default false,
  is_lost          boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (pipeline_id, organization_id)
    references public.pipelines (id, organization_id) on delete cascade
);

create index pipeline_stages_pipeline_idx on public.pipeline_stages (organization_id, pipeline_id, position);

create trigger pipeline_stages_set_updated_at
  before update on public.pipeline_stages
  for each row execute function public.set_updated_at();

create table public.deals (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  pipeline_id          uuid not null,
  stage_id             uuid not null,
  contact_id           uuid,
  company_id           uuid,
  owner_id             uuid references public.profiles(id) on delete set null,
  name                 text not null,
  value                numeric(14, 2) not null default 0,
  currency             text not null default 'USD',
  expected_close_date  date,
  description          text,
  created_by           uuid references auth.users(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz,
  unique (id, organization_id),
  foreign key (pipeline_id, organization_id)
    references public.pipelines (id, organization_id) on delete cascade,
  -- RESTRICT, not CASCADE: deleting a stage that still holds deals should
  -- fail loudly rather than silently orphan or wipe out pipeline history.
  foreign key (stage_id, organization_id)
    references public.pipeline_stages (id, organization_id) on delete restrict,
  foreign key (contact_id, organization_id)
    references public.contacts (id, organization_id) on delete set null,
  foreign key (company_id, organization_id)
    references public.companies (id, organization_id) on delete set null
);

create index deals_org_stage_idx on public.deals (organization_id, stage_id) where deleted_at is null;
create index deals_org_owner_idx on public.deals (organization_id, owner_id) where deleted_at is null;
create index deals_org_contact_idx on public.deals (organization_id, contact_id) where deleted_at is null;

create trigger deals_set_updated_at
  before update on public.deals
  for each row execute function public.set_updated_at();
