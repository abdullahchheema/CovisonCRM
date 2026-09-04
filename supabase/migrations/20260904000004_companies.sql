-- Companies are a first-class CRM object (unlike the legacy app, where a
-- contact's "company" was a bare free-text string). contacts.company_id
-- references this table.
create table public.companies (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  domain           citext,
  website          text,
  phone            text,
  address          jsonb,
  industry         text,
  size             int,
  owner_id         uuid references public.profiles(id) on delete set null,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  -- Lets child tables composite-FK to (id, organization_id), so a row can
  -- never reference a company in another tenant — the database can't
  -- represent it, rather than merely being policed by RLS.
  unique (id, organization_id)
);

create unique index companies_org_name_idx on public.companies (organization_id, lower(name)) where deleted_at is null;
create index companies_org_deleted_idx on public.companies (organization_id, deleted_at);

create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();
