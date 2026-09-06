-- audit_logs (010_audit_logs.sql) has existed since M1 with RLS in place,
-- but nothing has ever written to it. A generic trigger, not scattered
-- application-level logging calls, is what makes "populated from day one"
-- actually true. A trigger can't be forgotten by a future feature the way
-- an app-level log call can, and it captures soft-deletes (a plain UPDATE
-- setting deleted_at, which is how every "delete" in this app actually
-- works) the same as any other change, with no special-casing needed.
create or replace function public.audit_log_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_entity_id uuid;
begin
  if tg_op = 'DELETE' then
    v_org_id := old.organization_id;
    v_entity_id := old.id;
  else
    v_org_id := new.organization_id;
    v_entity_id := new.id;
  end if;

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, before, after)
  values (
    v_org_id,
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    v_entity_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- The four core CRM objects for now, not every table, to keep log volume
-- and the "before/after" snapshot size reasonable while this is new.
-- Extending to tags/pipelines/etc. is a one-line addition per table later.
create trigger contacts_audit_log
  after insert or update or delete on public.contacts
  for each row execute function public.audit_log_row();

create trigger companies_audit_log
  after insert or update or delete on public.companies
  for each row execute function public.audit_log_row();

create trigger deals_audit_log
  after insert or update or delete on public.deals
  for each row execute function public.audit_log_row();

create trigger tasks_audit_log
  after insert or update or delete on public.tasks
  for each row execute function public.audit_log_row();
