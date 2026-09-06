-- Lead types with per-type custom fields.
--
-- Different kinds of lead need different details — a truck-dispatching lead
-- carries MC numbers and equipment types, an RCM lead carries NPIs and
-- specialties — and the set of types grows over time. So the field
-- definitions live in data (a jsonb array on lead_types) rather than as
-- columns, and each contact's answers live in contacts.custom_fields.
-- Adding a new lead type or field is then a row edit in the app, never a
-- migration.
--
-- Shape of lead_types.fields (validated in the app, not the database — a
-- CHECK constraint here would mean a migration every time the field-type
-- list grows, which is exactly what this design is avoiding):
--   [{ "key": "mc_number",        -- stable slug, never changes once created
--      "label": "MC number",
--      "type": "text",           -- text | number | date | select | checkbox
--      "options": ["A", "B"],    -- select only
--      "required": false }]
create table public.lead_types (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  description      text,
  fields           jsonb not null default '[]'::jsonb,
  position         int not null default 0,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (id, organization_id)
);

create unique index lead_types_org_name_idx
  on public.lead_types (organization_id, lower(name)) where deleted_at is null;
create index lead_types_org_position_idx
  on public.lead_types (organization_id, position) where deleted_at is null;

create trigger lead_types_set_updated_at
  before update on public.lead_types
  for each row execute function public.set_updated_at();

-- contacts gains the type it belongs to and the answers for that type's
-- fields. Both nullable/defaulted, so every existing contact stays valid
-- with no backfill: an untyped contact simply shows the standard fields.
alter table public.contacts
  add column lead_type_id uuid,
  add column custom_fields jsonb not null default '{}'::jsonb;

-- Composite FK against (id, organization_id), same as every other
-- cross-table reference in this schema — a contact can never point at a
-- lead type belonging to another tenant, and the database enforces that
-- rather than trusting RLS to.
alter table public.contacts
  add constraint contacts_lead_type_id_fkey
  foreign key (lead_type_id, organization_id)
  references public.lead_types (id, organization_id) on delete set null;

create index contacts_org_lead_type_idx
  on public.contacts (organization_id, lead_type_id) where deleted_at is null;

-- Lets "contacts whose custom_fields contain X" stay an index scan rather
-- than a sequential filter, once there's enough data for it to matter.
create index contacts_custom_fields_idx
  on public.contacts using gin (custom_fields);

alter table public.lead_types enable row level security;
alter table public.lead_types force row level security;

create policy lead_types_select on public.lead_types for select to authenticated
  using (organization_id = (select public.current_org_id()));

-- Defining lead types is workspace configuration, same trust level as
-- email templates: managers and up, not every member.
create policy lead_types_insert on public.lead_types for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

create policy lead_types_update on public.lead_types for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

create policy lead_types_delete on public.lead_types for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );
