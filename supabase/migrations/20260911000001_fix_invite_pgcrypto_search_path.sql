-- Fixes "function gen_random_bytes(integer) does not exist" on invite_member
-- (and the equivalent digest() call in accept_invitation). Supabase-hosted
-- projects install pgcrypto into the `extensions` schema, not `public`, so
-- `create extension if not exists pgcrypto` in 001_extensions_and_helpers.sql
-- was a no-op there (Supabase's platform already installs it before any
-- migration runs) and these two functions' `set search_path = public`
-- never had `extensions` on its path. A vanilla local Postgres with no
-- pre-existing pgcrypto installs it into `public` by default, which is why
-- this passed local testing but broke on the live project. Widening the
-- search_path (rather than schema-qualifying the calls) keeps this correct
-- in both places, wherever pgcrypto actually landed.
create or replace function public.invite_member(
  org uuid,
  invite_email citext,
  invite_role public.org_role default 'member'
)
returns table (invitation_id uuid, raw_token text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_token text;
  new_id uuid;
begin
  if not public.has_org_role(org, array['owner', 'admin']) then
    raise exception 'only owners and admins can invite members';
  end if;

  new_token := encode(gen_random_bytes(32), 'hex');

  insert into public.organization_invitations
    (organization_id, email, role, token_hash, invited_by, expires_at)
  values
    (org, invite_email, invite_role, encode(digest(new_token, 'sha256'), 'hex'), auth.uid(), now() + interval '7 days')
  returning id into new_id;

  return query select new_id, new_token;
end;
$$;

create or replace function public.accept_invitation(raw_token text)
returns public.organizations
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  inv public.organization_invitations;
  org public.organizations;
  caller_email citext;
begin
  select email into caller_email from public.profiles where id = auth.uid();

  select * into inv
  from public.organization_invitations
  where token_hash = encode(digest(raw_token, 'sha256'), 'hex')
    and accepted_at is null
    and revoked_at is null
    and expires_at > now();

  if inv.id is null then
    raise exception 'invalid or expired invitation';
  end if;

  if inv.email <> caller_email then
    raise exception 'this invitation was issued to a different email address';
  end if;

  insert into public.organization_members (organization_id, user_id, role, invited_by)
  values (inv.organization_id, auth.uid(), inv.role, inv.invited_by)
  on conflict (organization_id, user_id) do nothing;

  update public.organization_invitations
  set accepted_at = now()
  where id = inv.id;

  update public.profiles
  set active_organization_id = inv.organization_id
  where id = auth.uid();

  select * into org from public.organizations where id = inv.organization_id;
  return org;
end;
$$;
