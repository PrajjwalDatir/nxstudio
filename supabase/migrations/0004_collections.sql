-- Collections: named groups that hold products (projects) inside a workspace.
-- Run in the Supabase SQL editor AFTER 0002_projects.sql.
--
-- A collection is just an owner-scoped label; membership lives on the project
-- via projects.collection_id. Deleting a collection ungroups its projects
-- (on delete set null) — it never deletes the products themselves.

create extension if not exists pgcrypto;

create table if not exists public.collections (
  id         text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null default 'Untitled',
  sort       integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists collections_user_id_idx on public.collections (user_id, sort);

alter table public.collections enable row level security;

-- Owner-only CRUD, mirroring public.projects.
drop policy if exists "select own collections" on public.collections;
create policy "select own collections"
  on public.collections for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own collections" on public.collections;
create policy "insert own collections"
  on public.collections for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update own collections" on public.collections;
create policy "update own collections"
  on public.collections for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own collections" on public.collections;
create policy "delete own collections"
  on public.collections for delete to authenticated
  using (auth.uid() = user_id);

-- Reuses touch_updated_at() from 0001_subscriptions.sql.
drop trigger if exists collections_touch_updated_at on public.collections;
create trigger collections_touch_updated_at
  before update on public.collections
  for each row execute function public.touch_updated_at();

-- Membership: which collection (if any) a project belongs to. RLS on projects
-- already scopes access; the FK just keeps the reference honest and nulls it out
-- when the collection is deleted.
alter table public.projects
  add column if not exists collection_id text
  references public.collections (id) on delete set null;

create index if not exists projects_collection_id_idx on public.projects (collection_id);
