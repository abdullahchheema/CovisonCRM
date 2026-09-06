-- Projects module: a project has ordered columns, each holding ordered
-- cards (todos). The nested kanban board from the legacy app's
-- projects/columns/todos collections, flattened onto three org-scoped
-- tables with composite FKs instead of bare projectId/columnId strings.
create table public.projects (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (id, organization_id)
);

create index projects_org_idx on public.projects (organization_id) where deleted_at is null;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create table public.project_columns (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  project_id       uuid not null,
  name             text not null,
  position         integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (project_id, organization_id)
    references public.projects (id, organization_id) on delete cascade
);

create index project_columns_project_idx
  on public.project_columns (project_id, position);

create trigger project_columns_set_updated_at
  before update on public.project_columns
  for each row execute function public.set_updated_at();

create table public.project_todos (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  project_id       uuid not null,
  column_id        uuid not null,
  title            text not null,
  description      text,
  assigned_to      uuid references public.profiles(id) on delete set null,
  created_by       uuid references auth.users(id) on delete set null,
  position         integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (id, organization_id),
  foreign key (project_id, organization_id)
    references public.projects (id, organization_id) on delete cascade,
  foreign key (column_id, organization_id)
    references public.project_columns (id, organization_id) on delete cascade
);

create index project_todos_column_idx
  on public.project_todos (column_id, position) where deleted_at is null;

create trigger project_todos_set_updated_at
  before update on public.project_todos
  for each row execute function public.set_updated_at();

-- tasks.project_id was reserved with no FK back in 008_tasks.sql, before this
-- table existed. Wire it up now.
alter table public.tasks
  add constraint tasks_project_id_fkey
  foreign key (project_id, organization_id)
  references public.projects (id, organization_id) on delete cascade;
