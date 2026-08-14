-- 0009_ai_context.sql
--
-- Two things:
--   1. context_entries — append-only research/context log per project (Brief
--      answers, uploads, AI-generated critiques/specs). Nothing here ever
--      gets overwritten; edits and regenerations just add a new row, so the
--      founder's research trail survives even when the compiled Brief fields
--      in projects.data get replaced.
--   2. ai_usage_daily + try_consume_ai_call() — a DB-backed budget guard for
--      the Gemini free tier. That quota is per Google Cloud project, shared
--      across every user of this app, not per user — so this is the thing
--      standing between "one founder double-clicking Generate" and every
--      other founder getting 429s for the rest of the day.

create table if not exists public.context_entries (
  id            uuid primary key default gen_random_uuid(),
  project_id    text not null references public.projects (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  kind          text not null check (kind in ('answer', 'note', 'interview', 'competitor', 'file', 'ai_extract')),
  field         text,
  source        text not null default 'manual' check (source in ('manual', 'upload', 'voice', 'ai_generated')),
  title         text,
  content       text not null,
  metadata      jsonb not null default '{}'::jsonb,
  superseded_by uuid references public.context_entries (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists context_entries_project_idx on public.context_entries (project_id, created_at desc);

alter table public.context_entries enable row level security;

-- Owner-only CRUD, same shape as projects' own RLS (0002_projects.sql).
drop policy if exists "select own context entries" on public.context_entries;
create policy "select own context entries"
  on public.context_entries for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own context entries" on public.context_entries;
create policy "insert own context entries"
  on public.context_entries for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "delete own context entries" on public.context_entries;
create policy "delete own context entries"
  on public.context_entries for delete to authenticated
  using (auth.uid() = user_id);

-- No update policy: entries are append-only by design (see superseded_by).

-- ---------------------------------------------------------------------------
-- AI usage budget — one row per UTC day, incremented atomically.
-- ---------------------------------------------------------------------------

create table if not exists public.ai_usage_daily (
  usage_date   date primary key default current_date,
  call_count   integer not null default 0,
  last_call_at timestamptz
);

-- RLS on with NO policies: unreachable by anon/authenticated (PostgREST),
-- only touched server-side via try_consume_ai_call() below.
alter table public.ai_usage_daily enable row level security;

create or replace function public.try_consume_ai_call(
  p_min_interval_seconds integer default 4,
  p_daily_cap integer default 900
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_last  timestamptz;
begin
  insert into public.ai_usage_daily (usage_date)
    values (current_date)
    on conflict (usage_date) do nothing;

  select call_count, last_call_at into v_count, v_last
    from public.ai_usage_daily
   where usage_date = current_date
     for update;

  if v_count >= p_daily_cap then
    return 'daily_cap';
  end if;

  if v_last is not null and now() - v_last < make_interval(secs => p_min_interval_seconds) then
    return 'rate_limited';
  end if;

  update public.ai_usage_daily
     set call_count = call_count + 1,
         last_call_at = now()
   where usage_date = current_date;

  return 'ok';
end;
$$;

-- Lock the function down to the service role — this bypasses RLS by design
-- (security definer), so it must not be callable by anon/authenticated.
revoke all on function public.try_consume_ai_call(integer, integer) from public;
grant execute on function public.try_consume_ai_call(integer, integer) to service_role;
