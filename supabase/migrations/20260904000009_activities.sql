-- Unified activity feed, replaces the legacy app's separate contact_notes
-- collection. Every note, call, email, meeting, or system-generated entry
-- (e.g. a status change) is one row here, always attached to exactly one
-- parent so a single query renders a contact/company/deal's timeline.
create table public.activities (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  type             text not null,  -- note | call | email | meeting | system | field_change
  body             text,
  metadata         jsonb,
  contact_id       uuid,
  company_id       uuid,
  deal_id          uuid,
  project_id       uuid,           -- no FK yet; projects table lands in M4
  actor_id         uuid references public.profiles(id) on delete set null,
  occurred_at      timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  check (num_nonnulls(contact_id, company_id, deal_id, project_id) = 1),
  foreign key (contact_id, organization_id)
    references public.contacts (id, organization_id) on delete cascade,
  foreign key (company_id, organization_id)
    references public.companies (id, organization_id) on delete cascade,
  foreign key (deal_id, organization_id)
    references public.deals (id, organization_id) on delete cascade
);

create index activities_org_contact_idx on public.activities (organization_id, contact_id, occurred_at desc)
  where deleted_at is null;
create index activities_org_company_idx on public.activities (organization_id, company_id, occurred_at desc)
  where deleted_at is null;
create index activities_org_deal_idx on public.activities (organization_id, deal_id, occurred_at desc)
  where deleted_at is null;
