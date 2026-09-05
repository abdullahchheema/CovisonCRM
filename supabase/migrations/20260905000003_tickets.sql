-- Support tickets. Ported from the legacy app's Ticket model (backend/models/
-- ticket.go) with two changes: contact is a real FK instead of a free-text
-- name/email pair (email is kept as a snapshot for tickets raised by someone
-- not yet a contact), and it's organization-scoped like everything else here.
create table public.tickets (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  contact_id       uuid,
  title            text not null,
  description      text,
  email            citext,
  category         text not null default 'general',
  priority         text not null default 'medium',
  status           text not null default 'open',
  assigned_to      uuid references public.profiles(id) on delete set null,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (id, organization_id),
  foreign key (contact_id, organization_id)
    references public.contacts (id, organization_id) on delete set null
);

create index tickets_org_status_idx on public.tickets (organization_id, status) where deleted_at is null;
create index tickets_org_assignee_idx on public.tickets (organization_id, assigned_to) where deleted_at is null;
create index tickets_org_contact_idx on public.tickets (organization_id, contact_id) where deleted_at is null;

create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();
