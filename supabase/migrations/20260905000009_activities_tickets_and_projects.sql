-- Extends the unified activity feed to tickets, and finishes wiring
-- project_id now that the projects table exists (009_activities.sql's
-- comment: "no FK yet; projects table lands in M4", it has, as of
-- 20260905000004_projects_and_kanban.sql).
alter table public.activities add column ticket_id uuid;

alter table public.activities drop constraint activities_check;
alter table public.activities add constraint activities_check
  check (num_nonnulls(contact_id, company_id, deal_id, project_id, ticket_id) = 1);

alter table public.activities
  add constraint activities_project_id_fkey
  foreign key (project_id, organization_id)
  references public.projects (id, organization_id) on delete cascade;

alter table public.activities
  add constraint activities_ticket_id_fkey
  foreign key (ticket_id, organization_id)
  references public.tickets (id, organization_id) on delete cascade;

create index activities_org_ticket_idx
  on public.activities (organization_id, ticket_id, occurred_at desc)
  where deleted_at is null;
create index activities_org_project_idx
  on public.activities (organization_id, project_id, occurred_at desc)
  where deleted_at is null;
