-- Run these two queries in the SQL Editor any time you add a table. Both
-- should return ZERO rows. This is the single most important check in the
-- whole schema — it's what makes "RLS is mandatory" actually true instead
-- of a promise someone can forget to keep.

-- 1. Tables with RLS not enabled at all (wide open to any authenticated
--    request, or even anon, depending on grants).
select schemaname, tablename
from pg_tables
where schemaname = 'public'
  and rowsecurity = false;

-- 2. Tables with RLS enabled but zero policies attached. Safe by default
--    (blocks everything) but almost certainly not what you intended, and a
--    sign a table was created without its policies being written yet.
select c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity
  and not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname
  );
