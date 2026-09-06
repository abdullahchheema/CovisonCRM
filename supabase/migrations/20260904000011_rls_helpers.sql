-- current_org_id() / current_org_role() read the JWT claims the custom
-- access token hook writes (see 014_auth_hook_and_trigger.sql). auth.jwt()
-- is STABLE, and wrapping the call in `(select ...)` at each call site makes
-- Postgres evaluate it once per statement as an InitPlan, after which every
-- RLS check below is a constant comparison (`organization_id = $1`) that can
-- drive the leading column of every composite index, instead of a per-row
-- database lookup. This is the reason RLS costs ~zero here at query time.
create or replace function public.current_org_id()
returns uuid
language sql
stable
as $$
  select nullif(
    ((select auth.jwt()) -> 'app_metadata' ->> 'active_org_id'), ''
  )::uuid
$$;

create or replace function public.current_org_role()
returns text
language sql
stable
as $$
  select (select auth.jwt()) -> 'app_metadata' ->> 'org_role'
$$;

-- Used only where the JWT claim can't be trusted yet or doesn't exist: the
-- bootstrap tables (organizations, organization_members,
-- organization_invitations, profiles) have a chicken-and-egg problem, a
-- user must be able to list their orgs *before* an active_org_id claim
-- exists, and the org switcher must read orgs other than the active one.
-- SECURITY DEFINER also breaks the RLS recursion that a plain policy on
-- organization_members querying organization_members would otherwise cause.
create or replace function public.is_org_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org and user_id = auth.uid()
  )
$$;

create or replace function public.has_org_role(org uuid, roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org
      and user_id = auth.uid()
      and role::text = any(roles)
  )
$$;

grant execute on function public.current_org_id() to authenticated;
grant execute on function public.current_org_role() to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, text[]) to authenticated;
