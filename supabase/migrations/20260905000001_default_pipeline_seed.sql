-- Extends create_organization() (013_rpc_functions.sql) to also seed a
-- default pipeline with standard stages, so deals are usable immediately
-- after a workspace is created rather than requiring a separate setup step.
-- A new migration replacing the function body, rather than editing
-- 013 in place. That file may already be applied to a live project, and
-- migrations are append-only.
create or replace function public.create_organization(org_name text, org_slug text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org public.organizations;
  new_pipeline_id uuid;
begin
  insert into public.organizations (name, slug, created_by)
  values (org_name, org_slug, auth.uid())
  returning * into new_org;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org.id, auth.uid(), 'owner');

  update public.profiles
  set active_organization_id = new_org.id
  where id = auth.uid();

  insert into public.pipelines (organization_id, name, is_default)
  values (new_org.id, 'Sales Pipeline', true)
  returning id into new_pipeline_id;

  insert into public.pipeline_stages (organization_id, pipeline_id, name, position, is_won, is_lost)
  values
    (new_org.id, new_pipeline_id, 'Lead', 0, false, false),
    (new_org.id, new_pipeline_id, 'Qualified', 1, false, false),
    (new_org.id, new_pipeline_id, 'Proposal', 2, false, false),
    (new_org.id, new_pipeline_id, 'Negotiation', 3, false, false),
    (new_org.id, new_pipeline_id, 'Won', 4, true, false),
    (new_org.id, new_pipeline_id, 'Lost', 5, false, true);

  return new_org;
end;
$$;
