-- Revises 20260911000002: that migration inserted a dedicated "Contacted"
-- stage as stage 2 and only moved an *existing* open deal into it. What was
-- actually wanted: a lead that gets emailed lands in the pipeline's actual
-- first stage (whatever it's named, "Lead" in the seed), created fresh if
-- the contact has no deal yet at all; a contact who already has an open
-- deal is left exactly where a person has since moved it, since re-emailing
-- someone shouldn't undo manual progress through later stages.
--
-- Removes the "Contacted" stage this migration's predecessor added. Any
-- deal a test send already moved there (unlikely: this was applied before
-- RESEND_API_KEY was configured, so mark_contact_contacted had nothing to
-- act on yet, but handled defensively anyway) is moved back to its
-- pipeline's first stage first, so the "on delete restrict" FK on
-- deals.stage_id doesn't block dropping the row.
update public.deals d
set stage_id = (
  select ps.id
  from public.pipeline_stages ps
  where ps.pipeline_id = d.pipeline_id
  order by ps.position asc
  limit 1
)
where d.stage_id in (select id from public.pipeline_stages where name = 'Contacted');

delete from public.pipeline_stages where name = 'Contacted';

update public.pipeline_stages
set position = position - 1
where position >= 1;

-- Replaces create_organization() again (still append-only), back to the
-- original 6-stage seed with no Contacted stage.
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

-- Replaces mark_contact_contacted() from 20260911000002. Runs as the
-- calling user, same as before: relies on the caller's own RLS (select on
-- contacts/deals/pipelines/pipeline_stages, insert on deals), not elevated
-- privilege.
create or replace function public.mark_contact_contacted(p_contact_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_contact public.contacts;
  v_has_open_deal boolean;
  v_pipeline_id uuid;
  v_first_stage_id uuid;
begin
  select * into v_contact from public.contacts where id = p_contact_id;
  if v_contact.id is null then
    return;
  end if;

  select exists (
    select 1
    from public.deals d
    join public.pipeline_stages ps on ps.id = d.stage_id
    where d.contact_id = p_contact_id
      and d.deleted_at is null
      and not ps.is_won
      and not ps.is_lost
  ) into v_has_open_deal;

  -- Already somewhere in the pipeline: leave it, a follow-up email
  -- shouldn't reset progress a person made moving it forward by hand.
  if v_has_open_deal then
    return;
  end if;

  select id into v_pipeline_id
  from public.pipelines
  where organization_id = v_contact.organization_id
    and is_default
    and deleted_at is null
  limit 1;

  if v_pipeline_id is null then
    return;
  end if;

  select id into v_first_stage_id
  from public.pipeline_stages
  where pipeline_id = v_pipeline_id
  order by position asc
  limit 1;

  if v_first_stage_id is null then
    return;
  end if;

  insert into public.deals
    (organization_id, pipeline_id, stage_id, contact_id, company_id, owner_id, name, created_by)
  values
    (v_contact.organization_id, v_pipeline_id, v_first_stage_id, v_contact.id, v_contact.company_id,
     v_contact.owner_id, v_contact.name, auth.uid());
end;
$$;

grant execute on function public.mark_contact_contacted(uuid) to authenticated;
