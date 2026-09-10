-- Adds a "Contacted" stage right after the first stage of every existing
-- pipeline (shifting everything else down one), updates create_organization()
-- so new orgs get it too, and adds mark_contact_contacted(), called after a
-- template email send: moves the contact's single most-recently-created
-- open deal into "Contacted". No stage found in that deal's pipeline, or no
-- open deal at all, and it's a no-op, nothing is auto-created.

update public.pipeline_stages
set position = position + 1
where position >= 1;

insert into public.pipeline_stages (organization_id, pipeline_id, name, position, is_won, is_lost)
select p.organization_id, p.id, 'Contacted', 1, false, false
from public.pipelines p
where not exists (
  select 1 from public.pipeline_stages ps
  where ps.pipeline_id = p.id and ps.name = 'Contacted'
);

-- Replaces 002_default_pipeline_seed.sql's body (migrations are append-only)
-- so newly created orgs seed with Contacted already in place.
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
    (new_org.id, new_pipeline_id, 'Contacted', 1, false, false),
    (new_org.id, new_pipeline_id, 'Qualified', 2, false, false),
    (new_org.id, new_pipeline_id, 'Proposal', 3, false, false),
    (new_org.id, new_pipeline_id, 'Negotiation', 4, false, false),
    (new_org.id, new_pipeline_id, 'Won', 5, true, false),
    (new_org.id, new_pipeline_id, 'Lost', 6, false, true);

  return new_org;
end;
$$;

-- Runs as the calling user (no "security definer"): relies on the same RLS
-- the caller already has (select on contacts/deals/pipeline_stages, update
-- on deals), rather than bypassing it, since anyone who can send a template
-- email can already move a deal's stage by hand.
create or replace function public.mark_contact_contacted(p_contact_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_deal record;
  v_contacted_stage_id uuid;
begin
  select d.* into v_deal
  from public.deals d
  join public.pipeline_stages ps on ps.id = d.stage_id
  where d.contact_id = p_contact_id
    and d.deleted_at is null
    and not ps.is_won
    and not ps.is_lost
  order by d.created_at desc
  limit 1;

  if v_deal.id is null then
    return;
  end if;

  select id into v_contacted_stage_id
  from public.pipeline_stages
  where pipeline_id = v_deal.pipeline_id
    and name = 'Contacted'
  limit 1;

  if v_contacted_stage_id is null or v_contacted_stage_id = v_deal.stage_id then
    return;
  end if;

  update public.deals set stage_id = v_contacted_stage_id where id = v_deal.id;
end;
$$;

grant execute on function public.mark_contact_contacted(uuid) to authenticated;
