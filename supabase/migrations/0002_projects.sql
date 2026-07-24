-- Projects: per-user workspaces. Run in the Supabase SQL editor.
--
-- One row per project. The document-shaped workspace lives in `data` (jsonb);
-- name, github_*, and due_dates are lifted into columns so the Projects list
-- and calendar can read them cheaply. RLS scopes every operation to the owner.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id            text primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null default 'Untitled',
  data          jsonb not null default '{}'::jsonb,
  github_repo   text,
  github_branch text not null default 'main',
  due_dates     jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id, created_at);

alter table public.projects enable row level security;

-- Owner-only CRUD. `with check` on insert/update prevents assigning rows to
-- another user_id.
drop policy if exists "select own projects" on public.projects;
create policy "select own projects"
  on public.projects for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own projects" on public.projects;
create policy "insert own projects"
  on public.projects for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update own projects" on public.projects;
create policy "update own projects"
  on public.projects for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own projects" on public.projects;
create policy "delete own projects"
  on public.projects for delete to authenticated
  using (auth.uid() = user_id);

-- Reuses the touch_updated_at() function from 0001_subscriptions.sql. If you
-- run this migration standalone, uncomment the function definition below.
-- create or replace function public.touch_updated_at()
-- returns trigger language plpgsql as $$
-- begin new.updated_at = now(); return new; end; $$;

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.touch_updated_at();
