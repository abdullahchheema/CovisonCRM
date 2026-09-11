-- Follow-up sequences: an ordered list of steps (each an email template +
-- a delay in days since the previous step), a contact gets "enrolled" in
-- one, and a daily cron (see app/api/cron/follow-ups) sends whichever
-- step is due and advances or completes the enrollment. Same shape HubSpot
-- Sequences / Salesforce cadences use: enroll, timed steps, runs until
-- done or manually stopped. A single-step sequence ("follow up in 7 days")
-- and a full drip (7 -> 14 -> 21 -> 30) are the same feature, just
-- different step counts, so there's deliberately no special-cased "simple
-- reminder" type.

create table public.follow_up_sequences (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  description      text,
  is_active        boolean not null default true,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (id, organization_id)
);

create trigger follow_up_sequences_set_updated_at
  before update on public.follow_up_sequences
  for each row execute function public.set_updated_at();

create table public.follow_up_sequence_steps (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  sequence_id        uuid not null,
  position           int not null,
  delay_days         int not null check (delay_days > 0),
  email_template_id  uuid not null,
  created_at         timestamptz not null default now(),
  unique (id, organization_id),
  unique (sequence_id, position),
  foreign key (sequence_id, organization_id)
    references public.follow_up_sequences (id, organization_id) on delete cascade,
  -- RESTRICT: a template still referenced by a step shouldn't vanish out
  -- from under a running sequence.
  foreign key (email_template_id, organization_id)
    references public.email_templates (id, organization_id) on delete restrict
);

create index follow_up_sequence_steps_sequence_idx
  on public.follow_up_sequence_steps (organization_id, sequence_id, position);

create table public.follow_up_enrollments (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  sequence_id          uuid not null,
  contact_id           uuid not null,
  status               text not null default 'active' check (status in ('active', 'completed', 'stopped')),
  -- 0 = enrolled, nothing sent yet. Set to a step's `position` once that
  -- step has been sent.
  current_step_position int not null default 0,
  next_run_at          timestamptz not null,
  enrolled_at          timestamptz not null default now(),
  enrolled_by          uuid references public.profiles(id) on delete set null,
  stopped_at           timestamptz,
  stopped_reason       text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (sequence_id, organization_id)
    references public.follow_up_sequences (id, organization_id) on delete cascade,
  foreign key (contact_id, organization_id)
    references public.contacts (id, organization_id) on delete cascade
);

-- One active run of a given sequence per contact at a time; re-enrolling
-- after completion/stop is fine, that's just a new row.
create unique index follow_up_enrollments_active_unique
  on public.follow_up_enrollments (sequence_id, contact_id)
  where status = 'active';

-- What the daily cron scans: due, active enrollments, org by org.
create index follow_up_enrollments_due_idx
  on public.follow_up_enrollments (organization_id, next_run_at)
  where status = 'active';

create index follow_up_enrollments_contact_idx
  on public.follow_up_enrollments (organization_id, contact_id);

create trigger follow_up_enrollments_set_updated_at
  before update on public.follow_up_enrollments
  for each row execute function public.set_updated_at();

alter table public.follow_up_sequences enable row level security;
alter table public.follow_up_sequences force row level security;

create policy follow_up_sequences_select on public.follow_up_sequences for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy follow_up_sequences_insert on public.follow_up_sequences for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy follow_up_sequences_update on public.follow_up_sequences for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy follow_up_sequences_delete on public.follow_up_sequences for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

alter table public.follow_up_sequence_steps enable row level security;
alter table public.follow_up_sequence_steps force row level security;

create policy follow_up_sequence_steps_select on public.follow_up_sequence_steps for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy follow_up_sequence_steps_insert on public.follow_up_sequence_steps for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy follow_up_sequence_steps_update on public.follow_up_sequence_steps for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy follow_up_sequence_steps_delete on public.follow_up_sequence_steps for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

alter table public.follow_up_enrollments enable row level security;
alter table public.follow_up_enrollments force row level security;

create policy follow_up_enrollments_select on public.follow_up_enrollments for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy follow_up_enrollments_insert on public.follow_up_enrollments for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy follow_up_enrollments_update on public.follow_up_enrollments for update to authenticated
  using (organization_id = (select public.current_org_id()))
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager', 'member')
  );

create policy follow_up_enrollments_delete on public.follow_up_enrollments for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_org_role()) in ('owner', 'admin', 'manager')
  );

-- Enrolls a contact: schedules the first step's send `delay_days` from now.
-- Runs as the caller (RLS does the authorization), returns the new
-- enrollment id.
create or replace function public.enroll_contact_in_sequence(p_sequence_id uuid, p_contact_id uuid)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_first_delay int;
  v_org_id uuid;
  v_enrollment_id uuid;
begin
  select organization_id into v_org_id from public.contacts where id = p_contact_id;
  if v_org_id is null then
    raise exception 'contact not found';
  end if;

  select delay_days into v_first_delay
  from public.follow_up_sequence_steps
  where sequence_id = p_sequence_id
  order by position asc
  limit 1;

  if v_first_delay is null then
    raise exception 'sequence has no steps';
  end if;

  insert into public.follow_up_enrollments
    (organization_id, sequence_id, contact_id, next_run_at, enrolled_by)
  values
    (v_org_id, p_sequence_id, p_contact_id, now() + make_interval(days => v_first_delay), auth.uid())
  returning id into v_enrollment_id;

  return v_enrollment_id;
end;
$$;

grant execute on function public.enroll_contact_in_sequence(uuid, uuid) to authenticated;

create or replace function public.stop_enrollment(p_enrollment_id uuid, p_reason text default null)
returns void
language plpgsql
set search_path = public
as $$
begin
  update public.follow_up_enrollments
  set status = 'stopped', stopped_at = now(), stopped_reason = p_reason
  where id = p_enrollment_id and status = 'active';
end;
$$;

grant execute on function public.stop_enrollment(uuid, text) to authenticated;
