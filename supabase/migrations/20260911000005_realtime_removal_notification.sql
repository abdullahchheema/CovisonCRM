-- Live "you've been removed" notice: when a membership row is deleted,
-- the removed user's already-open browser tab shows a dialog immediately,
-- no page reload or next-navigation needed.
--
-- This is deliberately built on the existing notifications table/RLS
-- (user_id = auth.uid(), independent of org membership), not a Realtime
-- subscription directly on organization_members. organization_members'
-- own RLS (is_org_member(organization_id)) checks CURRENT membership, so
-- subscribing to it directly would mean the very act of losing membership
-- also revokes the ability to be told about it. A row in a table whose
-- access doesn't depend on the thing being announced sidesteps that.
--
-- Reusable beyond this one case: any module can insert a notifications row
-- with a new `type` and a case in CriticalNotificationListener (web/src/
-- components/critical-notification-listener.tsx) to get the same
-- interrupt-immediately behavior, without new realtime plumbing per case.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

create or replace function public.notify_member_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Skip self-removal (a second owner removing themselves, or someone
  -- leaving on their own): no point interrupting the person who just
  -- caused this themselves.
  if auth.uid() is distinct from old.user_id then
    insert into public.notifications
      (organization_id, user_id, actor_id, type, title, entity_type, entity_id)
    values
      (old.organization_id, old.user_id, auth.uid(), 'removed_from_org',
       'You were removed from this workspace', 'organization', old.organization_id);
  end if;
  return old;
end;
$$;

create trigger organization_members_notify_removal
  after delete on public.organization_members
  for each row execute function public.notify_member_removal();
