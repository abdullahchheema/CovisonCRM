-- Email audience lists and templates, data management only. Actual sending
-- is M3 (needs a Resend account + a durable job queue, per the migration
-- plan); these tables let a workspace build its templates and audiences now
-- so nothing here needs a second migration pass when sending lands.
create table public.email_groups (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  description      text,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (id, organization_id)
);

create unique index email_groups_org_name_idx
  on public.email_groups (organization_id, lower(name)) where deleted_at is null;

create trigger email_groups_set_updated_at
  before update on public.email_groups
  for each row execute function public.set_updated_at();

-- Join table, same shape as contact_tags.
create table public.email_group_contacts (
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  group_id         uuid not null,
  contact_id       uuid not null,
  added_at         timestamptz not null default now(),
  primary key (group_id, contact_id),
  foreign key (group_id, organization_id)
    references public.email_groups (id, organization_id) on delete cascade,
  foreign key (contact_id, organization_id)
    references public.contacts (id, organization_id) on delete cascade
);

create index email_group_contacts_org_idx
  on public.email_group_contacts (organization_id, contact_id);

create table public.email_templates (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  name               text not null,
  subject            text not null,
  body               text not null default '',
  recipient_group_id uuid,
  frequency          text not null default 'one-time',
  send_date          date,
  send_time          time,
  day_of_week        text,
  day_of_month       integer,
  status             text not null default 'draft',
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,
  unique (id, organization_id),
  foreign key (recipient_group_id, organization_id)
    references public.email_groups (id, organization_id) on delete set null
);

create index email_templates_org_status_idx
  on public.email_templates (organization_id, status) where deleted_at is null;

create trigger email_templates_set_updated_at
  before update on public.email_templates
  for each row execute function public.set_updated_at();
