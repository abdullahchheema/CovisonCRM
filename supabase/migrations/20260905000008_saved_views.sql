-- Saved views: a named, persisted filter/sort combination for a list page.
-- entity_type keys which page a view belongs to ('contacts' first; the UI
-- generalizes to companies/tickets/tasks without another migration — this
-- table doesn't need to know what "filters" means, it just stores and
-- returns the JSON the page it belongs to wrote).
create table public.saved_views (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  entity_type      text not null,
  name             text not null,
  filters          jsonb not null default '{}'::jsonb,
  is_shared        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index saved_views_owner_name_idx
  on public.saved_views (user_id, entity_type, lower(name));
-- Shared views need to be listed by any org member, not just the owner —
-- a second, org-scoped lookup path alongside the owner index above.
create index saved_views_org_shared_idx
  on public.saved_views (organization_id, entity_type) where is_shared;

create trigger saved_views_set_updated_at
  before update on public.saved_views
  for each row execute function public.set_updated_at();

alter table public.saved_views enable row level security;
alter table public.saved_views force row level security;

-- A user sees their own views (shared or not) plus anyone else's views
-- they've explicitly shared to the org.
create policy saved_views_select on public.saved_views for select to authenticated
  using (
    user_id = auth.uid()
    or (is_shared and organization_id = (select public.current_org_id()))
  );

create policy saved_views_insert on public.saved_views for insert to authenticated
  with check (
    user_id = auth.uid()
    and organization_id = (select public.current_org_id())
  );

-- Only the owner can rename/re-save/(un)share or delete their own view —
-- a shared view is read-only to everyone else, same as a shared filter
-- link in any comparable product.
create policy saved_views_update on public.saved_views for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy saved_views_delete on public.saved_views for delete to authenticated
  using (user_id = auth.uid());
