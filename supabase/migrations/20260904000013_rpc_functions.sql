-- Creates an organization and makes the caller its owner in one transaction,
-- so a user can never end up owning an org with no membership row (which
-- would lock them out under the RLS policies in 012_rls_policies.sql).
create or replace function public.create_organization(org_name text, org_slug text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org public.organizations;
begin
  insert into public.organizations (name, slug, created_by)
  values (org_name, org_slug, auth.uid())
  returning * into new_org;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org.id, auth.uid(), 'owner');

  update public.profiles
  set active_organization_id = new_org.id
  where id = auth.uid();

  return new_org;
end;
$$;

grant execute on function public.create_organization(text, text) to authenticated;

-- Switches which org the caller's JWT will claim on next refresh. The app
-- must call supabase.auth.refreshSession() after this to pick up the new
-- active_org_id/org_role claims. This function only updates the pointer.
create or replace function public.set_active_org(org uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_org_member(org) then
    raise exception 'not a member of this organization';
  end if;

  update public.profiles
  set active_organization_id = org
  where id = auth.uid();
end;
$$;

grant execute on function public.set_active_org(uuid) to authenticated;

-- Creates a hashed, expiring invitation and returns the ONE-TIME raw token
-- for the caller to email. The raw token is never stored, only its hash.
create or replace function public.invite_member(
  org uuid,
  invite_email citext,
  invite_role public.org_role default 'member'
)
returns table (invitation_id uuid, raw_token text)
language plpgsql
security definer
set search_path = public
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

grant execute on function public.invite_member(uuid, citext, public.org_role) to authenticated;

-- Accepts an invitation by its raw token. Requires the caller's profile
-- email to match the invited email, otherwise a leaked/forwarded link
-- could let a different account join.
create or replace function public.accept_invitation(raw_token text)
returns public.organizations
language plpgsql
security definer
set search_path = public
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

grant execute on function public.accept_invitation(text) to authenticated;
