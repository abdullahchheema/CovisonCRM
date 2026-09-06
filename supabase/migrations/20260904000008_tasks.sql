-- Tasks are attachable to a contact, company, or deal, or nothing (a
-- standalone personal to-do). project_id is reserved for M4, when the
-- projects module lands; it has no FK yet because the projects table
-- doesn't exist in this schema.
create table public.tasks (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  assigned_to      uuid references public.profiles(id) on delete set null,
  created_by       uuid references auth.users(id) on delete set null,
  contact_id       uuid,
  company_id       uuid,
  deal_id          uuid,
  project_id       uuid,
  title            text not null,
  description      text,
  priority         text,
  status           text not null default 'open',
  due_at           timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (id, organization_id),
  check (num_nonnulls(contact_id, company_id, deal_id, project_id) <= 1),
  foreign key (contact_id, organization_id)
    references public.contacts (id, organization_id) on delete cascade,
  foreign key (company_id, organization_id)
    references public.companies (id, organization_id) on delete cascade,
  foreign key (deal_id, organization_id)
    references public.deals (id, organization_id) on delete cascade
);

create index tasks_org_assignee_idx on public.tasks (organization_id, assigned_to, due_at) where deleted_at is null;
create index tasks_org_due_idx on public.tasks (organization_id, due_at)
  where deleted_at is null and status <> 'completed';

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();
