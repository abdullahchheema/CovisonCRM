-- Append-only. Populated from day one rather than retrofitted later, so
-- there's no gap in history. Real writes come from SECURITY DEFINER RPCs /
-- triggers (added as each feature ships) or the service role, regular
-- authenticated users can only read their own org's log, never write to it.
create table public.audit_logs (
  id               bigint generated always as identity primary key,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  actor_id         uuid references public.profiles(id) on delete set null,
  action           text not null,
  entity_type      text not null,
  entity_id        uuid,
  before           jsonb,
  after            jsonb,
  ip               inet,
  user_agent       text,
  created_at       timestamptz not null default now()
);

create index audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);
create index audit_logs_org_entity_idx on public.audit_logs (organization_id, entity_type, entity_id, created_at desc);
