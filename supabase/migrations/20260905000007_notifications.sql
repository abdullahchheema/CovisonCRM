-- In-app notifications, v1: assignment events only ("you were assigned
-- this contact/deal/ticket/..."). Rows are written exclusively by
-- SECURITY DEFINER trigger functions below (owned by the migration role,
-- which bypasses RLS the same way create_organization()/invite_member() do
-- in 013_rpc_functions.sql). There is deliberately no INSERT policy for
-- `authenticated`, so a client can never forge a notification for another
-- user. Polling-based unread count for v1; Realtime is the natural upgrade
-- once this is proven, not a prerequisite for it.
create table public.notifications (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  actor_id         uuid references auth.users(id) on delete set null,
  type             text not null,
  title            text not null,
  body             text,
  link             text,
  entity_type      text,
  entity_id        uuid,
  read_at          timestamptz,
  created_at       timestamptz not null default now()
);

-- Leading column is the recipient, not organization_id, notifications are
-- read by "which user", never listed by org, and a user may have pending
-- notifications from an org that isn't their currently active one.
create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc) where read_at is null;

alter table public.notifications enable row level security;
alter table public.notifications force row level security;

create policy notifications_select on public.notifications for select to authenticated
  using (user_id = auth.uid());

create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notifications_delete on public.notifications for delete to authenticated
  using (user_id = auth.uid());

-- No insert policy; see the file header note.

-- Shared helper: skip self-assignment (no point notifying someone they
-- assigned something to themselves) and skip a null assignee.
create or replace function public.create_assignment_notification(
  p_organization_id uuid,
  p_user_id uuid,
  p_actor_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_title text,
  p_link text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_user_id = p_actor_id then
    return;
  end if;

  insert into public.notifications
    (organization_id, user_id, actor_id, type, title, link, entity_type, entity_id)
  values
    (p_organization_id, p_user_id, p_actor_id, 'assigned', p_title, p_link, p_entity_type, p_entity_id);
end;
$$;

-- One small trigger function per entity rather than one dynamic-SQL
-- function keyed off TG_TABLE_NAME/TG_ARGV, more code, but each one reads
-- top to bottom with no format()-string indirection to trace through.

create or replace function public.notify_contact_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.owner_id is not null
     and (TG_OP = 'INSERT' or NEW.owner_id is distinct from OLD.owner_id) then
    perform public.create_assignment_notification(
      NEW.organization_id, NEW.owner_id, auth.uid(),
      'contact', NEW.id,
      format('You were assigned %s', NEW.name),
      '/contacts/' || NEW.id
    );
  end if;
  return NEW;
end;
$$;

create trigger contacts_notify_assignment
  after insert or update of owner_id on public.contacts
  for each row execute function public.notify_contact_assignment();

create or replace function public.notify_company_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.owner_id is not null
     and (TG_OP = 'INSERT' or NEW.owner_id is distinct from OLD.owner_id) then
    perform public.create_assignment_notification(
      NEW.organization_id, NEW.owner_id, auth.uid(),
      'company', NEW.id,
      format('You were assigned %s', NEW.name),
      '/companies/' || NEW.id
    );
  end if;
  return NEW;
end;
$$;

create trigger companies_notify_assignment
  after insert or update of owner_id on public.companies
  for each row execute function public.notify_company_assignment();

create or replace function public.notify_deal_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.owner_id is not null
     and (TG_OP = 'INSERT' or NEW.owner_id is distinct from OLD.owner_id) then
    perform public.create_assignment_notification(
      NEW.organization_id, NEW.owner_id, auth.uid(),
      'deal', NEW.id,
      format('You were assigned the deal "%s"', NEW.name),
      '/deals/' || NEW.id
    );
  end if;
  return NEW;
end;
$$;

create trigger deals_notify_assignment
  after insert or update of owner_id on public.deals
  for each row execute function public.notify_deal_assignment();

create or replace function public.notify_task_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.assigned_to is not null
     and (TG_OP = 'INSERT' or NEW.assigned_to is distinct from OLD.assigned_to) then
    perform public.create_assignment_notification(
      NEW.organization_id, NEW.assigned_to, auth.uid(),
      'task', NEW.id,
      format('You were assigned the task "%s"', NEW.title),
      '/tasks/' || NEW.id
    );
  end if;
  return NEW;
end;
$$;

create trigger tasks_notify_assignment
  after insert or update of assigned_to on public.tasks
  for each row execute function public.notify_task_assignment();

create or replace function public.notify_ticket_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.assigned_to is not null
     and (TG_OP = 'INSERT' or NEW.assigned_to is distinct from OLD.assigned_to) then
    perform public.create_assignment_notification(
      NEW.organization_id, NEW.assigned_to, auth.uid(),
      'ticket', NEW.id,
      format('You were assigned the ticket "%s"', NEW.title),
      '/tickets/' || NEW.id
    );
  end if;
  return NEW;
end;
$$;

create trigger tickets_notify_assignment
  after insert or update of assigned_to on public.tickets
  for each row execute function public.notify_ticket_assignment();
