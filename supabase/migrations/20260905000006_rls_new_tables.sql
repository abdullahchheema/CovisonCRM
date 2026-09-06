-- RLS for tickets, projects/kanban, and email groups/templates, same
-- JWT-claim shape as 012_rls_policies.sql. Re-run
-- supabase/tests/rls_meta.sql after this: both queries there must still
-- return zero rows.

alter table public.tickets enable row level security;
alter table public.tickets force row level security;

create policy tickets_select on public.tickets for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy tickets_insert on public.tickets for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy tickets_update on public.tickets for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy tickets_delete on public.tickets for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

alter table public.projects enable row level security;
alter table public.projects force row level security;

create policy projects_select on public.projects for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy projects_insert on public.projects for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

create policy projects_update on public.projects for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

create policy projects_delete on public.projects for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin')
  );

alter table public.project_columns enable row level security;
alter table public.project_columns force row level security;

create policy project_columns_select on public.project_columns for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy project_columns_insert on public.project_columns for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy project_columns_update on public.project_columns for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy project_columns_delete on public.project_columns for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

alter table public.project_todos enable row level security;
alter table public.project_todos force row level security;

create policy project_todos_select on public.project_todos for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy project_todos_insert on public.project_todos for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy project_todos_update on public.project_todos for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy project_todos_delete on public.project_todos for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

alter table public.email_groups enable row level security;
alter table public.email_groups force row level security;

create policy email_groups_select on public.email_groups for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy email_groups_insert on public.email_groups for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy email_groups_update on public.email_groups for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy email_groups_delete on public.email_groups for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

alter table public.email_group_contacts enable row level security;
alter table public.email_group_contacts force row level security;

create policy email_group_contacts_select on public.email_group_contacts for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy email_group_contacts_insert on public.email_group_contacts for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy email_group_contacts_delete on public.email_group_contacts for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

alter table public.email_templates enable row level security;
alter table public.email_templates force row level security;

create policy email_templates_select on public.email_templates for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy email_templates_insert on public.email_templates for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

create policy email_templates_update on public.email_templates for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

create policy email_templates_delete on public.email_templates for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );
