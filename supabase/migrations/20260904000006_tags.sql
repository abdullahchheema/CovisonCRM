create table public.tags (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             citext not null,
  color            text not null default 'neutral',
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (id, organization_id)
);

create unique index tags_org_name_idx on public.tags (organization_id, name) where deleted_at is null;

-- Many-to-many join. organization_id is denormalized onto this row (rather
-- than derived via a join to contacts/tags) so RLS on this table is a plain
-- indexed equality check instead of a correlated EXISTS subquery — the
-- difference between an index scan and a per-row filter on every read.
create table public.contact_tags (
  contact_id       uuid not null,
  tag_id           uuid not null,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  created_at       timestamptz not null default now(),
  primary key (contact_id, tag_id),
  foreign key (contact_id, organization_id)
    references public.contacts (id, organization_id) on delete cascade,
  foreign key (tag_id, organization_id)
    references public.tags (id, organization_id) on delete cascade
);

-- Covers "all contacts with tag X" and the any/all tag-matching queries.
create index contact_tags_org_tag_idx on public.contact_tags (organization_id, tag_id, contact_id);
