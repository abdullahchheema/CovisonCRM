create table public.contacts (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  company_id         uuid,
  name               text not null,
  email              citext,
  phone              text,
  job_title          text,
  status             text not null default 'new',
  priority           text,
  owner_id           uuid references public.profiles(id) on delete set null,
  expected_revenue   numeric(14, 2),
  expected_close     date,
  probability        text,
  linkedin_url       text,
  website            text,
  country            text,
  city               text,
  niche              text,
  last_activity_at   timestamptz,
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,
  unique (id, organization_id),
  foreign key (company_id, organization_id)
    references public.companies (id, organization_id) on delete set null
);

-- Default list sort / pagination.
create index contacts_org_created_idx on public.contacts (organization_id, deleted_at, created_at desc);
create index contacts_org_company_idx on public.contacts (organization_id, company_id) where deleted_at is null;
create index contacts_org_owner_idx on public.contacts (organization_id, owner_id) where deleted_at is null;
create index contacts_org_status_idx on public.contacts (organization_id, status) where deleted_at is null;

-- Trigram search, replaces the legacy app's unindexed `LIKE '%x%'` scans.
create index contacts_name_trgm_idx on public.contacts using gin (name gin_trgm_ops);
create index contacts_email_trgm_idx on public.contacts using gin (email gin_trgm_ops);

create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();
