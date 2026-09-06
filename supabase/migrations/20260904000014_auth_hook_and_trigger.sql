-- Auto-creates a profiles row the moment a new auth.users row appears
-- (email/password signup, Google OAuth, or an admin-created user).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The Custom Access Token Hook. Supabase Auth calls this on every token
-- issue/refresh and merges whatever it returns back into the JWT. This is
-- what makes current_org_id()/current_org_role() (013_rls_helpers.sql) free
-- to read at query time. The alternative (a membership lookup inside every
-- RLS policy) would cost a database round trip per row on every query.
--
-- IMPORTANT: this function is not wired up by running this migration. You
-- must enable it once in the dashboard: Authentication → Hooks → Customize
-- Access Token (JWT) Claims hook → select public.custom_access_token_hook.
-- See SETUP.md for the exact steps.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  active_org uuid;
  member_role public.org_role;
begin
  select active_organization_id into active_org
  from public.profiles
  where id = (event ->> 'user_id')::uuid;

  if active_org is not null then
    select role into member_role
    from public.organization_members
    where organization_id = active_org
      and user_id = (event ->> 'user_id')::uuid;

    -- The profile's active_organization_id can go stale (e.g. the user was
    -- removed from that org since their last token refresh). Drop the claim
    -- rather than mint one for an org they no longer belong to.
    if member_role is null then
      active_org := null;
    end if;
  end if;

  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{app_metadata}', coalesce(claims -> 'app_metadata', '{}'::jsonb), true);

  if active_org is not null then
    claims := jsonb_set(claims, '{app_metadata,active_org_id}', to_jsonb(active_org::text));
    claims := jsonb_set(claims, '{app_metadata,org_role}', to_jsonb(member_role::text));
  else
    claims := claims #- '{app_metadata,active_org_id}';
    claims := claims #- '{app_metadata,org_role}';
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- Required by Supabase for any custom access token hook: the auth service
-- (supabase_auth_admin) must be able to call it and read the tables it
-- queries. No other role should be able to invoke it directly.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

grant select on public.profiles to supabase_auth_admin;
grant select on public.organization_members to supabase_auth_admin;
