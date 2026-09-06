-- Every table gets RLS enabled AND forced. FORCE matters: without it, the
-- table owner (the role migrations run as) is exempt from its own policies,
-- which would make local testing lie about what a real client can see.

------------------------------------------------------------------------
-- Bootstrap tables: organizations, profiles, members, invitations.
-- These use is_org_member()/has_org_role() (SECURITY DEFINER), not the JWT
-- claim, for the reasons in 013_rls_helpers.sql.
------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.organizations force row level security;

create policy organizations_select on public.organizations
  for select to authenticated
  using (public.is_org_member(id));

-- Direct inserts are a fallback; the app should call the create_organization()
-- RPC (015_rpc_functions.sql), which inserts the org + owner membership
-- atomically so a user is never left owning an org with no membership row.
create policy organizations_insert on public.organizations
  for insert to authenticated
  with check (created_by = auth.uid());

create policy organizations_update on public.organizations
  for update to authenticated
  using (public.has_org_role(id, array['owner', 'admin']))
  with check (public.has_org_role(id, array['owner', 'admin']));

create policy organizations_delete on public.organizations
  for delete to authenticated
  using (public.has_org_role(id, array['owner']));

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- A user can see the profiles of anyone who shares at least one org with
-- them, needed for assignee pickers, avatars, activity "by" fields, etc.
create policy profiles_select_org_members on public.profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.organization_members mine
      join public.organization_members theirs
        on theirs.organization_id = mine.organization_id
      where mine.user_id = auth.uid()
        and theirs.user_id = public.profiles.id
    )
  );

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- No insert/delete policy: profiles are created by the on_auth_user_created
-- trigger and removed only via auth.users cascade, both of which run outside
-- RLS. Default-deny is correct here.

alter table public.organization_members enable row level security;
alter table public.organization_members force row level security;

create policy organization_members_select on public.organization_members
  for select to authenticated
  using (public.is_org_member(organization_id));

-- Direct inserts are a fallback for the same reason as organizations_insert;
-- normal joins go through create_organization()/accept_invitation().
create policy organization_members_insert on public.organization_members
  for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner', 'admin']));

create policy organization_members_update on public.organization_members
  for update to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']))
  with check (public.has_org_role(organization_id, array['owner', 'admin']));

create policy organization_members_delete on public.organization_members
  for delete to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']));

alter table public.organization_invitations enable row level security;
alter table public.organization_invitations force row level security;

create policy organization_invitations_select on public.organization_invitations
  for select to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']));

create policy organization_invitations_update on public.organization_invitations
  for update to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']))
  with check (public.has_org_role(organization_id, array['owner', 'admin']));

create policy organization_invitations_delete on public.organization_invitations
  for delete to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']));

-- No insert policy: invitations are only created via the invite_member() RPC,
-- which generates and hashes the token server-side. Default-deny on direct
-- inserts is intentional.

------------------------------------------------------------------------
-- Business tables: the JWT-claim pattern. Same four-policy shape everywhere.
-- Read: any member. Write: owner/admin/manager/member. Delete: owner/admin/manager.
------------------------------------------------------------------------

alter table public.companies enable row level security;
alter table public.companies force row level security;

create policy companies_select on public.companies for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy companies_insert on public.companies for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy companies_update on public.companies for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy companies_delete on public.companies for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

alter table public.contacts enable row level security;
alter table public.contacts force row level security;

create policy contacts_select on public.contacts for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy contacts_insert on public.contacts for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy contacts_update on public.contacts for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy contacts_delete on public.contacts for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

alter table public.tags enable row level security;
alter table public.tags force row level security;

create policy tags_select on public.tags for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy tags_insert on public.tags for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy tags_update on public.tags for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy tags_delete on public.tags for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

alter table public.contact_tags enable row level security;
alter table public.contact_tags force row level security;

create policy contact_tags_select on public.contact_tags for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy contact_tags_insert on public.contact_tags for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy contact_tags_delete on public.contact_tags for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

alter table public.pipelines enable row level security;
alter table public.pipelines force row level security;

create policy pipelines_select on public.pipelines for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy pipelines_insert on public.pipelines for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

create policy pipelines_update on public.pipelines for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

create policy pipelines_delete on public.pipelines for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin')
  );

alter table public.pipeline_stages enable row level security;
alter table public.pipeline_stages force row level security;

create policy pipeline_stages_select on public.pipeline_stages for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy pipeline_stages_insert on public.pipeline_stages for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

create policy pipeline_stages_update on public.pipeline_stages for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

create policy pipeline_stages_delete on public.pipeline_stages for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin')
  );

alter table public.deals enable row level security;
alter table public.deals force row level security;

create policy deals_select on public.deals for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy deals_insert on public.deals for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy deals_update on public.deals for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy deals_delete on public.deals for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

alter table public.tasks enable row level security;
alter table public.tasks force row level security;

create policy tasks_select on public.tasks for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy tasks_insert on public.tasks for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy tasks_update on public.tasks for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy tasks_delete on public.tasks for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

alter table public.activities enable row level security;
alter table public.activities force row level security;

create policy activities_select on public.activities for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy activities_insert on public.activities for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

-- Activities are an append-only log by convention: no update policy. Delete
-- is restricted to owner/admin, for correcting mistakes, not routine use.
create policy activities_delete on public.activities for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin')
  );

alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;

-- Read-only from the client. Writes come from SECURITY DEFINER functions
-- (owned by postgres, so they bypass RLS) or the service role.
create policy audit_logs_select on public.audit_logs for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

------------------------------------------------------------------------
-- Meta-check: every table above should show rowsecurity = true and have at
-- least one policy. Re-run supabase/tests/rls_meta.sql after adding any new
-- table, a table that fails this silently returns zero rows to everyone,
-- or (worse) is left wide open if you forgot to enable RLS at all.
------------------------------------------------------------------------
