-- Extensions used across the schema.
create extension if not exists pgcrypto;   -- gen_random_uuid(), gen_random_bytes(), digest()
create extension if not exists citext;     -- case-insensitive email / slug / tag-name comparisons
create extension if not exists pg_trgm;    -- trigram indexes for contact name/email search

-- Shared trigger: stamps updated_at on every UPDATE. Attached per-table below.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
